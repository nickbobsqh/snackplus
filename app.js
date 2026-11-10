const TABS=["All","Original Language","Subbed","Dubbed","Exclusives","Saved","Other Services"];
const $=s=>document.querySelector(s);
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
let items=[],tab=0,sortNewest=true,saved=store.get("snack_saved",[]);
let savedSort=store.get("snack_saved_sort","added-new"),groups=store.get("snack_groups",[]),groupOf=store.get("snack_group_of",{});
let profile=store.get("snack_profile",{name:"",pic:""}),settings=store.get("snack_settings",{lite:false});

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}

// Normalize a movie/episode object so watch/download are always quality maps.
// Accepts old plain-string format and new {480p,720p,1080p} map.
function normalizeLinks(obj){
  const toMap=v=>{
    if(!v)return{};
    if(typeof v==="string")return v?{"720p":v}:{};
    return v;
  };
  obj.watch=toMap(obj.watch);
  obj.download=toMap(obj.download);
  return obj;
}

async function init(){
  document.body.classList.toggle("lite",!!settings.lite);
  renderTabs();renderProfile();
  try{
    const r=await fetch("movies.txt",{cache:"no-store"});
    items=JSON.parse(await r.text());
    items.forEach(it=>{
      if(it.type==="movie")normalizeLinks(it);
      else(it.episodes||[]).forEach(e=>normalizeLinks(e));
    });
  }catch(e){items=[];toast("Could not load movies.txt")}
  render();
  openFromHash();
}

function renderTabs(){
  $("#tabs").innerHTML=TABS.map((t,i)=>`<button class="${i==tab?"on":""}" data-i="${i}">${t}</button>`).join("");
  $("#tabs").onclick=e=>{const b=e.target.closest("button");if(b){tab=+b.dataset.i;$("#search").value="";renderTabs();render()}};
}
function renderProfile(){
  const a=$("#avatar");
  if(profile.pic){a.src=profile.pic;a.style.display="block";$("#avatarIcon").style.display="none"}
  else{a.style.display="none";$("#avatarIcon").style.display=""}
  $("#profileBtn").title=profile.name||"Profile";
}

function sortList(l){
  l.sort((a,b)=>new Date(b.added)-new Date(a.added));
  if(!sortNewest)l.reverse();
  return l;
}
const SAVED_SORTS={"added-new":"Date added: newest","added-old":"Date added: oldest","az":"Title A–Z","za":"Title Z–A"};
function sortSaved(l){
  const t=(a,b)=>a.title.localeCompare(b.title);
  const f={"added-new":(a,b)=>new Date(b.added)-new Date(a.added),"added-old":(a,b)=>new Date(a.added)-new Date(b.added),az:t,za:(a,b)=>t(b,a)};
  return l.sort(f[savedSort]||f["added-new"]);
}
function filtered(){
  const q=$("#search").value.trim().toLowerCase();
  let l=[...items];
  if(q){return sortList(l.filter(i=>[i.title,i.genre,i.type,i.year,i.description].join(" ").toLowerCase().includes(q)))}
  switch(tab){
    case 1:l=l.filter(i=>!i.subbed&&!i.dubbed);break;
    case 2:l=l.filter(i=>i.subbed);break;
    case 3:l=l.filter(i=>i.dubbed);break;
    case 4:l=l.filter(i=>i.exclusive);break;
    case 5:return sortSaved(l.filter(i=>saved.includes(i.id)));
    case 6:return null;
  }
  return sortList(l);
}

function render(){
  const q=$("#search").value.trim();
  $("#title").textContent=q?`Search: ${q}`:TABS[tab];
  const tools=$("#tools");tools.innerHTML="";
  const savedTab=tab==5&&!q;
  if(savedTab){
    tools.innerHTML=`<select id="sort">${Object.entries(SAVED_SORTS).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select>
      <button class="btn" id="addGroup">+ Group</button> <button class="btn" id="exp">Export</button> <button class="btn" id="imp">Import</button>`;
    $("#sort").value=savedSort;
    $("#sort").onchange=e=>{savedSort=e.target.value;store.set("snack_saved_sort",savedSort);render()};
    $("#addGroup").onclick=addGroup;
    $("#exp").onclick=exportSaved;$("#imp").onclick=importSaved;
  }else if(tab!=6){
    tools.innerHTML=`<select id="sort"><option value="n">Newest to oldest</option><option value="o">Oldest to newest</option></select>`;
    $("#sort").value=sortNewest?"n":"o";
    $("#sort").onchange=e=>{sortNewest=e.target.value=="n";render()};
  }
  const l=filtered(),g=$("#grid");
  if(l===null){g.innerHTML=`<div class="empty"><h2>This Page is a W.I.P</h2></div>`;return}
  if(!l.length){g.innerHTML=`<div class="empty">${savedTab?"Nothing saved yet. Tap the ♥ on a title to save it.":"Nothing here."}</div>`;return}
  if(!savedTab){g.innerHTML=l.map(card).join("");return}
  const grouped=(name)=>l.filter(i=>(groupOf[i.id]||"")==name);
  const valid=groups.filter(Boolean);
  if(!valid.length){g.innerHTML=l.map(card).join("");return}
  const ungrouped=l.filter(i=>!valid.includes(groupOf[i.id]));
  const section=(name,list,del)=>`<section style="grid-column:1/-1"><div class="bar" style="margin-bottom:10px"><h2>${esc(name)} <small>(${list.length})</small></h2>${del?`<button class="btn" data-gdel="${esc(name)}">Delete group</button>`:""}</div>
    <div class="grid">${list.length?list.map(card).join(""):`<div class="empty">No titles in this group.</div>`}</div></section>`;
  g.innerHTML=valid.map(n=>section(n,grouped(n),true)).join("")+(ungrouped.length?section("Ungrouped",ungrouped,false):"");
}
function addGroup(){
  const name=(prompt("Group name:")||"").trim();
  if(!name)return;
  if(groups.includes(name))return toast("A group with that name already exists");
  groups=[...groups,name];store.set("snack_groups",groups);render();
}

// Returns available quality keys from a map, sorted preferred order
const QUALITIES=["480p","720p","1080p"];
function availableQ(map){return QUALITIES.filter(q=>map&&map[q])}

function card(i){
  const isSaved=saved.includes(i.id),m=i.type=="movie";
  const watchMap=m?(i.watch||{}):{};
  const dlMap=m?(i.download||{}):{};
  const hasWatch=m?availableQ(watchMap).length>0:false;
  const hasDl=m?availableQ(dlMap).length>0:false;
  const b=[m?"Movie":"Show",i.subbed&&"Subbed",i.dubbed&&"Dubbed"].filter(Boolean).map(x=>`<span class="badge">${x}</span>`).join("")+(i.exclusive?`<span class="badge ex">Dubbed by SNACK</span>`:"");
  const btns=m
    ?`<button class="btn pri" data-a="watch" ${hasWatch?"":"disabled"}>Watch</button><button class="btn" data-a="dl" ${hasDl?"":"disabled"}>Download</button><button class="btn" data-a="share">Share</button>`
    :`<button class="btn pri" data-a="eps">Episodes</button><button class="btn" data-a="share">Share</button>`;
  const grp=tab==5&&!$("#search").value.trim()&&groups.length?`<select class="grp" data-a="grp" title="Group"><option value="">Ungrouped</option>${groups.map(n=>`<option ${groupOf[i.id]==n?"selected":""}>${esc(n)}</option>`).join("")}</select>`:"";
  return `<article class="card glass" data-id="${esc(i.id)}">
   <div class="cover"><span>${esc(i.title)}</span><img src="${esc(i.cover)}" alt="" onerror="this.remove()">
   <div class="badges">${b}</div><button class="save ${isSaved?"on":""}" data-a="save" title="Save">${isSaved?"♥":"♡"}</button></div>
   <div class="info"><h3>${esc(i.title)}</h3>
   <div class="meta">${esc(i.year)} • ${esc(i.genre)} • ★ ${esc(i.rating)} • ${esc(i.duration)}</div>
   <div class="desc">${esc(i.description)}</div>${grp}<div class="btns">${btns}</div></div></article>`;
}

$("#grid").onclick=e=>{
  const d=e.target.closest("[data-gdel]");
  if(d){const n=d.dataset.gdel;if(confirm(`Delete group "${n}"? Its titles stay saved.`)){
    groups=groups.filter(x=>x!=n);store.set("snack_groups",groups);
    Object.keys(groupOf).forEach(k=>{if(groupOf[k]==n)delete groupOf[k]});store.set("snack_group_of",groupOf);render()}return}
  const b=e.target.closest("[data-a]");if(!b||b.tagName=="SELECT")return;
  const it=items.find(x=>x.id==b.closest(".card").dataset.id);if(!it)return;
  const a=b.dataset.a;
  if(a=="save"){saved=saved.includes(it.id)?saved.filter(x=>x!=it.id):[...saved,it.id];store.set("snack_saved",saved);render()}
  else if(a=="watch")pickQuality(it.watch,it.title,"watch");
  else if(a=="dl")pickQuality(it.download,it.title,"download");
  else if(a=="share")share(it.id);
  else if(a=="eps")episodes(it);
};
$("#grid").onchange=e=>{
  const s=e.target.closest(".grp");if(!s)return;
  const it=items.find(x=>x.id==s.closest(".card").dataset.id);if(!it)return;
  if(s.value)groupOf[it.id]=s.value;else delete groupOf[it.id];
  store.set("snack_group_of",groupOf);render();
};
$("#search").oninput=render;

function openModal(h){$("#dialog").innerHTML=h;$("#modal").classList.remove("hidden")}
function closeModal(){$("#modal").classList.add("hidden");$("#dialog").innerHTML="";if(location.hash)history.replaceState(null,"",location.pathname+location.search)}
$("#modal").onclick=e=>{if(e.target.id=="modal"||e.target.closest("[data-close]"))closeModal()};
document.onkeydown=e=>{if(e.key=="Escape")closeModal()};

// Quality picker modal — mode: "watch" | "download"
function pickQuality(map,title,mode){
  const qs=availableQ(map);
  if(!qs.length)return toast(mode==="watch"?"Not available to watch":"Download not available");
  if(qs.length===1){
    if(mode==="watch")play(map[qs[0]],title);
    else download(map[qs[0]],title);
    return;
  }
  const btns=qs.map(q=>`<button class="btn pri" data-q="${q}">${q}</button>`).join("");
  openModal(`<h2>${esc(title)}</h2><p style="opacity:.7;margin-bottom:12px">${mode==="watch"?"Select quality to watch:":"Select quality to download:"}</p>
    <div class="row">${btns}</div>
    <div class="row"><button class="btn" data-close>Cancel</button></div>`);
  $("#dialog").onclick=ev=>{
    const qb=ev.target.closest("[data-q]");if(!qb)return;
    const url=map[qb.dataset.q];
    closeModal();
    if(mode==="watch")play(url,title);
    else download(url,title);
  };
}

function play(url,title,back){
  if(!url)return toast("Not available to watch");
  const backBtn=back?`<button class="btn" data-back>Back to episodes</button>`:"";
  openModal(`<h2>${esc(title)}</h2><video src="${esc(url)}" controls autoplay playsinline></video><div class="row">${backBtn}<button class="btn" data-close>Close</button></div>`);
  if(back)$("#dialog").onclick=ev=>{if(ev.target.closest("[data-back]"))back()};
}
const epLabel=(it,e)=>`${it.title} - Season ${e.season||1} ${e.title}`;
function download(url,title){
  if(!url)return toast("Download not available");
  const a=document.createElement("a");a.href=url;a.download=title;a.target="_blank";a.rel="noopener";document.body.appendChild(a);a.click();a.remove();
}
async function share(id,ep){
  const url=location.origin+location.pathname+"#"+id+(ep!=null?"/"+ep:"");
  try{await navigator.clipboard.writeText(url);toast("Link copied")}catch{prompt("Copy this link:",url)}
}

function episodes(it,season){
  const eps=it.episodes||[];
  const seasons=[...new Set(eps.map(e=>e.season||1))].sort((a,b)=>a-b);
  if(season==null){
    const rows=seasons.map(s=>{const n=eps.filter(e=>(e.season||1)==s).length;
      return `<button class="btn season" data-s="${s}">Season ${s} - <span>${n} episode${n==1?"":"s"}</span></button>`}).join("");
    openModal(`<h2>${esc(it.title)} - Seasons</h2>${rows||"<p>No episodes yet.</p>"}<div class="row"><button class="btn" data-close>Close</button></div>`);
  }else{
    // Episodes: Watch + Share only (no Download button)
    const rows=eps.map((e,n)=>[e,n]).filter(([e])=>(e.season||1)==season).map(([e,n])=>{
      const watchMap=e.watch||{};
      const hasWatch=availableQ(watchMap).length>0;
      return `<div class="ep"><span>${esc(e.title)}</span><div class="btns">
        <button class="btn pri" data-e="w${n}" ${hasWatch?"":"disabled"}>Watch</button>
        <button class="btn" data-e="s${n}">Share</button></div></div>`;
    }).join("");
    openModal(`<h2>${esc(it.title)} - Season ${season}</h2>${rows||"<p>No episodes in this season.</p>"}<div class="row"><button class="btn" data-back>Back to seasons</button><button class="btn" data-close>Close</button></div>`);
  }
  $("#dialog").onclick=ev=>{
    if(ev.target.closest("[data-back]"))return episodes(it);
    const sb=ev.target.closest("[data-s]");if(sb)return episodes(it,+sb.dataset.s);
    const b=ev.target.closest("[data-e]");if(!b)return;
    const n=+b.dataset.e.slice(1),e=it.episodes[n],k=b.dataset.e[0];
    const watchMap=e.watch||{};
    const qs=availableQ(watchMap);
    if(k==="w"){
      if(qs.length===1)play(watchMap[qs[0]],epLabel(it,e),()=>episodes(it,e.season||1));
      else if(qs.length>1)pickQualityEp(watchMap,epLabel(it,e),it,e);
    }else if(k==="s")share(it.id,n);
  };
}

// Quality picker for episode watch (restores episode list on back)
function pickQualityEp(map,label,it,ep){
  const qs=availableQ(map);
  const btns=qs.map(q=>`<button class="btn pri" data-q="${q}">${q}</button>`).join("");
  openModal(`<h2>${esc(label)}</h2><p style="opacity:.7;margin-bottom:12px">Select quality to watch:</p>
    <div class="row">${btns}</div>
    <div class="row"><button class="btn" data-back>Back</button><button class="btn" data-close>Cancel</button></div>`);
  $("#dialog").onclick=ev=>{
    if(ev.target.closest("[data-back]"))return episodes(it,ep.season||1);
    const qb=ev.target.closest("[data-q]");if(!qb)return;
    play(map[qb.dataset.q],label,()=>episodes(it,ep.season||1));
  };
}

function openFromHash(){
  const [id,ep]=decodeURIComponent(location.hash.slice(1)).split("/");
  const it=items.find(x=>x.id==id);if(!it)return;
  if(it.type=="movie"){
    const qs=availableQ(it.watch||{});
    if(qs.length===1)play(it.watch[qs[0]],it.title);
    else pickQuality(it.watch,it.title,"watch");
  }else if(ep!=null&&it.episodes?.[ep]){
    const e=it.episodes[ep];const watchMap=e.watch||{};
    const qs=availableQ(watchMap);
    if(qs.length===1)play(watchMap[qs[0]],epLabel(it,e),()=>episodes(it,e.season||1));
    else episodes(it,e.season||1);
  }else episodes(it);
}
addEventListener("hashchange",()=>items.length&&openFromHash());

function exportSaved(){
  const blob=new Blob([JSON.stringify({snack_saved:saved})],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="snack-saved.json";a.click();
}
function importSaved(){
  const f=document.createElement("input");f.type="file";f.accept=".json";
  f.onchange=()=>f.files[0].text().then(t=>{
    try{const d=JSON.parse(t);if(Array.isArray(d.snack_saved)){saved=d.snack_saved;store.set("snack_saved",saved);render();toast("Imported");}else toast("Invalid file");}catch{toast("Invalid file");}
  });f.click();
}

// Profile modal
$("#profileBtn").onclick=()=>{
  openModal(`<h2>Profile</h2>
    <div class="row"><img class="bigav" id="bigav" src="${esc(profile.pic)}" onerror="this.style.visibility='hidden'" onload="this.style.visibility='visible'"></div>
    <div class="row"><label style="flex:1;font-size:13px">Name<input class="field" id="pname" value="${esc(profile.name)}" placeholder="Your name" style="width:100%;margin-top:4px"></label></div>
    <div class="row"><label style="flex:1;font-size:13px">Avatar URL<input class="field" id="ppic" value="${esc(profile.pic)}" placeholder="https://..." style="width:100%;margin-top:4px"></label></div>
    <div class="row"><button class="btn pri" id="psave">Save</button><button class="btn" data-close>Cancel</button></div>`);
  $("#ppic").oninput=e=>{$("#bigav").src=e.target.value;$("#bigav").style.visibility="visible"};
  $("#psave").onclick=()=>{profile={name:$("#pname").value,pic:$("#ppic").value};store.set("snack_profile",profile);renderProfile();closeModal();toast("Profile saved")};
};

// Settings modal
$("#settingsBtn").onclick=()=>{
  openModal(`<h2>Settings</h2>
    <div class="row"><label style="display:flex;align-items:center;gap:10px"><input type="checkbox" id="slite" ${settings.lite?"checked":""}> Lite mode (no glass blur)</label></div>
    <div class="row"><button class="btn pri" id="ssave">Save</button><button class="btn" data-close>Cancel</button></div>`);
  $("#ssave").onclick=()=>{settings.lite=$("#slite").checked;store.set("snack_settings",settings);document.body.classList.toggle("lite",!!settings.lite);closeModal();toast("Settings saved")};
};

init();
