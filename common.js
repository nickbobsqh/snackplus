const ICONS={
play:'M8 5v14l11-7z',download:'M5 20h14v-2H5zM19 9h-4V3H9v6H5l7 7z',share:'M18 16.1c-.8 0-1.5.3-2 .8l-7.1-4.2c.1-.2.1-.5.1-.7s0-.5-.1-.7L16 7.2c.5.5 1.2.8 2 .8 1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3c0 .2 0 .5.1.7L8 9.8C7.5 9.3 6.8 9 6 9c-1.7 0-3 1.3-3 3s1.3 3 3 3c.8 0 1.5-.3 2-.8l7.1 4.2c-.1.2-.1.4-.1.6 0 1.6 1.3 2.9 2.9 2.9s2.9-1.3 2.9-2.9-1.2-2.9-2.8-2.9z',
list:'M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z',close:'M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z',
gear:'M19.4 13a7.8 7.8 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.3 7.3 0 0 0-1.7-1L15 3.2h-4l-.4 2.7c-.6.3-1.2.6-1.7 1l-2.5-1-2 3.5L6.6 11a7.8 7.8 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1l.4 2.7h4l.4-2.7c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z',
person:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z',
search:'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
history:'M13 3a9 9 0 0 0-9 9H1l4 4 4-4H6a7 7 0 1 1 2 4.9l-1.400 1.400A9 9 0 1 0 13 3zm-1 5v5l4.3 2.500.8-1.300-3.600-2.200V8z',
spark:'M12 2l2.4 7.600L22 12l-7.600 2.400L12 22l-2.400-7.600L2 12l7.600-2.400z',
cc:'M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-8 7H9.500v-.5h-2v3h2V13H11v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1zm7 0h-1.500v-.5h-2v3h2V13H18v1a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1z',
mic:'M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.900V21h2v-3.100A7 7 0 0 0 19 11z',
star:'M12 17.300 18.200 21l-1.600-7L22 9.200l-7.200-.6L12 2 9.200 8.600 2 9.200 7.500 14 5.800 21z',
bookmark:'M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2z',
bookmarkO:'M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2zm0 15-5-2.200L7 18V5h10z',
apps:'M4 8h4V4H4zm6 12h4v-4h-4zm-6 0h4v-4H4zm0-6h4v-4H4zm6 0h4v-4h-4zm6-10v4h4V4zm-6 4h4V4h-4zm6 6h4v-4h-4zm0 6h4v-4h-4z',
up:'M5 20h14v-2H5zM5 10h4v6h6v-6h4l-7-7z',
plus:'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z',trash:'M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6zM19 4h-3.500l-1-1h-5l-1 1H5v2h14z',
copy:'M16 1H4a2 2 0 0 0-2 2v14h2V3h12zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11z',
save:'M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM15 9H5V5h10z',
film:'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4z',
school:'M5 13.200v4l7 3.800 7-3.800v-4l-7 3.800zM12 3 1 9l11 6 9-4.900V17h2V9z',
music:'M12 3v10.600A4 4 0 1 0 14 17V7h4V3z',
down:'M7 10l5 5 5-5z',edit:'M3 17.250V21h3.750L17.810 9.940l-3.750-3.750zM20.710 7.040a1 1 0 0 0 0-1.410l-2.340-2.340a1 1 0 0 0-1.410 0l-1.830 1.830 3.750 3.750z'};
const ic=(n,c='')=>`<svg class="i ${c}" viewBox="0 0 24 24"><path d="${ICONS[n]}"/></svg>`;
const THEMES={snack:['SNACK+','#FF6710'],light:['Light','#006EDD'],dark:['Dark','#3189ED'],green:['Green','#33DD89'],cream:['Cream','#BA6522']};
const store={get(k,d){try{const v=localStorage.getItem('snack.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){localStorage.setItem('snack.'+k,JSON.stringify(v))}};
function applyTheme(t){if(!THEMES[t])t='snack';document.documentElement.dataset.theme=t;store.set('theme',t)}
applyTheme(store.get('theme','snack'));
function themePicker(el,after){el.innerHTML=Object.entries(THEMES).map(([k,[n,c]])=>`<button class="sw ${document.documentElement.dataset.theme==k?'on':''}" data-t="${k}"><i style="background:${c}"></i>${n}</button>`).join('');el.onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;applyTheme(b.dataset.t);themePicker(el,after);after&&after()}}
function toast(m){let t=document.querySelector('.toast');if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t)}t.textContent=m;t.style.display='block';clearTimeout(t._h);t._h=setTimeout(()=>t.style.display='none',2200)}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
