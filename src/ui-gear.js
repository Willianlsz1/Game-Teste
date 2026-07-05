// ui-gear.js — modal de Gear: slots equipados, tooltip de peça, multiplicador de level-up.
// fmtStat/statValueText vêm de ui-core.

Object.assign(G.ui, {

  bindGear() {
    if (this.el["gear-mult"]) {
      this.el["gear-mult"].addEventListener("click", (e) => {
        const btn = e.target.closest("[data-mult]");
        if (!btn) return;
        const raw = btn.dataset.mult;
        this.gearMult = raw === "max" ? "max" : +raw;
        this.el["gear-mult"].querySelectorAll("button").forEach((b) =>
          b.classList.toggle("is-active", b === btn)
        );
      });
    }
  },

  // ---- GEAR MODAL ----

  renderGear() {
    if (!this.el["gear-slots"]) return;
    const slotCard = (slot) => {
      const item = G.state.data.equipped[slot.id];
      if (!item) return "";
      const lvl   = item.level || 1;
      const cap   = G.gear.cap(item);
      const maxed = G.gear.isMaxed(item);
      const icon  = slot.icon || "❔";
      let action;
      if (maxed) {
        action = `<button class="gear-max" disabled>Max</button>`;
      } else {
        action = `<span class="gear-slot__cost">✦ ${G.util.fmt(G.gear.cost(item))}</span>
                  <button class="gear-levelup" data-levelup="${slot.id}">Level up</button>`;
      }
      return `<div class="gear-slot pos-${slot.id}" data-tip="${slot.id}" style="--rar:${item.color}">
        <span class="gear-slot__lvl">LVL ${lvl}/${G.util.fmt(cap)}</span>
        <div class="gear-slot__icon">
          <span class="ico-ph">${icon}</span>
          <img class="ico-img" src="assets/gear/${slot.id}.png" alt="" onerror="this.remove()" />
        </div>
        <div class="gear-slot__action">${action}</div>
      </div>`;
    };
    const node = this.el["gear-slots"];
    node.innerHTML = G.data.slots.map(slotCard).join("");
    node.querySelectorAll("[data-levelup]").forEach((b) => {
      b.addEventListener("click", () => this.doGearLevelUp(b.dataset.levelup));
    });
    if (this.el["gear-materials"]) this.el["gear-materials"].innerHTML = "";
    node.querySelectorAll(".gear-slot[data-tip]").forEach((s) => {
      s.addEventListener("mouseenter", () => this.showGearTip(s));
      s.addEventListener("mousemove",  () => this.showGearTip(s));
      s.addEventListener("mouseleave", () => this.hideGearTip());
    });
  },

  // ganho efetivo por nível (ou por degrau) de um afixo, já com o multiplicador de raridade
  // aplicado — a MESMA regra de G.gear.affixValue, pra "+X /lv" bater com o que o level-up realmente dá.
  gearAffixGain(item, a) {
    const r = G.data.rarities.find((r) => r.id === item.rarity);
    let mult = r ? (r.statMult || 1) : 1;
    if (a.stat === 'critDmg') mult = 1; // mesma exceção de affixValue
    if (a.perStep != null) return a.perStep * mult;
    let per = a.perLevel || 0;
    const scale = G.data.balance.gearPowerScale;
    if (scale != null && a.stat === 'atk') per = per * scale;
    return per * mult;
  },

  gearTipHtml(item) {
    const lvl = item.level || 1;
    const cap = G.gear.cap(item);
    const base = G.data.gearBase[item.slot];
    const uncommonIds = (base && base.uncommonAffixes || []).map((a) => a.id);
    const affixes = item.affixes.map((a) => {
      const v    = G.gear.affixValue(item, a);
      const sign = a.pct ? "%" : "";
      const name = this.STAT_NAMES[a.stat] || a.label;
      const rarityTag = uncommonIds.indexOf(a.id) !== -1 ? `<span class="tip-rarity">Uncommon</span>` : "";
      const atCap = a.cap != null && v >= a.cap;
      let note = "";
      if (atCap) {
        // afixo maxado: não há mais ganho a mostrar
        note = `<span class="tip-perlv">(max)</span>`;
      } else if (a.perStep != null) {
        // Rarity Find (P8.1): degrau explícito — ganho a cada N níveis
        const step = a.step || 50;
        const gain = this.gearAffixGain(item, a);
        note = `<span class="tip-perlv">+${this.fmtStat(gain)}${sign} per ${step} lv</span>`;
      } else if (a.perLevel && a.step) {
        // perLevel "em degraus" (ex.: atk speed, lumens) — o valor só sobe a cada `step` níveis,
        // de uma vez, em vez de gotejar todo nível.
        const gain = this.gearAffixGain(item, a) * a.step;
        note = `<span class="tip-perlv">+${this.fmtStat(gain)}${sign} per ${a.step} lv</span>`;
      } else if (a.perLevel) {
        const gain = this.gearAffixGain(item, a);
        note = `<span class="tip-perlv">+${this.fmtStat(gain)}${sign} /lv</span>`;
      }
      return `<div class="tip-affix"><span class="tip-affix__main">+${this.fmtStat(v)}${sign} ${name}</span>${rarityTag}${note}</div>`;
    }).join("");
    return `<div class="tip-name" style="color:${item.color}">${item.name}</div>
      <div class="tip-sub" style="color:${item.color}">${item.rarityName} ${item.slotLabel}</div>
      <div class="tip-lvl">Level ${lvl} / ${cap}</div>
      <div class="tip-affixes">${affixes}</div>`;
  },

  showGearTip(slot) {
    const tip = this.el["gear-tooltip"];
    if (!tip) return;
    const item = G.state.data.equipped[slot.dataset.tip];
    if (!item) return;
    tip.innerHTML = this.gearTipHtml(item);
    tip.hidden = false;
    const modal = slot.closest(".modal--gear");
    if (!modal) return;
    const mr = modal.getBoundingClientRect();
    const sr = slot.getBoundingClientRect();
    const tr = tip.getBoundingClientRect();
    const isLeft = sr.left + sr.width / 2 < mr.left + mr.width / 2;
    let left = isLeft ? sr.right - mr.left + 12 : sr.left - mr.left - tr.width - 12;
    let top  = sr.top - mr.top;
    left = G.util.clamp(left, 8, mr.width - tr.width - 8);
    top  = G.util.clamp(top,  8, mr.height - tr.height - 8);
    tip.style.left = left + "px";
    tip.style.top  = top  + "px";
  },

  hideGearTip() {
    const tip = this.el["gear-tooltip"];
    if (tip) tip.hidden = true;
  },

  doGearLevelUp(slotId) {
    const item = G.state.data.equipped[slotId];
    if (!item) return;
    const done = G.gear.levelUpTimes(item, this.gearMult);
    if (done > 0) this.log(`${item.name} → Lv. ${item.level}`, "good");
    else this.log("Not enough Lumens.", "bad");
    G.state.save();
    this.renderAll();
  },
});
