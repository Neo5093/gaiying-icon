/* ═══════════ 该影 icon 中英双语 ═══════════ */
"use strict";

const LANG = (() => {
  const saved = localStorage.getItem("qmicon.lang");
  if (saved === "zh" || saved === "en") return saved;
  return (navigator.language || "en").toLowerCase().startsWith("zh") ? "zh" : "en";
})();

const I18N = {
  "app.title": ["该影 icon — 专业级跨平台图标设计工作站", "该影 icon — Cross-platform App Icon Studio"],
  "app.tagline": ["免注册 · 纯浏览器 · 14+ 平台", "No sign-up · In-browser · 14+ platforms"],
  "top.history": ["历史", "History"], "top.random": ["随机", "Shuffle"],
  "top.share": ["分享", "Share"], "top.download": ["下载", "Download"],
  "top.theme.title": ["切换深浅色界面", "Toggle light / dark UI"],
  "top.help.title": ["快捷键帮助", "Keyboard shortcuts"],
  "top.lang.title": ["切换语言 Switch language", "切换语言 Switch language"],

  "acc.source": ["图标形状", "Icon Shape"], "acc.bg": ["背景设计", "Background Design"],
  "acc.mask": ["形状蒙版", "Shape Mask"], "acc.fx": ["图层特效", "Layer Effects"],
  "acc.badge": ["徽章 / 角标", "Badge"], "acc.presets": ["设计模板", "Design Templates"],
  "acc.advanced": ["高级", "Advanced"],

  "src.clipart": ["图形", "Graphic"], "src.emoji": ["Emoji", "Emoji"],
  "src.text": ["文本", "Text"], "src.image": ["图片", "Image"],
  "src.brand": ["Logo", "Logo"], "src.svg": ["SVG", "SVG"],
  "src.more": ["更多图标", "More icons"], "src.more.title": ["选择更多图标类型", "Choose more icon types"],
  "clip.search.ph": ["搜索 2w+ 图标或符号（支持中文）…", "Search 20k+ icons or symbols…"],
  "clip.nethint": ["在线搜索不可用，已展示内置图标库", "Online search unavailable — showing built-in icons"],
  "emoji.search.ph": ["搜索 Emoji…", "Search emoji…"],
  "text.content": ["文字内容", "Text"], "text.multiline": ["支持换行", "multi-line"],
  "text.ph": ["如：App、Go、智", "e.g. App, Go"],
  "text.font": ["字体", "Font"],
  "gfont.ph": ["加载任意 Google 字体名…", "Load any Google Font…"], "gfont.load": ["加载", "Load"],
  "text.weight": ["字重", "Weight"], "text.ls": ["字距", "Tracking"], "text.lh": ["行高", "Leading"],
  "text.curve": ["文字变形", "Text warp"],
  "curve.none": ["无", "None"], "curve.up": ["上弧", "Arc up"], "curve.down": ["下弧", "Arc down"],
  "text.curveamt": ["弧度", "Curvature"],
  "img.drop.title": ["点击上传", "Click to upload"], "img.drop.sub": ["或拖拽图片到此处", "or drag & drop"],
  "img.drop.hint": ["PNG / JPG / SVG / WebP，建议透明背景", "PNG / JPG / SVG / WebP — transparent bg recommended"],
  "img.url.ph": ["或输入图片 URL…", "or paste image URL…"], "img.load": ["加载", "Load"],
  "img.recolor": ["重新着色", "Recolor"], "img.original": ["原图", "Original"], "img.tint": ["单色化", "Tint"],
  "img.remove": ["移除图片", "Remove image"],
  "brand.search.ph": ["搜索 3,000+ 品牌 Logo（在线）…", "Search 3,000+ brand logos (online)…"],
  "brand.nethint": ["品牌库需要网络连接", "Brand library requires network"],
  "svg.paste": ["粘贴 SVG 代码", "Paste SVG code"], "svg.apply": ["解析并应用", "Parse & apply"],
  "tint.label": ["图标颜色", "Icon color"],
  "tint.solid": ["单色", "Solid"], "tint.gradient": ["渐变", "Gradient"],
  "tf.scale": ["缩放", "Scale"], "tf.dx": ["X 偏移", "Offset X"], "tf.dy": ["Y 偏移", "Offset Y"],
  "tf.rot": ["旋转", "Rotation"], "tf.flip": ["翻转", "Flip"], "tf.reset": ["重置", "Reset"],
  "adjust.label": ["图像调整", "Image adjustments"],
  "adjust.brightness": ["亮度", "Brightness"], "adjust.contrast": ["对比度", "Contrast"],
  "adjust.saturation": ["饱和度", "Saturation"], "adjust.temperature": ["色温", "Temperature"],
  "adjust.hue": ["色调", "Hue"], "adjust.reset": ["重置调整", "Reset adjustments"],

  "bg.solid": ["纯色", "Solid"], "bg.linear": ["线性", "Linear"], "bg.radial": ["径向", "Radial"],
  "bg.conic": ["锥形", "Conic"], "bg.image": ["图片", "Image"], "bg.none": ["透明", "None"],
  "bg.gradpresets": ["渐变预设", "Gradient presets"],
  "bg.c1": ["颜色 1", "Color 1"], "bg.c2": ["颜色 2", "Color 2"], "bg.angle": ["渐变角度", "Angle"],
  "bg.swap": ["交换", "Swap"], "bg.randomgrad": ["随机配色", "Random palette"],
  "bg.image.label": ["背景图片", "Background image"], "bg.image.upload": ["点击上传背景图", "Upload background image"],
  "bg.texture": ["图案纹理叠加", "Pattern overlay"],
  "tex.opacity": ["强度", "Opacity"], "tex.size": ["大小", "Size"], "bg.noise": ["噪点", "Noise"],

  "shape.squircle": ["iOS 超椭圆", "Squircle"], "shape.rounded": ["圆角矩形", "Rounded"],
  "shape.circle": ["圆形", "Circle"], "shape.square": ["全出血", "Full-bleed"],
  "shape.hexagon": ["六边形", "Hexagon"], "shape.star": ["星形", "Star"],
  "shape.diamond": ["菱形", "Diamond"], "shape.triangle": ["三角", "Triangle"],
  "shape.drop": ["水滴", "Drop"], "shape.shield": ["盾牌", "Shield"], "shape.custom": ["自定义", "Custom"],
  "mask.radius": ["圆角半径", "Corner radius"], "mask.pad": ["外边距（透明留白）", "Outer margin"],
  "mask.custom": ["自定义 SVG 蒙版", "Custom SVG mask"], "mask.customapply": ["应用自定义蒙版", "Apply custom mask"],
  "mask.hint": ["蒙版作用于 Web / 桌面图标与中央画布；Android 与 iOS 导出按平台规范自动处理。",
    "Mask applies to web/desktop icons and the canvas; Android & iOS exports follow platform specs automatically."],

  "fx.layers": ["图层可见性", "Layer visibility"],
  "layer.fg": ["前景", "Foreground"], "layer.bg": ["背景", "Background"], "layer.badge": ["徽章", "Badge"],
  "fx.shadow": ["阴影", "Shadow"],
  "sh.none": ["无", "None"], "sh.soft": ["柔和", "Soft"], "sh.hard": ["硬边", "Hard"], "sh.long": ["长投影", "Long"],
  "sh.blur": ["模糊", "Blur"], "sh.op": ["透明度", "Opacity"],
  "fx.stroke": ["描边", "Outline"], "stroke.w": ["宽度", "Width"], "stroke.color": ["颜色", "Color"],
  "fx.glow": ["发光", "Glow"], "glow.str": ["强度", "Strength"],
  "fx.gloss": ["整体光泽", "Gloss"],
  "gloss.none": ["无", "None"], "gloss.top": ["顶部高光", "Top light"], "gloss.diag": ["斜面光", "Diagonal"],
  "fx.border": ["内边框细线", "Inner hairline"],

  "badge.enable": ["启用徽章", "Enable badge"], "badge.style": ["样式", "Style"],
  "badge.ribbon": ["角标", "Ribbon"], "badge.bar": ["底部横条", "Bottom bar"], "badge.dot": ["圆点", "Dot"],
  "badge.text": ["徽章文字", "Badge text"], "badge.pos": ["位置", "Position"], "badge.size": ["大小", "Size"],
  "badge.bgc": ["底色", "Fill"], "badge.fgc": ["文字色", "Text color"],
  "badge.dotcontent": ["圆点内容", "Dot content"],
  "badge.dcnone": ["无", "None"], "badge.dcicon": ["图形", "Icon"], "badge.dcemoji": ["Emoji", "Emoji"], "badge.dcimage": ["图片", "Image"],
  "badge.dotimg": ["点击或拖入图片", "Click or drop an image"],
  "badge.dx": ["X 偏移", "X offset"], "badge.dy": ["Y 偏移", "Y offset"],

  "preset.signal": ["清响", "Signal"], "preset.meadow": ["林野", "Meadow"], "preset.coral": ["珊瑚", "Coral"],
  "preset.cobalt": ["钴夜", "Cobalt"], "preset.lilac": ["莓紫", "Lilac"], "preset.steel": ["墨白", "Ink White"],
  "preset.glass": ["青玻", "Sea Glass"], "preset.midnight": ["金夜", "Gold Night"],
  "preset.aurora": ["青橙", "Teal Amber"], "preset.sunset": ["暖日", "Warm Day"], "preset.mint": ["青瓷", "Celadon"],
  "preset.night": ["深空", "Deep Space"], "preset.candy": ["珊瑚", "Coral"], "preset.minimal": ["极简", "Minimal"],
  "preset.neon": ["黑金", "Black Gold"], "preset.dots": ["点阵", "Dot Grid"], "preset.paper": ["纸感", "Paper"],
  "preset.forest": ["云杉", "Spruce"], "preset.graphite": ["石墨", "Graphite"], "preset.flame": ["暖焰", "Warm Flame"],

  "stage.light": ["浅色", "Light"], "stage.dark": ["深色", "Dark"], "stage.grid": ["棋盘格", "Checker"],
  "stage.info": ["1024 × 1024 px · 实时渲染", "1024 × 1024 px · live render"],
  "stage.undo": ["撤销", "Undo"], "stage.redo": ["重做", "Redo"],
  "stage.reset": ["重置全部", "Reset all"], "stage.save": ["存入历史", "Save snapshot"],
  "app.name": ["应用名称", "App name"], "contrast": ["对比度", "Contrast"],

  "pv.all": ["全部", "All"], "pv.mobile": ["移动端", "Mobile"], "pv.desktop": ["电脑端", "Computer"], "pv.web": ["网页端", "Web"],
  "pv.circle": ["圆形", "Circle"], "pv.squircle": ["Squircle", "Squircle"],
  "pv.rounded": ["圆角", "Rounded"], "pv.square": ["方形", "Square"],
  "pv.themed": ["Android 13 主题图标", "Android 13 themed"], "pv.notif": ["通知栏 24dp", "Notification 24dp"],
  "pv.appstore": ["App Store 1024", "App Store 1024"], "pv.home": ["主屏幕", "Home screen"],
  "pv.iosdark": ["iOS 18 深色", "iOS 18 dark"],
  "pv.favicon": ["favicon 32", "favicon 32"], "pv.pwa": ["PWA 512", "PWA 512"],
  "pv.maskable": ["Maskable 安全区", "Maskable safe zone"],
  "pv.og": ["OG 社交分享图 1200×630", "OG social image 1200×630"],
  "pv.macdock": ["macOS Dock", "macOS Dock"], "pv.wintile": ["Windows 磁贴", "Windows tile"],
  "pv.watch": ["watchOS", "watchOS"], "pv.tv": ["Apple TV", "Apple TV"], "pv.store": ["商店卡片", "Store card"],
  "pv.free": ["★★★★★ · 免费", "★★★★★ · Free"], "pv.get": ["获取", "GET"],

  "exp.platform": ["平台", "Platforms"], "exp.format": ["附加格式", "Extra formats"],
  "exp.custom": ["自定义尺寸", "Custom sizes"],
  "exp.files": ["文件列表", "File list"], "exp.zip": ["下载 ZIP 包", "Download ZIP"],
  "dlg.export": ["导出资源包", "Export package"],
  "exp.go": ["生成并下载 ZIP", "Generate & download ZIP"],
  "exp.rendering": ["正在渲染…", "Rendering…"],
  "exp.renderingfile": ["正在渲染 {p}", "Rendering {p}"],
  "exp.done": ["完成！已打包 {n} 个文件", "Done! {n} files packed"],
  "exp.started": ["资源包已开始下载", "Download started"],
  "exp.fail": ["导出失败：", "Export failed: "],
  "exp.needplat": ["请至少选择一个平台", "Select at least one platform"],
  "exp.total": ["共 {n} 个文件", "{n} files total"],

  "dlg.history": ["历史记录", "History"],
  "his.cfgexport": ["导出配置 JSON", "Export config JSON"], "his.cfgimport": ["导入配置 JSON", "Import config JSON"],
  "his.clear": ["清空", "Clear"], "dlg.close": ["关闭", "Close"],
  "his.empty": ["暂无历史。点击画布下方「存入历史」或按 Ctrl+S 保存当前设计。",
    "No history yet. Click \"Save snapshot\" under the canvas or press Ctrl+S."],
  "his.loaded": ["已载入「{n}」", "Loaded \"{n}\""],
  "dlg.help": ["快捷键", "Shortcuts"],
  "kb.undo": ["撤销", "Undo"], "kb.redo": ["重做", "Redo"], "kb.save": ["存入历史", "Save snapshot"],
  "kb.export": ["导出下载", "Export"], "kb.history": ["历史记录", "History"], "kb.random": ["随机灵感", "Shuffle"],
  "kb.panels": ["切换面板", "Switch panel"], "kb.env": ["深 / 浅画布环境", "Toggle canvas env"],

  "toast.saved": ["已存入历史记录", "Saved to history"],
  "toast.random": ["随机灵感已生成", "Shuffled a new look"],
  "toast.sharecopied": ["分享链接已复制到剪贴板", "Share link copied"],
  "toast.sharestripped": ["链接已复制（图片过大未包含在链接中）", "Link copied (image too large to embed)"],
  "toast.reset": ["已重置为默认设计", "Reset to default"],
  "toast.imported": ["配置已导入", "Config imported"],
  "toast.importfail": ["配置文件解析失败", "Failed to parse config"],
  "toast.sharedload": ["已从分享链接载入设计", "Loaded design from share link"],
  "toast.iconpicked": ["已选择 {n}", "Selected {n}"],
  "toast.iconfail": ["加载图标失败，请检查网络", "Failed to load icon — check network"],
  "toast.svgneed": ["请粘贴完整的 <svg> 代码", "Paste a complete <svg> snippet"],
  "toast.svgapplied": ["SVG 已应用，可用「图标颜色 → 单色」重新着色", "SVG applied — recolor via Icon color → Solid"],
  "toast.imgapplied": ["图片已应用", "Image applied"],
  "toast.imgfail": ["图片加载失败（可能是跨域限制），请下载后上传", "Image failed (possibly CORS) — download it and upload instead"],
  "toast.pathfail": ["路径解析失败", "Invalid path data"],
  "toast.maskapplied": ["自定义蒙版已应用", "Custom mask applied"],
  "toast.fontloading": ["正在加载字体 {n}…", "Loading font {n}…"],
  "toast.preset": ["已应用「{n}」预设", "Applied \"{n}\" preset"],
  "share.prompt": ["复制此链接分享：", "Copy this link to share:"],

  "cat.常用": ["常用", "Frequent"], "cat.表情": ["表情", "Smileys"], "cat.动物": ["动物", "Animals"],
  "cat.食物": ["食物", "Food"], "cat.活动": ["活动", "Activities"], "cat.旅行": ["旅行", "Travel"],
  "cat.物品": ["物品", "Objects"], "cat.符号": ["符号", "Symbols"],
  "set.all": ["全部", "All"], "set.coloremoji": ["彩色 Emoji", "Color Emoji"],
};

function t(key, params) {
  const e = I18N[key];
  let s = e ? e[LANG === "zh" ? 0 : 1] : key;
  if (params) for (const k in params) s = s.replace(`{${k}}`, params[k]);
  return s;
}

function applyI18n() {
  document.documentElement.lang = LANG === "zh" ? "zh-CN" : "en";
  document.title = t("app.title");
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = t(el.dataset.i18nTitle); });
}

function switchLang() {
  localStorage.setItem("qmicon.lang", LANG === "zh" ? "en" : "zh");
  location.reload();
}
