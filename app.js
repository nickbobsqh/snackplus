// data.txt format (one episode per line, fields separated by |):
// show | cover | season | episode | download link | watch link | folder link
// Leave a field empty if unavailable. Lines starting with # are ignored.
const $ = id => document.getElementById(id);
let shows = [];

fetch('data.txt?' + Date.now()).then(r => r.text()).then(txt => {
  const map = new Map();
  txt.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const [show, cover = '', season = '', episode = '', dl = '', watch = '', folder = ''] =
      line.split('|').map(s => s.trim());
    if (!show) return;
    if (!map.has(show)) map.set(show, { name: show, cover: '', folder: '', eps: [] });
    const s = map.get(show);
    if (cover && !s.cover) s.cover = cover;
    if (folder && !s.folder) s.folder = folder;
    if (episode || dl || watch)
      s.eps.push({ season: season || '1', episode: episode || '?', dl, watch });
  });
  shows = [...map.values()];
  shows.forEach(s => s.eps.sort((a, b) =>
    (parseFloat(a.season) - parseFloat(b.season)) || (parseFloat(a.episode) - parseFloat(b.episode)) || 0));
  render();
}).catch(() => { $('empty').hidden = false; $('empty').textContent = 'Could not load data.txt'; });

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function safeUrl(u) { return /^(https?:)?\/\//i.test(u) || !/^[a-z]+:/i.test(u) ? u : '#'; }

function btn(label, enabled, onclick, href) {
  const b = el(href && enabled ? 'a' : 'button', 'btn' + (enabled ? '' : ' off'), label);
  if (!enabled) { b.disabled = true; return b; }
  if (href) { b.href = safeUrl(href); b.target = '_blank'; b.rel = 'noopener'; }
  else b.onclick = onclick;
  return b;
}

function render() {
  const q = $('search').value.toLowerCase();
  const grid = $('grid');
  grid.innerHTML = '';
  const list = shows.filter(s => s.name.toLowerCase().includes(q));
  $('empty').hidden = list.length > 0;
  list.forEach(s => {
    const card = el('div', 'card');
    const img = el('img');
    img.src = s.cover; img.alt = s.name; img.loading = 'lazy';
    card.append(img, el('h3', '', s.name),
      el('small', '', s.eps.length + ' episode' + (s.eps.length === 1 ? '' : 's')));
    const b = el('div', 'btns');
    b.append(
      btn('Episodes', s.eps.some(e => e.dl), () => openEpisodes(s)),
      btn('Open Folder', !!s.folder, null, s.folder),
      btn('Watch', s.eps.some(e => e.watch), () => openWatch(s)));
    b.firstChild.classList.add('primary');
    card.append(b);
    grid.append(card);
  });
}

function groupBySeason(eps, container, rowFn) {
  let last = null;
  eps.forEach(e => {
    if (e.season !== last) { container.append(el('div', 'season', 'Season ' + e.season)); last = e.season; }
    container.append(rowFn(e));
  });
}

function openModal(title) {
  $('mTitle').textContent = title;
  $('mBody').innerHTML = '';
  $('modal').hidden = false;
  return $('mBody');
}
function closeModal() {
  $('modal').hidden = true;
  $('mBody').innerHTML = ''; // stops playback
}

function openEpisodes(s) {
  const body = openModal(s.name + ' — Episodes');
  groupBySeason(s.eps, body, e => {
    const row = el('div', 'ep');
    row.append(el('span', '', 'Episode ' + e.episode));
    const d = btn('Download', !!e.dl, null, e.dl);
    if (e.dl) d.setAttribute('download', '');
    row.append(d);
    return row;
  });
}

function openWatch(s) {
  const body = openModal(s.name + ' — Watch');
  const video = el('video');
  video.controls = true;
  video.hidden = true;
  body.append(video);
  const rows = [];
  groupBySeason(s.eps, body, e => {
    const row = el('div', 'ep');
    row.append(el('span', '', 'Episode ' + e.episode));
    row.append(btn('▶ Play', !!e.watch, () => {
      video.src = e.watch; video.hidden = false; video.play().catch(() => {});
      rows.forEach(r => r.classList.remove('playing'));
      row.classList.add('playing');
      video.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }));
    rows.push(row);
    return row;
  });
}

$('close').onclick = closeModal;
$('modal').onclick = e => { if (e.target === $('modal')) closeModal(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
$('search').addEventListener('input', render);
