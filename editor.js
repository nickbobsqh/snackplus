const $=s=>document.querySelector(s);
let data=[],cur=-1,handle=null,dirty=false;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"item";
const today=()=>new Date().toISOString().slice(0,10);

async function load(){
  try{data=JSON.parse(await (await fetch("movies.txt",{cache:"no-store"})).text())}catch{data=[];toast("Could not load movies.txt")}
  cur=data.length?0:-1;dirty=false;draw();
}
function draw(){
  $("#items").innerHTML=data.map((d,i)=>`<div class="li ${i==cur?"on":""}" data-i="${i}">${esc(d.title||"(untitled)")}<small>${d.type} • ${esc(d.year||"")}</small></div>`).join("");
  form();
}
$("#items").onclick=e=>{const l=e.target.closest(".li");if(l){cur=+l.dataset.i;draw()}};

function add(type){
  const o={id:"",type,title:"New "+type,year:new Date().getFullYear(),genre:"",rating:"",duration:"",description:"",cover:"",added:today(),new:true,trending:0,subbed:false,dubbed:false,exclusive:false};
  if(type=="movie"){o.watch="";o.download=""}else o.episodes=[{title:"Episode 1",watch:"",download:""}];
  o.id=uniqueId(slug(o.title));data.push(o);cur=data.length-1;dirty=true;draw();
}
function uniqueId(b,self){let id=b,n=2;while(data.some(d=>d!==self&&d.id==id))id=b+"-"+n++;return id}
$("#addM").onclick=()=>add("movie");$("#addS").onclick=()=>add("show");

function form(){
  const f=$("#form"),d=data[cur];
  if(!d){f.innerHTML="<p>Nothing selected. Add a movie or show.</p>";return}
  const t=(k,l,w,type="text")=>`<label class="${w?"w":""}">${l}<input class="field" type="${type}" data-k="${k}" value="${esc(d[k])}"></label>`;
  const c=(k,l)=>`<label><input type="checkbox" data-c="${k}" ${d[k]?"checked":""}> ${l}</label>`;
  let h=`<div class="f">
   ${t("title","Title")}${t("id","ID (used in share link)")}
   <label>Type<select class="field" data-k="type" disabled><option>${d.type}</option></select></label>${t("year","Year")}
   ${t("genre","Genre")}${t("rating","Rating")}
   ${t("duration","Duration / seasons")}${t("added","Date added","","date")}
   ${t("trending","Trending score (0 = hidden)","","number")}
   <label class="w">Description<textarea class="field" rows="3" data-k="description">${esc(d.description)}</textarea></label>
   <label class="w">Cover image path or URL<div style="display:flex;gap:10px"><input class="field" data-k="cover" value="${esc(d.cover)}"><img class="preview" id="pv" src="${esc(d.cover)}" onerror="this.style.visibility='hidden'" onload="this.style.visibility='visible'"></div></label>
   <div class="chk">${c("new","New")}${c("subbed","Subbed (Persian subs)")}${c("dubbed","Dubbed (Persian)")}${c("exclusive","Exclusive (Dubbed by SNACK)")}</div>`;
  if(d.type=="movie")h+=`<label class="w">Video link (used for Watch and Download)<input class="field" data-k="link" value="${esc(d.watch||d.download||"")}"></label>`;
  else{
    h+=`<div class="w"><b>Episodes</b><div id="eps" style="margin-top:8px">`+(d.episodes||[]).map((e,n)=>`<div class="epr">
     <input class="field" type="number" min="1" data-e="${n}" data-ek="season" placeholder="Season" value="${e.season||1}">
     <input class="field" data-e="${n}" data-ek="title" placeholder="Title" value="${esc(e.title)}">
     <input class="field" data-e="${n}" data-ek="link" placeholder="Video link" value="${esc(e.watch||e.download||"")}">
     <button class="btn" data-mu="${n}" ${n==0?"disabled":""}>↑</button><button class="btn" data-md="${n}" ${n==(d.episodes.length-1)?"disabled":""}>↓</button><button class="btn" data-rm="${n}">✕</button></div>`).join("")+`</div><button class="btn" id="addE">+ Episode</button></div>`;
  }
  h+=`</div><div class="row" style="margin-top:16px"><button class="btn" id="up">↑ Move up</button><button class="btn" id="dn">↓ Move down</button><button class="btn danger" id="del">Delete</button></div>`;
  f.innerHTML=h;
}
$("#form").addEventListener("input",e=>{
  const d=data[cur],el=e.target;dirty=true;
  if(el.dataset.k=="link"){d.watch=d.download=el.value}
  else if(el.dataset.k){let v=el.value;if(el.type=="number")v=+v;d[el.dataset.k]=v;
    if(el.dataset.k=="title")$(`.li[data-i="${cur}"]`).firstChild.textContent=v||"(untitled)";
    if(el.dataset.k=="cover")$("#pv").src=v}
  else if(el.dataset.c)d[el.dataset.c]=el.checked;
  else if(el.dataset.e!=null){const ep=d.episodes[+el.dataset.e];if(el.dataset.ek=="link")ep.watch=ep.download=el.value;else ep[el.dataset.ek]=el.dataset.ek=="season"?+el.value:el.value}
});
$("#form").addEventListener("change",e=>{if(e.target.dataset.k=="id"){const d=data[cur];d.id=uniqueId(slug(d.id),d);e.target.value=d.id}});
$("#form").addEventListener("click",e=>{
  const d=data[cur],b=e.target.closest("button");if(!b)return;
  if(b.id=="addE"){const season=d.episodes.at(-1)?.season||1,num=d.episodes.filter(e=>(e.season||1)==season).length+1;d.episodes.push({title:"Episode "+num,watch:"",download:"",season});dirty=true;form()}
  else if(b.dataset.mu!=null){const n=+b.dataset.mu;if(n>0){[d.episodes[n-1],d.episodes[n]]=[d.episodes[n],d.episodes[n-1]];dirty=true;form()}}
  else if(b.dataset.md!=null){const n=+b.dataset.md;if(n<d.episodes.length-1){[d.episodes[n+1],d.episodes[n]]=[d.episodes[n],d.episodes[n+1]];dirty=true;form()}}
  else if(b.dataset.rm!=null){d.episodes.splice(+b.dataset.rm,1);dirty=true;form()}
  else if(b.id=="del"){if(confirm("Delete "+d.title+"?")){data.splice(cur,1);cur=Math.min(cur,data.length-1);dirty=true;draw()}}
  else if(b.id=="up"&&cur>0){[data[cur-1],data[cur]]=[data[cur],data[cur-1]];cur--;dirty=true;draw()}
  else if(b.id=="dn"&&cur<data.length-1){[data[cur+1],data[cur]]=[data[cur],data[cur+1]];cur++;dirty=true;draw()}
});

function clean(){
  return data.map(d=>{const o={...d};
    if(!o.id)o.id=uniqueId(slug(o.title),d);
    o.rating=o.rating===""||isNaN(+o.rating)?o.rating:+o.rating;
    return o});
}
$("#save").onclick=async()=>{
  const text=JSON.stringify(clean(),null,2)+"\n";
  try{
    if(window.showSaveFilePicker){
      if(!handle)handle=await showSaveFilePicker({suggestedName:"movies.txt",types:[{description:"Text",accept:{"text/plain":[".txt"]}}]});
      const w=await handle.createWritable();await w.write(text);await w.close();
      toast("Saved");dirty=false;return;
    }
  }catch(err){if(err.name=="AbortError")return}
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/plain"}));a.download="movies.txt";a.click();
  toast("Downloaded - replace movies.txt in your repo");dirty=false;
};
$("#open").onclick=async()=>{
  try{
    if(window.showOpenFilePicker){
      [handle]=await showOpenFilePicker({types:[{description:"Text",accept:{"text/plain":[".txt"]}}]});
      data=JSON.parse(await (await handle.getFile()).text());
    }else{
      const txt=await new Promise((res,rej)=>{const i=document.createElement("input");i.type="file";i.accept=".txt,.json";
        i.onchange=()=>i.files[0].text().then(res,rej);i.click()});
      data=JSON.parse(txt);
    }
    cur=data.length?0:-1;dirty=false;draw();toast("Opened");
  }catch(err){if(err.name!="AbortError")toast("Invalid file")}
};
$("#reload").onclick=()=>{if(!dirty||confirm("Discard unsaved changes?"))load()};
addEventListener("beforeunload",e=>{if(dirty){e.preventDefault();e.returnValue=""}});
load();
