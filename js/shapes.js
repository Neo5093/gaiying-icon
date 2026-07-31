/* ═══════════ 形状蒙版路径生成 ═══════════ */
"use strict";

const SHAPE_DEFS = ["squircle", "rounded", "circle", "square", "hexagon", "star",
  "diamond", "triangle", "drop", "shield", "custom"].map(id => ({ id, key: "shape." + id }));

const APPLE_ICON_SUPERELLIPSE_N = 5;

function buildSuperellipsePath(ctx, s, exponent = APPLE_ICON_SUPERELLIPSE_N) {
  const c = s / 2;
  const steps = Math.max(96, Math.min(384, Math.round(s / 3)));
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const ct = Math.cos(t), st = Math.sin(t);
    const x = c + c * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / exponent);
    const y = c + c * Math.sign(st) * Math.pow(Math.abs(st), 2 / exponent);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/* 在 ctx 上构建蒙版路径（0,0 ~ s,s 区域） */
function buildShapePath(ctx, s, type, radiusPct = 22, customPath = null) {
  ctx.beginPath();
  const c = s / 2;
  switch (type) {
    case "circle":
      ctx.arc(c, c, c, 0, Math.PI * 2);
      break;
    case "rounded": {
      const r = (Math.max(0, Math.min(50, radiusPct)) / 100) * s;
      ctx.roundRect(0, 0, s, s, r);
      break;
    }
    case "squircle": {
      buildSuperellipsePath(ctx, s);
      break;
    }
    case "hexagon": {
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        const x = c + c * Math.cos(a), y = c + c * Math.sin(a);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }
    case "star": {
      const outer = c, inner = c * 0.5;
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const x = c + r * Math.cos(a), y = c + r * Math.sin(a);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }
    case "diamond":
      ctx.moveTo(c, 0); ctx.lineTo(s, c); ctx.lineTo(c, s); ctx.lineTo(0, c);
      ctx.closePath();
      break;
    case "triangle":
      ctx.moveTo(c, 0.02 * s); ctx.lineTo(0.98 * s, 0.95 * s); ctx.lineTo(0.02 * s, 0.95 * s);
      ctx.closePath();
      break;
    case "drop":
      ctx.moveTo(c, 0.03 * s);
      ctx.bezierCurveTo(0.62 * s, 0.18 * s, 0.86 * s, 0.36 * s, 0.86 * s, 0.62 * s);
      ctx.arc(c, 0.62 * s, 0.36 * s, 0, Math.PI, false);
      ctx.bezierCurveTo(0.14 * s, 0.36 * s, 0.38 * s, 0.18 * s, c, 0.03 * s);
      ctx.closePath();
      break;
    case "shield":
      ctx.moveTo(0.08 * s, 0.1 * s);
      ctx.lineTo(0.92 * s, 0.1 * s);
      ctx.lineTo(0.92 * s, 0.52 * s);
      ctx.bezierCurveTo(0.92 * s, 0.78 * s, 0.66 * s, 0.92 * s, 0.5 * s, 0.98 * s);
      ctx.bezierCurveTo(0.34 * s, 0.92 * s, 0.08 * s, 0.78 * s, 0.08 * s, 0.52 * s);
      ctx.closePath();
      break;
    case "custom":
      if (customPath) {
        try {
          const p = new Path2D(customPath);
          const m = new DOMMatrix().scale(s / 100, s / 100);
          const scaled = new Path2D();
          scaled.addPath(p, m);
          return scaled; // 返回 Path2D，调用方用 clip(path)
        } catch (e) { /* fallthrough */ }
      }
      buildSuperellipsePath(ctx, s);
      break;
    case "square":
    default:
      ctx.rect(0, 0, s, s);
  }
  return null;
}

/* 应用蒙版裁剪 */
function clipShape(ctx, s, type, radiusPct, customPath) {
  const p2d = buildShapePath(ctx, s, type, radiusPct, customPath);
  if (p2d) ctx.clip(p2d); else ctx.clip();
}

/* 生成形状选择器里的小预览 SVG */
function shapeThumbSVG(type) {
  const tmp = document.createElement("canvas");
  tmp.width = tmp.height = 48;
  const ctx = tmp.getContext("2d");
  const p2d = buildShapePath(ctx, 48, type, 22, "M50 0 L100 100 L0 100 Z");
  ctx.fillStyle = "#888";
  if (p2d) ctx.fill(p2d); else ctx.fill();
  return tmp.toDataURL();
}
