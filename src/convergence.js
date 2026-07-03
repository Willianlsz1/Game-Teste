// =============================================================
// convergence.js — PRESTIGE (rebirth) + Pontos de Convergence
// =============================================================
// Convergence concede DOIS ganhos (híbrido):
//  1. Pontos de Convergence — gastos nas Árvores de Passivas (poder indireto).
//  2. Legacy — +atk%/+hp% direto por convergence, empilha permanente (poder na hora).
//
// P5.1 — Gate escalonado: gate₁ = convGateBase (fim do G1) · gateₙ₊₁ = gateₙ × convGateGrowth.
// Cada convergence sobe o requisito de nível → as convergences se espalham pelos grupos.
// P5.3 — Pontos = convPointsBase × (nível/convGateBase)^convPointsExp: convergir no gate rende
// ~×1.5 a anterior; empurrar 1 grupo além do gate ≈ ×2.1 (mata a decisão degenerada de convergir).
// convPointsPct vem do nó Deep Memory (Árvore I). convEfficiency/capstoneFracture/convPointsMin
// não têm nó na Árvore I (voltam na Árvore II) — ficam inertes (effect()=0), aplicados por cima.
//
// Reseta: nível, XP, Lumens, área da run e os contadores da run.
// Mantém: gear, materiais, passivas, awaken, áreas liberadas, Pontos, recordes.

G.convergence = {
  // gate corrente = requisito de nível da PRÓXIMA convergence (escada por convergences já feitas)
  currentGate() {
    const b = G.data.balance;
    return Math.round(b.convGateBase * Math.pow(b.convGateGrowth, G.state.data.convergences || 0));
  },

  rawPoints() { return Math.floor(this.pointsFor(G.state.data.level || 1)); },

  points() {
    let p = this.rawPoints();
    if (G.passives) {
      p *= 1 + G.passives.effect("convPointsPct") / 100;
      p *= 1 + G.passives.effect("convEfficiency") / 100;
      p *= 1 + G.passives.effect("capstoneFracture") / 100;
      p = Math.max(p, G.passives.effect("convPointsMin"));
    }
    return Math.floor(p);
  },

  pointsFor(level) {
    const b = G.data.balance;
    return b.convPointsBase * Math.pow((level || 1) / b.convGateBase, b.convPointsExp);
  },

  // bônus DIRETO por convergence (parte "quente" do híbrido): cada convergence
  // empilha +atk%/+hp% permanente. Os Pontos (acima) seguem alimentando passivas.
  legacyAtkPct() { return (G.state.data.convergences || 0) * G.data.balance.convLegacyAtkPct; },
  legacyHpPct()  { return (G.state.data.convergences || 0) * G.data.balance.convLegacyHpPct; },

  pending() { return this.canConverge() ? this.points() : 0; },
  canConverge() { return G.state.data.level >= this.currentGate(); },

  // renasce: zera nível/XP/Lumens/área e contadores da run, credita Pontos
  converge() {
    if (!this.canConverge()) return false;
    const d = G.state.data;
    const gained = this.pending();
    d.convergencePoints = (d.convergencePoints || 0) + gained;
    d.convergences = (d.convergences || 0) + 1;

    d.level = 1;
    d.xp = 0;
    d.lumens = 0;
    d.areaIndex = 0;
    d.runKills = 0;
    d.runBosses = 0;
    d.runMaxAreaIndex = 0;
    if (G.combat) { G.combat._bossKills = 0; G.combat._momentumStacks = 0; G.combat._momentumTimer = 0; }   // não carregar progresso de boss/momentum pro novo ciclo

    G.state.invalidateStats();
    d.hp = G.state.maxHp();

    G.combat.enemies = [];
    G.combat.enemy = null;
    G.combat.pendingHits = [];
    G.combat.respawnTimer = G.data.balance.respawnDelay;
    // P8.4: converger NO MEIO do finale do Okhra não pode deixar o palco/maré presos —
    // sem isto, `.okhra-manifest` (classe no body) e a maré ficam ativos sobre a área 1
    // até o próximo spawn() (nunca, se o jogo estiver pausado; ver combat.paused em main.js).
    if (G.combat._okhraManifest || G.combat._tideTimer || G.combat._tideRisen) {
      G.combat._okhraManifest = false; G.combat._tideTimer = 0; G.combat._tideRisen = false;
      if (G.ui && G.ui.setOkhraStage) G.ui.setOkhraStage(false);
    }

    if (G.ui && G.ui.log)
      G.ui.log(`✦ Convergence: the Seeker breaks and begins anew. +${G.util.fmt(gained)} Convergence Points.`, "boss");
    if (G.ui) {
      if (G.ui.onAreaChange) G.ui.onAreaChange();
      if (G.ui.renderAll) G.ui.renderAll();
    }
    G.state.save();
    return true;
  },
};
