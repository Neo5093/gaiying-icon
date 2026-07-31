/* ═══════════ 入口：初始化 / 顶栏 / 快捷键 / 历史 ═══════════ */
"use strict";

let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ── 主题 ── */
function initTheme() {
  const saved = localStorage.getItem(LS_THEME);
  if (saved) document.documentElement.dataset.theme = saved;
  else if (matchMedia("(prefers-color-scheme: dark)").matches) document.documentElement.dataset.theme = "dark";
  $("btnTheme").onclick = () => {
    const cur = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = cur;
    localStorage.setItem(LS_THEME, cur);
    scheduleRender();
  };
}

/* ── 画布环境 ── */
function initStage() {
  $("stageBgSeg").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    $("stageBgSeg").querySelectorAll("button").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    $("stageWrap").dataset.env = b.dataset.v;
  });
}

/* ── 历史记录对话框 ── */
function renderHistoryGrid() {
  const grid = $("historyGrid");
  grid.innerHTML = "";
  const list = getHistory();
  if (!list.length) {
    grid.innerHTML = `<p class="hint" style="grid-column:1/-1">${t("his.empty")}</p>`;
    return;
  }
  list.forEach((h, i) => {
    const b = document.createElement("button");
    b.title = `${h.name} · ${new Date(h.t).toLocaleString(LANG === "zh" ? "zh-CN" : "en")}`;
    b.innerHTML = `<img src="${h.thumb}" alt=""><span class="del">×</span>`;
    b.onclick = e => {
      if (e.target.classList.contains("del")) {
        deleteHistory(i); renderHistoryGrid(); return;
      }
      state = mergeState(JSON.parse(h.state));
      syncUI(); onStateChange();
      $("dlHistory").close();
      toast(t('his.loaded', { n: h.name }));
    };
    grid.appendChild(b);
  });
}
function saveCurrentToHistory() {
  const thumb = makeCanvas(96);
  const src = $("stageCanvas");
  thumb.getContext("2d").drawImage(src, 0, 0, 96, 96);
  saveToHistory(thumb.toDataURL("image/png"));
  toast(t('toast.saved'));
}

function initTopbar() {
  $("btnHistory").onclick = () => { renderHistoryGrid(); $("dlHistory").showModal(); };
  $("btnSaveHistory").onclick = saveCurrentToHistory;
  $("historyClear").onclick = () => { clearHistory(); renderHistoryGrid(); };

  $("btnRandom").onclick = () => { randomize(); syncUI(); onStateChange(); toast(t('toast.random')); };

  $("btnShare").onclick = async () => {
    const { hash, stripped } = encodeShare();
    const url = location.origin + location.pathname + hash;
    try {
      await navigator.clipboard.writeText(url);
      toast(stripped ? t('toast.sharestripped') : t('toast.sharecopied'));
    } catch (e) {
      prompt(t('share.prompt'), url);
    }
  };

  $("btnUndo").onclick = () => { if (undo()) { syncUI(); scheduleRender(); } };
  $("btnRedo").onclick = () => { if (redo()) { syncUI(); scheduleRender(); } };
  $("btnReset").onclick = () => {
    state = structuredClone(DEFAULT_STATE);
    syncUI(); onStateChange();
    toast(t('toast.reset'));
  };
  $("btnHelp").onclick = () => $("dlHelp").showModal();

  // 配置导入导出
  $("cfgExport").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
    a.download = "qm-icon-config.json";
    a.click();
  };
  $("cfgImport").onclick = () => $("cfgFile").click();
  $("cfgFile").onchange = () => {
    const f = $("cfgFile").files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        state = mergeState(JSON.parse(r.result));
        syncUI(); onStateChange();
        $("dlHistory").close();
        toast(t('toast.imported'));
      } catch (e) { toast(t('toast.importfail')); }
    };
    r.readAsText(f);
  };

  // 对话框关闭按钮
  document.querySelectorAll("dialog [data-close]").forEach(b => {
    b.onclick = () => b.closest("dialog").close();
  });
}

/* ── 快捷键 ── */
function initShortcuts() {
  document.addEventListener("keydown", e => {
    const tag = document.activeElement?.tagName;
    const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey ? redo() : undo()) { syncUI(); scheduleRender(); }
    } else if (mod && e.key.toLowerCase() === "y") {
      e.preventDefault();
      if (redo()) { syncUI(); scheduleRender(); }
    } else if (mod && e.key.toLowerCase() === "s") {
      e.preventDefault(); saveCurrentToHistory();
    } else if (mod && e.key.toLowerCase() === "e") {
      e.preventDefault(); $("btnDownload").click();
    } else if (mod && e.key.toLowerCase() === "h") {
      e.preventDefault(); $("btnHistory").click();
    } else if (!typing && !mod) {
      if (e.key.toLowerCase() === "r") $("btnRandom").click();
      else if (e.key.toLowerCase() === "d") {
        const seg = $("stageBgSeg");
        const cur = seg.querySelector(".active");
        (cur?.dataset.v === "light" ? seg.querySelector('[data-v="dark"]') : seg.querySelector('[data-v="light"]')).click();
      } else if (/^[1-6]$/.test(e.key)) {
        const accs = document.querySelectorAll("#leftPanel .acc");
        const target = accs[+e.key - 1];
        if (target) {
          accs.forEach(a => a.open = a === target);
          target.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    }
  });
}

/* ── 右侧预览筛选 ── */
function initPvFilter() {
  $("pvFilter").addEventListener("click", e => {
    const c = e.target.closest(".chip");
    if (!c) return;
    $("pvFilter").querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
    c.classList.add("active");
    const v = c.dataset.v;
    document.querySelectorAll(".pv-card").forEach(card => {
      card.hidden = v !== "all" && card.dataset.cat !== v;
    });
    if (v === "all" || v === "mobile") $("pvMoreCard").open = true;
  });
}

/* ── 启动 ── */
window.addEventListener("DOMContentLoaded", () => {
  applyI18n();
  $("langLabel").textContent = LANG === "zh" ? "EN" : "中";
  $("btnLang").onclick = switchLang;

  const shared = decodeShare();
  if (!shared) loadAutosave();

  initTheme();
  initPanels();
  initExportBar();
  initTopbar();
  initStage();
  initShortcuts();
  initPvFilter();

  syncUI();
  undoStack.push(snapshot());
  refreshAll();
  if (shared) toast(t('toast.sharedload'));

  // 字体就绪后重渲染一次
  document.fonts?.ready?.then(() => scheduleRender());
});
