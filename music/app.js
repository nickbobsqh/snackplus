// data.txt format (one track per line, fields separated by |):
// title | artist | cover | audio link | download link
// audio link = direct .mp3/.m4a/.ogg link. Leave download empty to grey it out.
// Lines starting with # are ignored.
const $ = id => document.getElementById(id);
const audio = $('audio');
let tracks = [];
let current = -1;
let shuffle = false;
let visible = [];

fetch('data.txt?' + Date.now()).then(r => r.text()).then(txt => {
  tracks = txt.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'))
    .map(l => {
      const [title, artist = '', cover = '', src = '', dl = ''] = l.split('|').map(s => s.trim());
      return { title, artist, cover, src, dl };
    }).filter(t => t.title && t.src);
  render();
}).catch(() => { $('empty').hidden = false; $('empty').textContent = 'Could not load data.txt'; });

function fmt(s) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return m + ':' + String(r).padStart(2, '0');
}

function render() {
  const q = $('search').value.toLowerCase();
  visible = tracks.map((t, i) => ({ t, i }))
    .filter(({ t }) => (t.title + ' ' + t.artist).toLowerCase().includes(q));
  const list = $('list');
  list.innerHTML = '';
  $('empty').hidden = visible.length > 0;
  visible.forEach(({ t, i }) => {
    const row = document.createElement('div');
    row.className = 'track glass' + (i === current ? ' playing' : '');
    const img = document.createElement('img');
    img.src = t.cover || ''; img.alt = ''; img.loading = 'lazy';
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = '<div class="t"></div><div class="a"></div>';
    meta.querySelector('.t').textContent = t.title;
    meta.querySelector('.a').textContent = t.artist;
    const dl = document.createElement('a');
    dl.className = 'pbtn dl' + (t.dl ? '' : ' off');
    dl.textContent = 'Download';
    if (t.dl) { dl.href = t.dl; dl.download = ''; dl.onclick = e => e.stopPropagation(); }
    row.append(img, meta, dl);
    row.onclick = () => play(i);
    list.append(row);
  });
}

function play(i) {
  current = i;
  const t = tracks[i];
  audio.src = t.src;
  audio.play().catch(() => {});
  $('player').hidden = false;
  $('pCover').src = t.cover || '';
  $('pTitle').textContent = t.title;
  $('pArtist').textContent = t.artist;
  document.querySelectorAll('.track').forEach(r => r.classList.remove('playing'));
  render();
}

function step(dir) {
  if (!tracks.length) return;
  if (shuffle) return play(Math.floor(Math.random() * tracks.length));
  const n = current < 0 ? 0 : (current + dir + tracks.length) % tracks.length;
  play(n);
}

$('play').onclick = () => {
  if (current < 0) return play(0);
  audio.paused ? audio.play() : audio.pause();
};
$('next').onclick = () => step(1);
$('prev').onclick = () => {
  if (audio.currentTime > 3) audio.currentTime = 0; else step(-1);
};
$('shuffle').onclick = () => {
  shuffle = !shuffle;
  $('shuffle').textContent = 'Shuffle: ' + (shuffle ? 'on' : 'off');
};
$('vol').oninput = e => audio.volume = e.target.value;
$('search').addEventListener('input', render);

audio.onplay = () => $('play').innerHTML = '&#10074;&#10074;';
audio.onpause = () => $('play').innerHTML = '&#9654;';
audio.onended = () => step(1);
audio.onloadedmetadata = () => {
  $('seek').max = audio.duration;
  $('dur').textContent = fmt(audio.duration);
};
audio.ontimeupdate = () => {
  $('seek').value = audio.currentTime;
  $('cur').textContent = fmt(audio.currentTime);
};
$('seek').oninput = e => audio.currentTime = e.target.value;
