/* ═══════════ 左侧面板交互绑定 ═══════════ */
"use strict";

const SYNCERS = [];
function registerSync(fn) { SYNCERS.push(fn); }
function syncUI() { SYNCERS.forEach(fn => { try { fn(); } catch (e) {} }); updatePanelVisibility(); }

/* ── 通用绑定工具 ── */
function bindSeg(id, get, set) {
  const el = $(id);
  el.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    set(btn.dataset.v);
    syncUI(); onStateChange();
  });
  registerSync(() => {
    el.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.v === String(get())));
  });
}
function bindRange(id, get, set, fmt) {
  const el = $(id);
  const out = el.closest(".field")?.querySelector("output");
  const upd = () => { if (out) out.textContent = fmt ? fmt(get()) : get(); };
  el.addEventListener("input", () => { set(+el.value); upd(); onStateChange(); });
  registerSync(() => { el.value = get(); upd(); });
}
function bindColor(id, get, set) {
  const el = $(id);
  el.addEventListener("input", () => { set(el.value); onStateChange(); });
  registerSync(() => { el.value = get(); });
}
function bindCheck(id, get, set) {
  const el = $(id);
  el.addEventListener("change", () => { set(el.checked); syncUI(); onStateChange(); });
  registerSync(() => { el.checked = !!get(); });
}
function bindText(id, get, set) {
  const el = $(id);
  el.addEventListener("input", () => { set(el.value); onStateChange(); });
  registerSync(() => { if (document.activeElement !== el) el.value = get(); });
}

/* ── 色板 ── */
function initSwatches() {
  document.querySelectorAll(".swatches").forEach(sp => {
    const target = sp.dataset.target;
    SWATCH_COLORS.forEach(c => {
      const i = document.createElement("i");
      i.style.background = c;
      i.onclick = () => {
        const input = $(target);
        input.value = c;
        input.dispatchEvent(new Event("input"));
      };
      sp.appendChild(i);
    });
  });
}

/* ── 素材来源 ── */
const EXTRA_SOURCES = ["brand", "image", "emoji", "svg"];
const SOURCE_LABEL_KEYS = {
  brand: "src.brand",
  image: "src.image",
  emoji: "src.emoji",
  svg: "src.svg",
};
function isExtraSource(v) {
  return EXTRA_SOURCES.includes(v);
}

function initSource() {
  const root = $("sourceSeg");
  const moreBtn = $("sourceMoreBtn");
  const moreLabel = $("sourceMoreLabel");
  const menu = $("sourceMoreMenu");
  const closeMenu = () => {
    menu.hidden = true;
    moreBtn.setAttribute("aria-expanded", "false");
  };
  const setSource = v => {
    state.source = v;
    if (state.tint.mode === "original") state.tint.mode = "solid";
    document.querySelectorAll(".src-page").forEach(p => p.hidden = p.dataset.src !== v);
    if (v === "brand" && !$("brandGrid").childElementCount) loadBrandStarter();
  };

  root.addEventListener("click", e => {
    const btn = e.target.closest("[data-source-v]");
    if (!btn || !root.contains(btn)) return;
    setSource(btn.dataset.sourceV);
    closeMenu();
    syncUI(); onStateChange();
  });
  moreBtn.addEventListener("click", e => {
    e.stopPropagation();
    const open = menu.hidden;
    menu.hidden = !open;
    moreBtn.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", e => {
    if (!root.contains(e.target)) closeMenu();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeMenu();
  });

  registerSync(() => {
    document.querySelectorAll(".src-page").forEach(p => p.hidden = p.dataset.src !== state.source);
    if (state.tint.mode === "original") state.tint.mode = "solid";
    root.querySelectorAll("[data-source-v]").forEach(b => b.classList.toggle("active", b.dataset.sourceV === state.source));
    const extra = isExtraSource(state.source);
    moreBtn.classList.toggle("active", extra);
    moreLabel.textContent = extra ? t(SOURCE_LABEL_KEYS[state.source]) : "...";
  });
}

/* ── 内置 + 在线图标 ── */
function renderBuiltinGrid(filter = "", opts = {}) {
  const grid = $("clipGrid");
  if (!opts.append) grid.innerHTML = "";
  const f = filter.trim().toLowerCase();
  BUILTIN_ICONS.filter(i => !f || i.k.includes(f) || i.n.includes(f)).forEach(icon => {
    const b = document.createElement("button");
    b.title = icon.n;
    b.innerHTML = `<svg viewBox="0 0 24 24"><path d="${icon.d}" fill="currentColor"${icon.fr ? ` fill-rule="${icon.fr}"` : ""}/></svg>`;
    b.classList.toggle("active", !state.clipart.svg && state.clipart.id === icon.n);
    b.onclick = () => {
      state.source = "clipart";
      state.clipart = { id: icon.n, svg: null, vb: null };
      if (state.tint.mode === "original") state.tint.mode = "solid";
      syncUI();
      if ($("clipSearch").value.trim()) renderBuiltinGrid($("clipSearch").value);
      else renderDefaultIconGrid();
      onStateChange();
    };
    grid.appendChild(b);
  });
}

const ICON_QUERY_ALIASES = {
  "爱": "heart", "爱心": "heart", "喜欢": "heart", "收藏": "star", "星": "star", "星星": "star",
  "闪电": "zap", "能量": "bolt", "家": "home", "主页": "home", "首页": "home", "房子": "home",
  "火箭": "rocket", "启动": "rocket", "完成": "check", "对勾": "check", "关闭": "close",
  "添加": "plus", "加": "plus", "播放": "play", "暂停": "pause", "音乐": "music", "通知": "bell",
  "书签": "bookmark", "聊天": "chat", "消息": "message", "云": "cloud", "编辑": "edit",
  "铅笔": "pencil", "邮件": "mail", "旗帜": "flag", "文件夹": "folder", "灯泡": "lightbulb",
  "创意": "idea", "位置": "map pin", "地图": "map", "锁": "lock", "安全": "shield",
  "用户": "user", "人": "user", "发送": "send", "纸飞机": "send", "设置": "settings",
  "齿轮": "settings", "购物车": "cart", "商店": "shop", "点赞": "thumb up", "眼睛": "eye",
  "无线": "wifi", "网络": "wifi", "时间": "clock", "月亮": "moon", "太阳": "sun",
  "盾牌": "shield", "火焰": "flame", "热门": "flame", "钻石": "diamond", "皇冠": "crown",
  "叶子": "leaf", "环保": "leaf", "游戏": "gamepad", "咖啡": "coffee", "飞机": "plane",
  "旅行": "travel", "汽车": "car", "目标": "target", "礼物": "gift", "钥匙": "key",
  "地球": "globe", "全球": "globe", "钱": "money", "金融": "money", "学校": "school",
  "教育": "school", "工作": "briefcase", "调色板": "palette", "艺术": "art", "耳机": "headphones",
  "代码": "code", "健身": "fitness", "医院": "hospital", "医疗": "medical", "书": "book",
  "阅读": "book", "画笔": "brush", "手机": "phone", "电脑": "laptop", "视频": "video",
  "麦克风": "microphone", "笑脸": "smile", "相机": "camera", "照片": "camera",
  "吉他": "guitar", "电吉他": "guitar", "乐器": "music", "钢琴": "piano", "键盘": "keyboard",
  "鼓": "drum", "小提琴": "violin", "萨克斯": "saxophone", "喇叭": "trumpet", "麦": "microphone",
  "耳麦": "headset", "唱片": "disc", "专辑": "album", "播客": "podcast", "收音机": "radio",
  "电影": "movie", "剪辑": "video", "直播": "broadcast", "图片": "image", "图库": "image",
  "下载": "download", "上传": "upload", "云上传": "cloud upload", "云下载": "cloud download",
  "搜索": "search", "放大镜": "search", "菜单": "menu", "更多": "more", "筛选": "filter",
  "日历": "calendar", "笔记": "note", "文档": "file text", "文件": "file", "复制": "copy",
  "保存": "save", "删除": "trash", "垃圾桶": "trash", "分享": "share", "链接": "link",
  "二维码": "qr code", "打印": "printer", "剪刀": "scissors", "标签": "tag", "奖杯": "trophy",
  "奖牌": "medal", "礼花": "party", "庆祝": "party", "彩虹": "rainbow", "魔法": "sparkles",
  "机器人": "bot", "人工智能": "ai", "芯片": "cpu", "数据库": "database", "服务器": "server",
  "终端": "terminal", "命令": "terminal", "代码分支": "git branch", "分支": "git branch",
  "汽车": "car", "自行车": "bike", "火车": "train", "船": "ship", "公交": "bus", "卡车": "truck",
  "跑步": "running", "篮球": "basketball", "足球": "football", "游泳": "swimming", "瑜伽": "yoga",
  "餐厅": "restaurant", "食物": "food", "汉堡": "burger", "披萨": "pizza", "苹果": "apple",
  "购物": "shopping", "包": "bag", "信用卡": "credit card", "钱包": "wallet", "银行": "bank",
  "心电": "activity", "药": "pill", "急救": "first aid", "牙齿": "tooth", "眼镜": "glasses",
  "植物": "plant", "树": "tree", "花": "flower", "水": "water", "雨": "rain", "雪": "snow",
  "温度": "temperature", "火": "flame", "警告": "alert", "错误": "error", "信息": "info",
  "correo": "mail", "casa": "home", "corazon": "heart", "coeur": "heart", "maison": "home",
  "haus": "home", "herz": "heart", "hjem": "home", "cuore": "heart",
  "guitarra": "guitar", "guitare": "guitar", "gitarre": "guitar", "chitarra": "guitar",
  "ホーム": "home", "家です": "home", "ハート": "heart", "ロケット": "rocket", "ギター": "guitar",
  "하트": "heart", "집": "home", "로켓": "rocket", "기타": "guitar",
};

const DEFAULT_ICONIFY_ICONS = [
  "lucide:heart", "lucide:star", "lucide:rocket", "lucide:home", "lucide:settings", "lucide:search",
  "lucide:bell", "lucide:camera", "lucide:book-open", "lucide:message-circle", "lucide:shopping-cart", "lucide:sparkles",
  "tabler:brand-github", "tabler:palette", "tabler:plane", "tabler:bike", "tabler:shoe", "tabler:device-mobile",
  "tabler:calendar", "tabler:map-pin", "tabler:headphones", "tabler:briefcase", "tabler:school", "tabler:coin",
  "ph:lightbulb", "ph:music-note", "ph:guitar", "ph:game-controller", "ph:coffee", "ph:gift",
  "ph:paint-brush", "ph:shield-check", "ph:leaf", "ph:target", "ph:code", "ph:microphone",
  "material-symbols:favorite-rounded", "material-symbols:rocket-launch-rounded", "material-symbols:home-rounded", "material-symbols:auto-awesome-rounded",
  "material-symbols:directions-car-rounded", "material-symbols:restaurant-rounded", "material-symbols:fitness-center-rounded", "material-symbols:workspace-premium-rounded",
  "heroicons:cpu-chip", "heroicons:cloud", "heroicons:lock-closed", "heroicons:globe-alt",
  "heroicons:document-text", "heroicons:folder", "heroicons:arrow-down-tray", "heroicons:qr-code",
];

const QUERY_TRANSLATION_LS = "qmicon.queryTranslations";
let clipSearchSeq = 0;

function readTranslationCache() {
  try { return JSON.parse(localStorage.getItem(QUERY_TRANSLATION_LS) || "{}"); } catch (e) { return {}; }
}
function writeTranslationCache(cache) {
  try { localStorage.setItem(QUERY_TRANSLATION_LS, JSON.stringify(cache)); } catch (e) {}
}
function isEnglishLikeQuery(q) {
  return /^[\w\s:./+-]+$/i.test(q.trim());
}
function extractGoogleTranslation(data) {
  return (data?.[0] || []).map(part => part?.[0] || "").join(" ").trim();
}
function cleanTranslatedQuery(q) {
  return q.toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 4)
    .join(" ");
}
async function fetchTranslatedQuery(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error("translate failed");
  const data = JSON.parse(await res.text());
  return cleanTranslatedQuery(extractGoogleTranslation(data));
}
async function translateIconQuery(q) {
  const raw = q.trim();
  if (!raw || isEnglishLikeQuery(raw)) return "";
  const cache = readTranslationCache();
  if (cache[raw]) return cache[raw];
  const endpoint = `/api/translate-icon?q=${encodeURIComponent(raw)}`;
  const direct = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(raw)}`;
  for (const url of [endpoint, direct]) {
    try {
      const translated = await fetchTranslatedQuery(url);
      if (translated && translated !== cleanTranslatedQuery(raw)) {
        cache[raw] = translated;
        writeTranslationCache(cache);
        return translated;
      }
    } catch (e) {}
  }
  return "";
}

function iconQueryCandidates(q) {
  const raw = q.trim().toLowerCase();
  if (!raw) return [];
  const folded = raw.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const exact = ICON_QUERY_ALIASES[raw] || ICON_QUERY_ALIASES[folded];
  if (exact) return [exact];
  const out = [];
  for (const [term, query] of Object.entries(ICON_QUERY_ALIASES)) {
    if (term.length >= 2 && raw.includes(term) && !out.includes(query)) out.push(query);
  }
  const hit = BUILTIN_ICONS.find(i => {
    const k = i.k.toLowerCase();
    return i.n === folded || k.split(/\s+/).includes(raw) || k.includes(raw);
  });
  if (hit && !out.includes(hit.n)) out.push(hit.n);
  if (!out.includes(folded)) out.push(folded);
  return out.slice(0, 3);
}

async function iconQueryCandidatesAsync(q) {
  const out = [];
  const add = v => {
    const s = (v || "").trim();
    if (s && !out.includes(s)) out.push(s);
  };
  const translated = await translateIconQuery(q);
  if (translated) {
    add(translated);
    iconQueryCandidates(q).filter(isEnglishLikeQuery).forEach(add);
    return out.slice(0, 4);
  }
  iconQueryCandidates(q).forEach(add);
  return out.slice(0, 4);
}

function normalizeIconQuery(q) {
  return iconQueryCandidates(q)[0] || "";
}

async function iconifySearch(q, prefix) {
  const merged = [];
  for (const query of await iconQueryCandidatesAsync(q)) {
    const url = `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=72${prefix ? `&prefix=${prefix}` : ""}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const icons = (await res.json()).icons || [];
    for (const icon of icons) if (!merged.includes(icon)) merged.push(icon);
    if (merged.length >= 48) break;
  }
  return merged;
}
async function iconifyPick(full) {
  const [set, name] = full.split(":");
  const res = await fetch(`https://api.iconify.design/${set}.json?icons=${name}`, { signal: AbortSignal.timeout(8000) });
  const data = await res.json();
  const item = data.icons[name];
  if (!item) throw new Error("icon not found");
  const vb = `${item.left || 0} ${item.top || 0} ${item.width || data.width || 16} ${item.height || data.height || 16}`;
  return { body: item.body, vb };
}
function renderOnlineGrid(gridEl, icons, isColor, opts = {}) {
  if (!opts.append) gridEl.innerHTML = "";
  icons.forEach(full => {
    const [set, name] = full.split(":");
    const b = document.createElement("button");
    b.title = full;
    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = `https://api.iconify.design/${set}/${name}.svg${isColor ? "" : "?color=%23808080"}`;
    img.onerror = () => b.remove();
    b.appendChild(img);
    b.onclick = async () => {
      try {
        const { body, vb } = await iconifyPick(full);
        state.source = set === "simple-icons" ? "brand" : "clipart";
        state.clipart = { id: full, svg: body, vb };
        if (state.tint.mode === "original") state.tint.mode = "solid";
        gridEl.querySelectorAll("button").forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        syncUI(); onStateChange();
        toast(t('toast.iconpicked', { n: name }));
      } catch (e) { toast(t('toast.iconfail')); }
    };
    gridEl.appendChild(b);
  });
}

function renderDefaultIconGrid() {
  renderBuiltinGrid();
  renderOnlineGrid($("clipGrid"), DEFAULT_ICONIFY_ICONS, false, { append: true });
}

function initClipart() {
  renderDefaultIconGrid();
  let timer;
  $("clipSearch").addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(doClipSearch, 350);
  });
}
async function doClipSearch() {
  const seq = ++clipSearchSeq;
  const q = $("clipSearch").value.trim();
  $("clipNetHint").hidden = true;
  if (!q) { renderDefaultIconGrid(); return; }
  renderBuiltinGrid(q);
  try {
    const candidates = await iconQueryCandidatesAsync(q);
    if (seq !== clipSearchSeq) return;
    if (!$("clipGrid").childElementCount) {
      for (const candidate of candidates) {
        if (candidate === q.toLowerCase()) continue;
        renderBuiltinGrid(candidate);
        if ($("clipGrid").childElementCount) break;
      }
    }
    const icons = await iconifySearch(q, "");
    if (seq !== clipSearchSeq) return;
    if (icons.length) renderOnlineGrid($("clipGrid"), icons, false);
    else if (!$("clipGrid").childElementCount) renderBuiltinGrid(q);
  } catch (e) {
    $("clipNetHint").hidden = false;
  }
}

/* ── 品牌 Logo ── */
const BRAND_STARTER = ["github", "figma", "slack", "google", "apple", "x", "instagram", "youtube", "tiktok", "whatsapp", "telegram", "discord", "spotify", "netflix", "android", "react", "vuedotjs", "svelte", "nodedotjs", "python", "rust", "docker", "kubernetes", "firebase", "vercel", "openai", "notion", "linear"];
function loadBrandStarter() {
  renderOnlineGrid($("brandGrid"), BRAND_STARTER.map(n => `simple-icons:${n}`), false);
}
function initBrand() {
  let timer;
  $("brandSearch").addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const q = $("brandSearch").value.trim();
      $("brandNetHint").hidden = true;
      if (!q) { loadBrandStarter(); return; }
      try {
        const icons = await iconifySearch(q, "simple-icons");
        renderOnlineGrid($("brandGrid"), icons, false);
      } catch (e) { $("brandNetHint").hidden = false; }
    }, 350);
  });
}

/* ── Emoji ── */
let emojiCat = "常用";
function initEmoji() {
  const cats = $("emojiCats");
  Object.keys(EMOJI_DATA).forEach((cat, i) => {
    const c = document.createElement("button");
    c.className = "chip" + (i === 0 ? " active" : "");
    c.textContent = t('cat.' + cat);
    c.onclick = () => {
      emojiCat = cat;
      cats.querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
      c.classList.add("active");
      renderEmojiGrid();
    };
    cats.appendChild(c);
  });
  $("emojiSearch").addEventListener("input", renderEmojiGrid);
  renderEmojiGrid();
}
function renderEmojiGrid() {
  const grid = $("emojiGrid");
  grid.innerHTML = "";
  const q = $("emojiSearch").value.trim().toLowerCase();
  let chars;
  if (q) {
    chars = Object.entries(EMOJI_NAMES).filter(([, k]) => k.includes(q)).map(([c]) => c);
    if (!chars.length) chars = [...new Intl.Segmenter().segment(Object.values(EMOJI_DATA).join(""))].map(s => s.segment).filter(c => c.trim());
  } else {
    chars = [...new Intl.Segmenter().segment(EMOJI_DATA[emojiCat])].map(s => s.segment).filter(c => c.trim());
  }
  chars.slice(0, 120).forEach(ch => {
    const b = document.createElement("button");
    b.textContent = ch;
    b.classList.toggle("active", state.source === "emoji" && state.emoji.char === ch);
    b.onclick = () => {
      state.source = "emoji";
      state.emoji.char = ch;
      if (state.tint.mode === "original") state.tint.mode = "solid";
      grid.querySelectorAll("button").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      syncUI(); onStateChange();
    };
    grid.appendChild(b);
  });
}

/* ── 文字 ── */
function initText() {
  const sel = $("textFont");
  FONT_LIST.forEach(f => {
    const o = document.createElement("option");
    o.value = o.textContent = f;
    o.style.fontFamily = f;
    sel.appendChild(o);
  });
  sel.addEventListener("change", () => { state.text.font = sel.value; onStateChange(); });
  registerSync(() => { sel.value = state.text.font; });

  bindText("textValue", () => state.text.value, v => state.text.value = v);
  bindSeg("textWeightSeg", () => state.text.weight, v => state.text.weight = +v);
  bindRange("textLs", () => state.text.ls, v => state.text.ls = v);
  bindRange("textLh", () => Math.round(state.text.lh * 100), v => state.text.lh = v / 100, v => (v / 100).toFixed(1));
  bindSeg("textCurveSeg", () => state.text.curve, v => state.text.curve = v);
  bindRange("textCurve", () => state.text.curveAmt, v => state.text.curveAmt = v, v => v + "°");

  $("gfontLoad").onclick = () => {
    const name = $("gfontName").value.trim();
    if (!name) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@400;700;900&display=swap`;
    document.head.appendChild(link);
    if (![...sel.options].some(o => o.value === name)) {
      const o = document.createElement("option");
      o.value = o.textContent = name;
      sel.appendChild(o);
    }
    state.text.font = name;
    sel.value = name;
    toast(t('toast.fontloading', { n: name }));
    setTimeout(onStateChange, 800);
    setTimeout(scheduleRender, 2000);
  };
}

/* ── 图片上传 ── */
function readFileAsDataUrl(file, cb) {
  const r = new FileReader();
  r.onload = () => cb(r.result);
  r.readAsDataURL(file);
}
function initImage() {
  const dz = $("dropZone"), fi = $("fileInput");
  dz.onclick = () => fi.click();
  fi.onchange = () => fi.files[0] && readFileAsDataUrl(fi.files[0], d => setImage(d));
  ["dragover", "dragleave", "drop"].forEach(ev => dz.addEventListener(ev, e => {
    e.preventDefault();
    dz.classList.toggle("over", ev === "dragover");
    if (ev === "drop" && e.dataTransfer.files[0]) readFileAsDataUrl(e.dataTransfer.files[0], d => setImage(d));
  }));
  $("imgUrlLoad").onclick = async () => {
    const url = $("imgUrl").value.trim();
    if (!url) return;
    try {
      await loadImage(url);
      setImage(url);
    } catch (e) { toast(t('toast.imgfail')); }
  };
  bindSeg("imgModeSeg", () => state.image.mode, v => {
    state.image.mode = v;
    if (state.tint.mode === "original") state.tint.mode = "solid";
  });
  $("imgRemove").onclick = () => { state.image.data = null; syncUI(); onStateChange(); };
  registerSync(() => { $("imageTools").hidden = !state.image.data; });
}
function setImage(dataUrl) {
  state.source = "image";
  state.image.data = dataUrl;
  if (state.tint.mode === "original") state.tint.mode = "solid";
  syncUI(); onStateChange();
  toast(t('toast.imgapplied'));
}

/* ── SVG 粘贴 ── */
function initSvg() {
  $("svgApply").onclick = () => {
    const code = $("svgCode").value.trim();
    if (!code.includes("<svg")) { toast(t('toast.svgneed')); return; }
    state.source = "svg";
    state.svg.code = code.replace(/currentColor/g, "#000000");
    if (state.tint.mode === "original") state.tint.mode = "solid";
    syncUI(); onStateChange();
    toast(t('toast.svgapplied'));
  };
}

/* ── 前景着色 + 变换 ── */
function initTint() {
  bindSeg("tintSeg", () => state.tint.mode, v => state.tint.mode = v);
  bindColor("tintColor", () => state.tint.c1, v => state.tint.c1 = v);
  bindColor("tintColor2", () => state.tint.c2, v => state.tint.c2 = v);
  registerSync(() => {
    if (state.tint.mode === "original") state.tint.mode = "solid";
    $("tintColor2").hidden = state.tint.mode !== "gradient";
    $("tintRow").style.opacity = 1;
  });

  bindRange("fgScale", () => Math.round(state.fg.scale * 100), v => state.fg.scale = v / 100, v => v + "%");

  // 图像调整
  bindRange("adjBrightness", () => state.adjust.brightness, v => state.adjust.brightness = v, v => v + "%");
  bindRange("adjContrast", () => state.adjust.contrast, v => state.adjust.contrast = v, v => v + "%");
  bindRange("adjSaturation", () => state.adjust.saturation, v => state.adjust.saturation = v, v => v + "%");
  bindRange("adjTemperature", () => state.adjust.temperature, v => state.adjust.temperature = v);
  bindRange("adjHue", () => state.adjust.hue, v => state.adjust.hue = v, v => v + "°");
  $("adjReset").onclick = () => {
    Object.assign(state.adjust, { brightness: 100, contrast: 100, saturation: 100, temperature: 0, hue: 0 });
    syncUI(); onStateChange();
  };
  bindRange("fgDx", () => state.fg.dx, v => state.fg.dx = v);
  bindRange("fgDy", () => state.fg.dy, v => state.fg.dy = v);
  bindRange("fgRot", () => state.fg.rot, v => state.fg.rot = v, v => v + "°");

  document.querySelectorAll("[data-quick]").forEach(b => b.onclick = () => {
    const q = b.dataset.quick;
    if (q === "rot-90") state.fg.rot = ((state.fg.rot - 90 + 540) % 360) - 180;
    if (q === "rot+90") state.fg.rot = ((state.fg.rot + 90 + 540) % 360) - 180;
    if (q === "flip") state.fg.flip = !state.fg.flip;
    if (q === "reset-tf") Object.assign(state.fg, { scale: 0.6, dx: 0, dy: 0, rot: 0, flip: false });
    syncUI(); onStateChange();
  });
}

/* ── 背景 ── */
function initBg() {
  bindSeg("bgTypeSeg", () => state.bg.type, v => state.bg.type = v);
  bindColor("bgColor1", () => state.bg.c1, v => state.bg.c1 = v);
  bindColor("bgColor2", () => state.bg.c2, v => state.bg.c2 = v);
  bindRange("bgAngle", () => state.bg.angle, v => state.bg.angle = v, v => v + "°");
  $("bgSwap").onclick = () => { [state.bg.c1, state.bg.c2] = [state.bg.c2, state.bg.c1]; syncUI(); onStateChange(); };
  $("bgRandomGrad").onclick = () => {
    const g = GRADIENT_PRESETS[Math.floor(Math.random() * GRADIENT_PRESETS.length)];
    state.bg.c1 = g[0]; state.bg.c2 = g[1];
    syncUI(); onStateChange();
  };

  const gp = $("gradPresets");
  GRADIENT_PRESETS.forEach(([a, b]) => {
    const btn = document.createElement("button");
    btn.style.background = `linear-gradient(135deg, ${a}, ${b})`;
    btn.onclick = () => {
      if (state.bg.type === "solid" || state.bg.type === "none" || state.bg.type === "image") state.bg.type = "linear";
      state.bg.c1 = a; state.bg.c2 = b;
      syncUI(); onStateChange();
    };
    gp.appendChild(btn);
  });

  // 背景图片
  const bdz = $("bgDropZone"), bfi = $("bgFileInput");
  bdz.onclick = () => bfi.click();
  bfi.onchange = () => bfi.files[0] && readFileAsDataUrl(bfi.files[0], d => {
    state.bg.image = d; state.bg.type = "image";
    syncUI(); onStateChange();
  });

  // 纹理
  const tg = $("textureGrid");
  PATTERN_TYPES.forEach(tp => {
    const b = document.createElement("button");
    b.dataset.v = tp;
    if (tp === "none") b.textContent = t("sh.none");
    else {
      const tile = patternTile(tp, 9, "#94a3b8");
      b.style.backgroundImage = `url(${tile.toDataURL()})`;
    }
    b.onclick = () => { state.bg.pattern = tp; syncUI(); onStateChange(); };
    tg.appendChild(b);
  });
  registerSync(() => {
    tg.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.v === state.bg.pattern));
  });
  bindRange("texOpacity", () => Math.round(state.bg.patOp * 100), v => state.bg.patOp = v / 100, v => v + "%");
  bindRange("texSize", () => state.bg.patSize, v => state.bg.patSize = v);
  bindRange("bgNoise", () => Math.round(state.bg.noise * 100), v => state.bg.noise = v / 100, v => v + "%");
}

/* ── 形状 ── */
function initMask() {
  const grid = $("shapeGrid");
  SHAPE_DEFS.forEach(s => {
    const b = document.createElement("button");
    b.dataset.v = s.id;
    b.innerHTML = `<img src="${shapeThumbSVG(s.id)}" width="24" height="24" alt="">${t(s.key)}`;
    b.onclick = () => { state.mask.type = s.id; syncUI(); onStateChange(); };
    grid.appendChild(b);
  });
  registerSync(() => {
    grid.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.v === state.mask.type));
  });
  bindRange("maskRadius", () => state.mask.radius, v => state.mask.radius = v, v => v + "%");
  bindRange("maskPad", () => state.mask.pad, v => state.mask.pad = v, v => v + "%");
  $("customMaskApply").onclick = () => {
    const p = $("customMask").value.trim();
    if (!p) return;
    try { new Path2D(p); } catch (e) { toast(t('toast.pathfail')); return; }
    state.mask.custom = p;
    state.mask.type = "custom";
    syncUI(); onStateChange();
    toast(t('toast.maskapplied'));
  };
}

/* ── 特效 ── */
function initFx() {
  bindCheck("lyFg", () => state.layers.fg, v => state.layers.fg = v);
  bindCheck("lyBg", () => state.layers.bg, v => state.layers.bg = v);
  bindCheck("lyBadge", () => state.layers.badge, v => state.layers.badge = v);

  bindSeg("shadowSeg", () => state.fx.shadow.mode, v => state.fx.shadow.mode = v);
  bindRange("shX", () => state.fx.shadow.x, v => state.fx.shadow.x = v);
  bindRange("shY", () => state.fx.shadow.y, v => state.fx.shadow.y = v);
  bindRange("shBlur", () => state.fx.shadow.blur, v => state.fx.shadow.blur = v);
  bindRange("shOp", () => Math.round(state.fx.shadow.op * 100), v => state.fx.shadow.op = v / 100, v => v + "%");
  bindColor("shColor", () => state.fx.shadow.color, v => state.fx.shadow.color = v);

  bindCheck("strokeOn", () => state.fx.stroke.on, v => state.fx.stroke.on = v);
  bindRange("strokeW", () => state.fx.stroke.w, v => state.fx.stroke.w = v);
  bindColor("strokeColor", () => state.fx.stroke.color, v => state.fx.stroke.color = v);

  bindCheck("glowOn", () => state.fx.glow.on, v => state.fx.glow.on = v);
  bindRange("glowStr", () => Math.round(state.fx.glow.str * 100), v => state.fx.glow.str = v / 100, v => v + "%");
  bindColor("glowColor", () => state.fx.glow.color, v => state.fx.glow.color = v);

  bindSeg("glossSeg", () => state.fx.gloss, v => state.fx.gloss = v);
  bindCheck("innerBorder", () => state.fx.border, v => state.fx.border = v);
}

/* ── 徽章 ── */
function initBadge() {
  bindCheck("badgeOn", () => state.badge.on, v => state.badge.on = v);
  bindSeg("badgeStyleSeg", () => state.badge.style, v => state.badge.style = v);
  bindText("badgeText", () => state.badge.text, v => state.badge.text = v);
  bindRange("badgeSize", () => Math.round(state.badge.size * 100), v => state.badge.size = v / 100, v => v + "%");
  bindRange("badgeDx", () => state.badge.dx || 0, v => state.badge.dx = v);
  bindRange("badgeDy", () => state.badge.dy || 0, v => state.badge.dy = v);
  bindColor("badgeBg", () => state.badge.bg, v => state.badge.bg = v);
  bindColor("badgeFg", () => state.badge.fg, v => state.badge.fg = v);
  const pos = $("badgePos");
  pos.querySelectorAll("button").forEach(b => b.onclick = () => {
    state.badge.pos = b.dataset.v;
    syncUI(); onStateChange();
  });
  registerSync(() => {
    pos.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.v === state.badge.pos));
  });

  // 圆点内容
  bindSeg("badgeDotTypeSeg", () => state.badge.dotType || "none", v => state.badge.dotType = v);

  // ── 图形：内置过滤 + Iconify 在线搜索（与主图标选择器同源）──
  const dotIconGrid = $("badgeDotIconGrid");
  function renderDotBuiltinGrid(filter = "", opts = {}) {
    if (!opts.append) dotIconGrid.innerHTML = "";
    const f = filter.trim().toLowerCase();
    BUILTIN_ICONS.filter(i => !f || i.k.includes(f) || i.n.includes(f)).forEach(icon => {
      const b = document.createElement("button");
      b.title = icon.n;
      b.innerHTML = `<svg viewBox="0 0 24 24"><path d="${icon.d}" fill="currentColor"${icon.fr ? ` fill-rule="${icon.fr}"` : ""}/></svg>`;
      b.classList.toggle("active", !state.badge.dotIconSvg && state.badge.dotIcon === icon.n);
      b.onclick = () => {
        state.badge.dotType = "icon";
        state.badge.dotIcon = icon.n;
        state.badge.dotIconSvg = null; state.badge.dotIconVb = null;
        syncUI(); onStateChange();
      };
      dotIconGrid.appendChild(b);
    });
  }
  function renderDotOnlineGrid(icons, opts = {}) {
    if (!opts.append) dotIconGrid.innerHTML = "";
    icons.forEach(full => {
      const [set, name] = full.split(":");
      const b = document.createElement("button");
      b.title = full;
      const img = document.createElement("img");
      img.loading = "lazy";
      img.src = `https://api.iconify.design/${set}/${name}.svg?color=%23808080`;
      img.onerror = () => b.remove();
      b.appendChild(img);
      b.classList.toggle("active", !!state.badge.dotIconSvg && state.badge.dotIcon === full);
      b.onclick = async () => {
        try {
          const { body, vb } = await iconifyPick(full);
          state.badge.dotType = "icon";
          state.badge.dotIcon = full;
          state.badge.dotIconSvg = body; state.badge.dotIconVb = vb;
          syncUI(); onStateChange();
        } catch (e) { toast(t('toast.iconfail')); }
      };
      dotIconGrid.appendChild(b);
    });
  }
  function renderDotDefaultIconGrid() {
    renderDotBuiltinGrid();
    renderDotOnlineGrid(DEFAULT_ICONIFY_ICONS, { append: true });
  }
  let dotIconSearchSeq = 0, dotIconTimer;
  $("badgeDotIconSearch").addEventListener("input", () => {
    clearTimeout(dotIconTimer);
    dotIconTimer = setTimeout(async () => {
      const seq = ++dotIconSearchSeq;
      const q = $("badgeDotIconSearch").value.trim();
      $("badgeDotIconNetHint").hidden = true;
      if (!q) { renderDotDefaultIconGrid(); return; }
      renderDotBuiltinGrid(q);
      try {
        const candidates = await iconQueryCandidatesAsync(q);
        if (seq !== dotIconSearchSeq) return;
        if (!dotIconGrid.childElementCount) {
          for (const candidate of candidates) {
            if (candidate === q.toLowerCase()) continue;
            renderDotBuiltinGrid(candidate);
            if (dotIconGrid.childElementCount) break;
          }
        }
        const icons = await iconifySearch(q, "");
        if (seq !== dotIconSearchSeq) return;
        if (icons.length) renderDotOnlineGrid(icons);
        else if (!dotIconGrid.childElementCount) renderDotBuiltinGrid(q);
      } catch (e) { $("badgeDotIconNetHint").hidden = false; }
    }, 350);
  });
  renderDotDefaultIconGrid();
  registerSync(() => {
    dotIconGrid.querySelectorAll("button").forEach(b => {
      const isOnline = !!b.querySelector("img");
      b.classList.toggle("active", state.badge.dotType === "icon" &&
        (isOnline ? (!!state.badge.dotIconSvg && b.title === state.badge.dotIcon)
                  : (!state.badge.dotIconSvg && b.title === state.badge.dotIcon)));
    });
  });

  // ── Emoji：分类 + 搜索（与主 Emoji 选择器同源）──
  let dotEmojiCat = "常用";
  const dotEmojiCats = $("badgeDotEmojiCats");
  Object.keys(EMOJI_DATA).forEach((cat, i) => {
    const c = document.createElement("button");
    c.className = "chip" + (i === 0 ? " active" : "");
    c.textContent = t('cat.' + cat);
    c.onclick = () => {
      dotEmojiCat = cat;
      dotEmojiCats.querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
      c.classList.add("active");
      renderDotEmojiGrid();
    };
    dotEmojiCats.appendChild(c);
  });
  $("badgeDotEmojiSearch").addEventListener("input", renderDotEmojiGrid);
  function renderDotEmojiGrid() {
    const grid = $("badgeDotEmojiGrid");
    grid.innerHTML = "";
    const q = $("badgeDotEmojiSearch").value.trim().toLowerCase();
    let chars;
    if (q) {
      chars = Object.entries(EMOJI_NAMES).filter(([, k]) => k.includes(q)).map(([c]) => c);
      if (!chars.length) chars = [...new Intl.Segmenter().segment(Object.values(EMOJI_DATA).join(""))].map(s => s.segment).filter(c => c.trim());
    } else {
      chars = [...new Intl.Segmenter().segment(EMOJI_DATA[dotEmojiCat])].map(s => s.segment).filter(c => c.trim());
    }
    chars.slice(0, 120).forEach(ch => {
      const b = document.createElement("button");
      b.textContent = ch;
      b.classList.toggle("active", state.badge.dotType === "emoji" && state.badge.dotEmoji === ch);
      b.onclick = () => {
        state.badge.dotType = "emoji";
        state.badge.dotEmoji = ch;
        syncUI(); onStateChange();
      };
      grid.appendChild(b);
    });
  }
  renderDotEmojiGrid();
  registerSync(() => {
    $("badgeDotEmojiGrid").querySelectorAll("button").forEach(b =>
      b.classList.toggle("active", state.badge.dotType === "emoji" && b.textContent === state.badge.dotEmoji));
  });

  // ── 图片上传 ──
  const dotDrop = $("badgeDotDrop"), dotFile = $("badgeDotFile");
  const setDotImage = d => {
    state.badge.dotType = "image"; state.badge.dotImage = d;
    dotDrop.classList.add("has-img");
    syncUI(); onStateChange();
  };
  dotDrop.onclick = () => dotFile.click();
  dotFile.onchange = () => dotFile.files[0] && readFileAsDataUrl(dotFile.files[0], setDotImage);
  ["dragover", "dragleave", "drop"].forEach(ev => dotDrop.addEventListener(ev, e => {
    e.preventDefault();
    dotDrop.classList.toggle("over", ev === "dragover");
    if (ev === "drop" && e.dataTransfer.files[0]) readFileAsDataUrl(e.dataTransfer.files[0], setDotImage);
  }));
  registerSync(() => {
    const hasImg = state.badge.dotType === "image" && !!state.badge.dotImage;
    dotDrop.classList.toggle("has-img", hasImg);
    dotDrop.style.backgroundImage = hasImg ? `url(${state.badge.dotImage})` : "";
    dotDrop.querySelector("span").style.display = hasImg ? "none" : "";
  });
}

/* ── 风格预设 ── */
async function initPresets() {
  const grid = $("presetGrid");
  for (const pr of PRESETS) {
    const b = document.createElement("button");
    b.title = t(pr.key);
    const cv = document.createElement("canvas");
    cv.width = cv.height = 96;
    b.appendChild(cv);
    b.onclick = () => {
      applyPreset(pr.p);
      syncUI(); onStateChange();
      toast(t('toast.preset', { n: t(pr.key) }));
    };
    grid.appendChild(b);
    // 用预设渲染缩略图（前景固定火箭）
    const tmpState = mergeState(pr.p);
    tmpState.source = "clipart"; tmpState.clipart = { id: "rocket" };
    tmpState.fg = { scale: 0.6, dx: 0, dy: 0, rot: 0, flip: false };
    renderIcon(cv.getContext("2d"), 96, { shape: tmpState.mask.type, radius: tmpState.mask.radius }, tmpState).catch(() => {});
  }
}

/* ── 可见性联动 ── */
function updatePanelVisibility() {
  const bg = state.bg;
  $("bgC1Field").style.display = (bg.type === "none" || bg.type === "image") ? "none" : "";
  $("bgC2Field").style.display = (bg.type === "solid" || bg.type === "none" || bg.type === "image") ? "none" : "";
  $("bgAngleField").style.display = (bg.type === "linear" || bg.type === "conic") ? "" : "none";
  $("bgImgField").hidden = bg.type !== "image";
  $("texOpts").style.display = bg.pattern === "none" ? "none" : "";
  $("radiusField").style.display = state.mask.type === "rounded" ? "" : "none";
  $("curveAmtField").hidden = state.text.curve === "none";
  $("shadowOpts").style.display = state.fx.shadow.mode === "none" ? "none" : "";
  $("strokeOpts").hidden = !state.fx.stroke.on;
  $("glowOpts").hidden = !state.fx.glow.on;
  $("badgeTools").hidden = !state.badge.on;
  $("badgeTextField").style.display = state.badge.style === "dot" ? "none" : "";
  $("badgePosField").style.display = state.badge.style === "bar" ? "none" : "";
  $("badgeDotTools").hidden = state.badge.style !== "dot";
  $("badgeOffsetRow").style.display = state.badge.style === "bar" ? "none" : "";
  const dType = state.badge.dotType || "none";
  $("badgeDotIconTools").hidden = dType !== "icon";
  $("badgeDotEmojiTools").hidden = dType !== "emoji";
  $("badgeDotImgField").hidden = dType !== "image";
  $("imageTools").hidden = !state.image.data;
}

function initPanels() {
  initSwatches();
  initSource();
  initClipart();
  initEmoji();
  initText();
  initImage();
  initBrand();
  initSvg();
  initTint();
  initBg();
  initMask();
  initFx();
  initBadge();
  initPresets();
  bindText("appName", () => state.name, v => { state.name = v; updateNames(); });
}
