let joinRoom = null;
import("https://esm.sh/trystero@0.21.5/torrent").then((m) => { joinRoom = m.joinRoom; state?.servers?.forEach((s) => { try { connect(s); } catch (e) { console.error(e); } }); }).catch((e) => console.error("Trystero failed", e));

const APP_ID = "snack-cord-v1";
const STORE = "snackcord.v1";
const THEMES = ["snack", "light", "dark", "green", "cream"];
const $ = (id) => document.getElementById(id);

const ICONS = {
  hash: '<path d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18"/>',
  voice: '<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 010 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
  users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0114 0M16 4a4 4 0 010 8M22 21a7 7 0 00-5-6.7"/>',
  link: '<path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
};
const svg = (name) => `<svg class="icon" viewBox="0 0 24 24">${ICONS[name]}</svg>`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = (n = 12) => { const a = "abcdefghijkmnopqrstuvwxyz23456789"; let s = ""; const b = crypto.getRandomValues(new Uint8Array(n)); for (const x of b) s += a[x % a.length]; return s; };
const code8 = () => uid(8).toUpperCase();
const initials = (n) => (n || "?").trim().slice(0, 1).toUpperCase();

/* ---------- Storage ---------- */
let state = load();
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE));
    if (s && s.me) return s;
  } catch {}
  return null;
}
function save() { localStorage.setItem(STORE, JSON.stringify(state)); }
function theme(name) { document.documentElement.dataset.theme = name; }

/* ---------- Runtime ---------- */
// rt[serverId] = { room, send:{msg,typing,hello,sync,del,edit}, peers: Map<peerId,{name}>, typing: Map }
const rt = {};
let curSrv = null, curCh = null, members = true;

function newServer(name, code) {
  code = code || code8();
  return {
    id: uid(8), name, code,
    channels: [{ id: "gen-" + code, name: "general", type: "text" }, { id: "rnd-" + code, name: "random", type: "text" }],
    messages: {}, // channelId -> [msg]
    deleted: [],  // tombstone ids
  };
}

function connect(srv) {
  if (rt[srv.id] || !joinRoom) return;
  const room = joinRoom({ appId: APP_ID }, "snackcord-" + srv.code);
  const [sMsg, gMsg] = room.makeAction("msg");
  const [sEdit, gEdit] = room.makeAction("edit");
  const [sDel, gDel] = room.makeAction("del");
  const [sTyp, gTyp] = room.makeAction("typing");
  const [sHello, gHello] = room.makeAction("hello");
  const [sSync, gSync] = room.makeAction("sync");
  const r = { room, peers: new Map(), typing: new Map(), sendHello: sHello, sendSync: sSync, sendMsg: sMsg, sendEdit: sEdit, sendDel: sDel, sendTyp: sTyp };
  rt[srv.id] = r;

  const hello = () => ({ name: state.me.name, srvName: srv.pending ? null : srv.name, channels: srv.channels });
  room.onPeerJoin((pid) => { sHello(hello(), pid); sSync({ messages: srv.messages, deleted: srv.deleted }, pid); render(); });
  room.onPeerLeave((pid) => { r.peers.delete(pid); r.typing.delete(pid); render(); });

  gHello((d, pid) => {
    r.peers.set(pid, { name: d.name || "Unknown" });
    if (srv.pending && d.srvName) { srv.name = d.srvName; delete srv.pending; }
    // merge channels we don't know
    for (const c of d.channels || []) if (!srv.channels.some((x) => x.id === c.id)) srv.channels.push(c);
    save(); render();
  });
  gSync((d) => {
    for (const id of d.deleted || []) if (!srv.deleted.includes(id)) srv.deleted.push(id);
    for (const [ch, list] of Object.entries(d.messages || {})) {
      const mine = (srv.messages[ch] ||= []);
      for (const m of list) {
        if (srv.deleted.includes(m.id)) continue;
        const i = mine.findIndex((x) => x.id === m.id);
        if (i < 0) mine.push(m); else if ((m.edited || 0) > (mine[i].edited || 0)) mine[i] = m;
      }
      mine.sort((a, b) => a.ts - b.ts);
    }
    purgeDeleted(srv); save(); render();
  });
  gMsg((m) => {
    if (srv.deleted.includes(m.id)) return;
    const list = (srv.messages[m.ch] ||= []);
    if (!list.some((x) => x.id === m.id)) { list.push(m); list.sort((a, b) => a.ts - b.ts); }
    save(); render();
  });
  gEdit((m) => {
    const list = srv.messages[m.ch] || [];
    const x = list.find((y) => y.id === m.id);
    if (x && (m.edited || 0) > (x.edited || 0)) { x.text = m.text; x.edited = m.edited; save(); render(); }
  });
  gDel((d) => {
    if (!srv.deleted.includes(d.id)) srv.deleted.push(d.id);
    for (const ch in srv.messages) srv.messages[ch] = srv.messages[ch].filter((x) => x.id !== d.id);
    save(); render();
  });
  gTyp((d, pid) => {
    if (d.on) { r.typing.set(pid, { name: d.name, t: Date.now() }); } else r.typing.delete(pid);
    renderTyping();
  });
  setInterval(() => { // expire stale typing
    let changed = false;
    for (const [pid, v] of r.typing) if (Date.now() - v.t > 4000) { r.typing.delete(pid); changed = true; }
    if (changed) renderTyping();
  }, 1000);
}

function purgeDeleted(srv) {
  for (const ch in srv.messages) srv.messages[ch] = srv.messages[ch].filter((x) => !srv.deleted.includes(x.id));
}

function broadcastHello(srv) { const r = rt[srv.id]; if (r) r.sendHello({ name: state.me.name, srvName: srv.pending ? null : srv.name, channels: srv.channels }); }

/* ---------- Rendering ---------- */
function render() {
  renderRail(); renderSidebar(); renderMessages(); renderMembers(); renderTyping();
  $("meAv").textContent = initials(state.me.name);
  $("meName").textContent = state.me.name;
}

function renderRail() {
  $("rail").innerHTML = state.servers.map((s) =>
    `<button class="rail-btn ${s.id === curSrv?.id ? "active" : ""}" data-srv="${s.id}" title="${esc(s.name)}">${esc(initials(s.name))}</button>`
  ).join("") + `<div class="rail-sep"></div><button class="rail-btn" id="btnAddSrv" title="Add server">${`<svg class="icon" viewBox="0 0 24 24">${ICONS.plus}</svg>`}</button>`;
}

function renderSidebar() {
  if (!curSrv) { $("srvName").textContent = "No server"; $("channels").innerHTML = ""; return; }
  $("srvName").textContent = curSrv.name;
  const texts = curSrv.channels.filter((c) => c.type === "text");
  const voices = curSrv.channels.filter((c) => c.type === "voice");
  const row = (c) => `<div class="chan ${c.id === curCh ? "active" : ""}" data-ch="${c.id}">${svg(c.type === "voice" ? "voice" : "hash")}<span>${esc(c.name)}</span></div>`;
  $("channels").innerHTML =
    `<div class="chan-group"><h4>Text channels</h4>${texts.map(row).join("")}</div>` +
    (voices.length ? `<div class="chan-group"><h4>Voice channels</h4>${voices.map(row).join("")}</div>` : "") +
    `<div class="chan-group"><div class="chan" id="btnAddCh">${svg("plus")}<span>Add channel</span></div></div>`;
}

function renderMessages() {
  const box = $("messages");
  const composer = $("composer");
  if (!curSrv || !curCh) { box.innerHTML = `<div class="empty">Create or join a server to start.</div>`; composer.classList.add("hidden"); $("chName").textContent = ""; $("chTopic").textContent = ""; return; }
  const ch = curSrv.channels.find((c) => c.id === curCh);
  $("chName").textContent = ch ? "# " + ch.name : "";
  $("chTopic").textContent = ch ? `Invite code: ${curSrv.code}` : "";
  composer.classList.remove("hidden");
  const list = curSrv.messages[curCh] || [];
  if (!list.length) { box.innerHTML = `<div class="empty">No messages yet. Say hello.</div>`; return; }
  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
  box.innerHTML = list.map((m) => {
    const mine = m.authorId === state.me.id;
    const t = new Date(m.ts).toLocaleString([], { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" });
    const actions = mine ? `<div class="msg-actions"><button class="icon-btn" data-edit="${m.id}" title="Edit">${svg("edit")}</button><button class="icon-btn" data-del="${m.id}" title="Delete">${svg("trash")}</button></div>` : "";
    return `<div class="msg"><div class="avatar">${esc(initials(m.author))}</div><div class="msg-body">
      <div class="msg-head"><b>${esc(m.author)}</b><time>${t}</time></div>
      <div class="msg-text" data-text="${m.id}">${esc(m.text)}${m.edited ? ' <span class="edited">(edited)</span>' : ""}</div>
    </div>${actions}</div>`;
  }).join("");
  if (atBottom) box.scrollTop = box.scrollHeight;
}

function renderMembers() {
  const box = $("members");
  if (!curSrv || !members) { box.classList.add("hidden"); return; }
  box.classList.remove("hidden");
  const r = rt[curSrv.id];
  const online = r ? [...r.peers.values()] : [];
  box.innerHTML = `<h4>Online — ${online.length + 1}</h4>
    <div class="member"><div class="avatar">${esc(initials(state.me.name))}</div><span>${esc(state.me.name)}</span><span class="dot on"></span></div>` +
    online.map((p) => `<div class="member"><div class="avatar">${esc(initials(p.name))}</div><span>${esc(p.name)}</span><span class="dot on"></span></div>`).join("");
}

function renderTyping() {
  const r = curSrv && rt[curSrv.id];
  const names = r ? [...r.typing.values()].map((v) => v.name) : [];
  $("typing").textContent = names.length ? `${names.join(", ")} ${names.length > 1 ? "are" : "is"} typing...` : "";
}

function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.add("hidden"), 2200);
}

/* ---------- Modal ---------- */
function openModal(html, bind) {
  const m = $("modal"); m.innerHTML = `<div class="dialog">${html}</div>`; m.classList.remove("hidden");
  m.onclick = (e) => { if (e.target === m) closeModal(); };
  bind?.(m.querySelector(".dialog"));
}
function closeModal() { $("modal").classList.add("hidden"); $("modal").innerHTML = ""; }

function openServerDialog() {
  openModal(`<h3>Add a server</h3>
    <button class="btn filled" id="mCreate">Create a new server</button>
    <div class="field"><span>Or join with an invite code</span><input id="mCode" maxlength="8" placeholder="8-character code"></div>
    <div class="row-end"><button class="btn" id="mCancel">Cancel</button><button class="btn filled" id="mJoin">Join</button></div>`,
  (d) => {
    d.querySelector("#mCancel").onclick = closeModal;
    d.querySelector("#mCreate").onclick = () => { closeModal(); openNameServer(); };
    d.querySelector("#mJoin").onclick = () => {
      const c = d.querySelector("#mCode").value.trim().toUpperCase();
      if (!/^[A-Z0-9]{8}$/.test(c)) return toast("Invite code must be 8 letters or digits");
      if (state.servers.some((s) => s.code === c)) return toast("You already joined that server");
      const s = newServer("Joining " + c.slice(0, 4) + "...", c);
      s.pending = true;
      addServer(s); closeModal();
    };
  });
}

function openNameServer() {
  openModal(`<h3>Name your server</h3>
    <div class="field"><span>Server name</span><input id="mName" maxlength="32" value="${esc(state.me.name)}'s server"></div>
    <div class="row-end"><button class="btn" id="mCancel">Cancel</button><button class="btn filled" id="mOk">Create</button></div>`,
  (d) => {
    d.querySelector("#mCancel").onclick = closeModal;
    d.querySelector("#mOk").onclick = () => {
      const n = d.querySelector("#mName").value.trim() || "New server";
      addServer(newServer(n)); closeModal();
    };
  });
}

function openInvite() {
  if (!curSrv) return;
  openModal(`<h3>Invite people</h3>
    <p class="muted">Share this code. Friends join with it from the Add server menu.</p>
    <div class="code">${esc(curSrv.code)}</div>
    <div class="row-end"><button class="btn" id="mClose">Close</button><button class="btn filled" id="mCopy">Copy code</button></div>`,
  (d) => {
    d.querySelector("#mClose").onclick = closeModal;
    d.querySelector("#mCopy").onclick = () => { navigator.clipboard?.writeText(curSrv.code); toast("Code copied"); };
  });
}

function openSettings() {
  openModal(`<h3>Settings</h3>
    <div class="field"><span>Display name</span><input id="sName" maxlength="32" value="${esc(state.me.name)}"></div>
    <div class="field"><span>Theme</span><div class="radio-row">${THEMES.map((t) =>
      `<label><input type="radio" name="th" value="${t}" ${state.theme === t ? "checked" : ""} hidden><span>${t[0].toUpperCase() + t.slice(1)}</span></label>`).join("")}</div></div>
    <div class="row-end"><button class="btn" id="mClose">Close</button><button class="btn filled" id="mSave">Save</button></div>`,
  (d) => {
    d.querySelectorAll('input[name="th"]').forEach((i) => i.onchange = () => theme(i.value));
    d.querySelector("#mClose").onclick = () => { theme(state.theme); closeModal(); };
    d.querySelector("#mSave").onclick = () => {
      const n = d.querySelector("#sName").value.trim();
      if (n) state.me.name = n;
      state.theme = d.querySelector('input[name="th"]:checked').value;
      theme(state.theme); save();
      for (const s of state.servers) broadcastHello(s);
      closeModal(); render();
    };
  });
}

function openAddChannel() {
  openModal(`<h3>Create channel</h3>
    <div class="field"><span>Name</span><input id="cName" maxlength="32" placeholder="new-channel"></div>
    <div class="field"><span>Type</span><div class="radio-row">
      <label><input type="radio" name="ct" value="text" checked hidden><span>Text</span></label>
      <label><input type="radio" name="ct" value="voice" hidden><span>Voice</span></label></div></div>
    <div class="row-end"><button class="btn" id="mCancel">Cancel</button><button class="btn filled" id="mOk">Create</button></div>`,
  (d) => {
    d.querySelectorAll('input[name="ct"]').forEach((i) => i.onchange = () => { d.querySelectorAll('input[name="ct"]').forEach((x) => x.parentElement.querySelector("span").style.color = ""); });
    d.querySelector("#mCancel").onclick = closeModal;
    d.querySelector("#mOk").onclick = () => {
      const n = d.querySelector("#cName").value.trim().toLowerCase().replace(/\s+/g, "-");
      if (!n) return toast("Name required");
      const type = d.querySelector('input[name="ct"]:checked').value;
      curSrv.channels.push({ id: uid(6), name: n, type });
      save(); closeModal(); render();
      broadcastHello(curSrv);
    };
  });
}

/* ---------- Actions ---------- */
function addServer(s) {
  state.servers.push(s); curSrv = s; curCh = s.channels[0].id;
  save(); connect(s); render();
}

function selectServer(id) {
  curSrv = state.servers.find((s) => s.id === id);
  curCh = curSrv.channels.find((c) => c.type === "text")?.id || null;
  connect(curSrv); render();
}

function selectChannel(id) {
  const c = curSrv.channels.find((x) => x.id === id);
  if (!c || c.type !== "text") return toast("Voice channels are not available yet");
  curCh = id; render();
}

function sendMessage(text) {
  const m = { id: uid(10), ch: curCh, author: state.me.name, authorId: state.me.id, text, ts: Date.now() };
  (curSrv.messages[curCh] ||= []).push(m);
  save(); rt[curSrv.id].sendMsg(m); render();
}

function editMessage(id) {
  const list = curSrv.messages[curCh] || [];
  const m = list.find((x) => x.id === id); if (!m) return;
  openModal(`<h3>Edit message</h3>
    <textarea id="eText" rows="4" maxlength="2000" class="code" style="font-family:inherit;resize:vertical">${esc(m.text)}</textarea>
    <div class="row-end"><button class="btn" id="mCancel">Cancel</button><button class="btn filled" id="mOk">Save</button></div>`,
  (d) => {
    d.querySelector("#mCancel").onclick = closeModal;
    d.querySelector("#mOk").onclick = () => {
      const t = d.querySelector("#eText").value.trim(); if (!t) return;
      m.text = t; m.edited = Date.now(); save(); rt[curSrv.id].sendEdit(m); closeModal(); render();
    };
  });
}

function deleteMessage(id) {
  openModal(`<h3>Delete message?</h3><p class="muted">This removes it for everyone online and later joiners.</p>
    <div class="row-end"><button class="btn" id="mCancel">Cancel</button><button class="btn danger" id="mOk">Delete</button></div>`,
  (d) => {
    d.querySelector("#mCancel").onclick = closeModal;
    d.querySelector("#mOk").onclick = () => {
      curSrv.deleted.push(id);
      for (const ch in curSrv.messages) curSrv.messages[ch] = curSrv.messages[ch].filter((x) => x.id !== id);
      save(); rt[curSrv.id].sendDel({ id }); closeModal(); render();
    };
  });
}

/* ---------- Events ---------- */
let typingOn = false, typingTimer = null;
function setTyping(on) {
  if (!curSrv || typingOn === on) return;
  typingOn = on; rt[curSrv.id]?.sendTyp({ on, name: state.me.name });
}

$("loginForm").onsubmit = (e) => {
  e.preventDefault();
  const name = $("loginName").value.trim(); if (!name) return;
  state = state || { servers: [], theme: "snack" };
  state.me = { id: uid(10), name };
  save(); boot();
};

$("rail").onclick = (e) => {
  const add = e.target.closest("#btnAddSrv");
  if (add) return openServerDialog();
  const b = e.target.closest("[data-srv]");
  if (b) selectServer(b.dataset.srv);
};

$("channels").onclick = (e) => {
  if (e.target.closest("#btnAddCh")) return openAddChannel();
  const c = e.target.closest("[data-ch]");
  if (c) selectChannel(c.dataset.ch);
};

$("messages").onclick = (e) => {
  const ed = e.target.closest("[data-edit]"); if (ed) return editMessage(ed.dataset.edit);
  const dl = e.target.closest("[data-del]"); if (dl) deleteMessage(dl.dataset.del);
};

$("msgInput").addEventListener("input", (e) => {
  const el = e.target; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 160) + "px";
  setTyping(el.value.length > 0);
  clearTimeout(typingTimer); typingTimer = setTimeout(() => setTyping(false), 2500);
});

$("composer").onsubmit = (e) => {
  e.preventDefault();
  const el = $("msgInput"); const t = el.value.trim();
  if (!t || !curCh) return;
  sendMessage(t); el.value = ""; el.style.height = "auto"; setTyping(false);
};

$("msgInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("composer").requestSubmit(); }
});

$("btnSettings").onclick = openSettings;
$("btnInvite").onclick = openInvite;
$("btnMembers").onclick = () => { members = !members; renderMembers(); };

/* ---------- Icons in static slots ---------- */
function paintStatic() {
  $("btnSettings").innerHTML = svg("settings");
  $("btnInvite").innerHTML = svg("link");
  $("btnMembers").innerHTML = svg("users");
}

/* ---------- Boot ---------- */
function boot() {
  $("login").classList.add("hidden");
  $("app").classList.remove("hidden");
  paintStatic();
  theme(state.theme || "snack");
  if (state.servers.length) { curSrv = state.servers[0]; curCh = curSrv.channels.find((c) => c.type === "text")?.id || null; state.servers.forEach(connect); }
  render();
}

state = load();
if (state) {
  if (!state.theme) state.theme = "snack";
  theme(state.theme);
  boot();
} else {
  theme("snack");
  $("loginName").focus();
}
