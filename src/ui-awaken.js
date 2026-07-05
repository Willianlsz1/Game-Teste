// ui-awaken.js — tela de Awaken: lista de despertares + painel de preview (antes/depois,
// requisitos, botão de desbloqueio). Regras vivem em G.awaken.

Object.assign(G.ui, {

  bindAwaken() {
    // Awaken: selecionar entry (sidebar) / desbloquear (botão do preview)
    if (this.el["awaken-list"])
      this.el["awaken-list"].addEventListener("click", (e) => {
        const entry = e.target.closest("[data-id]");
        if (!entry) return;
        this._selectedAwaken = entry.dataset.id;
        this.el["awaken-list"].querySelectorAll(".awk-entry").forEach((el) =>
          el.classList.toggle("is-active", el.dataset.id === this._selectedAwaken)
        );
        this.renderAwakenPreview(this._selectedAwaken);
      });
    if (this.el["awaken-preview"])
      this.el["awaken-preview"].addEventListener("click", (e) => {
        const btn = e.target.closest("[data-awaken]");
        if (!btn) return;
        if (G.awaken.unlock(btn.dataset.awaken)) this.renderAwaken();
      });
  },

  // ---------- AWAKEN ----------
  renderAwaken() {
    const d = G.state.data;
    if (this.el["awaken-essence"])
      this.el["awaken-essence"].textContent = G.util.fmt((d.awakenMaterials && d.awakenMaterials.firstLight) || 0);
    const wrap = this.el["awaken-list"];
    if (!wrap) return;

    if (!this._selectedAwaken) {
      const first = G.data.awakens.find((a) => !G.awaken.isUnlocked(a.id)) || G.data.awakens[0];
      if (first) this._selectedAwaken = first.id;
    }

    wrap.innerHTML = G.data.awakens.map((a) => {
      const unlocked = G.awaken.isUnlocked(a.id);
      const can = G.awaken.canUnlock(a.id);
      const state = unlocked ? "done" : can ? "ready" : "locked";
      const badge = unlocked ? "Awakened" : can ? "Ready" : "Locked";
      const b = a.bonus;
      const shortFx = [
        b.atkMult ? `ATK ×${b.atkMult}` : null,
        b.hpMult ? `HP ×${b.hpMult}` : null,
        b.crit ? `Crit +${b.crit}%` : null,
        b.lumensBonus ? `Lumens +${b.lumensBonus}%` : null,
        b.xpBonus ? `XP +${b.xpBonus}%` : null,
      ].filter(Boolean).slice(0, 2).join(" · ");
      const active = this._selectedAwaken === a.id ? " is-active" : "";
      return `<li class="awk-entry is-${state}${active}" data-id="${a.id}">
        <div class="awk-entry__top">
          <span class="awk-entry__name">${a.name}</span>
          <span class="awk-entry__badge">${badge}</span>
        </div>
        <span class="awk-entry__fx">${shortFx}</span>
      </li>`;
    }).join("");

    this.renderAwakenPreview(this._selectedAwaken);
  },

  renderAwakenPreview(id) {
    const panel = this.el["awaken-preview"];
    if (!panel) return;
    const a = G.data.awakens.find((x) => x.id === id);
    if (!a) { panel.innerHTML = ""; return; }

    const unlocked = G.awaken.isUnlocked(a.id);
    const can = G.awaken.canUnlock(a.id);
    const s = G.state.stats();
    const b = a.bonus;

    const statRows = [
      b.atkMult  ? { label: "ATK",       before: G.util.fmt(s.atk),          after: G.util.fmt(Math.round(s.atk * b.atkMult)), active: unlocked } : null,
      b.hpMult   ? { label: "HP",        before: G.util.fmt(s.hp),           after: G.util.fmt(Math.round(s.hp  * b.hpMult)),  active: unlocked } : null,
      b.crit     ? { label: "Crit",      before: `${s.crit.toFixed(1)}%`,    after: `${Math.min(100, s.crit + b.crit).toFixed(1)}%`,  active: unlocked } : null,
      b.critDmg  ? { label: "Crit Dmg",  before: `${s.critDmg.toFixed(0)}%`, after: `${(s.critDmg + b.critDmg).toFixed(0)}%`,   active: unlocked } : null,
      b.lumensBonus ? { label: "Lumens Bonus", before: `${s.lumensBonus.toFixed(0)}%`, after: `${(s.lumensBonus + b.lumensBonus).toFixed(0)}%`, active: unlocked } : null,
      b.xpBonus  ? { label: "XP Bonus",  before: `${s.xpBonus.toFixed(0)}%`,  after: `${(s.xpBonus + b.xpBonus).toFixed(0)}%`,   active: unlocked } : null,
    ].filter(Boolean);

    const reqName = { area: "Area", level: "Lv", kills: "Kills", convergences: "Convergences" };
    const reqs = G.awaken.requirements(a.id).map((r) => {
      if (r.key === "crown") return { label: "The Ring Closes (crown lit)", met: r.met };
      // P8: Oferenda de Lumens (one-time) — rótulo em inglês "Offering".
      if (r.key === "lumens") return { label: `Offering ${G.util.fmt(r.have)}/${G.util.fmt(r.need)} ✦`, met: r.met };
      const base = r.key.indexOf("material:") === 0 ? "Awaken Mat" : (reqName[r.key] || r.key);
      return { label: `${base} ${G.util.fmt(r.have)}/${G.util.fmt(r.need)}`, met: r.met };
    });

    const stateClass = unlocked ? " is-done" : can ? " is-ready" : "";
    const action = unlocked
      ? `<div class="awk-preview__done">✦ Awakened, the light endures</div>`
      : `<button class="kit-btn-ceremonial awk-preview__btn" data-awaken="${a.id}"${can ? "" : " disabled"}>${can ? "◈ Awaken" : "Requirements not met"}</button>`;

    panel.innerHTML = `<div class="awk-preview__inner${stateClass}">
      <div class="awk-preview__head">
        <img class="awk-emblem" src="assets/ui/icon_awaken.png" alt="" onerror="this.remove()">
        <h3 class="awk-preview__title">${a.name}</h3>
        ${a.lore ? `<p class="awk-preview__lore">"${a.lore}"</p>` : ""}
      </div>
      <div class="awk-preview__stats">
        ${statRows.map((r) => `<div class="awk-stat-row">
          <span class="awk-stat-row__label">${r.label}</span>
          <div class="awk-stat-row__right">
            <span class="awk-stat-row__before">${r.before}</span>
            ${r.active
              ? `<span class="awk-stat-row__active">Active ✓</span>`
              : `<span class="awk-stat-row__arrow">→</span><span class="awk-stat-row__after">${r.after}</span>`}
          </div>
        </div>`).join("")}
      </div>
      <div class="awk-preview__reqs">
        <span class="awk-preview__reqs-label">Requirements</span>
        <div class="awk-reqs-grid">
          ${reqs.map((r) => `<div class="awk-req${r.met ? " is-met" : ""}">
            <span class="awk-req__icon">${r.met ? "✓" : "✗"}</span>
            <span class="awk-req__label">${r.label}</span>
          </div>`).join("")}
        </div>
      </div>
      <div class="awk-preview__action">${action}</div>
    </div>`;
  },
});
