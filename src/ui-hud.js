// ui-hud.js — HUD topo (recursos, HP/XP do herói, painel de stats, taxas) e navegação de área.
// fmtStat/statValueText vivem em ui-core (compartilhados por Gear/Forge).

Object.assign(G.ui, {

  bindHud() {
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
    const sigKeys = ["cleave", "bulwark", "overcrit", "momentum", "twiceGilded", "fortuneTorrent", "hollowing"];
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
    // P9 r4 (§9 item 3): revelação — a linha Corona só existe DEPOIS do First Light.
    // Pré-awaken o tier Corona não spawna nem aparece em NENHUMA UI (nem como "0%").
    const coronaRevealed = !!(G.awaken && G.awaken.isDone("first_light"));
    const lightsHtml =
      `<li class="stat-row--section"><span>Lights</span><span class="stat-row__hint">chance / cap</span></li>` +
      lightRow("Ember", "#5ee0d2", "ember") +
      lightRow("Lumen", "#4fa8ff", "lumen") +
      (coronaRevealed ? lightRow("Corona", "#9d7bff", "corona") : "");

    if (this.el["gear-stats"]) this.el["gear-stats"].innerHTML = html + sigHtml + lightsHtml;
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
});
