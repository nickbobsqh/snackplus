const TABS=["Recently Added","New","Trending","Original Language","Subbed","Dubbed","Exclusives","Saved","Other Services"];
const $=s=>document.querySelector(s);
const store={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
let items=[],tab=0,sortNewest=true,saved=store.get("snack_saved",[]);
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

function filtered(){
  const q=$("#search").value.trim().toLowerCase();
  let l=[...items];
  if(q){return l.filter(i=>[i.title,i.genre,i.type,i.year,i.description].join(" ").toLowerCase().includes(q))}
  const byAdded=(a,b)=>new Date(b.added)-new Date(a.added);
  switch(tab){
    case 0:l.sort(byAdded);if(!sortNewest)l.reverse();break;
    case 1:l=l.filter(i=>i.new).sort(byAdded);if(!sortNewest)l.reverse();break;
    case 2:l.sort((a,b)=>(b.trending||0)-(a.trending||0));l=l.filter(i=>i.trending>0);break;
    case 3:l=l.filter(i=>!i.subbed&&!i.dubbed);break;
    case 4:l=l.filter(i=>i.subbed);break;
    case 5:l=l.filter(i=>i.dubbed);break;
    case 6:l=l.filter(i=>i.exclusive);break;
    case 7:l=l.filter(i=>saved.includes(i.id));break;
    case 8:return null;
  }
  return l;
}

function render(){
  const q=$("#search").value.trim();
  $("#title").textContent=q?`Search: ${q}`:TABS[tab];
  const tools=$("#tools");tools.innerHTML="";
  if(!q&&(tab<=1)){
    tools.innerHTML=`<select id="sort"><option value="n">Newest to oldest</option><option value="o">Oldest to newest</option></select>`;
    $("#sort").value=sortNewest?"n":"o";
    $("#sort").onchange=e=>{sortNewest=e.target.value=="n";render()};
  }
  if(!q&&tab==7){
    tools.innerHTML=`<button class="btn" id="exp">Export</button> <button class="btn" id="imp">Import</button>`;
    $("#exp").onclick=exportSaved;$("#imp").onclick=importSaved;
  }
  const l=filtered(),g=$("#grid");
  if(l===null){g.innerHTML=`<div class="empty"><h2>This Page is a W.I.P</h2></div>`;return}
  if(!l.length){g.innerHTML=`<div class="empty">${tab==7&&!q?"Nothing saved yet. Tap the ♥ on a title to save it.":"Nothing here."}</div>`;return}
  g.innerHTML=l.map(card).join("");
}

function card(i){
  const isSaved=saved.includes(i.id),m=i.type=="movie";
  const b=[m?"Movie":"Show",i.subbed&&"Subbed",i.dubbed&&"Dubbed"].filter(Boolean).map(x=>`<span class="badge">${x}</span>`).join("")+(i.exclusive?`<span class="badge ex">Dubbed by SNACK</span>`:"");
  const btns=m?`<button class="btn pri" data-a="watch" ${i.watch?"":"disabled"}>Watch</button><button class="btn" data-a="dl" ${i.download?"":"disabled"}>Download</button><button class="btn" data-a="share">Share</button>`
   :`<button class="btn pri" data-a="eps">Episodes</button>`;
  return `<article class="card glass" data-id="${esc(i.id)}">
   <div class="cover"><span>${esc(i.title)}</span><img src="${esc(i.cover)}" alt="" onerror="this.remove()">
   <div class="badges">${b}</div><button class="save ${isSaved?"on":""}" data-a="save" title="Save">${isSaved?"♥":"♡"}</button></div>
   <div class="info"><h3>${esc(i.title)}</h3>
   <div class="meta">${esc(i.year)} • ${esc(i.genre)} • ★ ${esc(i.rating)} • ${esc(i.duration)}</div>
   <div class="desc">${esc(i.description)}</div><div class="btns">${btns}</div></div></article>`;
}

$("#grid").onclick=e=>{
  const b=e.target.closest("[data-a]");if(!b)return;
  const it=items.find(x=>x.id==b.closest(".card").dataset.id);if(!it)return;
  const a=b.dataset.a;
  if(a=="save"){saved=saved.includes(it.id)?saved.filter(x=>x!=it.id):[...saved,it.id];store.set("snack_saved",saved);render()}
  else if(a=="watch")play(it.watch,it.title);
  else if(a=="dl")download(it.download,it.title);
  else if(a=="share")share(it.id);
  else if(a=="eps")episodes(it);
};
$("#search").oninput=render;

function openModal(h){$("#dialog").innerHTML=h;$("#modal").classList.remove("hidden")}
function closeModal(){$("#modal").classList.add("hidden");$("#dialog").innerHTML="";if(location.hash)history.replaceState(null,"",location.pathname+location.search)}
$("#modal").onclick=e=>{if(e.target.id=="modal"||e.target.closest("[data-close]"))closeModal()};
document.onkeydown=e=>{if(e.key=="Escape")closeModal()};

function play(url,title){
  if(!url)return toast("Not available to watch");
  openModal(`<h2>${esc(title)}</h2><video src="${esc(url)}" controls autoplay playsinline></video><div class="row"><button class="btn" data-close>Close</button></div>`);
}
function download(url,title){
  if(!url)return toast("Download not available");
  const a=document.createElement("a");a.href=url;a.download=title;a.target="_blank";a.rel="noopener";document.body.appendChild(a);a.click();a.remove();
}
async function share(id,ep){
  const url=location.origin+location.pathname+"#"+id+(ep!=null?"/"+ep:"");
  try{await navigator.clipboard.writeText(url);toast("Link copied")}catch{prompt("Copy this link:",url)}
}
function episodes(it,keepHash){
  const eps=it.episodes||[],rows=[...new Set(eps.map(e=>e.season||1))].sort((a,b)=>a-b).map(s=>`<h3 style="margin:12px 0 4px">Season ${s}</h3>`+eps.map((e,n)=>[e,n]).filter(([e])=>(e.season||1)==s).map(([e,n])=>`<div class="ep"><span>${esc(e.title)}</span><div class="btns">
   <button class="btn pri" data-e="w${n}" ${e.watch?"":"disabled"}>Watch</button>
   <button class="btn" data-e="d${n}" ${e.download?"":"disabled"}>Download</button>
   <button class="btn" data-e="s${n}">Share</button></div></div>`).join("")).join("");
  openModal(`<h2>${esc(it.title)} - Episodes</h2>${rows||"<p>No episodes yet.</p>"}<div class="row"><button class="btn" data-close>Close</button></div>`);
  $("#dialog").onclick=ev=>{const b=ev.target.closest("[data-e]");if(!b)return;
    const n=+b.dataset.e.slice(1),e=it.episodes[n],k=b.dataset.e[0];
    if(k=="w")play(e.watch,it.title+" - "+e.title);else if(k=="d")download(e.download,e.title);else share(it.id,n)};
}
function openFromHash(){
  const [id,ep]=decodeURIComponent(location.hash.slice(1)).split("/");
  const it=items.find(x=>x.id==id);if(!it)return;
  if(it.type=="movie")play(it.watch,it.title);
  else if(ep!=null&&it.episodes?.[ep]?.watch)play(it.episodes[ep].watch,it.title+" - "+it.episodes[ep].title);
  else episodes(it);
}
addEventListener("hashchange",()=>items.length&&openFromHash());

function exportSaved(){
  const blob=new Blob([JSON.stringify({snack_saved:saved})],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="snack-saved.json";a.click();
}
function importSaved(){
  const f=document.createElement("input");f.type="file";f.accept=".json,.txt,application/json";
  f.onchange=async()=>{try{
    const d=JSON.parse(await f.files[0].text());
    const l=Array.isArray(d)?d:d.snack_saved;
    if(!Array.isArray(l))throw 0;
    saved=[...new Set([...saved,...l.map(String)])];store.set("snack_saved",saved);render();toast("Imported")
  }catch{toast("Invalid file")}};
  f.click();
}

$("#profileBtn").onclick=()=>{
  let pic=profile.pic;
  openModal(`<h2>Profile</h2><div class="row"><img class="bigav" id="pp" src="${esc(pic)}" alt="">
   <input type="file" id="pf" accept="image/*"></div>
   <div class="row"><input class="field" id="pn" placeholder="Your name" maxlength="30" value="${esc(profile.name)}"></div>
   <div class="row"><button class="btn pri" id="ps">Save</button><button class="btn" data-close>Cancel</button></div>`);
  $("#pf").onchange=e=>{const file=e.target.files[0];if(!file)return;
    const img=new Image();img.onload=()=>{const c=document.createElement("canvas");c.width=c.height=256;
      const s=Math.min(img.width,img.height),x=c.getContext("2d");
      x.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,256,256);
      pic=c.toDataURL("image/jpeg",.85);$("#pp").src=pic};
    img.src=URL.createObjectURL(file)};
  $("#ps").onclick=()=>{profile={name:$("#pn").value.trim(),pic};store.set("snack_profile",profile);renderProfile();closeModal();toast(profile.name?"Welcome, "+profile.name:"Saved")};
};
$("#settingsBtn").onclick=()=>{
  openModal(`<h2>Settings</h2>
   <label class="row"><input type="checkbox" id="sl" ${settings.lite?"checked":""}> Performance mode (disable blur &amp; glow effects)</label>
   <div class="row"><button class="btn" id="sc">Clear all local data</button></div>
   <div class="row"><button class="btn pri" data-close>Done</button></div>`);
  $("#sl").onchange=e=>{settings.lite=e.target.checked;store.set("snack_settings",settings);document.body.classList.toggle("lite",settings.lite)};
  $("#sc").onclick=()=>{if(confirm("Clear profile, saved list and settings?")){localStorage.clear();location.reload()}};
};
init();
