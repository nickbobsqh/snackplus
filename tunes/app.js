const $=s=>document.querySelector(s);
const audio=$('#audio'),main=$('#main'),q=$('#q');
const EXT=/\.(mp3|m4a|aac|flac|wav|ogg|opus|weba|webm)$/i;
const I={
note:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
play:'<path fill="currentColor" stroke="none" d="M7 4l13 8-13 8z"/>',
pause:'<rect fill="currentColor" stroke="none" x="6" y="4" width="4" height="16" rx="1"/><rect fill="currentColor" stroke="none" x="14" y="4" width="4" height="16" rx="1"/>',
prev:'<path fill="currentColor" stroke="none" d="M6 5h2v14H6zM19 5L9 12l10 7z"/>',
next:'<path fill="currentColor" stroke="none" d="M16 5h2v14h-2zM5 5l10 7-10 7z"/>',
shuffle:'<path d="M3 6h4l10 12h4"/><path d="M3 18h4l3-4"/><path d="M14 10l3-4h4"/><path d="M17 3l4 3-4 3"/><path d="M17 15l4 3-4 3"/>',
repeat:'<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
repeat1:'<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/><path d="M11 9l1-1v6"/>',
vol:'<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/>',
up:'<path d="M6 15l6-6 6 6"/>',
down:'<path d="M6 9l6 6 6-6"/>',
x:'<path d="M6 6l12 12M18 6L6 18"/>',
add:'<path d="M12 5v14M5 12h14"/>',
back:'<path d="M15 6l-6 6 6 6"/>'
};
const ic=(n,cls='')=>`<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
let tracks=[],view='songs',detail=null,queue=[],idx=-1,shuffle=false,repeat=0;
let playlists=JSON.parse(localStorage.getItem('snackTunesPL')||'{}');
const savePL=()=>localStorage.setItem('snackTunesPL',JSON.stringify(playlists));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=t=>isFinite(t)?Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0'):'0:00';

// ---- folder loading ----
async function* walk(dir,path=''){
  for await(const h of dir.values()){
    if(h.kind==='directory')yield*walk(h,path+h.name+'/');
    else if(EXT.test(h.name))yield{file:await h.getFile(),path:path+h.name};
  }
}
// ---- remember the chosen folder (IndexedDB stores the directory handle) ----
const dbp=new Promise((res,rej)=>{const r=indexedDB.open('snackTunes',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
async function kvGet(k){const db=await dbp;return new Promise(res=>{const r=db.transaction('kv').objectStore('kv').get(k);r.onsuccess=()=>res(r.result);r.onerror=()=>res(undefined)})}
async function kvSet(k,v){const db=await dbp;return new Promise(res=>{const tx=db.transaction('kv','readwrite');tx.objectStore('kv').put(v,k);tx.oncomplete=res})}
async function scanDir(d){
  await kvSet('folder',d).catch(()=>{});
  const f=[];$('#status').textContent='Scanning…';
  try{for await(const x of walk(d))f.push(x);load(f)}
  catch(e){$('#status').textContent=e.message}
}
$('#pick').onclick=async()=>{
  if(window.showDirectoryPicker){
    try{scanDir(await showDirectoryPicker({mode:'read'}))}
    catch(e){if(e.name!=='AbortError')$('#status').textContent=e.message}
  }else $('#fallback').click();
};
$('#promoClose').onclick=()=>$('#promo').classList.add('hide');

// On startup: reopen the saved folder automatically if permission is still granted,
// otherwise offer a one-click "Continue" button (browsers need a click to re-grant access).
(async()=>{
  if(!window.showDirectoryPicker)return;
  const d=await kvGet('folder').catch(()=>null);
  if(!d)return;
  if(await d.queryPermission({mode:'read'})==='granted')return scanDir(d);
  const b=$('#resume');b.textContent=`Open “${d.name}”`;b.classList.remove('hide');
  b.onclick=async()=>{if(await d.requestPermission({mode:'read'})==='granted')scanDir(d)};
})();
$('#fallback').onchange=e=>load([...e.target.files].filter(f=>EXT.test(f.name)).map(f=>({file:f,path:f.webkitRelativePath||f.name})));
$('#changeFolder').onclick=()=>{audio.pause();$('#welcome').classList.remove('hide')};


async function load(files){
  $('#status').textContent=`Reading ${files.length} files…`;
  tracks=[];
  for(const{file,path}of files){
    const m=await readTags(file);
    const base=file.name.replace(/\.[^.]+$/,'');
    const parts=path.split('/');
    tracks.push({id:path,file,title:m.title||base,artist:m.artist||'Unknown Artist',album:m.album||(parts.length>1?parts[parts.length-2]:'Unknown Album'),genre:m.genre||'Unknown Genre',cover:m.cover||null,track:m.track||0});
  }
  tracks.sort((a,b)=>a.title.localeCompare(b.title));
  $('#welcome').classList.add('hide');$('#status').textContent='';
  render();
}

// ---- minimal ID3v2 reader ----
async function readID3(file){
  const out={};
  try{
    const head=new Uint8Array(await file.slice(0,10).arrayBuffer());
    if(String.fromCharCode(...head.slice(0,3))!=='ID3')return out;
    const size=(head[6]<<21)|(head[7]<<14)|(head[8]<<7)|head[9];
    const b=new Uint8Array(await file.slice(10,10+size).arrayBuffer());
    const v=head[3];let p=0;
    const dec=(arr,enc)=>{let s=new TextDecoder(enc===1?'utf-16':enc===2?'utf-16be':enc===3?'utf-8':'iso-8859-1').decode(arr);return s.replace(/\0+$/,'').replace(/^\uFEFF/,'')};
    while(p+10<=b.length){
      const id=String.fromCharCode(...b.slice(p,p+4));if(!/^[A-Z0-9]{4}$/.test(id))break;
      const fs=v===4?(b[p+4]<<21)|(b[p+5]<<14)|(b[p+6]<<7)|b[p+7]:((b[p+4]<<24)|(b[p+5]<<16)|(b[p+6]<<8)|b[p+7])>>>0;
      const d=b.slice(p+10,p+10+fs);p+=10+fs;
      if(id[0]==='T'&&d.length){const t=dec(d.slice(1),d[0]);
        if(id==='TIT2')out.title=t;else if(id==='TPE1')out.artist=t.split('\0')[0];else if(id==='TALB')out.album=t;else if(id==='TRCK')out.track=parseInt(t,10)||undefined;
        else if(id==='TCON')out.genre=t.replace(/^\((\d+)\)/,'').trim()||undefined;}
      else if(id==='APIC'){
        let i=1;while(d[i]!==0)i++;const mime=dec(d.slice(1,i),0)||'image/jpeg';i+=2;
        if(d[0]===1||d[0]===2){while(!(d[i]===0&&d[i+1]===0))i+=2;i+=2}else{while(d[i]!==0)i++;i++}
        out.cover=URL.createObjectURL(new Blob([d.slice(i)],{type:mime.includes('/')?mime:'image/jpeg'}));
      }
    }
  }catch(e){}
  return out;
}

// ---- tag readers for other formats ----
const u8=async(f,s,e)=>new Uint8Array(await f.slice(s,e).arrayBuffer());
const txt=b=>new TextDecoder('utf-8').decode(b).replace(/\0+$/,'');
const be32=b=>((b[0]<<24)|(b[1]<<16)|(b[2]<<8)|b[3])>>>0;
const le32=(b,i=0)=>(b[i]|(b[i+1]<<8)|(b[i+2]<<16)|(b[i+3]<<24))>>>0;
const blobUrl=(b,mime)=>URL.createObjectURL(new Blob([b],{type:mime}));

async function readTags(file){
  let out={};
  try{
    const h=await u8(file,0,12);
    const sig=String.fromCharCode(...h.slice(0,4));
    if(sig.slice(0,3)==='ID3')out=await readID3(file);
    else if(sig==='fLaC')out=await readFLAC(file);
    else if(sig==='OggS')out=await readOgg(file);
    else if(sig==='RIFF')out=await readWAV(file);
    else if(String.fromCharCode(...h.slice(4,8))==='ftyp')out=await readMP4(file);
  }catch(e){}
  return out;
}

// Vorbis comments (FLAC, Ogg Vorbis, Opus)
function parseVorbis(b,p,out){
  const dv=new DataView(b.buffer,b.byteOffset,b.byteLength);
  p+=4+dv.getUint32(p,true);
  const n=dv.getUint32(p,true);p+=4;
  for(let i=0;i<n&&p+4<=b.length;i++){
    const l=dv.getUint32(p,true);p+=4;
    const s=new TextDecoder().decode(b.subarray(p,p+l));p+=l;
    const k=s.indexOf('=');if(k<0)continue;
    const key=s.slice(0,k).toUpperCase(),val=s.slice(k+1);
    if(key==='TITLE')out.title=val;
    else if(key==='ARTIST'&&!out.artist)out.artist=val;
    else if(key==='ALBUM')out.album=val;
    else if(key==='GENRE')out.genre=val;
    else if(key==='TRACKNUMBER')out.track=parseInt(val,10)||undefined;
  }
  return out;
}

async function readFLAC(file){
  const out={};let off=4;
  while(off+4<=file.size){
    const h=await u8(file,off,off+4);
    const last=h[0]&0x80,type=h[0]&0x7f,len=(h[1]<<16)|(h[2]<<8)|h[3];
    const b=await u8(file,off+4,off+4+len);
    if(type===4)parseVorbis(b,0,out);
    else if(type===6&&!out.cover){
      const dv=new DataView(b.buffer);
      const ml=dv.getUint32(4);
      const mime=txt(b.subarray(8,8+ml));
      let p=8+ml;p+=4+dv.getUint32(p);p+=16;
      const dl=dv.getUint32(p);p+=4;
      out.cover=blobUrl(b.slice(p,p+dl),mime||'image/jpeg');
    }
    if(last)break;
    off+=4+len;
  }
  return out;
}

async function readOgg(file){
  const out={};
  const b=await u8(file,0,Math.min(file.size,1<<20));
  const s=new TextDecoder('latin1').decode(b);
  let i=s.indexOf('\x03vorbis');
  if(i>=0)return parseVorbis(b,i+7,out);
  i=s.indexOf('OpusTags');
  if(i>=0)return parseVorbis(b,i+8,out);
  return out;
}

// WAV LIST/INFO chunk
async function readWAV(file){
  const out={};let p=12;
  while(p+8<=file.size){
    const h=await u8(file,p,p+8);
    const id=String.fromCharCode(...h.slice(0,4)),len=le32(h,4);
    if(id==='LIST'){
      const t=await u8(file,p+8,p+8+len);
      if(String.fromCharCode(...t.slice(0,4))==='INFO'){
        let q=4;
        while(q+8<=t.length){
          const k=String.fromCharCode(...t.slice(q,q+4)),l=le32(t,q+4);
          const v=txt(t.subarray(q+8,q+8+l));
          if(k==='INAM')out.title=v;else if(k==='IART')out.artist=v;
          else if(k==='IPRD')out.album=v;else if(k==='IGNR')out.genre=v;else if(k==='ITRK')out.track=parseInt(v,10)||undefined;
          q+=8+l+(l&1);
        }
      }
    }
    p+=8+len+(len&1);
  }
  return out;
}

// MP4 / M4A / ALAC iTunes-style atoms
async function readMP4(file){
  const out={};
  const atoms=async(s,e)=>{
    const list=[];let p=s;
    while(p+8<=e){
      const h=await u8(file,p,Math.min(p+16,e));
      let size=be32(h),hdr=8;
      if(size===1){size=Number(new DataView(h.buffer).getBigUint64(8));hdr=16}
      else if(size===0)size=e-p;
      if(size<hdr)break;
      list.push({type:String.fromCharCode(...h.slice(4,8)),s:p+hdr,e:p+size});
      p+=size;
    }
    return list;
  };
  const find=async(s,e,type)=>(await atoms(s,e)).find(a=>a.type===type);
  const moov=await find(0,file.size,'moov');
  if(!moov)return out;
  const cont=(await find(moov.s,moov.e,'udta'))||moov;
  const meta=await find(cont.s,cont.e,'meta');
  if(!meta)return out;
  const ilst=await find(meta.s+4,meta.e,'ilst');
  if(!ilst)return out;
  for(const item of await atoms(ilst.s,ilst.e)){
    const data=await find(item.s,item.e,'data');
    if(!data)continue;
    const payload=await u8(file,data.s+8,data.e);
    if(item.type==='covr'){
      const flag=be32(await u8(file,data.s,data.s+4));
      if(!out.cover)out.cover=blobUrl(payload,flag===14?'image/png':'image/jpeg');
      continue;
    }
    if(item.type==='trkn'){out.track=(payload[2]<<8)|payload[3]||undefined;continue}
    const v=txt(payload);
    if(item.type==='\u00a9nam')out.title=v;
    else if(item.type==='\u00a9ART')out.artist=v;
    else if(item.type==='\u00a9alb')out.album=v;
    else if(item.type==='\u00a9gen')out.genre=v;
  }
  return out;
}

// ---- views ----
const thumb=t=>t.cover?`style="background-image:url('${t.cover}')"`:'';
const cmp=(a,b)=>String(a).localeCompare(String(b),undefined,{sensitivity:'base',numeric:true});
let sortBy=localStorage.getItem('snackTunesSort')||'az';
$('#sort').value=sortBy;
$('#sort').onchange=e=>{sortBy=e.target.value;localStorage.setItem('snackTunesSort',sortBy);render()};

function sortTracks(list){
  if(sortBy==='albumorder')return [...list].sort((a,b)=>cmp(a.album,b.album)||((a.track||1e9)-(b.track||1e9))||cmp(a.title,b.title));
  const keys={artist:['artist','album','title'],album:['album','artist','title'],genre:['genre','artist','title']}[sortBy]||['title'];
  const s=[...list].sort((a,b)=>{for(const k of keys){const c=cmp(a[k],b[k]);if(c)return c}return 0});
  return sortBy==='za'?s.reverse():s;
}
function sortGroups(entries){
  const s=[...entries].sort((a,b)=>sortBy==='count'?(b[1].length-a[1].length)||cmp(a[0],b[0]):cmp(a[0],b[0]));
  return sortBy==='za'?s.reverse():s;
}
// Playlists keep their own order; library lists use the sort option.
function filtered(list){
  const keep=!!(detail&&detail.pl);
  const s=q.value.trim().toLowerCase();
  const r=s?list.filter(t=>(t.title+' '+t.artist+' '+t.album+' '+t.genre).toLowerCase().includes(s)):list;
  return keep?r:sortTracks(r);
}
function trackList(list){
  list=filtered(list);
  if(!list.length)return'<div class="empty">Nothing here.</div>';
  const pl=!!(detail&&detail.pl);
  return list.map((t,i)=>{
    const acts=pl
      ?`<button class="icon" data-up="${i}" title="Move up">${ic('up')}</button><button class="icon" data-down="${i}" title="Move down">${ic('down')}</button><button class="icon" data-rm="${i}" title="Remove from playlist">${ic('x')}</button>`
      :`<button class="icon add" data-add="${i}" title="Add to playlist">${ic('add')}</button>`;
    return `<div class="row${queue[idx]===t?' playing':''}" data-i="${i}"><div class="th" ${thumb(t)}></div><div class="t"><b>${esc(t.title)}</b><small>${esc(t.artist)} · ${esc(t.album)}</small></div>${acts}</div>`;
  }).join('');
}
function bindList(list){
  list=filtered(list);
  const pl=!!(detail&&detail.pl);
  const arr=pl?playlists[detail.name]:null;
  const shift=(pos,d)=>{const j=pos+d;if(pos<0||j<0||j>=arr.length)return;[arr[pos],arr[j]]=[arr[j],arr[pos]];savePL();render()};
  main.querySelectorAll('.row').forEach(r=>{
    r.onclick=e=>{
      const i=+r.dataset.i,t=list[i],b=e.target.closest('button');
      if(b){
        e.stopPropagation();
        if(b.dataset.add!==undefined)return addMenu(e,t);
        const pos=pl?arr.indexOf(t.id):-1;
        if(b.dataset.rm!==undefined){arr.splice(pos,1);savePL();return render()}
        if(b.dataset.up!==undefined)return shift(pos,-1);
        if(b.dataset.down!==undefined)return shift(pos,1);
        return;
      }
      queue=list.slice();play(i);
    };
  });
}
function groupBy(key){const m=new Map();tracks.forEach(t=>{if(!m.has(t[key]))m.set(t[key],[]);m.get(t[key]).push(t)});return m}
// Always rebuild a detail's list from current data, so edits show immediately.
function detailItems(){
  if(detail.pl){
    const byId=new Map(tracks.map(t=>[t.id,t]));
    return (playlists[detail.name]||[]).map(id=>byId.get(id)).filter(Boolean);
  }
  return groupBy(detail.key).get(detail.name)||[];
}
function render(){
  const names={songs:'Songs',artists:'Artists',albums:'Albums',genres:'Genres',playlists:'Playlists',other:'Other services'};
  $('#title').textContent=detail?detail.name:names[view];
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.v===view));
  if(view==='other'){main.innerHTML='<div class="wip">This Page is a W.I.P</div>';return}
  if(detail){
    const head=detail.pl?`<button class="btn back" id="back">${ic('back')} Back</button><button class="btn back" id="renpl">Rename</button><button class="btn back" id="delpl">Delete playlist</button>`:`<button class="btn back" id="back">${ic('back')} Back</button>`;
    main.innerHTML=head+trackList(detailItems());
    $('#back').onclick=()=>{detail=null;render()};
    if(detail.pl){
      $('#delpl').onclick=()=>{delete playlists[detail.name];savePL();detail=null;render()};
      $('#renpl').onclick=async()=>{
        const old=detail.name;
        const n=await askName('Rename playlist',old);
        if(!n||n===old||playlists[n])return;
        playlists[n]=playlists[old];delete playlists[old];detail.name=n;savePL();render();
      };
    }
    bindList(detailItems());return;
  }
  if(view==='songs'){main.innerHTML=trackList(tracks);bindList(tracks);return}
  const key={artists:'artist',albums:'album',genres:'genre'}[view];
  let entries;
  if(view==='playlists'){
    const byId=new Map(tracks.map(t=>[t.id,t]));
    entries=Object.entries(playlists).map(([n,ids])=>[n,ids.map(i=>byId.get(i)).filter(Boolean)]);
  }else entries=[...groupBy(key)];
  entries=sortGroups(entries);
  const s=q.value.trim().toLowerCase();
  let html=view==='playlists'?'<button class="btn back" id="newpl">'+ic('add')+' New playlist</button>':'';
  html+='<div class="grid">';let n=0;
  for(const[name,l]of entries){
    if(s&&!name.toLowerCase().includes(s))continue;n++;
    const c=l.find(t=>t.cover);
    html+=`<div class="tile" data-g="${esc(name)}"><div class="th" ${c?thumb(c):''}>${c?'':ic('note')}</div><b>${esc(name)}</b><br><small>${l.length} song${l.length==1?'':'s'}</small></div>`;
  }
  html+='</div>';if(!n)html+='<div class="empty">Nothing here.</div>';
  main.innerHTML=html;
  main.querySelectorAll('.tile').forEach(t=>t.onclick=()=>{
    detail={name:t.dataset.g,pl:view==='playlists',key};q.value='';render()});
  if(view==='playlists')$('#newpl').onclick=async()=>{
    const n=await askName('New playlist','');
    if(n&&!playlists[n]){playlists[n]=[];savePL();render()}
  };
}

// ---- name popup (replaces browser prompt) ----
let nmResolve=null;
function askName(title,value){
  $('#nmTitle').textContent=title;
  const inp=$('#nmInput');inp.value=value||'';
  $('#nameModal').classList.remove('hide');
  setTimeout(()=>{inp.focus();inp.select()});
  return new Promise(res=>nmResolve=res);
}
function closeName(v){
  $('#nameModal').classList.add('hide');
  const r=nmResolve;nmResolve=null;if(r)r(v);
}
const nmVal=()=>$('#nmInput').value.trim()||null;
$('#nmOk').onclick=()=>closeName(nmVal());
$('#nmCancel').onclick=()=>closeName(null);
$('#nmInput').onkeydown=e=>{if(e.key==='Enter')closeName(nmVal());else if(e.key==='Escape')closeName(null)};
$('#nameModal').onclick=e=>{if(e.target.id==='nameModal')closeName(null)};

function addMenu(e,t){
  document.querySelector('.menu')?.remove();
  const m=document.createElement('div');m.className='glass menu';
  const names=Object.keys(playlists);
  m.innerHTML=names.map(n=>`<button data-n="${esc(n)}">${esc(n)}</button>`).join('')+'<button data-new="1">+ New playlist…</button>';
  m.style.left=Math.min(e.clientX,innerWidth-200)+'px';m.style.top=Math.min(e.clientY,innerHeight-200)+'px';
  m.onclick=async ev=>{const b=ev.target.closest('button');if(!b)return;
    let n=b.dataset.n;
    if(b.dataset.new){n=await askName('New playlist','');if(!n)return;playlists[n]=playlists[n]||[]}
    if(!playlists[n].includes(t.id))playlists[n].push(t.id);savePL();m.remove();if(view==='playlists')render()};
  document.body.append(m);
  setTimeout(()=>document.addEventListener('click',()=>m.remove(),{once:true}));
}

// ---- playback ----
let url=null;
function play(i){
  idx=i;const t=queue[i];if(!t)return;
  if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(t.file);
  audio.src=url;audio.play();
  $('#pTitle').textContent=t.title;$('#pArtist').textContent=t.artist;
  const c=$('#cover');c.style.backgroundImage=t.cover?`url('${t.cover}')`:'';c.innerHTML=t.cover?'':ic('note');
  if('mediaSession'in navigator)navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:t.artist,album:t.album});
  document.querySelectorAll('.row').forEach(r=>r.classList.remove('playing'));
  render();
}
const next=()=>{if(!queue.length)return;play(shuffle?Math.floor(Math.random()*queue.length):(idx+1)%queue.length)};
const prev=()=>{if(audio.currentTime>3)audio.currentTime=0;else if(queue.length)play((idx-1+queue.length)%queue.length)};
$('#play').onclick=()=>{if(!audio.src)return;audio.paused?audio.play():audio.pause()};
$('#next').onclick=next;$('#prev').onclick=prev;
$('#shuffle').onclick=e=>{shuffle=!shuffle;e.currentTarget.classList.toggle('active',shuffle)};
$('#repeat').onclick=e=>{repeat=(repeat+1)%3;e.currentTarget.classList.toggle('active',repeat>0);e.currentTarget.innerHTML=ic(repeat==2?'repeat1':'repeat')};
audio.onplay=()=>$('#play').innerHTML=ic('pause');audio.onpause=()=>$('#play').innerHTML=ic('play');
audio.onended=()=>{if(repeat==2)play(idx);else if(idx<queue.length-1||repeat==1||shuffle)next();else audio.pause()};
audio.ontimeupdate=()=>{$('#cur').textContent=fmt(audio.currentTime);$('#dur').textContent=fmt(audio.duration);
  if(audio.duration){$('#seek').value=audio.currentTime/audio.duration*1000;fill($('#seek'))}};
const fill=el=>el.style.setProperty('--p',(el.value-el.min)/(el.max-el.min)*100+'%');
$('#seek').oninput=e=>{fill(e.target);if(audio.duration)audio.currentTime=e.target.value/1000*audio.duration};
$('#vol').oninput=e=>{fill(e.target);audio.volume=e.target.value/100};audio.volume=.8;fill($('#vol'));

document.querySelectorAll('#nav button').forEach(b=>b.onclick=()=>{view=b.dataset.v;detail=null;q.value='';render()});
q.oninput=render;
$('#searchBtn').onclick=()=>{q.focus();render()};
q.onkeydown=e=>{if(e.key==='Enter')render()};
render();
