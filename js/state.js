/* ═══════════ 状态管理：默认值 / 撤销重做 / 历史 / 分享 / 随机 ═══════════ */
"use strict";

const DEFAULT_STATE = {
  v: 3,
  name: "My App",
  source: "clipart",
  clipart: { id: "rocket", svg: null, vb: null }, // svg/vb 用于在线 Iconify 图标
  emoji: { char: "🚀" },
  text: { value: "A", font: "Inter", weight: 800, ls: 0, lh: 1.1, curve: "none", curveAmt: 30 },
  image: { data: null, mode: "original" },
  svg: { code: null },
  tint: { mode: "solid", c1: "#ffffff", c2: "#ffd166" },
  fg: { scale: 0.6, dx: 0, dy: 0, rot: 0, flip: false },
  adjust: { brightness: 100, contrast: 100, saturation: 100, temperature: 0, hue: 0 },
  bg: { type: "linear", c1: "#0f766e", c2: "#f59e0b", angle: 135, image: null,
        pattern: "none", patSize: 12, patOp: 0.2, noise: 0 },
  mask: { type: "square", radius: 22, pad: 0, custom: null },
  fx: {
    shadow: { mode: "soft", x: 0, y: 4, blur: 10, op: 0.3, color: "#000000" },
    stroke: { on: false, w: 4, color: "#1e1b4b" },
    glow: { on: false, str: 0.5, color: "#ffffff" },
    gloss: "none", border: false,
  },
  layers: { fg: true, bg: true, badge: true },
  badge: { on: false, style: "ribbon", text: "NEW", pos: "tr", size: 0.3, bg: "#ef4444", fg: "#ffffff",
           dx: 0, dy: 0, dotType: "none", dotIcon: "check", dotIconSvg: null, dotIconVb: null, dotEmoji: "⭐", dotImage: null },
};

let state = structuredClone(DEFAULT_STATE);

/* ── 撤销 / 重做 ── */
const undoStack = [], redoStack = [];
let commitTimer = null;
function snapshot() { return JSON.stringify(state); }
function commitState() {
  clearTimeout(commitTimer);
  commitTimer = setTimeout(() => {
    const snap = snapshot();
    if (undoStack[undoStack.length - 1] !== snap) {
      undoStack.push(snap);
      if (undoStack.length > 60) undoStack.shift();
      redoStack.length = 0;
    }
    autosave();
  }, 350);
}
function undo() {
  if (undoStack.length < 2) return false;
  redoStack.push(undoStack.pop());
  state = JSON.parse(undoStack[undoStack.length - 1]);
  return true;
}
function redo() {
  if (!redoStack.length) return false;
  const snap = redoStack.pop();
  undoStack.push(snap);
  state = JSON.parse(snap);
  return true;
}

/* ── 本地持久化 ── */
const LS_CUR = "qmicon.current", LS_HIS = "qmicon.history", LS_THEME = "qmicon.theme";
function autosave() {
  try { localStorage.setItem(LS_CUR, snapshot()); } catch (e) {}
}
function loadAutosave() {
  try {
    const raw = localStorage.getItem(LS_CUR);
    if (raw) {
      const saved = JSON.parse(raw);
      if (isLegacyOpeningDefault(saved)) {
        localStorage.removeItem(LS_CUR);
        state = structuredClone(DEFAULT_STATE);
        return false;
      }
      state = mergeState(saved);
      return true;
    }
  } catch (e) {}
  return false;
}
function isLegacyOpeningDefault(obj) {
  if (!obj || obj.v !== 1) return false;
  return obj.source === "clipart" &&
    obj.clipart?.id === "rocket" &&
    !obj.clipart?.svg &&
    obj.bg?.type === "linear" &&
    obj.bg?.c1 === "#6366f1" &&
    obj.bg?.c2 === "#a855f7" &&
    obj.tint?.mode === "solid" &&
    obj.tint?.c1 === "#ffffff" &&
    !obj.image?.data &&
    !obj.svg?.code &&
    obj.badge?.on === false;
}
function mergeState(obj) {
  const base = structuredClone(DEFAULT_STATE);
  const deep = (t, s) => {
    for (const k in s) {
      if (s[k] && typeof s[k] === "object" && !Array.isArray(s[k]) && t[k]) deep(t[k], s[k]);
      else t[k] = s[k];
    }
  };
  deep(base, obj || {});
  migrateState(base, obj || {});
  return base;
}
function isDefaultSquircleMask(mask) {
  return mask?.type === "squircle" &&
    (mask.radius === undefined || mask.radius === 22) &&
    (mask.pad === undefined || mask.pad === 0) &&
    !mask.custom;
}
function migrateState(target, source) {
  if ((source.v || 1) < 3 && isDefaultSquircleMask(source.mask)) {
    target.mask.type = "square";
    target.mask.radius = 22;
    target.mask.pad = 0;
    target.mask.custom = null;
  }
  target.v = DEFAULT_STATE.v;
}

/* ── 历史记录 ── */
function getHistory() {
  try { return JSON.parse(localStorage.getItem(LS_HIS) || "[]"); } catch (e) { return []; }
}
function saveToHistory(thumbDataUrl) {
  const list = getHistory();
  let st = snapshot();
  if (st.length > 400000) { // 图片过大时不存原图
    const slim = JSON.parse(st);
    slim.image.data = null; slim.bg.image = null;
    st = JSON.stringify(slim);
  }
  list.unshift({ t: Date.now(), name: state.name, thumb: thumbDataUrl, state: st });
  while (list.length > 30) list.pop();
  try { localStorage.setItem(LS_HIS, JSON.stringify(list)); } catch (e) {
    list.splice(10); // 空间不足时裁剪
    try { localStorage.setItem(LS_HIS, JSON.stringify(list)); } catch (e2) {}
  }
}
function deleteHistory(i) {
  const list = getHistory(); list.splice(i, 1);
  localStorage.setItem(LS_HIS, JSON.stringify(list));
}
function clearHistory() { localStorage.removeItem(LS_HIS); }

/* ── URL 分享 ── */
function encodeShare() {
  const slim = JSON.parse(snapshot());
  let stripped = false;
  if (slim.image.data && slim.image.data.length > 6000) { slim.image.data = null; stripped = true; }
  if (slim.bg.image && slim.bg.image.length > 6000) { slim.bg.image = null; stripped = true; }
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(slim))))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return { hash: "#s=" + b64, stripped };
}
function decodeShare() {
  const m = location.hash.match(/#s=([A-Za-z0-9_-]+)/);
  if (!m) return false;
  try {
    const b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
    state = mergeState(JSON.parse(decodeURIComponent(escape(atob(b64)))));
    history.replaceState(null, "", location.pathname);
    return true;
  } catch (e) { return false; }
}

/* ── 风格预设 ── */
const PRESETS = [
  { key: "preset.signal", p: { bg: { type: "linear", c1: "#0f766e", c2: "#f59e0b", angle: 135, pattern: "none", noise: 0 }, tint: { mode: "solid", c1: "#ffffff" }, fx: { shadow: { mode: "soft", op: 0.22, x: 0, y: 5, blur: 12 }, glow: { on: false }, gloss: "none", border: false }, mask: { type: "square", radius: 22, pad: 0 } } },
  { key: "preset.meadow", p: { bg: { type: "linear", c1: "#14532d", c2: "#a3e635", angle: 125, pattern: "none", noise: 0 }, tint: { mode: "solid", c1: "#f8fafc" }, fx: { shadow: { mode: "soft", op: 0.2, x: 0, y: 5, blur: 12 }, glow: { on: false }, gloss: "none", border: false }, mask: { type: "square", radius: 22, pad: 0 } } },
  { key: "preset.coral", p: { bg: { type: "linear", c1: "#be123c", c2: "#fb7185", angle: 145, pattern: "none", noise: 0 }, tint: { mode: "solid", c1: "#fff7ed" }, fx: { shadow: { mode: "soft", op: 0.2, x: 0, y: 4, blur: 12 }, glow: { on: false }, gloss: "top", border: false }, mask: { type: "square", radius: 22, pad: 0 } } },
  { key: "preset.cobalt", p: { bg: { type: "radial", c1: "#2563eb", c2: "#111827", angle: 135, pattern: "none", noise: 0 }, tint: { mode: "solid", c1: "#f8fafc" }, fx: { shadow: { mode: "soft", op: 0.26, x: 0, y: 5, blur: 14 }, glow: { on: false }, gloss: "none", border: true }, mask: { type: "square", radius: 22, pad: 0 } } },
  { key: "preset.lilac", p: { bg: { type: "linear", c1: "#7c3aed", c2: "#f472b6", angle: 145, pattern: "none", noise: 0 }, tint: { mode: "solid", c1: "#ffffff" }, fx: { shadow: { mode: "soft", op: 0.2, x: 0, y: 5, blur: 12 }, glow: { on: false }, gloss: "top", border: false }, mask: { type: "square", radius: 22, pad: 0 } } },
  { key: "preset.steel", p: { bg: { type: "solid", c1: "#f8fafc", c2: "#f8fafc", angle: 135, pattern: "none", noise: 0 }, tint: { mode: "solid", c1: "#111827" }, fx: { shadow: { mode: "soft", op: 0.13, x: 0, y: 4, blur: 10 }, glow: { on: false }, gloss: "none", border: true }, mask: { type: "square", radius: 22, pad: 0 } } },
  { key: "preset.glass", p: { bg: { type: "linear", c1: "#0891b2", c2: "#34d399", angle: 130, pattern: "none", noise: 0 }, tint: { mode: "gradient", c1: "#ffffff", c2: "#e0f2fe" }, fx: { shadow: { mode: "soft", op: 0.18, x: 0, y: 5, blur: 12 }, glow: { on: false }, gloss: "top", border: false }, mask: { type: "square", radius: 22, pad: 0 } } },
  { key: "preset.midnight", p: { bg: { type: "linear", c1: "#111827", c2: "#0f766e", angle: 135, pattern: "grid", patOp: 0.08, patSize: 18, noise: 0 }, tint: { mode: "gradient", c1: "#fbbf24", c2: "#ffffff" }, fx: { shadow: { mode: "none", op: 0.2 }, glow: { on: true, str: 0.36, color: "#fbbf24" }, gloss: "none", border: false }, mask: { type: "square", radius: 22, pad: 0 } } },
];
function applyPreset(p) {
  state = mergeState(Object.assign(JSON.parse(snapshot()), {}));
  const deep = (t, s) => { for (const k in s) { if (s[k] && typeof s[k] === "object" && t[k]) deep(t[k], s[k]); else t[k] = s[k]; } };
  deep(state, p);
}

/* ── 随机灵感 ── */
function randomize() {
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const core = JSON.parse(JSON.stringify({
    source: state.source,
    clipart: state.clipart,
    emoji: state.emoji,
    text: state.text,
    image: state.image,
    svg: state.svg,
    tint: state.tint,
    fg: state.fg,
  }));
  const palettes = [
    ["#0f766e", "#f59e0b"],
    ["#0f766e", "#38bdf8"],
    ["#f97316", "#facc15"],
    ["#be123c", "#fb7185"],
    ["#166534", "#84cc16"],
    ["#1f2937", "#64748b"],
    ["#111827", "#fbbf24"],
    ["#0f172a", "#2dd4bf"],
  ];
  const grad = pick(palettes);
  state.bg.type = pick(["linear", "linear", "radial", "solid"]);
  state.bg.c1 = grad[0]; state.bg.c2 = grad[1];
  state.bg.angle = Math.floor(Math.random() * 360);
  state.bg.pattern = pick(["none", "none", "none", "grid", "dots"]);
  state.bg.patOp = 0.06 + Math.random() * 0.1;
  state.bg.noise = Math.random() < 0.12 ? 0.08 : 0;
  Object.assign(state.mask, { type: "square", radius: 22, pad: 0, custom: null });
  state.fx.shadow.mode = pick(["soft", "soft", "none"]);
  state.fx.shadow.op = 0.13 + Math.random() * 0.13;
  state.fx.gloss = pick(["none", "none", "top"]);
  state.fx.glow.on = false;
  state.source = core.source;
  state.clipart = core.clipart;
  state.emoji = core.emoji;
  state.text = core.text;
  state.image = core.image;
  state.svg = core.svg;
  state.tint = core.tint;
  state.fg = core.fg;
}
