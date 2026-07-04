// ui-forge.js — modal da Forge: materiais, conversões e promoção de raridade (bigorna).
// Sem bind próprio (botões são ligados inline em cada render). fmtStat vem de ui-core.

Object.assign(G.ui, {

  // ---- FORGE MODAL ----

  renderForge() {
    if (!this.el["forge-mats"]) return;
    const fmt = G.util.fmt;

    const mat = (kind, qty, label, color) =>
      `<div class="forge-mat" style="--c:${color}">
        <img class="forge-mat__icon" src="assets/materials/${kind}.png" alt="" onerror="this.replaceWith(document.createTextNode('⬡'))">
        <span class="forge-mat__qty">${fmt(qty)}</span>
        <span class="forge-mat__label">${label}</span>
      </div>`;
    this.el["forge-mats"].innerHTML =
      mat("common",     G.economy.getGear("common"),       "Common",      "#9aa7bd") +
      mat("uncommon",   G.economy.getGear("uncommon"),     "Uncommon",    "#7ec8a0") +
      mat("firstLight", G.economy.getAwaken("firstLight"), "First Light", "#d4b4ff");

    this.el["forge-convert"].innerHTML = G.economy.CONVERSIONS.length
      ? G.economy.CONVERSIONS.map((c, i) => {
          const rate = G.economy.conversionRate(c);
          const max  = G.economy.maxConversions(c);
          return `<div class="forge-recipe">
            <span class="forge-recipe__line">${rate} ${c.fromLabel} <b>→</b> 1 ${c.toLabel}</span>
            <span class="forge-recipe__avail">Can make: ${fmt(max)}</span>
            <button class="forge-btn" data-convert="${i}" ${max > 0 ? "" : "disabled"}>Convert all</button>
          </div>`;
        }).join("")
      : `<span class="forge-recipe__avail">Unavailable in Map 1.</span>`;

    this.el["forge-promote"].innerHTML = G.data.slots.map((slot) => {
      const item = G.state.data.equipped[slot.id];
      if (!item) return "";
      const next = G.gear._nextRarity(item.rarity);
      if (!next) {
        return `<div class="forge-prom forge-prom--max">
          <span class="forge-prom__name">${item.slotLabel}</span>
          <span class="forge-prom__state" style="color:${item.color}">${item.rarityName} · Max rarity</span></div>`;
      }
      const nextRar = G.data.rarities.find((r) => r.id === next);
      const maxed   = G.gear.isMaxed(item);
      const cost    = G.gear.promoteCost(item);   // ARRAY de { kind, amount } (P9 r4: dois materiais)
      const MATLBL  = { common: "Common", uncommon: "Uncommon" };
      const costHtml = cost.map((c) => {
        const have = G.economy.getGear(c.kind);
        return `<span class="forge-prom__cost ${have >= c.amount ? "ok" : "short"}">${fmt(have)} / ${c.amount} ${MATLBL[c.kind] || c.kind}</span>`;
      }).join("");
      const sel = this._forgeSel === slot.id ? " is-selected" : "";
      const action = !maxed
        ? `<span class="forge-prom__note">Reach max level first</span>`
        : `${costHtml}
           <span class="forge-prom__sel">View ›</span>`;
      return `<div class="forge-prom forge-prom--click${sel}" data-select="${slot.id}">
        <span class="forge-prom__name">${item.slotLabel}</span>
        <span class="forge-prom__rar"><b style="color:${item.color}">${item.rarityName}</b> → <b style="color:${nextRar.color}">${nextRar.name}</b></span>
        <div class="forge-prom__action">${action}</div></div>`;
    }).join("");

    this.el["forge-convert"].querySelectorAll("[data-convert]").forEach((b) =>
      b.addEventListener("click", () => this.doForgeConvert(+b.dataset.convert)));
    this.el["forge-promote"].querySelectorAll("[data-select]").forEach((row) =>
      row.addEventListener("click", () => { this._forgeSel = row.dataset.select; this.renderForge(); this.renderForgeAnvil(row.dataset.select); }));

    if (this._forgeSel) this.renderForgeAnvil(this._forgeSel);
    else if (this.el["forge-anvil"]) this.el["forge-anvil"].hidden = true;
  },

  renderForgeAnvil(slotId) {
    const anvil = this.el["forge-anvil"];
    if (!anvil) return;
    const item = G.state.data.equipped[slotId];
    const next = item && G.gear._nextRarity(item.rarity);
    if (!item || !next) { anvil.hidden = true; this._forgeSel = null; return; }
    const nextRar  = G.data.rarities.find((r) => r.id === next);
    const newPiece = G.gear.buildPiece(item.slot, next);
    newPiece.level = item.level || 1;
    const curById  = {};
    item.affixes.forEach((a) => { curById[a.id] = a; });

    const rows = newPiece.affixes.map((na) => {
      const sign = na.pct ? "%" : "";
      const name = this.STAT_NAMES[na.stat] || na.label;
      const newV = this.fmtStat(G.gear.affixValue(newPiece, na));
      const cur  = curById[na.id];
      if (cur) {
        const curV = this.fmtStat(G.gear.affixValue(item, cur));
        return `<div class="anvil-affix">
          <span class="anvil-affix__lbl">${name}</span>
          <span class="anvil-affix__val"><i>+${curV}${sign}</i> <em>→</em> <b>+${newV}${sign}</b></span></div>`;
      }
      return `<div class="anvil-affix anvil-affix--new">
        <span class="anvil-affix__lbl">${name}</span>
        <span class="anvil-affix__val"><b>+${newV}${sign}</b> <em class="tag-new">NEW</em></span></div>`;
    }).join("");

    const cost = G.gear.promoteCost(item);   // ARRAY de { kind, amount } (P9 r4: dois materiais)
    const can  = G.gear.canPromote(item);
    const MATLBL = { common: "Common", uncommon: "Uncommon" };
    const costHtml = cost.map((c) => {
      const have = G.economy.getGear(c.kind);
      return `<div class="anvil-cost ${have >= c.amount ? "ok" : "short"}">${G.util.fmt(have)} / ${c.amount} ${MATLBL[c.kind] || c.kind}</div>`;
    }).join("");
    const icon = (G.data.slots.find((s) => s.id === item.slot) || {}).icon || "❔";

    anvil.innerHTML = `<div class="anvil-icon" style="--rar:${nextRar.color}">
        <span class="ico-ph">${icon}</span>
        <img src="assets/gear/${item.slot}.png" alt="" onerror="this.remove()">
      </div>
      <div class="anvil-card">
      <div class="anvil-name">${item.slotLabel}</div>
      <div class="anvil-rar"><b style="color:${item.color}">${item.rarityName}</b> <em>→</em> <b style="color:${nextRar.color}">${nextRar.name}</b></div>
      <div class="anvil-affixes">${rows}</div>
      ${costHtml}
      <button class="forge-btn forge-btn--up" data-promote="${item.slot}" ${can ? "" : "disabled"}>Promote</button>
    </div>`;
    anvil.hidden = false;
    anvil.querySelectorAll("[data-promote]").forEach((b) =>
      b.addEventListener("click", () => this.doForgePromote(b.dataset.promote)));
  },

  doForgeConvert(i) {
    const c = G.economy.CONVERSIONS[i];
    if (c && G.economy.convertGear(c) > 0) { G.state.save(); this.renderForge(); }
  },

  doForgePromote(slotId) {
    const item = G.state.data.equipped[slotId];
    if (item && G.gear.promote(item)) {
      G.state.invalidateStats();
      G.state.save();
      this.renderForge();
      this.renderGear();
      this.renderStats();
    }
  },
});
