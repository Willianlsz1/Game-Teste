// ui-core.js — base do G.ui: cache de elementos, modal, pause/reset, log, orquestrador
// de render e bind() que delega para os bind<Tela>() definidos em cada arquivo de tela.
// Nenhuma regra de jogo aqui.

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
    // P9 r4 — afixos novos
    twiceGilded:      "Double Lumens Chance",
    fortuneTorrent:   "Quadruple Lumens Chance",
    hollowing:        "Enemy HP Reduction",
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

  // bind() monolítico foi fragmentado em bind<Tela>() dentro de cada arquivo de tela;
  // aqui só delegamos (com guard: uma tela ausente não quebra o resto).
  bind() {
    if (this.bindGear) this.bindGear();
    if (this.bindHud) this.bindHud();
    if (this.bindWorldMap) this.bindWorldMap();
    if (this.bindConvergence) this.bindConvergence();
    if (this.bindAwaken) this.bindAwaken();
    if (this.bindPassives) this.bindPassives();
    if (this.bindForge) this.bindForge();
    if (this.bindBattle) this.bindBattle();
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

  // ---------- SHARED STAT HELPERS ----------
  // fmtStat/statValueText são usados por várias telas (HUD renderStats/statMatrix,
  // Gear gearTipHtml, Forge renderForgeAnvil) → vivem em ui-core, não numa tela.

  fmtStat(v) {
    const r = Math.round(v * 1000) / 1000;
    if (Number.isInteger(r)) return G.util.fmt(r);
    if (Math.abs(r) < 1000) return String(parseFloat(r.toFixed(3)));
    return G.util.fmt(v);
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

  // ---------- RENDER ----------

  renderAll() {
    this.renderResources();
    this.renderHeroHp();
    this.renderStats();
    this.renderGear();
    this.renderHud();
  },

  toggleLog() {
    const p = document.getElementById("log-panel");
    const b = document.getElementById("log-toggle");
    if (!p) return;
    const collapsed = p.classList.toggle("collapsed");
    if (b) { b.textContent = collapsed ? "+" : "−"; b.title = collapsed ? "Expand" : "Minimize"; }
  },

  log(msg, cls) {
    const line = document.createElement("div");
    line.className = "log-line " + (cls || "");
    line.textContent = msg;
    this.el["log"].prepend(line);
    while (this.el["log"].children.length > 30) this.el["log"].lastChild.remove();
  },
};
