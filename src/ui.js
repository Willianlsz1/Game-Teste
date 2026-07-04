// ui.js — renderização e eventos. Nenhuma regra de jogo aqui.

G.ui = {
  el: {},
  gearMult: 1,

  // display copy: stat key -> plain English name (no fantasy affix names)
  STAT_NAMES: {
    atk:              "ATK",
    hp:               "HP",
    crit:             "Crit Chance",
    critDmg:          "Crit Damage",
    atkSpeed:         "Attack Speed",
    xpBonus:          "XP Bonus",
    lumensBonus:      "Lumens Bonus",
    damageReduction:  "Damage Reduction",
    specialDmg:       "Rare and Boss Damage",
    cleave:           "Cleave (overkill to next)",
    bulwark:          "Damage Reduction (below 35% HP)",
    overcrit:         "Double Strike Chance",
    momentum:         "Attack Speed per Kill",
    rarityFindEmber:  "Ember Light Chance",
    rarityFindLumen:  "Lumen Light Chance",
    rarityFindCorona: "Corona Light Chance",
  },

  cache() {
    const ids = [
      "res-lumens", "res-area", "harbinger-counter",
      "hero-card-level", "hero-hp-fill", "hero-hp-label", "hero-xp-fill", "hero-xp-label",
      "enemies-container", "log",
      "gear-stats", "gear-slots", "gear-mult", "gear-tooltip", "gear-materials",
      "forge-mats", "forge-convert", "forge-promote", "forge-anvil",
      // World Map
      "wmap-bg", "wmap-act-label", "wmap-act-down", "wmap-act-up",
      "wmap-nodes", "wmap-trail", "wmap-info", "wmap-info-art", "wmap-info-name",
      "wmap-info-emblem", "wmap-info-sub", "wmap-info-chip", "wmap-info-lore", "wmap-info-deep",
      "wmap-info-level", "wmap-info-enemies", "wmap-info-mobs",
      "wmap-info-boss-row", "wmap-info-boss", "wmap-info-unlock-row", "wmap-info-unlock",
      "wmap-info-res", "wmap-info-travel", "wmap-info-close",
      // Convergence
      "conv-points", "conv-count", "conv-highest", "conv-pending", "conv-current", "conv-return", "conv-next", "btn-converge",
      // Awaken
      "awaken-essence", "awaken-list", "awaken-preview",
      // Passives
      "pv-body", "pv-lock",
    ];
    for (const id of ids) this.el[id] = document.getElementById(id);
  },

  bind() {
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
    // breakdown de stats: clicar numa linha abre a matriz Fonte × Camada
    const gs = document.getElementById("gear-stats");
    if (gs) gs.addEventListener("click", (e) => {
      const row = e.target.closest(".stat-row");
      if (row) this.openStatPop(row.dataset.stat);
    });
    const pop = document.getElementById("stat-pop");
    if (pop) pop.addEventListener("click", (e) => {
      if (e.target === pop || e.target.closest("[data-close]")) this.closeStatPop();
    });

    // World Map: painel de info (fechar / viajar) e botão "◀ World"
    if (this.el["wmap-info-close"])
      this.el["wmap-info-close"].addEventListener("click", () => { this.el["wmap-info"].hidden = true; });
    // clique no overlay (fora do card) fecha o info; clique DENTRO do card não fecha
    if (this.el["wmap-info"])
      this.el["wmap-info"].addEventListener("click", (e) => {
        if (e.target === this.el["wmap-info"]) this.el["wmap-info"].hidden = true;
      });
    if (this.el["wmap-info-travel"])
      this.el["wmap-info-travel"].addEventListener("click", () => {
        if (this._infoArea != null) this.travelTo(this._infoArea);
      });
    const wback = document.getElementById("wmap-back");
    if (wback) wback.addEventListener("click", () => { document.getElementById("modal-worldmap").hidden = true; });

    // World Map: navegação entre atos (A = Floresta / B = Porto Afundado). Não muda a área do jogador.
    if (this.el["wmap-act-down"])
      this.el["wmap-act-down"].addEventListener("click", () => {
        if (this.el["wmap-act-down"].classList.contains("is-locked")) return;
        this._wmapAct = "B"; this.renderWorldMap();
        if (this.el["wmap-info"]) this.el["wmap-info"].hidden = true;
      });
    if (this.el["wmap-act-up"])
      this.el["wmap-act-up"].addEventListener("click", () => {
        this._wmapAct = "A"; this.renderWorldMap();
        if (this.el["wmap-info"]) this.el["wmap-info"].hidden = true;
      });

    // Convergence (prestige): confirma e renasce
    if (this.el["btn-converge"])
      this.el["btn-converge"].addEventListener("click", () => {
        if (!G.convergence.canConverge()) return;
        const pts = G.convergence.pending();
        if (confirm(`Converge now for ${G.util.fmt(pts)} Convergence Points? Your level resets to 1.`)) {
          G.convergence.converge();
          this.renderConvergence();
        }
      });

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

    // Passivas (World-Tree I): comprar nó (clique delegado; a coroa não é comprável).
    // buy() já faz invalidateStats + save; aqui só disparamos o floater e re-renderizamos.
    const pscreen = document.getElementById("modal-passives");
    if (pscreen)
      pscreen.addEventListener("click", (e) => {
        const node = e.target.closest(".pv-node");
        if (!node || node.classList.contains("pv-crown")) return;
        const i = +node.dataset.i;
        if (G.passives.buy(i)) { this._pvFloater(node, i); this.renderPassives(); }
      });
  },

  openModal(id) {
    this.renderAll();
    // World Map renderiza só ao abrir (não a cada tick); painel começa fechado
    if (id === "modal-worldmap") {
      this._wmapAct = (G.state.data.areaIndex || 0) <= 8 ? "A" : "B";
      this.renderWorldMap();
      if (this.el["wmap-info"]) this.el["wmap-info"].hidden = true;
    }
    if (id === "modal-forge") this.renderForge();
    if (id === "modal-convergence") this.renderConvergence();
    if (id === "modal-awaken") this.renderAwaken();
    if (id === "modal-passives") this.renderPassives();
    const m = document.getElementById(id);
    if (m) m.hidden = false;
    // passivas: o fit do stage roda dentro de renderPassives() (linha acima), mas nesse
    // instante a tela ainda está hidden (display:none) — getBoundingClientRect() dá 0×0.
    // Re-fita agora que .hidden=false já tirou o display:none do layout.
    if (id === "modal-passives" && this.el["pv-body"]) this._pvFitStage(this.el["pv-body"]);
  },

  resetGame() {
    if (confirm("Restart the game? All progress will be lost.")) { G.state.reset(); location.reload(); }
  },

  togglePause(btn) {
    G.combat.paused = !G.combat.paused;
    if (btn) { btn.classList.toggle("icon-btn--active", G.combat.paused); btn.textContent = G.combat.paused ? "▶" : "⏸"; }
  },

  // ---------- RENDER ----------

  renderAll() {
    this.renderResources();
    this.renderHeroHp();
    this.renderStats();
    this.renderGear();
    this.renderHud();
  },

  renderResources() {
    this.el["res-lumens"].textContent = G.util.fmt(G.state.data.lumens);
    const area = G.data.currentArea();
    this.el["res-area"].textContent = area.name;
    const tc = document.querySelector(".hud-topcenter");
    if (tc) {
      const port = G.data.currentArea().theme === "port";
      tc.classList.toggle("theme-port", port);
      tc.classList.toggle("theme-forest", !port);
    }
    const wimg = document.querySelector(".world-img");
    const wsrc = area.imgFinale && document.body.classList.contains("okhra-manifest") ? area.imgFinale : area.img;
    if (wimg && wsrc && wimg.getAttribute("src") !== wsrc) wimg.src = wsrc;
    const d = G.state.data;
    const maxUnlocked = Math.min(d.maxAreaUnlocked || 0, G.data.areas.length - 1);
    const prev = document.getElementById("area-prev");
    const next = document.getElementById("area-next");
    if (prev) prev.classList.toggle("is-disabled", d.areaIndex <= 0);
    if (next) next.classList.toggle("is-disabled", d.areaIndex >= maxUnlocked);
    this.el["hero-card-level"].textContent = d.level;
  },

  renderHeroHp() {
    const max = G.state.maxHp();
    const pct = G.util.clamp((G.state.data.hp / max) * 100, 0, 100);
    this.el["hero-hp-fill"].style.width  = pct + "%";
    this.el["hero-hp-label"].textContent = `HP ${G.util.fmt(Math.max(0, G.state.data.hp))} / ${G.util.fmt(max)}`;
    const xp = G.state.data.xp;
    const xpNext = G.state.xpToNext();
    if (this.el["hero-xp-fill"]) this.el["hero-xp-fill"].style.width = G.util.clamp((xp / xpNext) * 100, 0, 100) + "%";
    if (this.el["hero-xp-label"]) this.el["hero-xp-label"].textContent = `XP ${G.util.fmt(xp)} / ${G.util.fmt(xpNext)}`;
  },

  fmtStat(v) {
    const r = Math.round(v * 1000) / 1000;
    if (Number.isInteger(r)) return G.util.fmt(r);
    if (Math.abs(r) < 1000) return String(parseFloat(r.toFixed(3)));
    return G.util.fmt(v);
  },

  renderStats() {
    const s = G.state.stats();
    const rows = [
      ["atk",         "ATK"],
      ["hp",          "Max HP"],
      ["crit",        "Crit"],
      ["critDmg",     "Crit Dmg"],
      ["atkSpeed",    "Atk Speed"],
      ["xpBonus",     "XP Bonus"],
      ["lumensBonus", "Lumens Bonus"],
    ];
    const html = rows.map(([key, k]) =>
      `<li class="stat-row" data-stat="${key}"><span>${k}</span><b>${this.statValueText(key, s)}</b></li>`).join("");

    // Assinaturas (P9): só aparecem se o jogador tiver a peça (valor > 0); sem stat-pop de
    // breakdown (mesmo tratamento das linhas de Lights) — usa classe stat-row--light.
    const sigKeys = ["cleave", "bulwark", "overcrit", "momentum"];
    const sigHtml = sigKeys
      .filter((key) => (s[key] || 0) > 0)
      .map((key) => `<li class="stat-row--light"><span>${this.STAT_NAMES[key]}</span><b>${(s[key]).toFixed(1)}%</b></li>`)
      .join("");

    const rf  = s.rarityFind  || { ember: 0, lumen: 0, corona: 0 };
    const cap = s.rarityCaps  || { ember: 0, lumen: 0, corona: 0 };
    const lightRow = (label, color, t) => {
      const chance = (Math.min(rf[t], cap[t]) * 100).toFixed(1);
      const capPct = (cap[t] * 100).toFixed(1);
      return `<li class="stat-row--light"><span style="color:${color}">${label}</span><b>${chance}% / ${capPct}%</b></li>`;
    };
    const lightsHtml =
      `<li class="stat-row--section"><span>Lights</span><span class="stat-row__hint">chance / cap</span></li>` +
      lightRow("Ember", "#5ee0d2", "ember") +
      lightRow("Lumen", "#4fa8ff", "lumen") +
      lightRow("Corona", "#9d7bff", "corona");

    if (this.el["gear-stats"]) this.el["gear-stats"].innerHTML = html + sigHtml + lightsHtml;
  },

  statValueText(key, s) {
    s = s || G.state.stats();
    switch (key) {
      case "atk": case "hp":  return G.util.fmt(s[key]);
      case "crit":            return s.crit.toFixed(2) + "%";
      case "critDmg":         return "+" + this.fmtStat(s.critDmg) + "%";
      case "atkSpeed":        return s.atkSpeed.toFixed(3) + " /s";
      case "xpBonus":         return "+" + this.fmtStat(s.xpBonus) + "%";
      case "lumensBonus":     return "+" + s.lumensBonus.toFixed(0) + "%";
      default:                return "";
    }
  },

  // matriz Fonte × Camada (Primary / Bonus / Multiplier) de uma stat
  statMatrixHtml(key) {
    const s = G.state.stats();
    const bd = (s._breakdown || {})[key] || [];
    const LABELS = { atk: "ATTACK", hp: "MAX HEALTH", crit: "CRITICAL RATE", critDmg: "CRITICAL DAMAGE",
      atkSpeed: "ATTACK SPEED", xpBonus: "XP BONUS", lumensBonus: "LUMENS BONUS" };
    const ORDER = ["Base", "Character Level", "Equipment", "Passives", "Awaken"];
    const sources = [];
    for (const src of ORDER) if (bd.some((e) => e.source === src)) sources.push(src);
    bd.forEach((e) => { if (!sources.includes(e.source)) sources.push(e.source); });

    const isPctStat = G.data.pctStats.indexOf(key) !== -1;

    const sumF  = (src) => bd.filter((e) => e.source === src && e.type === "flat").reduce((a, e) => a + e.amount, 0);
    const sumP  = (src) => bd.filter((e) => e.source === src && e.type === "pct").reduce((a, e) => a + e.amount, 0);
    const prodM = (src) => bd.filter((e) => e.source === src && e.type === "mult").reduce((a, e) => a * e.amount, 1);
    const cF = (v) => v ? (isPctStat ? `+${+v.toFixed(2)}%` : `+${G.util.fmt(Math.round(v))}`) : "";
    const cP = (v) => v ? `+${+v.toFixed(2)}%` : "";
    const cM = (v) => (v && v !== 1) ? `×${+v.toFixed(2)}` : "";

    const body = sources.map((src) =>
      `<tr><th>${src}</th><td>${cF(sumF(src))}</td><td>${cP(sumP(src))}</td><td>${cM(prodM(src))}</td></tr>`).join("");
    const tF = bd.filter((e) => e.type === "flat").reduce((a, e) => a + e.amount, 0);
    const tP = bd.filter((e) => e.type === "pct").reduce((a, e) => a + e.amount, 0);
    const tM = bd.filter((e) => e.type === "mult").reduce((a, e) => a * e.amount, 1);

    return `<div class="sbd">
      <button class="sbd__x" data-close title="Close">✕</button>
      <div class="sbd__title">${LABELS[key] || key}</div>
      <div class="sbd__sub">Total ${(LABELS[key] || key).toLowerCase()} of your hero</div>
      <div class="sbd__grand"><span>Total</span><b>${this.statValueText(key, s)}</b></div>
      <table class="sbd__t">
        <thead><tr><th></th><th>Primary</th><th>Bonus</th><th>Multiplier</th></tr></thead>
        <tbody>${body}</tbody>
        <tfoot><tr><th>Total</th><td>${cF(tF)}</td><td>${cP(tP)}</td><td>${cM(tM) || "×1"}</td></tr></tfoot>
      </table>
    </div>`;
  },

  openStatPop(key) {
    const pop = document.getElementById("stat-pop");
    if (!pop) return;
    pop.innerHTML = this.statMatrixHtml(key);
    pop.hidden = false;
  },
  closeStatPop() { const pop = document.getElementById("stat-pop"); if (pop) pop.hidden = true; },

  renderHud() {
    const s   = G.state.stats();
    const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    const dps = Math.round(s.atk / G.state.attackInterval());

    const r = G.rates.getRates();
    set("rate-gold",  G.util.fmt(Math.round(r.lumens)));
    set("rate-xp",    G.util.fmt(Math.round(r.xp)));
    set("rate-kills", (r.kills || 0).toFixed(1));
    set("rate-dmg",   G.util.fmt(dps));
  },

  toggleLog() {
    const p = document.getElementById("log-panel");
    const b = document.getElementById("log-toggle");
    if (!p) return;
    const collapsed = p.classList.toggle("collapsed");
    if (b) { b.textContent = collapsed ? "+" : "−"; b.title = collapsed ? "Expand" : "Minimize"; }
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
      const cost    = G.gear.promoteCost(item);
      const have    = G.economy.getGear(cost.kind);
      const costLabel = cost.kind === "uncommon" ? "Uncommon" : "Common";
      const sel = this._forgeSel === slot.id ? " is-selected" : "";
      const action = !maxed
        ? `<span class="forge-prom__note">Reach max level first</span>`
        : `<span class="forge-prom__cost ${have >= cost.amount ? "ok" : "short"}">${fmt(have)} / ${cost.amount} ${costLabel}</span>
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

    const cost = G.gear.promoteCost(item);
    const have = G.economy.getGear(cost.kind);
    const can  = G.gear.canPromote(item);
    const costLabel = cost.kind === "uncommon" ? "Uncommon" : "Common";
    const icon = (G.data.slots.find((s) => s.id === item.slot) || {}).icon || "❔";

    anvil.innerHTML = `<div class="anvil-icon" style="--rar:${nextRar.color}">
        <span class="ico-ph">${icon}</span>
        <img src="assets/gear/${item.slot}.png" alt="" onerror="this.remove()">
      </div>
      <div class="anvil-card">
      <div class="anvil-name">${item.slotLabel}</div>
      <div class="anvil-rar"><b style="color:${item.color}">${item.rarityName}</b> <em>→</em> <b style="color:${nextRar.color}">${nextRar.name}</b></div>
      <div class="anvil-affixes">${rows}</div>
      <div class="anvil-cost ${have >= cost.amount ? "ok" : "short"}">${G.util.fmt(have)} / ${cost.amount} ${costLabel}</div>
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
      let note = "";
      if (a.perStep != null) {
        // Rarity Find (P8.1): mostra o degrau atual e o próximo (valor + nível)
        const step = a.step || 50;
        const atCap = a.cap != null && v >= a.cap;
        const nextLv = (Math.floor(lvl / step) + 1) * step;
        note = atCap
          ? `<span class="tip-perlv">max ${this.fmtStat(a.cap)}${sign}</span>`
          : `<span class="tip-perlv">next step: +${this.fmtStat(a.perStep)}${sign} at Lv ${nextLv}</span>`;
      } else if (a.perLevel) {
        note = `<span class="tip-perlv">+${this.fmtStat(a.perLevel)}${sign} per level</span>`;
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

  // Area navigation
  goToArea(delta) {
    const d    = G.state.data;
    const maxU = Math.min(d.maxAreaUnlocked || 0, G.data.areas.length - 1);
    const ni   = G.util.clamp(d.areaIndex + delta, 0, maxU);
    if (ni === d.areaIndex) return;
    d.areaIndex = ni;
    G.combat.clearWave();
    this.onAreaChange();
  },

  travelTo(i) {
    const d    = G.state.data;
    const maxU = Math.min(d.maxAreaUnlocked || 0, G.data.areas.length - 1);
    const close = () => { const m = document.getElementById("modal-worldmap"); if (m) m.hidden = true; };
    if (i < 0 || i > maxU || i === d.areaIndex) { close(); return; }
    d.areaIndex = i;
    G.combat.clearWave();
    this.onAreaChange();
    close();
  },

  onAreaChange() { this._lastArt = null; this.renderResources(); },

  // Combat
  _lastArt: null,

  // contador de invocação do Harbinger — topo-direito, logo abaixo do medidor de Lumens.
  // Roda no clock de 100ms (via renderEnemy) porque a contagem muda a cada kill.
  renderHarbingerCounter() {
    const el = this.el["harbinger-counter"];
    if (!el) return;
    const area = G.data.currentArea();
    const d = G.state.data;
    const lastIdx = G.data.areas.length - 1;

    const liveBoss = G.combat.enemies.find(e => e.isBoss && !e.dead);
    if (liveBoss) {
      el.classList.add("is-here");
      el.innerHTML = liveBoss.isMapBoss ? `◆ ${(liveBoss.baseName || liveBoss.name || "OKHRA").toUpperCase()} IS HERE` : "⟡ THE HARBINGER IS HERE";
      el.style.display = "";
      return;
    }
    el.classList.remove("is-here");

    const stirs = (name) => {
      const n = Math.max(0, G.enemyFactory._bossThreshold() - G.combat._bossKills);
      el.innerHTML = `⟡ ${name} stirs in <b>${n}</b> kills`;
      el.style.display = "";
    };

    if (area.boss && d.areaIndex === lastIdx) {
      const h6Felled = Array.isArray(d.harbingersFelled) && d.harbingersFelled.indexOf(lastIdx) !== -1;
      const awake = !!(G.awaken && G.awaken.isDone("first_light"));
      if (!h6Felled) { stirs(area.boss.name); return; }
      if (awake && area.mapBoss) { stirs(area.mapBoss.name); return; }
      el.innerHTML = "The tide stirs... awaken the First Light.";
      el.style.display = "";
      return;
    }

    if (area.boss) { stirs(area.boss.name); return; }
    el.style.display = "none";
  },

  renderEnemy() {
    this.renderHarbingerCounter();
    const container = this.el["enemies-container"];
    if (!container) return;

    const alive = G.combat.enemies.filter(e => !e.dead);

    if (!alive.length) {
      if (container.innerHTML) container.innerHTML = "";
      container.className = "enemies-container";
      this._enemySig = "";
      this._enemyFills = []; this._enemyLabels = []; this._enemyHpShown = []; this._shellBadges = [];
      return;
    }

    // renderiza a onda INTEIRA (mortos inclusos, greyed) → posições não mudam quando 1 morre,
    // e os índices enemy-art-{i} batem com os índices do combat (projéteis/floaters certos).
    // ORDEM DE EXIBIÇÃO (visual apenas): boss(es) por último, mobs comuns antes (ordem relativa
    // preservada). O array G.combat.enemies e o alvo de ataque (enemies[0]/find) NÃO mudam —
    // cada card carrega data-idx/ids do índice ORIGINAL no array, então floaters/projéteis
    // (que usam enemies.indexOf(target) ou o idx passado por combat.js) continuam corretos.
    const list = G.combat.enemies;
    const sig  = list.map(e => e.name + (e.rarity ? e.rarity.tag : "") + (e.isBoss ? "B" : "") + (e.lightshell > 0 ? "S" : "")).join("|");

    if (this._enemySig !== sig) {
      this._enemySig = sig;
      container.className = `enemies-container pack-${Math.min(list.length, 3)}`;
      // cópia com índice original preservada; sort estável (Array#sort é estável no V8/Chrome
      // moderno) — mobs comuns mantêm a ordem relativa entre si, boss(es) vão pro fim.
      const order = list.map((e, i) => ({ e, i })).sort((a, b) => (a.e.isBoss ? 1 : 0) - (b.e.isBoss ? 1 : 0));
      container.innerHTML = order.map(({ e, i }) => {
        const shelled = e.lightshell > 0;
        let header;
        if (e.isBoss) {
          const sig = (e.modifiers || [])
            .map((k) => G.data.modifiers[k] && G.data.modifiers[k].label)
            .filter(Boolean).join(" · ").toUpperCase();
          header = `<span class="harbinger-tag">${e.isMapBoss ? `◆ ${(e.baseName || e.name || "OKHRA").split(",")[0].toUpperCase()} ◆` : "⟡ HARBINGER ⟡"}</span>
          <span class="boss-nameplate${e.isMapBoss ? " nihelim" : ""}">${(e.baseName || e.name).toUpperCase()}</span>
          ${sig ? `<span class="boss-signature">${sig}</span>` : ""}`;
        } else {
          const nameColor = e.rarity ? ` style="color:${e.rarity.color}"` : "";
          header = `<span class="enemy-name"${nameColor}>${e.rarity ? `${e.name} · ${e.rarity.tag}` : e.name}</span>`;
        }
        return `<div class="enemy-card${e.isBoss ? " boss" : ""}" data-idx="${i}">
          ${header}
          <span class="shell-badge" id="shell-badge-${i}"${shelled ? "" : ` style="display:none"`}></span>
          <div class="enemy-figure${e.isBoss ? " boss" : ""}${shelled ? " shelled" : ""}" id="enemy-art-${i}">
            <span class="art-ph">${e.sprite}</span>
            ${e.img ? `<img class="art-img" src="${e.img}" alt="" onerror="this.remove()" />` : ""}
            <div class="floaters" id="floaters-enemy-${i}"></div>
          </div>
          <div class="enemy-info">
            <span class="card-sub">Lv. <b>${e.level}</b> · ATK <b>${G.util.fmt(e.dmg)}</b></span>
            <div class="bar enemy-bar${e.isBoss ? " boss-bar" : ""}">
              <div class="bar-fill enemy-fill" id="enemy-hp-fill-${i}"></div>
              <span class="bar-label" id="enemy-hp-label-${i}"></span>
            </div>
          </div>
        </div>`;
      }).join("");
      // cacheia os elementos por índice ORIGINAL do array (não por posição no DOM, que agora
      // pode diferir) — evita 2×N getElementById por tick de 100ms.
      this._enemyFills   = list.map((e, i) => document.getElementById(`enemy-hp-fill-${i}`));
      this._enemyLabels  = list.map((e, i) => document.getElementById(`enemy-hp-label-${i}`));
      this._shellBadges  = list.map((e, i) => document.getElementById(`shell-badge-${i}`));
      this._enemyCards   = list.map((e, i) => container.querySelector(`.enemy-card[data-idx="${i}"]`));
      this._enemyHpShown = [];
    }

    // por tick: classes morto/ativo (baratas) + HP só quando muda (pula a escrita se e.hp igual)
    const firstAlive = list.findIndex(e => !e.dead);
    list.forEach((e, i) => {
      const card = this._enemyCards && this._enemyCards[i];
      if (card) {
        card.classList.toggle("enemy-dead", !!e.dead);
        card.classList.toggle("enemy-active", i === firstAlive);
      }
      const badge = this._shellBadges && this._shellBadges[i];
      if (badge && e.lightshell > 0) badge.textContent = `🛡 Lightshell ×${e.lightshell}`;
      if (this._enemyHpShown[i] === e.hp) return;
      this._enemyHpShown[i] = e.hp;
      const fill  = this._enemyFills[i];
      const label = this._enemyLabels[i];
      if (fill)  fill.style.width = G.util.clamp((e.hp / e.maxHp) * 100, 0, 100) + "%";
      if (label) label.textContent = `HP ${G.util.fmt(Math.max(0, e.hp))} / ${G.util.fmt(e.maxHp)}`;
    });
  },

  floater(amount, type, idx) {
    const target = type === "enemy"
      ? document.getElementById("floaters-hero")
      : document.getElementById("floaters-enemy-" + (idx || 0));
    if (!target) return;
    const f = document.createElement("span");
    f.className = "floater " + type;
    f.textContent = type === "shell" ? "ABSORBED" : (type === "enemy" ? "-" : "") + G.util.fmt(amount) + (type === "crit" ? "!" : "");
    f.style.left = G.util.randInt(20, 80) + "%";
    target.appendChild(f);
    setTimeout(() => f.remove(), 800);
  },

  projectile(type, idx) {
    const enemyEl = "enemy-art-" + (idx || 0);
    const fromEl = document.getElementById(type === "mob" ? enemyEl : "hero-art");
    const toEl   = document.getElementById(type === "mob" ? "hero-art" : enemyEl);
    if (!fromEl || !toEl) return;
    const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    const x1 = a.left + a.width / 2, y1 = a.top + a.height * 0.42;
    const x2 = b.left + b.width / 2, y2 = b.top + b.height * 0.42;
    const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 32;
    const img = document.createElement("img");
    img.className = "projectile" + (type === "mob" ? " projectile--mob" : "");
    img.src       = type === "mob" ? "assets/fx/bolt_mob.png" : "assets/fx/bolt_seeker.png";
    const dur = type === "mob" ? G.combat.mobProjectileTravel : G.combat.projectileTravel;  // fonte única (combat.js)
    img.style.cssText = `left:${x1}px;top:${y1}px;transform:translate(-50%,-50%) rotate(${ang}deg)`;
    img.style.transitionDuration = dur + "s";
    document.body.appendChild(img);
    void img.offsetWidth;
    img.style.left = x2 + "px"; img.style.top = y2 + "px"; img.style.opacity = "0.7";
    setTimeout(() => img.remove(), dur * 1000 + 80);
  },

  // ---------- PASSIVES (World-Tree I — árvore única binária + coroa) ----------
  // Design final (bake): a pintura cobre a viewport inteira em modo COVER (sem letterbox).
  // Nós são posicionados por % do RETÂNGULO DA IMAGEM (P.POSITIONS), então assentam no
  // lugar certo em qualquer proporção de janela. Chrome zero: só pintura + nós + galhos +
  // fechar. Um nó só é RENDERIZADO quando tem sprite (ICONS[i] != null) — nós sem sprite
  // ainda são totalmente invisíveis (sem placeholder, sem galho apontando pra eles). A
  // coroa segue a mesma regra (CROWN_ICON != null). Toda informação vive no tooltip.
  renderPassives() {
    const P = G.passives;
    const unlocked = P.unlocked();
    if (this.el["pv-lock"]) this.el["pv-lock"].hidden = unlocked;
    const body = this.el["pv-body"];
    if (!body) return;
    body.style.visibility = unlocked ? "" : "hidden";
    body.className = "pv-body pv-tree1";
    body.innerHTML = unlocked ? this._pvTreeHtml() : "";
    if (unlocked) {
      this._pvFitStage(body);
      this._pvBindResize();
    }
  },

  // stage full-bleed COVER: escala o retângulo 1672×941 pelo MAIOR dos dois eixos
  // (viewport width/height), centraliza, excesso cortado por overflow hidden no
  // .passives-screen. Tamanho final aplicado inline em px porque um div vazio não
  // tem conteúdo intrínseco pro CSS puro resolver "escala pelo máximo" sozinho.
  // Roda a cada renderPassives() e a cada resize da janela.
  _pvFitStage(body) {
    const stage = body.querySelector(".pv-stage");
    if (!stage) return;
    const ratio = 1672 / 941;
    const bodyRect = body.getBoundingClientRect();
    const vw = bodyRect.width, vh = bodyRect.height;
    let w = vw, h = w / ratio;
    if (h < vh) { h = vh; w = h * ratio; }   // cover: garante cobertura total, corta o excesso
    stage.style.width = w + "px";
    stage.style.height = h + "px";
  },

  // re-fita o stage no resize da janela, só enquanto a tela de passivas está aberta
  // (evita custo em telas fechadas; rAF evita disparo excessivo durante o drag do resize)
  _pvBindResize() {
    if (this._pvResizeBound) return;
    this._pvResizeBound = true;
    let raf = 0;
    window.addEventListener("resize", () => {
      const screen = document.querySelector(".passives-screen");
      if (!screen || screen.hidden) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => this._pvFitStage(this.el["pv-body"]));
    });
  },

  _pvTreeHtml() {
    const P = G.passives;
    const branches = this._pvBranches();
    let nodes = "";
    for (let i = 0; i < P.nodes.length; i++) if (P.iconOf(i)) nodes += this._pvNode(i);
    if (P.CROWN_ICON) nodes += this._pvCrown();
    const title = P.CROWN_ICON ? this._pvTitle() : "";
    return `<div class="pv-stage">
      <img class="pv-art" src="assets/passives/passives_tree.webp" alt="" draggable="false" />
      <svg class="pv-branches" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${branches}</svg>
      <div class="pv-nodes">${nodes}</div>
      ${title}
      ${this._pvBlessings()}
    </div>`;
  },

  // painel "Tree Blessings" — soma agregada de todos os bônus concedidos pelos níveis
  // já comprados (agrupado por efeito), no mesmo formato de texto do tooltip por-nó.
  // Re-renderiza no mesmo fluxo que os nós (renderPassives -> _pvTreeHtml), então
  // atualiza sozinho a cada compra (ui.js linha ~139: buy() -> renderPassives()).
  _pvBlessings() {
    const rows = G.passives.blessingsSummary();
    const body = rows.length
      ? `<ul class="pv-blessings-list">${rows.map((r) =>
          `<li class="pv-blessings-row"><span>${r.label}</span><span class="pv-blessings-val">${r.text}</span></li>`
        ).join("")}</ul>`
      : `<div class="pv-blessings-empty">The tree is silent. Buy your first passive.</div>`;
    return `<div class="pv-blessings">
      <div class="pv-blessings-head">Tree Blessings</div>
      ${body}
    </div>`;
  },

  // galhos de "seiva de luz" pai→filho, desenhados SÓ entre nós visíveis (ambos com
  // sprite) — um nó sem sprite não recebe galho apontando pra ele, mesmo se comprado.
  //
  // GEOMETRIA: cúbica de Bézier com a barriga puxada em direção ao eixo do tronco
  // (x=50%), não o ponto médio vertical puro do desenho anterior — os control points
  // são deslocados ~20% do delta-x em direção a x=50, o que faz a curva "nascer" do
  // tronco central como um raminho, em vez de arquear em qualquer direção genérica.
  //
  // TAPER: SVG <path stroke> não afina a espessura ao longo do traçado. Em vez de
  // recorrer a um polígono fechado (caro de calcular corretamente para uma bézier
  // arbitrária, e sensível a distorção porque o viewBox usa preserveAspectRatio="none"),
  // dividimos a curva em 2 sub-troços via De Casteljau (t=0..0.5 e t=0.5..1) e desenhamos
  // cada um com stroke-width decrescente (grosso no pai, fino no filho). É a aproximação
  // mais simples que ainda lê como afinamento contínuo a essa escala de tela.
  _pvBranches() {
    const P = G.passives, pos = P.POSITIONS, sp = P.SPLIT_POS;
    const visible = (i) => !!P.iconOf(i);
    const bought = (i) => (i === -1 ? true : P.level(i) >= 1);

    // estado da ligação pai(p)->filho(childIdx): locked / buyable / bought
    const state = (p, childIdx) => {
      if (!bought(p)) return "locked";
      return P.level(childIdx) >= 1 ? "bought" : "buyable";
    };

    // pontos de controle de uma bézier cúbica com barriga puxada pro tronco (x=50)
    const bulgeCtrl = (ax, ay, bx, by) => {
      const midY = (ay + by) / 2;
      // desloca os control points ~20% do caminho em direção ao eixo x=50 (tronco)
      const c1x = ax + (50 - ax) * 0.20;
      const c2x = bx + (50 - bx) * 0.20;
      return { c1x, c1y: midY, c2x, c2y: midY };
    };

    // De Casteljau: divide a cúbica M a C c1 c2 b em t=0.5, devolve os dois sub-troços
    // como arrays de pontos [ax,ay, c1x,c1y, c2x,c2y, bx,by] cada.
    const splitCubic = (ax, ay, c1x, c1y, c2x, c2y, bx, by) => {
      const lerp = (p, q, t) => p + (q - p) * t;
      const t = 0.5;
      const p01x = lerp(ax, c1x, t), p01y = lerp(ay, c1y, t);
      const p12x = lerp(c1x, c2x, t), p12y = lerp(c1y, c2y, t);
      const p23x = lerp(c2x, bx, t), p23y = lerp(c2y, by, t);
      const p012x = lerp(p01x, p12x, t), p012y = lerp(p01y, p12y, t);
      const p123x = lerp(p12x, p23x, t), p123y = lerp(p12y, p23y, t);
      const p0123x = lerp(p012x, p123x, t), p0123y = lerp(p012y, p123y, t);
      return {
        a: [ax, ay, p01x, p01y, p012x, p012y, p0123x, p0123y],
        b: [p0123x, p0123y, p123x, p123y, p23x, p23y, bx, by],
      };
    };

    const cubicPath = (pts) =>
      `M${pts[0].toFixed(2)},${pts[1].toFixed(2)} C${pts[2].toFixed(2)},${pts[3].toFixed(2)} ${pts[4].toFixed(2)},${pts[5].toFixed(2)} ${pts[6].toFixed(2)},${pts[7].toFixed(2)}`;

    // desenha uma ligação completa (halo difuso + núcleo afinado em 2 troços)
    const seg = (ax, ay, bx, by, st) => {
      const { c1x, c1y, c2x, c2y } = bulgeCtrl(ax, ay, bx, by);
      const full = [ax, ay, c1x, c1y, c2x, c2y, bx, by];
      const dFull = cubicPath(full);
      const { a, b } = splitCubic(ax, ay, c1x, c1y, c2x, c2y, bx, by);
      const dA = cubicPath(a); // metade junto ao pai — traço mais grosso
      const dB = cubicPath(b); // metade junto ao filho — traço mais fino (taper)
      const cls = `pv-branch-${st}`;
      return `<g class="pv-branch ${cls}">`
        + `<path class="pv-branch-halo" d="${dFull}" vector-effect="non-scaling-stroke"/>`
        + `<path class="pv-branch-core pv-branch-core--wide" d="${dA}" vector-effect="non-scaling-stroke"/>`
        + `<path class="pv-branch-core pv-branch-core--thin" d="${dB}" vector-effect="non-scaling-stroke"/>`
        + `</g>`;
    };

    let out = "";
    // tronco: raiz(0) → split; depois split → nós 1 e 2 — só desenhado se a raiz E ao
    // menos um dos dois filhos forem visíveis (o split é um waypoint decorativo, não um
    // nó real; sem nenhum filho visível não há segmento para puxar dele)
    if (visible(0) && (visible(1) || visible(2))) {
      const trunkState = bought(0) ? "bought" : "locked";
      out += seg(pos[0].x, pos[0].y, sp.x, sp.y, trunkState);
      if (visible(1)) out += seg(sp.x, sp.y, pos[1].x, pos[1].y, state(0, 1));
      if (visible(2)) out += seg(sp.x, sp.y, pos[2].x, pos[2].y, state(0, 2));
    }
    // demais nós (>=3): curva pai→filho, só se AMBOS (pai e filho) forem visíveis
    for (let i = 3; i < P.nodes.length; i++) {
      const p = P.parentOf(i);
      if (!visible(i) || !visible(p)) continue;
      out += seg(pos[p].x, pos[p].y, pos[i].x, pos[i].y, state(p, i));
    }
    return out;
  },

  _pvNode(i) {
    const P = G.passives;
    const node = P.nodes[i], pos = P.POSITIONS[i];
    const level = P.level(i), maxed = P.isMax(i), nmax = P.nodeMax();
    const locked = !P.parentBought(i) && level === 0;
    const canBuy = P.canBuy(i);
    const wantBuy = !maxed && !locked && P.parentBought(i);          // comprável de topologia (pode faltar pontos)
    const affordable = wantBuy && (G.state.data.convergencePoints || 0) >= P.nextCost(i);
    const cls = ["pv-node", node.depth === 4 ? "tip-below" : "", pos.x < 30 ? "tip-right" : pos.x > 70 ? "tip-left" : "",
      maxed ? "is-maxed" : "", wantBuy ? "is-buyable" : "", affordable ? "can-afford" : "",
      level > 0 && !maxed ? "is-owned" : "", locked ? "is-locked" : ""]
      .filter(Boolean).join(" ");
    const ic = P.iconOf(i);
    const shape = ic
      ? `<img class="pv-sprite" src="${ic}" alt="" draggable="false" />`
      : `<span class="pv-ring-placeholder"></span>`;
    const pillText = maxed ? `MAX ${nmax}/${nmax}` : `${level}/${nmax}`;
    return `<button class="${cls}" data-i="${i}"
        style="left:${pos.x}%;top:${pos.y}%">
      <span class="pv-shape${ic ? " has-sprite" : ""}">
        ${shape}
      </span>
      <span class="pv-level-pill">${pillText}</span>
      ${this._pvCard(i)}
    </button>`;
  },

  _pvCard(i) {
    const P = G.passives;
    const name = P.nodes[i].name, level = P.level(i), nmax = P.nodeMax();
    const maxed = P.isMax(i), locked = !P.parentBought(i) && level === 0;
    const ic = P.iconOf(i);
    const m = P.magnitude(i);
    let effRow = "";
    if (m) {
      if (level > 0) effRow = `<div class="pv-card-eff">Level ${level}: <b>${m.current}</b></div>`;
      if (!maxed) effRow += `<div class="pv-card-next">Next: <b>${m.next}</b></div>`;
    }
    const parentName = P.parentOf(i) >= 0 ? P.nodes[P.parentOf(i)].name : "";
    const foot = maxed ? `<div class="pv-card-foot is-max">Maxed</div>`
      : locked ? `<div class="pv-card-foot is-locked">Locked: requires ${parentName}</div>`
      : `<div class="pv-card-foot is-cost">Cost ◈ ${G.util.fmt(P.nextCost(i))}</div>`;
    return `<div class="pv-card${ic ? "" : " no-art"}">
      <div class="pv-card-head">
        ${ic ? `<div class="pv-card-thumb"><img src="${ic}" alt="" loading="lazy" /></div>` : ""}
        <div class="pv-card-headtext">
          <div class="pv-card-name">${name}</div>
          <div class="pv-card-sub">Level ${level}/${nmax}</div>
        </div>
      </div>
      <div class="pv-card-body">
        ${effRow}
        <div class="pv-card-lore">${P.loreOf(i)}</div>
        ${foot}
      </div>
    </div>`;
  },

  // título "Passives" flutuando sobre o céu da arte, ancorado acima da coroa —
  // só aparece quando a coroa existe (mesma regra de CROWN_ICON dos demais elementos).
  _pvTitle() {
    return `<div class="pv-title-wrap">
      <div class="pv-title-eyebrow">&#10022; World Tree &#10022;</div>
      <div class="pv-title-row">
        <span class="pv-title-rule"></span>
        <div class="pv-title">Passives</div>
        <span class="pv-title-rule"></span>
      </div>
      <div class="pv-title-tier">Tier I</div>
    </div>`;
  },

  _pvCrown() {
    const P = G.passives;
    const pos = P.CROWN_POS, on = P.crownActive();
    const lit = P.leaves().filter((i) => P.level(i) >= 1).length;
    const cls = ["pv-node", "pv-crown", "tip-below", on ? "crown-on" : "is-locked"].join(" ");
    const ic = P.CROWN_ICON;
    const shape = ic
      ? `<img class="pv-sprite" src="${ic}" alt="" draggable="false" />`
      : `<span class="pv-ring-placeholder"></span>`;
    const foot = on ? `<div class="pv-card-foot is-max">The Ring Closes · complete</div>`
      : `<div class="pv-card-foot is-locked">Locked: requires all 8 leaves (${lit}/8)</div>`;
    const card = `<div class="pv-card pv-card--crown${ic ? "" : " no-art"}">
      <div class="pv-card-head">
        ${ic ? `<div class="pv-card-thumb"><img src="${ic}" alt="" loading="lazy" /></div>` : ""}
        <div class="pv-card-headtext">
          <div class="pv-card-name">${P.CROWN.name}</div>
          <div class="pv-card-sub">${on ? "Granted" : "Sealed"}</div>
        </div>
      </div>
      <div class="pv-card-body">
        <div class="pv-card-eff"><b>+${P.unit("ringCloses")}% ATK · HP · Lumens · XP</b></div>
        <div class="pv-card-lore">${P.CROWN_LORE}</div>
        ${foot}
      </div>
    </div>`;
    return `<div class="${cls}" data-crown style="left:${pos.x}%;top:${pos.y}%">
      <span class="pv-shape${ic ? " has-sprite" : ""}">${shape}</span>
      ${card}
    </div>`;
  },

  // floater "+X%" subindo do nó comprado (padrão dos floaters de combate: span animado)
  _pvFloater(btn, i) {
    const P = G.passives, m = P.magnitude(i);
    const txt = m ? m.perLevel : "+1";
    const rect = btn.getBoundingClientRect();
    const f = document.createElement("span");
    f.className = "pv-floater";
    f.textContent = txt;
    f.style.left = (rect.left + rect.width / 2) + "px";
    f.style.top = (rect.top + rect.height * 0.32) + "px";
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 900);
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
      const base = r.key.indexOf("material:") === 0 ? "Awaken Mat" : (reqName[r.key] || r.key);
      return { label: `${base} ${G.util.fmt(r.have)}/${G.util.fmt(r.need)}`, met: r.met };
    });

    const stateClass = unlocked ? " is-done" : can ? " is-ready" : "";
    const action = unlocked
      ? `<div class="awk-preview__done">✦ Awakened, the light endures</div>`
      : `<button class="btn btn-ornate awk-preview__btn" data-awaken="${a.id}"${can ? "" : " disabled"}>${can ? "◈ Awaken" : "Requirements not met"}</button>`;

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

  // ---------- CONVERGENCE ----------
  renderConvergence() {
    const d = G.state.data;
    if (this.el["conv-points"]) this.el["conv-points"].textContent = G.util.fmt(d.convergencePoints || 0);
    if (this.el["conv-count"]) this.el["conv-count"].textContent = d.convergences || 0;
    if (this.el["conv-highest"]) this.el["conv-highest"].textContent = G.util.fmt(d.highestLevel || d.level);
    if (this.el["conv-pending"]) this.el["conv-pending"].textContent = G.util.fmt(G.convergence.pending());
    if (this.el["conv-current"]) this.el["conv-current"].textContent = `Lv ${G.util.fmt(d.level)} · ${G.data.currentArea().name}`;
    if (this.el["conv-return"]) this.el["conv-return"].textContent = `Lv 1 · ${G.data.areas[0].name}`;
    if (this.el["conv-next"]) this.el["conv-next"].textContent = G.util.fmt(G.convergence.currentGate());
    const btn = this.el["btn-converge"];
    if (btn) {
      const ok = G.convergence.canConverge();
      btn.disabled = !ok;
      btn.textContent = ok ? "Converge" : `Reach Lv ${G.util.fmt(G.convergence.currentGate())}`;
    }
  },

  // ---------- WORLD MAP ----------
  // posições dos 18 nós no mapa (% x,y) — fonte única p/ nós E trilha.
  // Ato A (0-8, Floresta): alinhadas à geografia pintada de map1.png.
  // Ato B (9-17, Porto Afundado): alinhado à geografia do map2.png.
  mapNodePos: [
    [10, 78], [22, 47], [38, 22], [55, 12], [52, 40],
    [72, 38], [36, 65], [60, 72], [88, 62],
    [17, 15], [35, 28], [61, 19], [20, 47], [33, 60],
    [71, 46], [41, 84], [56, 75], [85, 82],
  ],

  renderWorldMap() {
    const wrap = this.el["wmap-nodes"];
    if (!wrap) return;
    const d = G.state.data;
    const pos = this.mapNodePos;
    const total = G.data.areas.length;
    const maxU = Math.min(d.maxAreaUnlocked || 0, total - 1);
    const act = this._wmapAct === "B" ? "B" : "A";
    const first = act === "B" ? 9 : 0;
    const last = act === "B" ? total - 1 : 8;

    // fundo + rótulo do ato (Ato B = placeholder do Porto Afundado sobre map1.png)
    const wmap = document.getElementById("wmap");
    if (wmap) wmap.classList.toggle("is-actB", act === "B");
    if (this.el["wmap-bg"]) {
      const bgSrc = act === "B" ? "assets/ui/map2.png" : "assets/ui/map1.png";
      if (this.el["wmap-bg"].getAttribute("src") !== bgSrc) this.el["wmap-bg"].src = bgSrc;
    }
    const label = this.el["wmap-act-label"];
    if (label) {
      label.textContent = "The Sunken Port";
      label.hidden = act !== "B";
    }

    // botões de navegação entre atos
    const downBtn = this.el["wmap-act-down"];
    if (downBtn) {
      if (act === "A") {
        downBtn.hidden = false;
        const portStart = G.data.areas.findIndex(a => a.theme === "port");
        const portUnlocked = portStart >= 0 && maxU >= portStart;
        downBtn.classList.toggle("is-locked", !portUnlocked);
        downBtn.textContent = portUnlocked ? "▼ The Sunken Port" : "🔒 The Sunken Port";
        downBtn.title = portUnlocked ? "" : "Defeat the Gilded Hollow";
      } else {
        downBtn.hidden = true;
      }
    }
    const upBtn = this.el["wmap-act-up"];
    if (upBtn) upBtn.hidden = act !== "B";

    // trilha: só o rastro dourado de progresso, restrito aos nós do ato visível.
    // (a trilha base é PINTADA na arte — não desenhamos mais os paths azul-cinza.)
    const trail = this.el["wmap-trail"];
    if (trail) {
      const crPath = (pts, tension = 0.5) => {
        if (pts.length < 2) return "";
        const p = [pts[0], ...pts, pts[pts.length - 1]];
        let s = `M${p[1][0]},${p[1][1]}`;
        for (let i = 1; i < p.length - 2; i++) {
          const c1x = +(p[i][0] + (p[i+1][0] - p[i-1][0]) * tension / 3).toFixed(2);
          const c1y = +(p[i][1] + (p[i+1][1] - p[i-1][1]) * tension / 3).toFixed(2);
          const c2x = +(p[i+1][0] - (p[i+2][0] - p[i][0]) * tension / 3).toFixed(2);
          const c2y = +(p[i+1][1] - (p[i+2][1] - p[i][1]) * tension / 3).toFixed(2);
          s += ` C${c1x},${c1y} ${c2x},${c2y} ${p[i+1][0]},${p[i+1][1]}`;
        }
        return s;
      };
      const doneEnd = Math.min(maxU, last);
      const donePts = doneEnd >= first ? pos.slice(first, doneEnd + 1) : [];
      const donePath = crPath(donePts);
      const vne = 'fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"';
      trail.innerHTML = donePath
        ? `<path d="${donePath}" ${vne} stroke="rgba(0,0,0,0.45)" stroke-width="9"/>` +
          `<path d="${donePath}" ${vne} stroke="rgba(210,155,20,0.7)" stroke-width="5.5"/>` +
          `<path d="${donePath}" ${vne} stroke="rgba(255,242,170,0.52)" stroke-width="1.8"/>`
        : "";
    }

    wrap.innerHTML = G.data.areas.map((a, i) => {
      if (i < first || i > last) return "";
      const locked = i > maxU;
      const cur = i === d.areaIndex;
      const [x, y] = pos[i] || [50, 50];
      const cls = `wmap-node${locked ? " is-locked" : ""}${cur ? " is-current" : ""}`;
      const ph = `<span class="wmap-node__ph">${locked ? "🔒" : i + 1}</span>`;
      return `<button class="${cls}" style="left:${x}%;top:${y}%" data-area="${i}" title="${a.name}">
        ${ph}
        <img src="assets/ui/node_${i + 1}.png" alt="" onerror="this.remove()" />
        <span class="wmap-node__name">${a.name}</span>
      </button>`;
    }).join("");
    wrap.querySelectorAll("[data-area]").forEach((b) => {
      b.addEventListener("click", () => this.openAreaInfo(+b.dataset.area));
    });
  },

  openAreaInfo(i) {
    const a = G.data.areas[i];
    if (!a || !this.el["wmap-info"]) return;
    this._infoArea = i;
    const d = G.state.data;
    const total = G.data.areas.length;
    const maxU = Math.min(d.maxAreaUnlocked || 0, total - 1);
    const locked = i > maxU;
    const isCurrent = i === d.areaIndex;
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // tint por bioma: teal para o Porto, dourado para o resto
    this.el["wmap-info"].style.setProperty("--area-tint", a.theme === "port" ? "#5ee0d2" : "#e8b54a");

    // emblema do medalhão da área
    const emb = this.el["wmap-info-emblem"];
    if (emb) { emb.style.visibility = ""; emb.src = `assets/ui/node_${i + 1}.png`; }

    const art = this.el["wmap-info-art"];
    if (art)
      art.style.backgroundImage = a.img
        ? `linear-gradient(180deg, rgba(7,10,22,0.05), rgba(7,10,22,0.55)), url('${a.img}')`
        : "none";

    // Ato A não tem rótulo canônico "Act I" na UI; o botão de subida chama "The Dreaming Wood".
    // Ato B é canonicamente "The Sunken Port" (rótulo/nav do mapa).
    const actName = i <= 8 ? "Act I · The Dreaming Wood" : "Act II · The Sunken Port";
    this.el["wmap-info-name"].textContent = a.name;
    this.el["wmap-info-sub"].textContent = `${actName} · Area ${i + 1} of ${total}`;

    // chip de estado
    const felled = Array.isArray(d.harbingersFelled) && d.harbingersFelled.indexOf(i) !== -1;
    const chip = this.el["wmap-info-chip"];
    chip.textContent = locked ? "Locked" : isCurrent ? "You are here" : felled ? "Harbinger felled" : "Unlocked";

    // lore
    this.el["wmap-info-lore"].textContent = a.blurb || "";
    const deep = this.el["wmap-info-deep"];
    deep.textContent = a.lore || "";
    deep.hidden = !a.lore;

    // ameaça
    this.el["wmap-info-level"].textContent = `${a.levelRange[0]}–${a.levelRange[1]}`;
    const pack = G.enemyFactory.packSizeFor(i);
    this.el["wmap-info-enemies"].textContent = pack + " per wave";

    const mobs = this.el["wmap-info-mobs"];
    mobs.classList.toggle("is-locked", locked);
    mobs.innerHTML = a.enemies.map((e) =>
      `<div class="wmap-info__mob"><img src="${e.img}" alt="" onerror="this.style.visibility='hidden'"><span>${esc(e.name)}</span></div>`
    ).join("");

    // Harbinger
    const bossRow = this.el["wmap-info-boss-row"];
    if (a.boss) {
      bossRow.hidden = false;
      const boss = a.boss;
      const shrouded = locked;
      const name = shrouded ? "???" : esc(boss.name);
      let tag = "";
      if (!shrouded && Array.isArray(boss.signature) && boss.signature.length) {
        const mod = G.data.modifiers[boss.signature[0]];
        if (mod && mod.label) tag = `<span class="wmap-info__boss-tag">${esc(mod.label)}</span>`;
      }
      let cadence = "";
      if (!shrouded) {
        if (isCurrent) {
          const n = Math.max(0, G.enemyFactory.bossThresholdFor(i) - G.combat._bossKills);
          cadence = `stirs in ${n} kills`;
        } else {
          cadence = `stirs every ${G.enemyFactory.bossThresholdFor(i)} kills`;
        }
      }
      // Área 18: linha extra do Okhra (2º estágio pós-H6), preservando a lógica de portão/First Light.
      let extra = "";
      if (i === total - 1 && boss && a.mapBoss && !shrouded) {
        const awake = !!(G.awaken && G.awaken.isDone("first_light"));
        if (!felled)     extra = `Then: ${esc(a.mapBoss.name)} stirs beyond the Choir.`;
        else if (awake)  extra = `${esc(a.mapBoss.name)}, the Starving Tide, risen.`;
        else             extra = "The tide stirs... but your light sleeps. Awaken the First Light.";
      }
      this.el["wmap-info-boss"].className = `wmap-info__boss${shrouded ? " is-shrouded" : ""}`;
      this.el["wmap-info-boss"].innerHTML =
        `<img src="${boss.img || ""}" alt="" onerror="this.style.visibility='hidden'">` +
        `<div class="wmap-info__boss-txt"><span class="wmap-info__boss-name">${name}</span>${tag}` +
        (extra ? `<span class="wmap-info__boss-extra">${extra}</span>` : "") + `</div>` +
        (cadence ? `<span class="wmap-info__boss-cadence">${cadence}</span>` : "");
    } else {
      bossRow.hidden = true;
    }

    // spoils — projeção real do income do jogador atual
    const est = G.income.estimateAreaIncome(i);
    let res;
    if (est.deadly) {
      res = `<li class="is-warning">Beyond your strength. The tide would take you.</li>`;
    } else {
      const rows = [
        `<li><span>Lumens / min</span><b>+${G.util.fmt(est.lumensPerMin)}</b></li>`,
        `<li><span>XP / min</span><b>+${G.util.fmt(est.xpPerMin)}</b></li>`,
      ];
      if (i >= 5) rows.push(`<li><span>Awaken Material</span><b>Boss drop</b></li>`);
      res = rows.join("");
    }
    this.el["wmap-info-res"].innerHTML = res;

    // unlock (área travada): condição + barra de progresso por nível
    const unlockRow = this.el["wmap-info-unlock-row"];
    if (locked) {
      unlockRow.hidden = false;
      const pct = G.util.clamp((d.level / a.levelRange[0]) * 100, 0, 100);
      this.el["wmap-info-unlock"].innerHTML =
        `Reach level ${a.levelRange[0]}` +
        `<div class="wmap-info__unlock-bar"><div class="wmap-info__unlock-fill" style="width:${pct}%"></div></div>`;
    } else {
      unlockRow.hidden = true;
    }

    const tbtn = this.el["wmap-info-travel"];
    if (isCurrent) { tbtn.disabled = true; tbtn.textContent = "You are here"; }
    else if (locked) { tbtn.disabled = true; tbtn.textContent = `🔒 Reach Lv ${a.levelRange[0]}`; }
    else { tbtn.disabled = false; tbtn.textContent = `Travel to ${a.name}`; }

    this.el["wmap-info"].hidden = false;
  },

  // P8.4: palco do Okhra — combat avisa (ui só LÊ estado e aplica a classe cosmética).
  setOkhraStage(on) {
    if (document.body) document.body.classList.toggle("okhra-manifest", !!on);
    const area = G.data.currentArea();
    const wimg = document.querySelector(".world-img");
    const wsrc = area.imgFinale && on ? area.imgFinale : area.img;
    if (wimg && wsrc && wimg.getAttribute("src") !== wsrc) wimg.src = wsrc;
  },

  materialDrop(drops) {
    const container = document.getElementById("mat-drops");
    if (!container) return;
    const SINK   = G.economy ? G.economy.MATERIAL_SINK : {};
    const LABELS = { common: "Common", uncommon: "Uncommon", firstLight: "First Light" };
    for (const [matKey, qty] of Object.entries(drops)) {
      if (!qty) continue;
      const sink = SINK[matKey];
      if (!sink) continue;
      const kind = sink.kind;
      const el = document.createElement("div");
      el.className = `mat-drop mat-drop--${kind}`;
      el.innerHTML = `<img src="assets/materials/${kind}.png" class="mat-drop__icon" alt="" onerror="this.remove()"><span>+${qty} ${LABELS[kind] || kind}</span>`;
      container.appendChild(el);
      setTimeout(() => el.remove(), 2600);
    }
  },

  log(msg, cls) {
    const line = document.createElement("div");
    line.className = "log-line " + (cls || "");
    line.textContent = msg;
    this.el["log"].prepend(line);
    while (this.el["log"].children.length > 30) this.el["log"].lastChild.remove();
  },
};
