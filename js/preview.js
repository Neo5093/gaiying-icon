/* ═══════════ 实时预览刷新 ═══════════ */
"use strict";

const $ = id => document.getElementById(id);
let renderSeq = 0;

async function refreshAll() {
  const seq = ++renderSeq;
  const safe = async fn => { try { await fn(); } catch (e) { console.warn(e); } };
  const maskOpts = () => ({ shape: state.mask.type, radius: state.mask.radius, customPath: state.mask.custom, pad: state.mask.pad / 100 });

  // 中央画布
  await safe(async () => {
    const cv = $("stageCanvas");
    await renderIcon(cv.getContext("2d"), 1024, maskOpts());
  });
  if (seq !== renderSeq) return; // 已有更新的渲染请求

  // 画布环境光（取当前设计配色）
  const wrapEl = $("stageWrap");
  wrapEl.style.setProperty("--amb1", state.bg.type === "none" ? "#9aa" : state.bg.c1);
  wrapEl.style.setProperty("--amb2", state.bg.type === "solid" || state.bg.type === "none" ? state.bg.c1 : state.bg.c2);

  // Android 自适应形状
  await safe(async () => {
    const wrap = $("androidShapes");
    if (!wrap.dataset.built) {
      wrap.dataset.built = "1";
      [["circle", t("pv.circle")], ["squircle", t("pv.squircle")], ["rounded", t("pv.rounded")], ["square", t("pv.square")]].forEach(([sh, label]) => {
        const item = document.createElement("div");
        item.className = "pv-item";
        item.innerHTML = `<canvas width="128" height="128" data-shape="${sh}"></canvas><span>${label}</span>`;
        wrap.appendChild(item);
      });
    }
    for (const cv of wrap.querySelectorAll("canvas")) {
      await renderIcon(cv.getContext("2d"), 128, { shape: cv.dataset.shape, radius: 20 });
    }
  });

  // Android 13 主题图标 + 通知
  await safe(async () => {
    const cv = $("pvThemed"), ctx = cv.getContext("2d");
    const darkUi = document.documentElement.dataset.theme === "dark";
    ctx.clearRect(0, 0, 120, 120);
    ctx.fillStyle = darkUi ? "#3a3f55" : "#e0e3f5";
    ctx.beginPath(); ctx.arc(60, 60, 60, 0, 7); ctx.fill();
    const tmp = makeCanvas(120);
    await renderIcon(tmp.getContext("2d"), 120, { mono: darkUi ? "#c5cbf0" : "#3a4170", fgFactor: 0.72 });
    ctx.drawImage(tmp, 0, 0);
  });
  await safe(async () => {
    const cv = $("pvNotif"), ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, 40, 40);
    const tmp = makeCanvas(40);
    await renderIcon(tmp.getContext("2d"), 40, { mono: getComputedStyle(document.body).color, fgFactor: 0.95 });
    ctx.drawImage(tmp, 0, 0);
  });

  // iOS 预览：源图仍按规范导出为方形，这里模拟系统 rounded-rectangle mask。
  await safe(() => renderIcon($("pvIos").getContext("2d"), 120, { shape: "squircle" }));
  await safe(() => renderIcon($("pvIosHome").getContext("2d"), 96, { shape: "squircle" }));
  await safe(() => renderIcon($("pvIosDark").getContext("2d"), 120, { shape: "squircle", darkMode: true }));

  // Web
  await safe(() => renderIcon($("pvFavicon").getContext("2d"), 32, maskOpts()));
  await safe(() => renderIcon($("pvWeb").getContext("2d"), 120, maskOpts()));
  await safe(async () => {
    // maskable：全出血 + 安全区参考线
    const cv = $("pvMaskable"), ctx = cv.getContext("2d");
    await renderIcon(ctx, 120, { shape: "circle" });
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,.7)";
    ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(60, 60, 60 * 0.8, 0, 7); ctx.stroke();
    ctx.restore();
  });
  await safe(async () => {
    const cv = $("pvOg");
    await renderOg(cv.getContext("2d"), 240, 126);
  });

  // 桌面
  await safe(() => renderIcon($("pvMac").getContext("2d"), 110, { shape: "squircle", pad: 0.075 }));
  await safe(() => renderIcon($("pvWin").getContext("2d"), 120, maskOpts()));
  await safe(() => renderIcon($("pvWatch").getContext("2d"), 100, { shape: "circle" }));
  await safe(() => renderTvPreview($("pvTv").getContext("2d"), 160, 96));
  await safe(() => renderIcon($("pvStore").getContext("2d"), 56, { shape: "squircle" }));

  // 品牌角标 + 动态 favicon
  await safe(async () => {
    const cv = $("brandIcon");
    await renderIcon(cv.getContext("2d"), 64, maskOpts());
    if (seq === renderSeq) $("dynFavicon").href = cv.toDataURL();
  });

  // 对比度
  updateContrast();
  updateNames();
}

function updateContrast() {
  const pill = $("contrastPill");
  if (state.bg.type === "none" || state.tint.mode === "original") {
    pill.textContent = t("contrast") + " —"; pill.className = "contrast-pill"; return;
  }
  const bgc = state.bg.type === "solid" ? state.bg.c1 : avgHex(state.bg.c1, state.bg.c2);
  const r = contrastRatio(state.tint.c1, bgc);
  pill.textContent = `${t("contrast")} ${r.toFixed(1)}:1 ${r >= 3 ? "✓" : "△"}`;
  pill.className = "contrast-pill " + (r >= 3 ? "good" : "bad");
}
function avgHex(a, b) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const m = (x, y) => Math.round((x + y) / 2);
  const v = (m((pa >> 16) & 255, (pb >> 16) & 255) << 16) | (m((pa >> 8) & 255, (pb >> 8) & 255) << 8) | m(pa & 255, pb & 255);
  return "#" + v.toString(16).padStart(6, "0");
}

function updateNames() {
  const n = state.name || "My App";
  $("iosAppName").textContent = n;
  $("tabTitle").textContent = n;
  $("tvAppName").textContent = n;
  $("storeName").textContent = n;
}

function clipRoundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  ctx.clip();
}

async function renderTvPreview(ctx, w, h) {
  const st = state;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  clipRoundRect(ctx, 0, 0, w, h, 16);
  if (st.bg.type === "none") {
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(0, 0, w, h);
  } else if (st.bg.type === "solid") {
    ctx.fillStyle = st.bg.c1;
    ctx.fillRect(0, 0, w, h);
  } else if (st.bg.type === "radial") {
    const g = ctx.createRadialGradient(w * 0.42, h * 0.36, 4, w * 0.5, h * 0.5, w * 0.68);
    g.addColorStop(0, st.bg.c1); g.addColorStop(1, st.bg.c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  } else {
    const a = (st.bg.angle || 135) * Math.PI / 180;
    const g = ctx.createLinearGradient(w / 2 - Math.cos(a) * w / 2, h / 2 - Math.sin(a) * h / 2, w / 2 + Math.cos(a) * w / 2, h / 2 + Math.sin(a) * h / 2);
    g.addColorStop(0, st.bg.c1); g.addColorStop(1, st.bg.c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  const box = h * 0.52 * (st.fg.scale / 0.6);
  const content = await drawContent(st, box);
  const x = w / 2 + (st.fg.dx / 100) * w * 0.45;
  const y = h / 2 + (st.fg.dy / 100) * h * 0.45;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((st.fg.rot * Math.PI) / 180);
  if (st.fg.flip) ctx.scale(-1, 1);
  ctx.shadowColor = "rgba(0,0,0,.18)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  ctx.drawImage(content, -box / 2, -box / 2, box, box);
  ctx.restore();
  ctx.restore();
}

/* 防抖渲染调度 */
let rafPending = false;
function scheduleRender() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    refreshAll();
  });
}

/* 状态变更统一入口 */
function onStateChange(commit = true) {
  scheduleRender();
  if (commit) commitState();
}
