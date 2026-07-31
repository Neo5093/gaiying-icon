/* ═══════════ Canvas 渲染引擎 ═══════════ */
"use strict";

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const imgCache = new Map();

function loadImage(src) {
  if (imgCache.has(src)) return imgCache.get(src);
  const p = new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
  imgCache.set(src, p);
  return p;
}

function svgToDataUrl(svg) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function hexToRgba(hex, a = 1) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function relLum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
}
function contrastRatio(h1, h2) {
  const a = relLum(h1), b = relLum(h2);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function makeCanvas(w, h = w) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}

/* 填充前景内容颜色（单色 / 渐变；original 仅兼容旧配置和原图模式） */
function applyTint(cv, st, box) {
  if (st.tint.mode === "original") return cv;
  const ctx = cv.getContext("2d");
  ctx.globalCompositeOperation = "source-in";
  if (st.tint.mode === "gradient") {
    const g = ctx.createLinearGradient(0, 0, cv.width, cv.height);
    g.addColorStop(0, st.tint.c1); g.addColorStop(1, st.tint.c2);
    ctx.fillStyle = g;
  } else ctx.fillStyle = st.tint.c1;
  ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.globalCompositeOperation = "source-over";
  return cv;
}

/* ── 各内容源绘制到 box×box 画布 ── */
async function drawContent(st, box) {
  const cv = makeCanvas(Math.max(2, Math.round(box)));
  const ctx = cv.getContext("2d");
  const s = cv.width;

  if (st.source === "clipart" || st.source === "brand") {
    if (st.clipart.svg) { // 在线 Iconify
      let svg = st.clipart.svg;
      if (st.tint.mode !== "original") svg = svg.replace(/currentColor/g, st.tint.c1);
      else svg = svg.replace(/currentColor/g, "#000000");
      const full = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${st.clipart.vb || "0 0 24 24"}" width="256" height="256">${svg}</svg>`;
      try {
        const img = await loadImage(svgToDataUrl(full));
        ctx.drawImage(img, 0, 0, s, s);
        if (st.tint.mode === "gradient") applyTint(cv, st);
      } catch (e) {}
    } else {
      const icon = BUILTIN_ICONS.find(i => i.n === st.clipart.id) || BUILTIN_ICONS[0];
      const p = new Path2D(icon.d);
      ctx.save();
      ctx.scale(s / 24, s / 24);
      if (st.tint.mode === "gradient") {
        const g = ctx.createLinearGradient(0, 0, 24, 24);
        g.addColorStop(0, st.tint.c1); g.addColorStop(1, st.tint.c2);
        ctx.fillStyle = g;
      } else ctx.fillStyle = st.tint.mode === "original" ? "#000" : st.tint.c1;
      ctx.fill(p, icon.fr || "nonzero");
      ctx.restore();
    }
  }
  else if (st.source === "emoji") {
    ctx.font = `${s * 0.82}px ${EMOJI_FONT}`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(st.emoji.char, s / 2, s * 0.55);
    if (st.tint.mode !== "original") applyTint(cv, st);
  }
  else if (st.source === "text") {
    await drawText(ctx, st, s);
  }
  else if (st.source === "image" && st.image.data) {
    try {
      const img = await loadImage(st.image.data);
      const r = Math.min(s / img.width, s / img.height);
      const w = img.width * r, h = img.height * r;
      ctx.drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
      if (st.image.mode === "tint") applyTint(cv, st);
    } catch (e) {}
  }
  else if (st.source === "svg" && st.svg.code) {
    try {
      const img = await loadImage(svgToDataUrl(st.svg.code));
      const r = Math.min(s / img.width, s / img.height) || 1;
      const w = (img.width || s) * r, h = (img.height || s) * r;
      ctx.drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
      if (st.tint.mode !== "original") applyTint(cv, st);
    } catch (e) {}
  }
  return cv;
}

/* 文字绘制（多行 / 字距 / 弧形） */
async function drawText(ctx, st, s) {
  const t = st.text;
  const lines = (t.value || "A").split("\n").filter(l => l.length);
  if (!lines.length) lines.push("A");
  const fam = `"${t.font}", "Noto Sans SC", sans-serif`;
  try { await document.fonts.load(`${t.weight} 100px ${fam}`, lines.join("")); } catch (e) {}

  // 自动求合适字号
  let fs = s * 0.8;
  ctx.font = `${t.weight} ${fs}px ${fam}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${t.ls * (fs / 100)}px`;
  let maxW = Math.max(...lines.map(l => ctx.measureText(l).width));
  const totalH = lines.length * fs * t.lh;
  const fit = Math.min((s * 0.96) / maxW, (s * 0.96) / totalH);
  fs = Math.max(6, fs * Math.min(1, fit));
  ctx.font = `${t.weight} ${fs}px ${fam}`;
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${t.ls * (fs / 100)}px`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";

  if (st.tint.mode === "gradient") {
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, st.tint.c1); g.addColorStop(1, st.tint.c2);
    ctx.fillStyle = g;
  } else ctx.fillStyle = st.tint.mode === "original" ? "#000" : st.tint.c1;

  const lh = fs * t.lh;
  const y0 = s / 2 - ((lines.length - 1) * lh) / 2;

  if (t.curve !== "none" && lines.length === 1) {
    // 弧形排版：圆心在文字下方（上弧）或上方（下弧）
    const chars = [...lines[0]];
    const widths = chars.map(c => ctx.measureText(c).width);
    const totalW = widths.reduce((a, b) => a + b, 0) || 1;
    const totalArc = (Math.max(5, t.curveAmt) * Math.PI) / 180 * 2;
    const R = totalW / totalArc;
    const up = t.curve === "arc-up";
    const cy = up ? s / 2 + R : s / 2 - R;
    let acc = 0;
    for (let i = 0; i < chars.length; i++) {
      const mid = acc + widths[i] / 2;
      const theta = (mid / totalW - 0.5) * totalArc; // -arc/2 .. arc/2
      const x = s / 2 + Math.sin(theta) * R;
      const y = up ? cy - Math.cos(theta) * R : cy + Math.cos(theta) * R;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(up ? theta : -theta);
      ctx.fillText(chars[i], 0, 0);
      ctx.restore();
      acc += widths[i];
    }
  } else {
    lines.forEach((l, i) => ctx.fillText(l, s / 2, y0 + i * lh));
  }
}

/* ── 变换后的前景层画布 ── */
async function getFgCanvas(size, st, fgFactor = 1) {
  const cv = makeCanvas(size);
  const ctx = cv.getContext("2d");
  const scale = st.fg.scale * fgFactor;
  const box = size * Math.max(0.02, scale);
  const content = await drawContent(st, Math.min(box, 2048));
  ctx.save();
  ctx.translate(size / 2 + (st.fg.dx / 100) * size, size / 2 + (st.fg.dy / 100) * size);
  ctx.rotate((st.fg.rot * Math.PI) / 180);
  if (st.fg.flip) ctx.scale(-1, 1);
  ctx.drawImage(content, -box / 2, -box / 2, box, box);
  ctx.restore();
  applyAdjustments(cv, st.adjust);
  return cv;
}

/* ── 前景图像调整：亮度 / 对比度 / 饱和度 / 色温 / 色调 ── */
function needsAdjustments(adj) {
  return adj && (adj.brightness !== 100 || adj.contrast !== 100 || adj.saturation !== 100 || adj.temperature !== 0 || adj.hue !== 0);
}
const ADJ_AREA_LIMIT = 1024 * 1024;
const adjWork = new Map(); // size → 工作画布
function applyAdjustments(cv, adj) {
  if (!needsAdjustments(adj)) return;
  const area = cv.width * cv.height;
  if (area > ADJ_AREA_LIMIT) { // 大图先缩到工作分辨率处理再回绘，避免导出卡顿
    const ws = Math.max(1, Math.round(Math.sqrt(ADJ_AREA_LIMIT)));
    let w = adjWork.get(ws);
    if (!w) { w = makeCanvas(ws); adjWork.set(ws, w); }
    const wctx = w.getContext("2d");
    wctx.clearRect(0, 0, ws, ws);
    wctx.drawImage(cv, 0, 0, ws, ws);
    adjustPixels(wctx, ws, ws, adj);
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(w, 0, 0, cv.width, cv.height);
    return;
  }
  adjustPixels(cv.getContext("2d"), cv.width, cv.height, adj);
}
function adjustPixels(ctx, w, h, adj) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const bF = adj.brightness / 100;
  const cF = adj.contrast / 100;
  const sF = adj.saturation / 100;
  const temp = adj.temperature * 0.4;  // ±100 → ±40 通道偏移
  const LUMA_R = 0.213, LUMA_G = 0.715, LUMA_B = 0.072;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    let r = d[i], g = d[i + 1], bl = d[i + 2];
    // 亮度 + 对比度
    r = (r - 128) * cF + 128; g = (g - 128) * cF + 128; bl = (bl - 128) * cF + 128;
    r *= bF; g *= bF; bl *= bF;
    // 饱和度
    if (sF !== 1) {
      const luma = r * LUMA_R + g * LUMA_G + bl * LUMA_B;
      r = luma + (r - luma) * sF; g = luma + (g - luma) * sF; bl = luma + (bl - luma) * sF;
    }
    // 色温（暖 +R-B / 冷 -R+B）
    if (temp) { r += temp; bl -= temp; }
    // 色调（RGB 绕灰轴旋转，保饱和度；色温后处理使色温只调白平衡不改色相）
    if (adj.hue) {
      const k = 1 / Math.sqrt(3);
      const cosA = Math.cos(adj.hue * Math.PI / 180);
      const sinA = Math.sin(adj.hue * Math.PI / 180);
      const r2 = r * (cosA + (1 - cosA) / 3) + g * ((1 - cosA) / 3 - k * sinA) + bl * ((1 - cosA) / 3 + k * sinA);
      const g2 = r * ((1 - cosA) / 3 + k * sinA) + g * (cosA + (1 - cosA) / 3) + bl * ((1 - cosA) / 3 - k * sinA);
      const b2 = r * ((1 - cosA) / 3 - k * sinA) + g * ((1 - cosA) / 3 + k * sinA) + bl * (cosA + (1 - cosA) / 3);
      r = r2; g = g2; bl = b2;
    }
    d[i] = r < 0 ? 0 : r > 255 ? 255 : r;
    d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    d[i + 2] = bl < 0 ? 0 : bl > 255 ? 255 : bl;
  }
  ctx.putImageData(img, 0, 0);
}

function silhouette(srcCanvas, color) {
  const cv = makeCanvas(srcCanvas.width, srcCanvas.height);
  const ctx = cv.getContext("2d");
  ctx.drawImage(srcCanvas, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, cv.width, cv.height);
  return cv;
}

/* ── 背景填充 ── */
async function paintBackground(ctx, s, st) {
  const bg = st.bg;
  if (bg.type === "none") return;
  if (bg.type === "image" && bg.image) {
    try {
      const img = await loadImage(bg.image);
      const r = Math.max(s / img.width, s / img.height);
      const w = img.width * r, h = img.height * r;
      ctx.drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
    } catch (e) { ctx.fillStyle = bg.c1; ctx.fillRect(0, 0, s, s); }
  } else if (bg.type === "solid" || (bg.type === "image" && !bg.image)) {
    ctx.fillStyle = bg.c1; ctx.fillRect(0, 0, s, s);
  } else {
    let g;
    if (bg.type === "radial") {
      g = ctx.createRadialGradient(s / 2, s / 2, s * 0.05, s / 2, s / 2, s * 0.75);
    } else if (bg.type === "conic" && ctx.createConicGradient) {
      g = ctx.createConicGradient((bg.angle * Math.PI) / 180, s / 2, s / 2);
      g.addColorStop(0, bg.c1); g.addColorStop(0.5, bg.c2); g.addColorStop(1, bg.c1);
      ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
      paintOverlays(ctx, s, st);
      return;
    } else {
      const a = ((bg.angle - 90) * Math.PI) / 180;
      const r = s / 2;
      const dx = Math.cos(a) * r, dy = Math.sin(a) * r;
      g = ctx.createLinearGradient(s / 2 - dx, s / 2 - dy, s / 2 + dx, s / 2 + dy);
    }
    g.addColorStop(0, bg.c1); g.addColorStop(1, bg.c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  }
  paintOverlays(ctx, s, st);
}

const PATTERN_TYPES = ["none", "dots", "stripes", "grid", "checker", "waves", "cross"];
function patternTile(type, px, color = "#ffffff") {
  const t = makeCanvas(px * 2);
  const c = t.getContext("2d");
  c.strokeStyle = c.fillStyle = color;
  c.lineWidth = Math.max(1, px / 7);
  switch (type) {
    case "dots":
      c.beginPath(); c.arc(px / 2, px / 2, px / 5, 0, 7); c.arc(px * 1.5, px * 1.5, px / 5, 0, 7); c.fill();
      break;
    case "stripes":
      c.beginPath();
      for (let i = -2; i < 5; i++) { c.moveTo(i * px - px, px * 2.5); c.lineTo(i * px + px * 1.5, 0 - px / 2); }
      c.stroke();
      break;
    case "grid":
      c.strokeRect(0, 0, px, px); c.strokeRect(px, px, px, px);
      c.strokeRect(px, 0, px, px); c.strokeRect(0, px, px, px);
      break;
    case "checker":
      c.fillRect(0, 0, px, px); c.fillRect(px, px, px, px);
      break;
    case "waves":
      c.beginPath();
      for (let y = px / 2; y < px * 2.5; y += px) {
        c.moveTo(0, y);
        c.quadraticCurveTo(px / 2, y - px / 2, px, y);
        c.quadraticCurveTo(px * 1.5, y + px / 2, px * 2, y);
      }
      c.stroke();
      break;
    case "cross":
      const d = px / 3;
      [[px / 2, px / 2], [px * 1.5, px * 1.5]].forEach(([x, y]) => {
        c.beginPath();
        c.moveTo(x - d, y); c.lineTo(x + d, y);
        c.moveTo(x, y - d); c.lineTo(x, y + d);
        c.stroke();
      });
      break;
  }
  return t;
}

let noiseTile = null;
function getNoise() {
  if (noiseTile) return noiseTile;
  noiseTile = makeCanvas(128);
  const c = noiseTile.getContext("2d");
  const d = c.createImageData(128, 128);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.random() * 255;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  c.putImageData(d, 0, 0);
  return noiseTile;
}

function paintOverlays(ctx, s, st) {
  const bg = st.bg;
  if (bg.pattern && bg.pattern !== "none") {
    const px = Math.max(4, (bg.patSize / 100) * s * 0.6);
    const pat = ctx.createPattern(patternTile(bg.pattern, px), "repeat");
    ctx.save();
    ctx.globalAlpha = bg.patOp;
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, s, s);
    ctx.restore();
  }
  if (bg.noise > 0) {
    ctx.save();
    ctx.globalAlpha = bg.noise;
    ctx.globalCompositeOperation = "overlay";
    const pat = ctx.createPattern(getNoise(), "repeat");
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, s, s);
    ctx.restore();
  }
}

/* ── 主渲染入口 ──
 opts: shape, radius, customPath, pad(0-0.3), bgOn, fgOn, badgeOn,
       fgFactor, mono(色值→剪影模式), darkMode(iOS18), transparentBg */
async function renderIcon(ctx, size, opts = {}, st = state) {
  const o = Object.assign({
    shape: "square", radius: st.mask.radius, customPath: st.mask.custom,
    pad: 0, bgOn: st.layers.bg, fgOn: st.layers.fg, badgeOn: st.layers.badge && st.badge.on,
    fgFactor: 1, mono: null, darkMode: false,
  }, opts);

  ctx.clearRect(0, 0, size, size);
  ctx.save();

  // 外边距
  const inset = size * o.pad;
  const s = size - inset * 2;
  ctx.translate(inset, inset);

  // 蒙版
  if (o.shape !== "square") clipShape(ctx, s, o.shape, o.radius, o.customPath);
  else { ctx.beginPath(); ctx.rect(0, 0, s, s); ctx.clip(); }

  // 背景
  if (o.mono) {
    // 剪影模式不画装饰背景
  } else if (o.darkMode) {
    const g = ctx.createLinearGradient(0, 0, 0, s);
    g.addColorStop(0, "#3a3a3f"); g.addColorStop(1, "#17171a");
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    paintOverlays(ctx, s, st);
  } else if (o.bgOn) {
    await paintBackground(ctx, s, st);
  }

  // 前景
  if (o.fgOn) {
    const fg = await getFgCanvas(s, st, o.fgFactor);
    if (o.mono) {
      ctx.drawImage(silhouette(fg, o.mono), 0, 0);
    } else {
      const fx = st.fx;
      // 阴影
      if (fx.shadow.mode === "long") {
        const trail = makeCanvas(s);
        const tc = trail.getContext("2d");
        tc.drawImage(silhouette(fg, fx.shadow.color), 0, 0);
        const u = 1 / Math.SQRT2;
        for (let step = 1; step < s; step *= 2) {
          tc.drawImage(trail, step * u, step * u);
        }
        ctx.save(); ctx.globalAlpha = fx.shadow.op;
        ctx.drawImage(trail, 1, 1);
        ctx.restore();
      } else if (fx.shadow.mode === "hard") {
        ctx.save(); ctx.globalAlpha = fx.shadow.op;
        ctx.drawImage(silhouette(fg, fx.shadow.color), (fx.shadow.x / 100) * s, (fx.shadow.y / 100) * s);
        ctx.restore();
      } else if (fx.shadow.mode === "soft") {
        ctx.save();
        ctx.shadowColor = hexToRgba(fx.shadow.color, fx.shadow.op);
        ctx.shadowBlur = (fx.shadow.blur / 100) * s;
        ctx.shadowOffsetX = (fx.shadow.x / 100) * s;
        ctx.shadowOffsetY = (fx.shadow.y / 100) * s;
        ctx.drawImage(fg, 0, 0);
        ctx.restore();
        // 后面还会再画一次实体
      }
      // 发光
      if (fx.glow.on) {
        ctx.save();
        ctx.shadowColor = hexToRgba(fx.glow.color, Math.min(1, fx.glow.str));
        ctx.shadowBlur = s * 0.08 * (0.5 + fx.glow.str);
        ctx.drawImage(fg, 0, 0);
        ctx.drawImage(fg, 0, 0);
        ctx.restore();
      }
      // 描边（全方向剪影法）
      if (fx.stroke.on) {
        const sil = silhouette(fg, fx.stroke.color);
        const r = (fx.stroke.w / 200) * s * 0.5;
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          ctx.drawImage(sil, Math.cos(a) * r, Math.sin(a) * r);
        }
      }
      ctx.drawImage(fg, 0, 0);
    }
  }

  if (!o.mono) {
    // 光泽
    if (st.fx.gloss === "top") {
      const g = ctx.createLinearGradient(0, 0, 0, s);
      g.addColorStop(0, "rgba(255,255,255,.28)");
      g.addColorStop(0.5, "rgba(255,255,255,.06)");
      g.addColorStop(0.51, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    } else if (st.fx.gloss === "diag") {
      const g = ctx.createLinearGradient(0, 0, s, s);
      g.addColorStop(0, "rgba(255,255,255,.22)");
      g.addColorStop(0.5, "rgba(255,255,255,0)");
      g.addColorStop(1, "rgba(0,0,0,.12)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    }
    // 内边框
    if (st.fx.border) {
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,.5)";
      ctx.lineWidth = Math.max(1, s * 0.012);
      const m = s * 0.03;
      if (o.shape !== "square") {
        ctx.translate(m, m); ctx.scale((s - 2 * m) / s, (s - 2 * m) / s);
        const p2d = buildShapePath(ctx, s, o.shape, o.radius, o.customPath);
        if (p2d) ctx.stroke(p2d); else ctx.stroke();
      } else ctx.strokeRect(m, m, s - 2 * m, s - 2 * m);
      ctx.restore();
    }
    // 徽章
    if (o.badgeOn) await drawBadge(ctx, s, st);
  }
  ctx.restore();
}

async function drawBadge(ctx, s, st) {
  const b = st.badge;
  ctx.save();
  ctx.fillStyle = b.bg;
  const fs = s * 0.1 * (b.size / 0.3);
  ctx.font = `800 ${fs}px Inter, "Noto Sans SC", sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  if (b.style === "bar") {
    const h = s * 0.2 * (b.size / 0.3);
    ctx.fillRect(0, s - h, s, h);
    ctx.fillStyle = b.fg;
    ctx.fillText(b.text, s / 2, s - h / 2 + fs * 0.05, s * 0.9);
  } else if (b.style === "dot") {
    const r = s * 0.12 * (b.size / 0.3);
    const base = { tl: [r * 1.2, r * 1.2], tr: [s - r * 1.2, r * 1.2], bl: [r * 1.2, s - r * 1.2], br: [s - r * 1.2, s - r * 1.2] }[b.pos];
    const pos = [base[0] + (b.dx || 0) / 100 * s, base[1] + (b.dy || 0) / 100 * s];
    ctx.beginPath(); ctx.arc(pos[0], pos[1], r, 0, 7); ctx.fill();
    // 圆点内部内容
    const dt = b.dotType || "none";
    if (dt === "icon") {
      const isz = r * 2 * 0.62;
      if (b.dotIconSvg) { // 在线 Iconify 图标
        try {
          const vb = (b.dotIconVb || "0 0 24 24").split(/\s+/).map(Number);
          const full = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.dotIconVb || "0 0 24 24"}" width="128" height="128">${b.dotIconSvg.replace(/currentColor/g, b.fg)}</svg>`;
          const img = await loadImage(svgToDataUrl(full));
          const ar = (vb[2] || 24) / (vb[3] || 24);
          const dw = ar >= 1 ? isz : isz * ar, dh = ar >= 1 ? isz / ar : isz;
          ctx.drawImage(img, pos[0] - dw / 2, pos[1] - dh / 2, dw, dh);
        } catch (e) {}
      } else {
        const icon = BUILTIN_ICONS.find(i => i.n === b.dotIcon);
        if (icon) {
          ctx.save();
          ctx.translate(pos[0] - isz / 2, pos[1] - isz / 2);
          ctx.scale(isz / 24, isz / 24);
          ctx.fillStyle = b.fg;
          ctx.fill(new Path2D(icon.d), icon.fr || "nonzero");
          ctx.restore();
        }
      }
    } else if (dt === "emoji" && b.dotEmoji) {
      ctx.fillStyle = b.fg;
      ctx.font = `${r * 2 * 0.6}px ${EMOJI_FONT}`;
      ctx.fillText(b.dotEmoji, pos[0], pos[1] + r * 0.06);
    } else if (dt === "image" && b.dotImage) {
      try {
        const img = await loadImage(b.dotImage);
        ctx.save();
        ctx.beginPath(); ctx.arc(pos[0], pos[1], r * 0.92, 0, 7); ctx.clip();
        const ir = Math.max(r * 2 / img.width, r * 2 / img.height); // cover
        const iw = img.width * ir, ih = img.height * ir;
        ctx.drawImage(img, pos[0] - iw / 2, pos[1] - ih / 2, iw, ih);
        ctx.restore();
      } catch (e) {}
    }
  } else { // ribbon 角标
    const w = s * Math.SQRT2 * 0.42 * (b.size / 0.3);
    const flipX = b.pos === "tl" || b.pos === "bl" ? -1 : 1;
    const flipY = b.pos === "bl" || b.pos === "br" ? -1 : 1;
    ctx.translate(flipX === 1 ? s : 0, flipY === 1 ? 0 : s);
    ctx.scale(flipX, flipY);
    ctx.rotate(Math.PI / 4);
    const bh = fs * 1.5;
    ctx.fillRect(-w / 2, w * 0.28 - bh / 2, w, bh);
    ctx.fillStyle = b.fg;
    ctx.fillText(b.text, 0, w * 0.28 + fs * 0.04, w * 0.8);
  }
  ctx.restore();
}

/* OG 社交分享图 */
async function renderOg(ctx, w, h, st = state) {
  ctx.clearRect(0, 0, w, h);
  // 背景：弱化的主背景
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, w, h);
  const dark = relLum(st.bg.type === "none" ? "#888888" : st.bg.c1) < 0.45;
  g.addColorStop(0, dark ? "#111322" : "#f3f4fb");
  g.addColorStop(1, dark ? "#1d2138" : "#e2e5f5");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.restore();
  // 图标
  const isz = h * 0.62;
  const icv = makeCanvas(Math.round(isz));
  await renderIcon(icv.getContext("2d"), icv.width, { shape: st.mask.type, pad: 0 }, st);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.3)"; ctx.shadowBlur = h * 0.06; ctx.shadowOffsetY = h * 0.02;
  ctx.drawImage(icv, w * 0.09, (h - isz) / 2, isz, isz);
  ctx.restore();
  // 文案
  ctx.fillStyle = dark ? "#fff" : "#171930";
  ctx.font = `800 ${h * 0.14}px Inter, "Noto Sans SC", sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText(st.name || "My App", w * 0.09 + isz + w * 0.05, h * 0.46, w * 0.5);
  ctx.fillStyle = dark ? "rgba(255,255,255,.55)" : "rgba(23,25,48,.55)";
  ctx.font = `500 ${h * 0.06}px Inter, "Noto Sans SC", sans-serif`;
  ctx.fillText("Made with 该影 icon", w * 0.09 + isz + w * 0.05, h * 0.6, w * 0.5);
}
