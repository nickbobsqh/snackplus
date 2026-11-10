const TABS=["All","Original Language","Subbed","Dubbed","Exclusives","Saved","Other Services"];
const $=s=>document.querySelector(s);
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
let items=[],tab=0,sortNewest=true,saved=store.get("snack_saved",[]);
let savedSort=store.get("snack_saved_sort","added-new"),groups=store.get("snack_groups",[]),groupOf=store.get("snack_group_of",{});
let profile=store.get("snack_profile",{name:"",pic:""}),settings=store.get("snack_settings",{lite:false});

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}

async function init(){
  document.body.classList.toggle("lite",!!settings.lite);
  renderTabs();renderProfile();
  try{
    const r=await fetch("movies.txt",{cache:"no-store"});
    items=JSON.parse(await r.text());
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

// Build a quality-sources object from an item or episode using the new schema fields
function watchSources(o){
  const s={};
  if(o.watch480)s["480p"]=o.watch480;
  if(o.watch720)s["720p"]=o.watch720;
  if(o.watch1080)s["1080p"]=o.watch1080;
  // legacy fallback: single watch field
  if(!Object.keys(s).length&&o.watch)s["Watch"]=o.watch;
  return s;
}
function downloadSources(o){
  const s={};
  if(o.download480)s["480p"]=o.download480;
  if(o.download720)s["720p"]=o.download720;
  if(o.download1080)s["1080p"]=o.download1080;
  // legacy fallback
  if(!Object.keys(s).length&&o.download)s["Download"]=o.download;
  return s;
}
function hasWatch(o){return Object.keys(watchSources(o)).length>0}
function hasDownload(o){return Object.keys(downloadSources(o)).length>0}

function card(i){
  const isSaved=saved.includes(i.id),m=i.type=="movie";
  const b=[m?"Movie":"Show",i.subbed&&"Subbed",i.dubbed&&"Dubbed"].filter(Boolean).map(x=>`<span class="badge">${x}</span>`).join("")+(i.exclusive?`<span class="badge ex">Dubbed by SNACK</span>`:"");
  const btns=m
    ?`<button class="btn pri" data-a="watch" ${hasWatch(i)?"":"disabled"}>Watch</button><button class="btn" data-a="dl" ${hasDownload(i)?"":"disabled"}>Download</button><button class="btn" data-a="share">Share</button>`
    :`<button class="btn pri" data-a="eps">Episodes</button>`;
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
  else if(a=="watch")pickQuality(watchSources(it),it.title,(url)=>play(url,it.title));
  else if(a=="dl")pickQuality(downloadSources(it),it.title,(url)=>download(url,it.title));
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

// Quality picker: if only one option, skip the picker and call cb directly
function pickQuality(sources,title,cb){
  const keys=Object.keys(sources);
  if(!keys.length)return toast("Not available");
  if(keys.length==1)return cb(sources[keys[0]]);
  const btns=keys.map(k=>`<button class="btn pri" data-q="${esc(k)}">${esc(k)}</button>`).join("");
  openModal(`<h2>${esc(title)}</h2><p style="opacity:.7;margin-bottom:12px">Select quality</p><div class="row" style="flex-wrap:wrap;gap:10px">${btns}</div><div class="row" style="margin-top:12px"><button class="btn" data-close>Cancel</button></div>`);
  $("#dialog").onclick=ev=>{const b=ev.target.closest("[data-q]");if(b){closeModal();cb(sources[b.dataset.q])}};
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
    const rows=eps.map((e,n)=>[e,n]).filter(([e])=>(e.season||1)==season).map(([e,n])=>`<div class="ep"><span>${esc(e.title)}</span><div class="btns">
   <button class="btn pri" data-e="w${n}" ${