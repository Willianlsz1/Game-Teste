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
    if (this.bindMenu) this.bindMenu();
    if (this.bindIntro) this.bindIntro();
    this.bindReveals();
  },

  // ---------- L2: revelação progressiva das HUDs ----------
  // botões marcados com [data-reveal] nascem ocultos (display:none via classe is-hidden) e
  // só aparecem quando G.reveals.isRevealed(key) vira true. O beacon (anel pulsando) some
  // no 1º clique do botão OU sozinho depois de alguns segundos (nunca bloqueia input).
  // L6 (dono jul/05): revelação progressiva DORMENTE — todos os ícones liberados desde o
  // save novo. Os módulos (reveals.js, spotlight.js) continuam no lugar (o dono vai repensar
  // o onboarding), mas o fluxo de esconder/beacon/spotlight fica inerte aqui: bindReveals não
  // pendura nada, renderReveals não esconde nada, onReveal não acende beacon nem spotlight.
  bindReveals() { /* dormente: nenhum botão nasce oculto, nada a re-bindar */ },

  _dismissBeacon(btn) {
    const b = btn.querySelector(".icon-btn__beacon");
    if (b) b.remove();
    btn.classList.remove("is-beacon");
  },

  // dormente (L6): reveal continua marcando a flag no estado (reveals.js), mas a UI não
  // reage — sem beacon, sem spotlight. Todos os ícones já estão visíveis.
  onReveal(key) { /* no-op visual: ícones sempre visíveis, sem beacon/spotlight */ },

  // dormente (L6): garante TODOS os botões [data-reveal] visíveis (remove qualquer is-hidden/
  // is-beacon residual de um save/estado antigo). Idempotente.
  renderReveals() {
    document.querySelectorAll("[data-reveal]").forEach((btn) => {
      btn.classList.remove("is-hidden", "is-beacon");
      const b = btn.querySelector(".icon-btn__beacon");
      if (b) b.remove();
    });
  },

  // L6: fecha QUALQUER tela aberta (uma tela por vez). Volta ao combate — o combate/idle
  // segue rodando por baixo (não pausa; só a intro congela, via G.combat.frozen). Usado pelo
  // X de cada tela e pelo ESC. `.screen` cobre as telas convertidas; o seletor legado
  // .modal-overlay/.passives-screen fica por segurança (nenhuma sobra hoje, mas inócuo).
  closeScreens() {
    document.querySelectorAll(".screen, .modal-overlay, .passives-screen").forEach((m) => {
      if (!m.hidden) m.hidden = true;
    });
    this.syncActiveScreen();
  },

  openModal(id) {
    // L6: uma tela por vez — abrir uma troca (não empilha). Fecha o que estiver aberto antes.
    this.closeScreens();
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
    if (id === "modal-menu") this.renderMenu();
    const m = document.getElementById(id);
    if (m) m.hidden = false;
    // passivas: o fit do stage roda dentro de renderPassives() (linha acima), mas nesse
    // instante a tela ainda está hidden (display:none) — getBoundingClientRect() dá 0×0.
    // Re-fita agora que .hidden=false já tirou o display:none do layout.
    if (id === "modal-passives" && this.el["pv-body"]) this._pvFitStage(this.el["pv-body"]);
    this.syncActiveScreen();   // marca o botão como "tela aberta" sem esperar o tick de 1s
    // L6: spotlight guiado DORMENTE (dono jul/05) — não dispara passo 2 ao abrir a tela.
    // O módulo G.spotlight continua carregado (o dono vai repensar o onboarding), só não é
    // acionado. MODAL_SPOTLIGHT_KEY fica como referência/estado morto.
  },

  // modal id -> chave de G.spotlight.CONFIG (mesmas chaves de G.reveals.KEYS).
  MODAL_SPOTLIGHT_KEY: {
    "modal-forge": "forge",
    "modal-worldmap": "worldmap",
    "modal-convergence": "convergence",
    "modal-passives": "passives",
    "modal-awaken": "awaken",
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
    this.renderReveals();
    this.syncActiveScreen();
  },

  // P-UI-1 item 5: marcação sutil (não o brilho do beacon) no botão da toolbar cuja tela
  // está aberta agora. Botão <-> modal são 1:1; roda no mesmo tick de renderAll (barato:
  // 1 lookup por botão, sem observers). Único estado com pulso dourado continua sendo
  // .is-beacon (revelação nova do L2) — isto aqui é só uma borda levemente mais clara.
  _SCREEN_BTN_MODAL: {
    "btn-worldmap":    "modal-worldmap",
    "btn-convergence": "modal-convergence",
    "btn-forge":       "modal-forge",
    "btn-passives":    "modal-passives",
    "btn-awaken":      "modal-awaken",
    "btn-settings":    "modal-menu",
  },
  syncActiveScreen() {
    for (const btnId in this._SCREEN_BTN_MODAL) {
      const btn = document.getElementById(btnId);
      if (!btn) continue;
      const modal = document.getElementById(this._SCREEN_BTN_MODAL[btnId]);
      btn.classList.toggle("is-open", !!modal && !modal.hidden);
    }
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
    // P-UI-1: qualquer linha que NÃO seja de kill agrupável quebra a sequência (drop,
    // revelação, Harbinger, área, morte, level up ecoam aqui via toast/log direto).
    this._lastKillLine = null;
  },

  // P-UI-1 (item 4): kills comuns repetidos e consecutivos do MESMO mob agrupam numa única
  // linha que atualiza a contagem ("Defeated X ×3 · +264 ✦") em vez de spammar o Chronicle.
  // groupKey identifica "mesmo evento repetível" (nome do mob); qualquer G.ui.log() normal
  // entre dois kills iguais (drop, revelação, Harbinger, morte, área, level up) zera o grupo
  // porque log() acima limpa _lastKillLine. Bosses NUNCA agrupam (chamador não usa logKill).
  logKill(groupKey, label, lumensGained, cls) {
    const g = this._lastKillLine;
    if (g && g.key === groupKey && g.el && g.el.parentNode) {
      g.count += 1;
      g.lumens += lumensGained;
      g.el.textContent = `${label} ×${g.count} · +${G.util.fmt(g.lumens)} ✦`;
      return;
    }
    const line = document.createElement("div");
    line.className = "log-line " + (cls || "");
    line.textContent = `${label} · +${G.util.fmt(lumensGained)} ✦`;
    this.el["log"].prepend(line);
    while (this.el["log"].children.length > 30) this.el["log"].lastChild.remove();
    this._lastKillLine = { key: groupKey, count: 1, lumens: lumensGained, el: line };
  },

  // ---------- L3: toast — hint contextual one-shot (docs/design/LAUNCH_ITCHIO.md §L3) ----------
  // Não-bloqueante: some sozinho em ~6s ou no clique. Sempre ecoa a MESMA linha no Chronicle
  // (this.log) — o toast é só o destaque visual, não um canal paralelo de eventos.
  TOAST_MS: 6000,

  toast(msg) {
    if (!msg) return;
    this.log("✧ " + msg, "level");
    let wrap = document.getElementById("toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "toast-wrap";
      wrap.className = "toast-wrap";
      document.body.appendChild(wrap);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    const dismiss = () => {
      el.classList.add("is-leaving");
      setTimeout(() => el.remove(), 300);
    };
    el.addEventListener("click", dismiss);
    wrap.appendChild(el);
    setTimeout(dismiss, this.TOAST_MS);
  },
};
