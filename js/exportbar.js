/* ═══════════ 底部导出栏 + 导出对话框 ═══════════ */
"use strict";

function initExportBar() {
  document.querySelectorAll("[data-plat]").forEach(cb => {
    cb.addEventListener("change", () => {
      cb.checked ? EXPORT_OPTS.platforms.add(cb.dataset.plat) : EXPORT_OPTS.platforms.delete(cb.dataset.plat);
    });
  });
  document.querySelectorAll("[data-fmt]").forEach(cb => {
    cb.addEventListener("change", () => {
      cb.checked ? EXPORT_OPTS.formats.add(cb.dataset.fmt) : EXPORT_OPTS.formats.delete(cb.dataset.fmt);
    });
  });

  const chips = $("customSizes");
  const renderChips = () => {
    chips.innerHTML = "";
    EXPORT_OPTS.customSizes.forEach((sz, i) => {
      const c = document.createElement("i");
      c.textContent = `${sz}px ×`;
      c.onclick = () => { EXPORT_OPTS.customSizes.splice(i, 1); renderChips(); };
      chips.appendChild(c);
    });
  };
  const addCustomSizeFromInput = () => {
    const input = $("customSize");
    const v = +input.value;
    if (v >= 8 && v <= 4096 && !EXPORT_OPTS.customSizes.includes(v)) {
      EXPORT_OPTS.customSizes.push(v);
      EXPORT_OPTS.customSizes.sort((a, b) => a - b);
      input.value = "";
      renderChips();
      return true;
    }
    return false;
  };
  $("addSize").onclick = addCustomSizeFromInput;
  $("customSize").addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomSizeFromInput();
    }
  });

  const dlg = $("dlExport");
  const openExportDialog = () => {
    addCustomSizeFromInput();
    if (!EXPORT_OPTS.platforms.size && !EXPORT_OPTS.customSizes.length) {
      toast(t('exp.needplat')); return;
    }
    const plan = exportPlan();
    $("fileTree").textContent = fileTreeText(plan) + "\n\n" + t("exp.total", { n: plan.length });
    $("expProgress").hidden = true;
    dlg.showModal();
  };
  $("btnPreviewFiles").onclick = openExportDialog;
  $("btnExport").onclick = openExportDialog;
  $("btnDownload").onclick = openExportDialog;

  $("expGo").onclick = async () => {
    const prog = $("expProgress"), bar = prog.querySelector("div"), label = prog.querySelector("span");
    prog.hidden = false;
    $("expGo").disabled = true;
    try {
      const n = await runExport((p, path) => {
        bar.style.width = `${Math.round(p * 100)}%`;
        label.textContent = t('exp.renderingfile', { p: path });
      });
      label.textContent = t('exp.done', { n });
      toast(t('exp.started'));
      setTimeout(() => dlg.close(), 900);
    } catch (e) {
      console.error(e);
      label.textContent = t('exp.fail') + e.message;
    } finally {
      $("expGo").disabled = false;
    }
  };
}
