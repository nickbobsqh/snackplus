/* SNACK+ School — app.js */
const KEY = 'snackSchoolData';
const TABS = ['notes', 'schedule', 'homework', 'exams', 'profile'];

const T = {
  en: {
    appLabel: 'School',
    notes: 'Notes', notePh: 'Write here…', addImage: 'Image', addText: 'Text', removeImage: 'Remove', noteImg: 'Note image', imageTooBig: 'Image is too large to save.', clearInk: 'Clear drawing', toolSelect: 'Move', toolPen: 'Pen', toolErase: 'Eraser',
    schedule: 'Schedule', homework: 'Homework', exams: 'Exams', profile: 'Profile',
    name: 'Name', school: 'School', grade: 'Grade', years: 'Years', lastLogin: 'Last login', date: 'Date',
    firstVisit: 'First visit', noPhoto: 'No photo', photoAlt: 'Profile photo',
    exportData: 'Export data', importData: 'Import data', resetData: 'Reset data', toggleLang: 'فارسی',
    cornerLabel: 'Day / Period', cornerLabelRtl: 'Period / Day', hourPh: 'Hour', dayPh: 'Day', cellPh: '—',
    removeHour: 'Remove hour', removeDay: 'Remove day', addDay: '+ Add day', addHour: '+ Add hour',
    menu: 'Menu', rtlSwitch: 'RTL',
    exportSchedule: 'Export schedule (A4)', scheduleEmpty: 'Nothing to export yet', scheduleExported: 'Schedule image saved',
    remove: 'Remove', nothing: 'Nothing here yet.',
    required: 'Required', optional: 'Optional', addRequired: '+ Add required', addOptional: '+ Add optional',
    assignment: 'Assignment title', dueDate: 'Due date',
    midFinal: 'Midterms & Finals', quizzes: 'Class Quizzes',
    examTitle: 'Exam title', examDate: 'Date', examType: 'Midterm / Final', midterm: 'Midterm', final: 'Final', addExam: '+ Add exam',
    quizTitle: 'Quiz title', quizDate: 'Date', addQuiz: '+ Add quiz',
    upload: 'Upload', removePhoto: 'Remove', selectGrade: 'Select grade', gradeN: n => 'Grade ' + n,
    yourName: 'Your name', schoolName: 'School name',
    confirmRemove: 'Remove this item and everything in it?',
    confirmReset: 'Erase all data and start fresh? This cannot be undone. Consider exporting first.',
    confirmImport: 'Replace all current data with this file?',
    badFile: 'That file is not a valid export.', imported: 'Data imported', exported: 'Data exported',
    reset: 'All data reset', saveFail: 'Could not save. Browser storage may be full.',
    badImage: 'That file is not a supported image.',
  },
  fa: {
    appLabel: 'مدرسه',
    notes: 'یادداشت‌ها', notePh: 'اینجا بنویسید…', addImage: 'تصویر', addText: 'متن', removeImage: 'حذف', noteImg: 'تصویر یادداشت', imageTooBig: 'تصویر برای ذخیره کردن خیلی بزرگ است.', clearInk: 'پاک کردن نقاشی', toolSelect: 'جابه‌جایی', toolPen: 'قلم', toolErase: 'پاک‌کن',
    schedule: 'برنامه', homework: 'تکالیف', exams: 'امتحان‌ها', profile: 'پروفایل',
    name: 'نام', school: 'مدرسه', grade: 'پایه', years: 'سال تحصیلی', lastLogin: 'آخرین ورود', date: 'تاریخ',
    firstVisit: 'اولین بازدید', noPhoto: 'بدون عکس', photoAlt: 'عکس پروفایل',
    exportData: 'خروجی داده‌ها', importData: 'وارد کردن داده', resetData: 'بازنشانی داده', toggleLang: 'English',
    cornerLabel: 'روز / زنگ', cornerLabelRtl: 'زنگ / روز', hourPh: 'ساعت', dayPh: 'روز', cellPh: '—',
    removeHour: 'حذف ساعت', removeDay: 'حذف روز', addDay: '+ افزودن روز', addHour: '+ افزودن ساعت',
    menu: 'منو', rtlSwitch: 'راست‌چین',
    exportSchedule: 'خروجی برنامه (A4)', scheduleEmpty: 'چیزی برای خروجی گرفتن نیست', scheduleExported: 'تصویر برنامه ذخیره شد',
    remove: 'حذف', nothing: 'هنوز چیزی اضافه نشده.',
    required: 'اجباری', optional: 'اختیاری', addRequired: '+ افزودن اجباری', addOptional: '+ افزودن اختیاری',
    assignment: 'عنوان تکلیف', dueDate: 'تاریخ تحویل',
    midFinal: 'میان‌ترم و پایان‌ترم', quizzes: 'کوییزهای کلاس',
    examTitle: 'عنوان امتحان', examDate: 'تاریخ', examType: 'میان‌ترم / پایان‌ترم', midterm: 'میان‌ترم', final: 'پایان‌ترم', addExam: '+ افزودن امتحان',
    quizTitle: 'عنوان کوییز', quizDate: 'تاریخ', addQuiz: '+ افزودن کوییز',
    upload: 'بارگذاری', removePhoto: 'حذف', selectGrade: 'انتخاب پایه', gradeN: n => 'پایه ' + n,
    yourName: 'نام شما', schoolName: 'نام مدرسه',
    confirmRemove: 'این مورد و همه محتوای آن حذف شود؟',
    confirmReset: 'همه داده‌ها پاک شود و از نو شروع شود؟ این کار قابل بازگشت نیست. بهتر است ابتدا خروجی بگیرید.',
    confirmImport: 'همه داده‌های فعلی با این فایل جایگزین شود؟',
    badFile: 'این فایل یک خروجی معتبر نیست.', imported: 'داده‌ها وارد شد', exported: 'داده‌ها خروجی گرفته شد',
    reset: 'همه داده‌ها بازنشانی شد', saveFail: 'ذخیره نشد. ممکن است حافظه مرورگر پر باشد.',
    badImage: 'این فایل تصویر پشتیبانی‌شده نیست.',
  },
};

const def = () => ({
  profile: { name: '', school: '', grade: '', pfp: '', lastLogin: '' },
  notes: { items: [], strokes: [] }, // items: {id,t:'text'|'img',x,y,w,h,v|src}; strokes: {c,w,pts:[[x,y],..]} in board px
  schedule: { hours: [], days: [], cells: {} },
  homework: { required: [], optional: [] },
  exams: { exams: [], quizzes: [] },
  ui: { tab: 'notes', lang: 'en' },
});

function load() {
  const d = def();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY)) || {};
    for (const k in d) if (saved[k] && typeof saved[k] === 'object') Object.assign(d[k], saved[k]);
  } catch (e) { /* corrupt data: start fresh */ }
  if (!TABS.includes(d.ui.tab)) d.ui.tab = 'notes';
  if (!Array.isArray(d.notes.items)) d.notes.items = [];
  if (!Array.isArray(d.notes.strokes)) d.notes.strokes = [];
  if (d.notes.text) { d.notes.items.unshift({ t: 'text', v: d.notes.text }); delete d.notes.text; }
  d.notes.items.forEach((it, i) => { it.id ??= 'n' + Date.now().toString(36) + i; it.x ??= 20 + (i % 4) * 30; it.y ??= 20 + i * 30; it.w ??= it.t === 'text' ? 260 : 300; it.h ??= it.t === 'text' ? 120 : 220; });
  if (!['en', 'fa'].includes(d.ui.lang)) d.ui.lang = 'en';
  return d;
}

let D = load();
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(D));
    return true;
  } catch (e) {
    toast(t('saveFail'));
    return false;
  }
}

/* ---------- Language helpers ---------- */
function t(key, ...args) {
  const v = (T[D.ui.lang] && T[D.ui.lang][key]) ?? T.en[key] ?? key;
  return typeof v === 'function' ? v(...args) : v;
}
const fa = () => D.ui.lang === 'fa';
const loc = () => (fa() ? 'fa-IR' : 'en-US');
const num = n => (fa() ? Number(n).toLocaleString('fa-IR', { useGrouping: false }) : String(n));
const fmt = d => d.toLocaleString(loc(), { dateStyle: 'medium', timeStyle: 'short' });
const autoYears = () => {
  const n = new Date(), y = n.getFullYear();
  const start = n.getMonth() >= 6 ? y : y - 1; // school year starts in July
  return num(start) + '-' + num(start + 1);
};
const autoDate = () => new Date().toLocaleDateString(loc(), { dateStyle: 'long' });
const ord = n => {
  if (fa()) return num(n);
  const v = n % 100, s = ['th', 'st', 'nd', 'rd'];
  return n + (s[(v - 20) % 10] || s[v] || 'th');
};

// Last login: remember the previous visit for display, then record this one.
const PREV_LOGIN = D.profile.lastLogin || '';
D.profile.lastLogin = new Date().toISOString();
save();
const prevLoginText = () => {
  if (!PREV_LOGIN) return t('firstVisit');
  const d = new Date(PREV_LOGIN);
  return isNaN(d) ? PREV_LOGIN : fmt(d);
};

/* ---------- DOM helpers ---------- */
function $(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'on') for (const ev in attrs.on) el.addEventListener(ev, attrs.on[ev]);
    else if (k === 'text') el.textContent = attrs[k];
    else if (k === 'value') el.value = attrs[k];
    else el.setAttribute(k, attrs[k]);
  }
  kids.flat().forEach(c => { if (c != null) el.append(c); });
  return el;
}

// Click-to-edit text. Empty values show the placeholder.
function ed(get, set, ph = '', cls = '') {
  const e = $('span', { contenteditable: 'plaintext-only', class: 'ed ' + cls, 'data-ph': ph, spellcheck: 'false' });
  e.textContent = get() || '';
  e.addEventListener('input', () => { set(e.textContent); save(); });
  e.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' || ev.key === 'Escape') { ev.preventDefault(); e.blur(); }
  });
  return e;
}

const icon = (txt, fn, title) => $('button', { class: 'icon-btn', title, 'aria-label': title, text: txt, on: { click: fn } });
const btn = (txt, fn, cls = '') => $('button', { class: 'btn ' + cls, text: txt, on: { click: fn } });
const sure = hasContent => !hasContent || confirm(t('confirmRemove'));

function toast(msg) {
  const el = $('div', { class: 'toast', role: 'status', text: msg });
  document.body.append(el);
  setTimeout(() => el.classList.add('out'), 2200);
  setTimeout(() => el.remove(), 2600);
}

/* ---------- App shell ---------- */
function render() {
  document.documentElement.lang = D.ui.lang;
  document.documentElement.dir = fa() ? 'rtl' : 'ltr';
  document.querySelector('.logo span').textContent = t('appLabel');

  const tabs = document.getElementById('tabs');
  tabs.replaceChildren(...TABS.map(id => $('button', {
    class: id === D.ui.tab ? 'on' : '',
    text: t(id),
    'aria-selected': String(id === D.ui.tab),
    on: { click: () => { D.ui.tab = id; save(); render(); } },
  })));
  renderSide();
  menuBtn.textContent = t('menu');
  const views = { notes, schedule, homework, exams, profile };
  document.getElementById('main').replaceChildren(views[D.ui.tab]());
}

// Sidebar is display-only. Edit values in the Profile tab.
function renderSide() {
  const p = D.profile;
  const info = (label, value) => $('div', { class: 'info' },
    $('div', { class: 'lbl', text: label }),
    $('div', { class: 'val', text: value || '—' }));
  document.getElementById('side').replaceChildren(
    $('div', { class: 'pfp' }, p.pfp ? $('img', { src: p.pfp, alt: t('photoAlt') }) : $('span', { text: t('noPhoto') })),
    info(t('name'), p.name),
    info(t('school'), p.school),
    info(t('grade'), p.grade ? t('gradeN', num(p.grade)) : ''),
    info(t('years'), autoYears()),
    info(t('lastLogin'), prevLoginText()),
    info(t('date'), autoDate()),
    $('div', { class: 'side-actions' },
      btn(t('exportData'), exportData, 'primary'),
      btn(t('importData'), importData),
      btn(t('resetData'), resetData, 'danger'),
      btn(t('toggleLang'), () => { D.ui.lang = fa() ? 'en' : 'fa'; save(); render(); }, 'lang')),
  );
}

function exportData() {
  const blob = new Blob(
    [JSON.stringify({ app: 'SNACK+ School', exportedAt: new Date().toISOString(), data: D }, null, 2)],
    { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = $('a', { href: url, download: 'snack-school-export.json' });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(t('exported'));
}

function resetData() {
  if (!confirm(t('confirmReset'))) return;
  const lastLogin = D.profile.lastLogin, lang = D.ui.lang;
  D = def();
  D.profile.lastLogin = lastLogin;
  D.ui.lang = lang;
  save();
  render();
  toast(t('reset'));
}

function importData() {
  const input = $('input', { type: 'file', accept: '.json,application/json', hidden: '' });
  input.onchange = () => {
    const f = input.files[0];
    input.remove();
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      let s;
      try { s = JSON.parse(r.result).data; } catch (e) { s = null; }
      if (!s || typeof s !== 'object' || !s.schedule) { toast(t('badFile')); return; }
      if (!confirm(t('confirmImport'))) return;
      const d = def();
      for (const k in d) if (s[k] && typeof s[k] === 'object') Object.assign(d[k], s[k]);
      D = d;
      save();
      render();
      toast(t('imported'));
    };
    r.readAsText(f);
  };
  document.body.append(input);
  input.click();
}

/* ---------- A4 schedule image ---------- */
// A4 landscape at 300 dpi (3508 x 2480 px), exported as PNG.
async function exportSchedule() {
  const days = D.schedule.days, hours = D.schedule.hours, cells = D.schedule.cells;
  if (!days.length || !hours.length) { toast(t('scheduleEmpty')); return; }
  if (document.fonts) await document.fonts.ready;
  const logo = await new Promise(res => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = window.LOGO_DATA || 'logo.png';
  });

  const W = 3508, H = 2480, M = 150;
  const rtl = !!D.ui.schedRtl;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const font = (px, weight = 400) => `${weight} ${px}px Inter, Vazirmatn, Vazir, Tahoma, system-ui, sans-serif`;
  const edge = rtl ? W - M : M;           // logical start edge
  const dirX = rtl ? -1 : 1;
  const at = (x) => edge + dirX * x;      // logical x -> canvas x

  // Same palette as the site: dark violet base, orange glow, light text, glass panels.
  g.fillStyle = '#08040f';
  g.fillRect(0, 0, W, H);
  const glow = (x, y, rx, ry, color) => {
    g.save(); g.translate(x, y); g.scale(1, ry / rx);
    const grd = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    grd.addColorStop(0, color); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore();
  };
  glow(W * 0.3, 0, 1100, 1000, 'rgba(96, 40, 170, .8)');
  glow(W * 0.03, H * 0.55, 800, 900, 'rgba(70, 25, 140, .75)');
  glow(W * 0.8, H, 1000, 1000, 'rgba(170, 60, 10, .9)');
  g.textBaseline = 'middle';
  g.textAlign = rtl ? 'right' : 'left';
  g.font = font(96, 700);
  g.fillStyle = '#f1eaf8';
  g.fillText(D.profile.school || 'SNACK+ School', at(0), M + 60);
  g.font = font(56);
  g.fillStyle = 'rgba(241, 234, 248, .6)';
  const sub = [D.profile.name, D.profile.grade ? t('gradeN', num(D.profile.grade)) : '', autoYears()].filter(Boolean).join('  ·  ');
  g.fillText(sub, at(0), M + 160);
  if (logo) {
    const lh = 170, lwid = lh * logo.naturalWidth / logo.naturalHeight;
    const lx = rtl ? M : W - M - lwid;
    g.drawImage(logo, lx, M + 100 - lh / 2, lwid, lh);
  }

  // Grid: days as rows (label on the start side), hours as columns.
  const top = M + 230, tw = W - 2 * M, hh = 120;
  const lw = 340;
  const cw = (tw - lw) / hours.length;
  const rh = Math.min(400, (H - M - top - hh) / days.length);
  const colX = c => rtl ? W - M - lw - (c + 1) * cw : M + lw + c * cw; // left edge of hour column
  const rowY = r => top + hh + r * rh;
  const box = (x, y, w, h, fill) => {
    g.fillStyle = fill; g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(255, 255, 255, .22)'; g.lineWidth = 3; g.strokeRect(x, y, w, h);
  };
  const wrap = (text, maxW) => {
    const lines = []; let line = '';
    for (const w of String(text).split(/\s+/).filter(Boolean)) {
      const test = line ? line + ' ' + w : w;
      if (g.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    return lines.slice(0, 3);
  };
  const label = (text, x, y, w, h, px, weight, color = '#f1eaf8') => {
    g.font = font(px, weight); g.fillStyle = color;
    g.textAlign = 'center';
    const lines = wrap(text, w - 40);
    const lh = px * 1.25, start = y + h / 2 - (lines.length - 1) * lh / 2;
    lines.forEach((ln, k) => g.fillText(ln, x + w / 2, start + k * lh));
  };

  const glass = 'rgba(255, 255, 255, .1)', glassStrong = 'rgba(255, 255, 255, .16)';
  box(rtl ? W - M - lw : M, top, lw, hh, glassStrong);
  hours.forEach((h, c) => {
    box(colX(c), top, cw, hh, glassStrong);
    label(h || '', colX(c), top, cw, hh, 60, 700);
  });
  days.forEach((d, r) => {
    box(rtl ? W - M - lw : M, rowY(r), lw, rh, glassStrong);
    label(d || '', rtl ? W - M - lw : M, rowY(r), lw, rh, 60, 700);
    hours.forEach((_, c) => {
      box(colX(c), rowY(r), cw, rh, glass);
      label(cells[r + '|' + c] || '', colX(c), rowY(r), cw, rh, 52, 400);
    });
  });
  label(t(rtl ? 'cornerLabelRtl' : 'cornerLabel'), rtl ? W - M - lw : M, top, lw, hh, 52, 700, '#ff8a3d');

  cv.toBlob(blob => {
    if (!blob) { toast('Export failed'); return; }
    const url = URL.createObjectURL(blob);
    const a = $('a', { href: url, download: 'snack-school-schedule-A4.png' });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(t('scheduleExported'));
  }, 'image/png');
}

/* ---------- Schedule ---------- */
function schedule() {
  const S = D.schedule;
  // Data: S.days = rows, S.hours = columns, S.cells keyed 'dayIndex|hourIndex'.
  const cell = (r, i) => S.cells[r + '|' + i] || '';
  const colUsed = i => S.days.some((_, r) => cell(r, i));
  const rowUsed = r => S.hours.some((_, i) => cell(r, i));
  // Rebuild cell keys after a day or hour is removed.
  const reshape = fn => {
    const out = {};
    for (const k in S.cells) {
      const [r, i] = k.split('|').map(Number);
      const n = fn(r, i);
      if (n) out[n[0] + '|' + n[1]] = S.cells[k];
    }
    S.cells = out;
  };

  const head = $('tr', {}, $('th', { class: 'corner', text: t(D.ui.schedRtl ? 'cornerLabelRtl' : 'cornerLabel') }));
  S.hours.forEach((_, i) => head.append($('th', {},
    ed(() => S.hours[i], v => S.hours[i] = v, t('hourPh')),
    icon('−', () => {
      if (!sure(colUsed(i))) return;
      S.hours.splice(i, 1);
      reshape((r, x) => x === i ? null : [r, x > i ? x - 1 : x]);
      save(); render();
    }, t('removeHour')))));

  const tbl = $('table', {}, head);
  S.days.forEach((_, r) => {
    const tr = $('tr', {}, $('td', { class: 'rowhead' },
      ed(() => S.days[r], v => S.days[r] = v, t('dayPh')),
      icon('−', () => {
        if (!sure(rowUsed(r))) return;
        S.days.splice(r, 1);
        reshape((a, x) => a === r ? null : [a > r ? a - 1 : a, x]);
        save(); render();
      }, t('removeDay'))));
    S.hours.forEach((_, i) => tr.append($('td', {},
      ed(() => cell(r, i), v => S.cells[r + '|' + i] = v, t('cellPh')))));
    tbl.append(tr);
  });

  tbl.setAttribute('dir', D.ui.schedRtl ? 'rtl' : 'ltr');
  return $('section', { class: 'card' },
    $('div', { class: 'table-wrap' }, tbl),
    $('div', { class: 'actions' },
      btn(t('addDay'), () => { S.days.push(''); save(); render(); }),
      btn(t('addHour'), () => { S.hours.push(ord(S.hours.length + 1)); save(); render(); }),
      btn(t('exportSchedule'), () => exportSchedule(), 'primary'),
      btn(t('rtlSwitch') + ': ' + (D.ui.schedRtl ? 'ON' : 'OFF'), () => { D.ui.schedRtl = !D.ui.schedRtl; save(); render(); })));
}

/* ---------- Lists (homework / exams) ---------- */
// Fields whose key is listed here use a date picker instead of text.
const DATE_KEYS = new Set(['due', 'date']);
function typeSelect(obj, key) {
  const sel = $('select', { class: 'select type-pick', 'aria-label': t('examType'),
    on: { change: () => { obj[key] = sel.value; save(); } } },
    $('option', { value: '', text: t('examType') }),
    $('option', { value: 'midterm', text: t('midterm') }),
    $('option', { value: 'final', text: t('final') }));
  sel.value = ['midterm', 'final'].includes(obj[key]) ? obj[key] : '';
  return sel;
}
function dateInput(obj, key) {
  const inp = $('input', { type: 'date', class: 'date-pick', 'aria-label': key === 'due' ? t('dueDate') : t('date') });
  inp.value = obj[key] || '';
  inp.addEventListener('input', () => { obj[key] = inp.value; save(); });
  return inp;
}

function list(arr, fields, placeholders, addLabel) {
  const wrap = $('div', { class: 'list' });
  if (!arr.length) wrap.append($('p', { class: 'empty', text: t('nothing') }));
  arr.forEach((it, i) => {
    const row = $('div', { class: 'row' });
    fields.forEach((f, j) => row.append(f === 'type' ? typeSelect(it, f) : DATE_KEYS.has(f)
      ? dateInput(it, f)
      : ed(() => it[f], v => it[f] = v, placeholders[j], j === 0 ? 'main' : '')));
    row.append(icon('−', () => {
      if (!sure(Object.values(it).some(Boolean))) return;
      arr.splice(i, 1); save(); render();
    }, t('remove')));
    wrap.append(row);
  });
  wrap.append($('div', { class: 'actions' }, btn(addLabel, () => { arr.push({}); save(); render(); })));
  return wrap;
}

const BOARD_W = 2000, BOARD_H = 1400;
function notes() {
  const N = D.notes;
  const board = $('div', { class: 'board' });
  const canvas = $('canvas', { class: 'board-ink', width: BOARD_W, height: BOARD_H });
  const ctx = canvas.getContext('2d');
  const inner = $('div', { class: 'board-inner' }, canvas);
  board.append(inner);
  const drawAll = () => {
    ctx.clearRect(0, 0, BOARD_W, BOARD_H);
    ctx.lineCap = ctx.lineJoin = 'round';
    N.strokes.forEach(st => {
      if (!st.pts.length) return;
      ctx.strokeStyle = st.c; ctx.lineWidth = st.w;
      ctx.globalCompositeOperation = st.e ? 'destination-out' : 'source-over';
      ctx.beginPath(); ctx.moveTo(st.pts[0][0], st.pts[0][1]);
      st.pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.stroke();
    });
    ctx.globalCompositeOperation = 'source-over';
  };
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * BOARD_W / r.width, (e.clientY - r.top) * BOARD_H / r.height]; };

  // tool bar
  let tool = 'select', color = '#ffb35c', size = 4;
  const tools = $('div', { class: 'board-tools' });
  const toolBtn = (id, label) => { const b = btn(label, () => { tool = id; refreshTools(); }, ''); b.dataset.tool = id; return b; };
  const colorIn = $('input', { type: 'color', value: color, title: 'Color' });
  colorIn.addEventListener('input', () => { color = colorIn.value; });
  const sizeIn = $('input', { type: 'range', min: 2, max: 24, value: size, title: 'Size' });
  sizeIn.addEventListener('input', () => { size = +sizeIn.value; });
  const refreshTools = () => tools.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('primary', b.dataset.tool === tool));
  const addText = btn(t('addText'), () => {
    const it = { id: 'n' + Date.now().toString(36), t: 'text', x: 60, y: 60, w: 280, h: 120, v: '' };
    N.items.push(it); save(); render();
  }, 'ghost');
  const file = $('input', { type: 'file', accept: 'image/*', hidden: '' });
  file.addEventListener('change', () => {
    const f = file.files[0];
    if (!f) return;
    resizePhoto(f, data => {
      const it = { id: 'n' + Date.now().toString(36), t: 'img', x: 80, y: 80, w: 320, h: 240, src: data };
      N.items.push(it);
      if (save()) render(); else { N.items.pop(); toast(t('imageTooBig')); }
    }, 1000);
  });
  const addImg = btn(t('addImage'), () => file.click(), 'ghost');
  const clearBtn = btn(t('clearInk'), () => { if (confirm(t('confirmRemove'))) { N.strokes = []; drawAll(); save(); } }, 'ghost');
  tools.append(toolBtn('select', t('toolSelect')), toolBtn('pen', t('toolPen')), toolBtn('erase', t('toolErase')), colorIn, sizeIn, addText, addImg, clearBtn, file);
  refreshTools();

  // items
  const itemEls = new Map();
  let zTop = 1;
  const mountItem = (it) => {
    const el = $('div', { class: 'board-item ' + it.t });
    el.style.left = it.x + 'px'; el.style.top = it.y + 'px';
    el.style.width = it.w + 'px'; el.style.height = it.h + 'px';
    const grip = $('div', { class: 'board-grip' });
    const del = $('button', { class: 'board-del', text: '×', title: t('removeImage') });
    del.addEventListener('pointerdown', e => e.stopPropagation());
    del.addEventListener('click', e => { e.stopPropagation(); N.items = N.items.filter(x => x !== it); itemEls.delete(it); el.remove(); save(); });
    if (it.t === 'text') {
      const ta = $('textarea', { class: 'board-text', placeholder: t('notePh'), dir: 'auto' });
      ta.value = it.v || '';
      ta.addEventListener('input', () => { it.v = ta.value; save(); });
      ta.addEventListener('pointerdown', e => e.stopPropagation());
      el.append(ta);
    } else {
      el.append($('img', { src: it.src, alt: t('noteImg'), draggable: 'false' }));
    }
    const rz = $('div', { class: 'board-resize' });
    el.append(grip, del, rz);
    // drag / resize
    const drag = (handle, mode) => handle.addEventListener('pointerdown', e => {
      if (tool !== 'select') return;
      e.preventDefault(); e.stopPropagation();
      handle.setPointerCapture(e.pointerId);
      const [sx, sy] = pos(e); const ox = it.x, oy = it.y, ow = it.w, oh = it.h;
      const move = ev => {
        const [px, py] = pos(ev); const dx = px - sx, dy = py - sy;
        if (mode === 'move') { it.x = Math.max(0, ox + dx); it.y = Math.max(0, oy + dy); }
        else { it.w = Math.max(120, ow + dx); it.h = Math.max(60, oh + dy); }
        el.style.left = it.x + 'px'; el.style.top = it.y + 'px';
        el.style.width = it.w + 'px'; el.style.height = it.h + 'px';
      };
      const up = () => { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', up); save(); };
      handle.addEventListener('pointermove', move); handle.addEventListener('pointerup', up);
    });
    drag(grip, 'move'); drag(rz, 'resize');
    el.addEventListener('pointerdown', () => { el.style.zIndex = ++zTop; });
    itemEls.set(it, el);
    return el;
  };
  N.items.forEach(it => inner.append(mountItem(it)));

  // ink
  let cur = null;
  canvas.addEventListener('pointerdown', e => {
    if (tool === 'select') return;
    e.preventDefault(); canvas.setPointerCapture(e.pointerId);
    const erase = tool === 'erase';
    cur = { c: color, w: erase ? size * 3 : size, e: erase, pts: [pos(e)] };
    N.strokes.push(cur); drawAll();
  });
  canvas.addEventListener('pointermove', e => {
    if (!cur) return;
    cur.pts.push(pos(e)); drawAll();
  });
  const endInk = () => { if (cur) { cur = null; save(); } };
  canvas.addEventListener('pointerup', endInk);
  canvas.addEventListener('pointercancel', endInk);
  drawAll();

  // mirror inner sizing to board so scrolling works
  return $('section', { class: 'card notes' },
    $('h2', { text: t('notes') }), tools, board);
}

function homework() {
  const H = D.homework;
  const f = ['title', 'due'], ph = [t('assignment'), t('dueDate')];
  return $('section', { class: 'card' },
    $('h2', { text: t('required') }), list(H.required, f, ph, t('addRequired')),
    $('h2', { text: t('optional') }), list(H.optional, f, ph, t('addOptional')));
}

function exams() {
  const X = D.exams;
  return $('section', { class: 'card' },
    $('h2', { text: t('midFinal') }),
    list(X.exams, ['title', 'date', 'type'], [t('examTitle'), t('examDate'), t('examType')], t('addExam')),
    $('h2', { text: t('quizzes') }),
    list(X.quizzes, ['title', 'date'], [t('quizTitle'), t('quizDate')], t('addQuiz')));
}

/* ---------- Profile ---------- */
function resizePhoto(file, done, maxSide = 400) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const s = Math.min(1, maxSide / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    const g = c.getContext('2d');
    g.fillStyle = '#1d1329';
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    done(c.toDataURL('image/jpeg', 0.88));
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast(t('badImage')); };
  img.src = url;
}

function profile() {
  const p = D.profile;
  const file = $('input', { type: 'file', accept: 'image/*', hidden: '' });
  file.onchange = () => {
    const f = file.files[0];
    if (f) resizePhoto(f, data => { p.pfp = data; if (save()) render(); });
  };
  const grade = $('select', { class: 'select', 'aria-label': t('grade'), on: { change: () => { p.grade = grade.value; save(); renderSide(); } } },
    $('option', { value: '', text: t('selectGrade') }),
    ...Array.from({ length: 12 }, (_, i) => $('option', { value: String(i + 1), text: t('gradeN', num(i + 1)) })));
  grade.value = p.grade || '';

  const field = (label, k, ph) => $('div', { class: 'field' },
    $('div', { class: 'flabel', text: label }),
    ed(() => p[k], v => p[k] = v, ph));

  return $('section', { class: 'card profile' },
    $('div', { class: 'photo' },
      p.pfp ? $('img', { src: p.pfp, alt: t('photoAlt') }) : $('div', { class: 'photo-empty', text: t('noPhoto') }),
      $('div', { class: 'photo-btns' },
        btn(t('upload'), () => file.click()),
        btn(t('removePhoto'), () => { p.pfp = ''; save(); render(); }, 'ghost')),
      file),
    $('div', { class: 'fields' },
      field(t('name'), 'name', t('yourName')),
      field(t('school'), 'school', t('schoolName')),
      $('div', { class: 'field' }, $('div', { class: 'flabel', text: t('grade') }), grade)));
}
// Mobile sidebar popup
const menuBtn = document.getElementById('menuBtn');
const scrim = document.getElementById('scrim');
const sideEl = document.getElementById('side');
const setSide = open => {
  sideEl.classList.toggle('open', open);
  scrim.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
};
menuBtn.addEventListener('click', () => setSide(!sideEl.classList.contains('open')));
scrim.addEventListener('click', () => setSide(false));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setSide(false); });

render();
