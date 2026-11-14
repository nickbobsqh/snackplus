// SNACK+ Meet - WebRTC mesh video meetings.
// Signaling is serverless via Trystero (public relays), so it runs on GitHub Pages.
import { joinRoom } from "https://esm.sh/trystero@0.21.5/torrent";

const APP_ID = "snackplus-meet-v1";
const THEMES = [
  { id: "snack", name: "SNACK+", bg: "#380137", main: "#4B0848", active: "#FF6710" },
  { id: "light", name: "Light", bg: "#E7F1FC", main: "#FFFFFF", active: "#006EDD" },
  { id: "dark", name: "Dark", bg: "#05080F", main: "#0C1523", active: "#3189ED" },
  { id: "green", name: "Green", bg: "#0E2A1B", main: "#163A26", active: "#33DD89" },
  { id: "cream", name: "Cream", bg: "#F6ECD8", main: "#FFFAF0", active: "#BA6522" },
];

const $ = (id) => document.getElementById(id);
const ICON_MIC_OFF = "M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zM4.27 3 3 4.27l6.01 6.01V11a3 3 0 0 0 3.5 2.96l1.45 1.45A6.9 6.9 0 0 1 12 18c-3.31 0-6-2.69-6-6H4.27z";
const ICON_MIC = "M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z";
const ICON_SHARE = "M20 18c1.1 0 2-.9 2-2V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z";

const state = {
  name: localStorage.getItem("snack.name") || "",
  roomId: "",
  room: null,
  camStream: null,      // local camera + mic
  screenStream: null,   // local screen share
  micOn: true,
  camOn: true,
  peers: new Map(),     // peerId -> { name, mic, cam, tiles: Map<streamId, el> }
  remoteStreams: new Map(), // streamId -> { peerId, kind, stream }
};

// ---------- Theme ----------
function applyTheme(id) {
  document.body.dataset.theme = id;
  localStorage.setItem("snack.theme", id);
  document.querySelectorAll(".swatch").forEach((s) =>
    s.setAttribute("aria-checked", String(s.dataset.id === id)));
}
function buildSwatches() {
  const wrap = $("themeSwatchesLobby");
  THEMES.forEach((t) => {
    const b = document.createElement("button");
    b.className = "swatch";
    b.dataset.id = t.id;
    b.title = t.name;
    b.setAttribute("role", "radio");
    b.setAttribute("aria-label", t.name);
    b.innerHTML = `<span class="swatch-inner" style="background:${t.active}"></span>`;
    b.style.background = t.bg;
    b.onclick = () => applyTheme(t.id);
    wrap.appendChild(b);
  });
  applyTheme(localStorage.getItem("snack.theme") || "snack");
}

// ---------- Helpers ----------
function toast(msg, ms = 2600) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), ms);
}
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("active", s.id === id));
}
function slug(s) {
  return s.trim().toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}
function randomCode() {
  const a = new Uint32Array(3);
  crypto.getRandomValues(a);
  return Array.from(a, (n) => n.toString(36).slice(0, 3)).join("-");
}
function initials(name) {
  return (name || "?").trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
function svgIcon(path, cls = "") {
  return `<svg class="${cls}" viewBox="0 0 24 24"><path d="${path}"/></svg>`;
}

// ---------- Media ----------
async function getCamera() {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: { echoCancellation: true, noiseSuppression: true },
    });
  } catch {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      toast("Camera unavailable. Joined with audio only.");
      state.camOn = false;
      return s;
    } catch {
      toast("Microphone and camera blocked. You can still watch others.");
      state.micOn = false;
      state.camOn = false;
      return new MediaStream();
    }
  }
}

// ---------- Tiles ----------
function getGrid() { return $("grid"); }

function makeTile(key, { name, local, mirror }) {
  const el = document.createElement("div");
  el.className = "tile" + (local ? " local" : "");
  el.id = "tile-" + key;
  el.innerHTML = `
    <video autoplay playsinline ${local ? "muted" : ""} class="${mirror ? "mirror" : ""}"></video>
    <div class="avatar">${initials(name)}</div>
    <div class="label"><span class="lname"></span></div>`;
  el.querySelector(".lname").textContent = name + (local ? " (you)" : "");
  getGrid().appendChild(el);
  updateCount();
  return el;
}

function updateCount() {
  const n = state.peers.size + 1;
  $("peerCount").textContent = n + (n === 1 ? " person" : " people");
}

function setLocalTile() {
  let el = $("tile-local");
  if (!el) el = makeTile("local", { name: state.name, local: true, mirror: true });
  const v = el.querySelector("video");
  v.srcObject = state.camStream;
  refreshLocalTile();
}

function refreshLocalTile() {
  const el = $("tile-local");
  if (!el || !state.camStream) return;
  const vt = state.camStream.getVideoTracks()[0];
  const cameraOn = !!vt && vt.enabled && state.camOn;
  el.classList.toggle("hidden-video", !cameraOn);
  el.querySelector(".label").innerHTML =
    (state.micOn ? "" : svgIcon(ICON_MIC_OFF)) + `<span>${escapeHtml(state.name)} (you)</span>`;
  el.querySelector(".avatar").textContent = initials(state.name);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function updateRemoteTile(peerId) {
  const p = state.peers.get(peerId);
  if (!p) return;
  const camEl = p.camTile;
  if (camEl) {
    camEl.classList.toggle("hidden-video", !p.cam);
    camEl.querySelector(".avatar").textContent = initials(p.name);
    const label = camEl.querySelector(".label");
    label.innerHTML = (p.mic ? "" : svgIcon(ICON_MIC_OFF)) + `<span>${escapeHtml(p.name)}</span>`;
  }
  p.screenTiles?.forEach((el) => {
    const label = el.querySelector(".label");
    label.innerHTML = svgIcon(ICON_SHARE) + `<span>${escapeHtml(p.name)} is presenting</span>`;
  });
}

function addRemoteStreamTile(peerId, stream, kind) {
  const p = state.peers.get(peerId);
  if (!p) return;
  const key = `${peerId}-${kind}`;
  let el = document.getElementById("tile-" + key);
  if (!el) {
    el = makeTile(key, { name: p.name });
    if (kind === "screen") {
      el.classList.add("screen");
      el.querySelector("video").classList.add("contain");
      p.screenTiles = p.screenTiles || new Set();
      p.screenTiles.add(el);
    } else {
      p.camTile = el;
    }
  }
  el.querySelector("video").srcObject = stream;
  if (kind === "camera") updateRemoteTile(peerId);
  else {
    el.querySelector(".label").innerHTML = svgIcon(ICON_SHARE) + `<span>${escapeHtml(p.name)} is presenting</span>`;
    el.querySelector(".avatar").style.display = "none";
  }
}

function removePeerTiles(peerId) {
  const p = state.peers.get(peerId);
  if (!p) return;
  document.querySelectorAll(`[id^="tile-${peerId}-"]`).forEach((el) => el.remove());
  state.peers.delete(peerId);
  updateCount();
}

// ---------- Room ----------
async function join(roomId) {
  state.roomId = roomId;
  state.name = state.name || "Guest";
  localStorage.setItem("snack.name", state.name);

  $("roomLabel").textContent = roomId;
  history.replaceState(null, "", "?room=" + encodeURIComponent(roomId));

  state.camStream = await getCamera();
  $("micBtn").classList.toggle("off", !state.micOn);
  $("camBtn").classList.toggle("off", !state.camOn);
  showScreen("room");
  setLocalTile();
  updateCount();

  const room = joinRoom({ appId: APP_ID }, roomId);
  state.room = room;

  const [sendInfo, getInfo] = room.makeAction("info");
  const [sendState, getState] = room.makeAction("state");

  const announce = () => {
    sendInfo({ name: state.name });
    sendState({ mic: state.micOn, cam: state.camOn });
  };

  room.onPeerJoin((peerId) => {
    state.peers.set(peerId, { name: "Guest", mic: true, cam: true });
    updateCount();
    announce();
  });

  room.onPeerLeave((peerId) => {
    removePeerTiles(peerId);
  });

  getInfo((data, peerId) => {
    const p = state.peers.get(peerId) || { name: "Guest", mic: true, cam: true };
    p.name = String(data.name || "Guest").slice(0, 32);
    state.peers.set(peerId, p);
    updateRemoteTile(peerId);
  });

  getState((data, peerId) => {
    const p = state.peers.get(peerId);
    if (!p) return;
    p.mic = !!data.mic;
    p.cam = !!data.cam;
    updateRemoteTile(peerId);
  });

  room.onPeerStream((stream, peerId, metadata) => {
    const kind = metadata?.kind === "screen" ? "screen" : "camera";
    if (!state.peers.has(peerId)) state.peers.set(peerId, { name: "Guest", mic: true, cam: true });
    addRemoteStreamTile(peerId, stream, kind);
  });

  // Add our camera stream to the room (sent to all current and future peers)
  if (state.camStream.getTracks().length) {
    room.addStream(state.camStream, undefined, { kind: "camera" });
  }

  announce();
  toast("Joined " + roomId);
}

async function leave() {
  if (state.screenStream) stopShare();
  state.room?.leave();
  state.room = null;
  state.peers.clear();
  state.camStream?.getTracks().forEach((t) => t.stop());
  state.camStream = null;
  getGrid().innerHTML = "";
  history.replaceState(null, "", location.pathname);
  showScreen("lobby");
}

// ---------- Controls ----------
function toggleMic() {
  state.micOn = !state.micOn;
  state.camStream?.getAudioTracks().forEach((t) => (t.enabled = state.micOn));
  $("micBtn").classList.toggle("off", !state.micOn);
  refreshLocalTile();
  state.room?.makeAction("state")[0]({ mic: state.micOn, cam: state.camOn });
}

function toggleCam() {
  const vt = state.camStream?.getVideoTracks()[0];
  if (!vt) return toast("No camera available.");
  state.camOn = !state.camOn;
  vt.enabled = state.camOn;
  $("camBtn").classList.toggle("off", !state.camOn);
  refreshLocalTile();
  state.room?.makeAction("state")[0]({ mic: state.micOn, cam: state.camOn });
}

async function toggleShare() {
  if (state.screenStream) return stopShare();
  if (!navigator.mediaDevices.getDisplayMedia) return toast("Screen sharing is not supported here.");
  try {
    state.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
  } catch {
    return; // user cancelled
  }
  state.screenStream.getVideoTracks()[0].addEventListener("ended", stopShare);
  state.room.addStream(state.screenStream, undefined, { kind: "screen" });
  $("shareBtn").classList.add("active");

  let el = $("tile-local-screen");
  if (!el) {
    el = makeTile("local-screen", { name: state.name, local: true });
    el.classList.add("screen");
    el.querySelector("video").classList.add("contain");
    el.querySelector("video").muted = true;
  }
  el.querySelector("video").srcObject = state.screenStream;
  el.querySelector(".avatar").style.display = "none";
  el.querySelector(".label").innerHTML = svgIcon(ICON_SHARE) + `<span>Your screen</span>`;
}

function stopShare() {
  if (!state.screenStream) return;
  state.room?.removeStream(state.screenStream);
  state.screenStream.getTracks().forEach((t) => t.stop());
  state.screenStream = null;
  $("shareBtn").classList.remove("active");
  $("tile-local-screen")?.remove();
}

// ---------- Wiring ----------
function init() {
  buildSwatches();

  $("name").value = state.name;
  const params = new URLSearchParams(location.search);
  if (params.get("room")) $("room").value = params.get("room");

  $("randomRoom").onclick = () => ($("room").value = randomCode());

  const go = () => {
    const name = $("name").value.trim();
    const room = slug($("room").value);
    if (!name) return toast("Enter your name first.");
    if (!room) return toast("Enter a meeting code.");
    state.name = name.slice(0, 32);
    join(room).catch((e) => {
      console.error(e);
      toast("Could not join: " + (e.message || e));
      showScreen("lobby");
    });
  };
  $("joinBtn").onclick = go;
  $("name").addEventListener("keydown", (e) => e.key === "Enter" && go());
  $("room").addEventListener("keydown", (e) => e.key === "Enter" && go());

  $("copyLink").onclick = async () => {
    const url = `${location.origin}${location.pathname}?room=${encodeURIComponent(state.roomId)}`;
    try { await navigator.clipboard.writeText(url); toast("Invite link copied"); }
    catch { toast(url, 5000); }
  };

  $("micBtn").onclick = toggleMic;
  $("camBtn").onclick = toggleCam;
  $("shareBtn").onclick = toggleShare;
  $("leaveBtn").onclick = leave;
  window.addEventListener("beforeunload", () => state.room?.leave());

  if (params.get("room") && state.name) go();
}

init();
