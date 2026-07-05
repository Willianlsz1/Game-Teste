// ui-menu.js — modal Settings (⚙): save/export/import/display.
// Sem regra de jogo aqui além de chamar G.state.save()/reset()/load(); o resto é DOM.
// ESC fecha qualquer modal aberto; abrir o menu NÃO pausa o jogo (idle continua).

Object.assign(G.ui, {

  // ---- serialização do save (base64 de um JSON estável, unicode-safe) ----

  _encodeSave(dataObj) {
    const json = JSON.stringify(dataObj);
    // btoa só aceita latin1: escapa pra UTF-8 bytes antes de codificar.
    return window.btoa(unescape(encodeURIComponent(json)));
  },

  _decodeSave(str) {
    const json = decodeURIComponent(escape(window.atob(str)));
    return JSON.parse(json);
  },

  // campos mínimos que um save válido precisa ter (ver G.state.fresh())
  MENU_SAVE_REQUIRED_FIELDS: ["level", "xp", "lumens", "equipped"],

  _isValidSaveShape(obj) {
    if (!obj || typeof obj !== "object") return false;
    for (const k of this.MENU_SAVE_REQUIRED_FIELDS) if (!(k in obj)) return false;
    if (typeof obj.equipped !== "object" || obj.equipped === null) return false;
    return true;
  },

  // ---- bind ----

  bindMenu() {
    const $ = (id) => document.getElementById(id);

    // L6: ESC volta ao combate — fecha a tela aberta (via closeScreens; uma tela por vez).
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (this.closeScreens) this.closeScreens();
    });

    const saveBtn = $("menu-save-now");
    if (saveBtn) saveBtn.addEventListener("click", () => {
      G.state.save();
      this._flash("menu-save-feedback");
    });

    // ---- reset: confirmação dupla (digitar RESET) ----
    const resetBtn     = $("menu-reset-btn");
    const resetConfirm  = $("menu-reset-confirm");
    const resetInput    = $("menu-reset-input");
    const resetCancel   = $("menu-reset-cancel");
    const resetConfirmBtn = $("menu-reset-confirm-btn");
    if (resetBtn && resetConfirm) resetBtn.addEventListener("click", () => {
      resetConfirm.hidden = false;
      if (resetInput) { resetInput.value = ""; resetInput.focus(); }
      if (resetConfirmBtn) resetConfirmBtn.disabled = true;
    });
    if (resetInput) resetInput.addEventListener("input", () => {
      if (resetConfirmBtn) resetConfirmBtn.disabled = resetInput.value.trim().toUpperCase() !== "RESET";
    });
    if (resetCancel) resetCancel.addEventListener("click", () => { resetConfirm.hidden = true; });
    if (resetConfirmBtn) resetConfirmBtn.addEventListener("click", () => {
      if (resetInput && resetInput.value.trim().toUpperCase() !== "RESET") return;
      G.state.reset();
      location.reload();
    });

    // ---- export ----
    const exportCopy     = $("menu-export-copy");
    const exportDownload = $("menu-export-download");
    if (exportCopy) exportCopy.addEventListener("click", () => {
      const ta = $("menu-export-text");
      if (!ta) return;
      const doCopy = () => this._flash("menu-export-feedback");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ta.value).then(doCopy, () => this._fallbackCopy(ta, doCopy));
      } else this._fallbackCopy(ta, doCopy);
    });
    if (exportDownload) exportDownload.addEventListener("click", () => {
      const ta = $("menu-export-text");
      if (!ta) return;
      const blob = new Blob([ta.value], { type: "text/plain" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = "eclats_save.txt";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    });

    // ---- import ----
    const importBtn  = $("menu-import-btn");
    const importFile = $("menu-import-file");
    if (importBtn) importBtn.addEventListener("click", () => {
      const ta = $("menu-import-text");
      if (ta) this.doImportSave(ta.value);
    });
    if (importFile) importFile.addEventListener("change", () => {
      const file = importFile.files && importFile.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const ta = $("menu-import-text");
        if (ta) ta.value = String(reader.result || "").trim();
        this.doImportSave(String(reader.result || ""));
      };
      reader.readAsText(file);
    });

    // ---- display: fullscreen ----
    const fsBtn = $("menu-fullscreen");
    if (fsBtn) fsBtn.addEventListener("click", () => {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen)
          document.documentElement.requestFullscreen().catch(() => {});
        else if (document.exitFullscreen)
          document.exitFullscreen().catch(() => {});
      } catch (e) { /* fallback silencioso: navegador sem suporte */ }
    });

    // ---- display: UI scale ----
    const scaleGroup = $("menu-scale-group");
    if (scaleGroup) scaleGroup.querySelectorAll("[data-scale]").forEach((btn) =>
      btn.addEventListener("click", () => this.setUiScale(btn.dataset.scale)));

    this.applyUiScale(this.getUiScale());
  },

  _flash(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("is-shown");
    clearTimeout(this._menuFlashTimers && this._menuFlashTimers[id]);
    this._menuFlashTimers = this._menuFlashTimers || {};
    this._menuFlashTimers[id] = setTimeout(() => el.classList.remove("is-shown"), 1600);
  },

  _fallbackCopy(ta, cb) {
    try {
      ta.removeAttribute("readonly");
      ta.select();
      document.execCommand("copy");
      ta.setAttribute("readonly", "readonly");
      if (cb) cb();
    } catch (e) { /* sem suporte: silencioso */ }
  },

  // ---- render ----

  renderMenu() {
    const ta = document.getElementById("menu-export-text");
    if (ta) {
      try { ta.value = this._encodeSave(G.state.data); }
      catch (e) { ta.value = ""; }
    }
    const confirm = document.getElementById("menu-reset-confirm");
    if (confirm) confirm.hidden = true;
    const importMsg = document.getElementById("menu-import-msg");
    if (importMsg) { importMsg.textContent = ""; importMsg.className = "menu-import-msg"; }

    // reflete o UI scale ativo nos botões
    const scale = this.getUiScale();
    document.querySelectorAll("#menu-scale-group [data-scale]").forEach((btn) =>
      btn.classList.toggle("menu-btn--active", btn.dataset.scale === scale));
  },

  doImportSave(raw) {
    const msgEl = document.getElementById("menu-import-msg");
    const setMsg = (text, ok) => { if (msgEl) { msgEl.textContent = text; msgEl.className = "menu-import-msg " + (ok ? "ok" : "bad"); } };
    const str = (raw || "").trim();
    if (!str) { setMsg("Paste a save string or upload a file first.", false); return; }

    let obj;
    try { obj = this._decodeSave(str); }
    catch (e) { setMsg("Could not read this save (invalid or corrupted data). Your current save was NOT touched.", false); return; }

    if (!this._isValidSaveShape(obj)) {
      setMsg("This doesn't look like a valid Éclats save (missing required fields). Your current save was NOT touched.", false);
      return;
    }

    try {
      const json = JSON.stringify(obj);
      if (G.state.storageOk()) localStorage.setItem(G.state.SAVE_KEY, json);
      else G.state._mem[G.state.SAVE_KEY] = json;
    } catch (e) {
      setMsg("Could not write the imported save to storage. Your current save was NOT touched.", false);
      return;
    }

    setMsg("Save imported! Reloading…", true);
    setTimeout(() => location.reload(), 500);
  },

  // ---- UI scale (persistido separado do save, em localStorage à parte) ----

  UI_SCALE_KEY: "eclats_ui_scale",

  getUiScale() {
    try { return localStorage.getItem(this.UI_SCALE_KEY) || "default"; }
    catch (e) { return "default"; }
  },

  setUiScale(scale) {
    if (["small", "default", "large"].indexOf(scale) === -1) scale = "default";
    try { localStorage.setItem(this.UI_SCALE_KEY, scale); } catch (e) { /* sem storage: aplica só nesta sessão */ }
    this.applyUiScale(scale);
    document.querySelectorAll("#menu-scale-group [data-scale]").forEach((btn) =>
      btn.classList.toggle("menu-btn--active", btn.dataset.scale === scale));
  },

  applyUiScale(scale) {
    const html = document.documentElement;
    html.classList.remove("ui-scale-small", "ui-scale-default", "ui-scale-large");
    html.classList.add("ui-scale-" + scale);
  },
});
