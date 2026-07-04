#!/usr/bin/env node
// P9 RODADA 4 — maker do candidato v9-r5 (§9 vars 15–17, decisão do dono jul/04 sobre a
// anatomia medida do v9-r4 + probe A/B da coroa). Base = candidate_v9.json (arrays fitados,
// player curve, gear early, tree costs) + QUATRO mudanças:
//   1. COROA ×4: UNIT ringCloses 54→300 · Okhra hpMult re-fitado no par (alvo 71–95).
//   2. FIRST SPARK FLAT (var 15): raiz = ATK & HP FLAT/nível (mecânica em src/state.js);
//      UNIT fitado p/ ~30–50% do ATK total nas convs 1–5.
//   3. SUSTAIN (var 16): Regeneration UNIT 0.25 (maxada 2.5%/s) · Heal on Kill UNIT 1.5
//      (maxada 15%/kill) — gate: compensa 50–70% do DPS da banda (TTD 25s ≈ 4%/s), nunca ≥100%.
//   4. PASSE DE FORMA (var 17): morro G2–G3 suavizado (xpMultByGroup >1) · Porto morde
//      (áreas 10–15 HP ×1.4 + xpMultByGroup 0.3 no G4–G5) · deserto pré-FL morto
//      (awakenMaterial escala por área no G6 via qtyAreaMult — mecânica em src/economy.js).
//
// HISTÓRICO DO FIT (iterações, seed 1):
//   iter 1: okhra 6600→148 golpes · H3 208 (siphon) · G4/G5 2.5h · conv6 5.9h
//   iter 2: okhra 3700→80 ✓ · G4 4.1h ✓ · bosses ratio-fit
//   iter 3: G3 xpMult 2.6 QUEBROU (death loop no muro G4, nível preso 1329 por 180h) — o
//     player chega mais cedo/fraco; 2.3 = conhecido-bom; 2.45 não comprime (lumens-bound).
//   iter 4-5: porto 1.5→1.4 (margem de robustez) · matAreaMult desacelerado (FL caía na conv
//     13 com árvore 92%; alvo = FL ~conv 14 com árvore 100%).
//   iter 6-7: okhra re-fit sob a forma final — 61 golpes plateau em 4950-6000 (o farm do
//     threshold pré-luta auto-compensa HP extra com nível/gear extra); saltos maiores testados.
//
// Uso: node p9_make_v9r5.js   (lê os arrays fitados de candidate_v9.json; grava candidate_v9r5.json)
'use strict';
const fs = require('fs');
const path = require('path');

// ---- base: arrays fitados do v9-r4 ----
const BASE = JSON.parse(fs.readFileSync(path.join(__dirname, 'candidate_v9.json'), 'utf8'));
const HP_BASE = JSON.parse(BASE.dataPatch.match(/const HP = (\[\[.*?\]\]);/s)[1]);
const ATK_BASE = JSON.parse(BASE.dataPatch.match(/mobAtkByArea = (\[.*?\]);/s)[1]);

// ================= DIALS v9-r5 =================
const D = {
  // herdados do v9-r4 (inalterados)
  playerAtkCoef: 4.0,  playerAtkExp: 1.30,
  playerHpCoef:  2.0,  playerHpExp:  1.30,
  weaponPerLevel: 55,  armorPerLevel: 22,
  treeAtkPctUnit: 60,
  treeCostScale: 0.85, treeEvoFactor: 0.45, treeEvoRamp: 1.60,
  // bosses ratio-fit sob a forma nova (medição iter 6: H1 33 H2 19 H3 25 H4 38 H5 24 H6 21)
  bossHpMult: { 2: 3.5, 5: 3.0, 8: 3.2, 11: 4.8, 14: 7, 17: 200 },  // iter 11: hpMult cavalga o mob HP escalado do Porto (H4 251@40, H5 127@30) + H6 sob coroa mais cedo (8@70)
  // ---- 1. COROA ×4 + Okhra no par ----
  ringCloses: 300,       // era 54 (probe A/B: 300 = ponto ótimo; 1 degrau abaixo do rito ×5)
  okhraHpMult: 6800,     // iter 8: interpolado (6000=61 · 12000=176 golpes) p/ ~85
  // ---- 2. FIRST SPARK FLAT (var 15) ----
  firstSparkUnit: 4000,  // flat ATK&HP por nível (maxada 15k); fit: 30–50% do ATK nas convs 1–5
  // ---- 3. SUSTAIN (var 16, padrão C) ----
  hpRegenUnit:    0.25,  // maxada 2.5%/s ÷ banda ~4%/s recebido = ~62% (gate 50–70%, nunca ≥100%)
  healOnKillUnit: 1.5,   // maxada 15%/kill (burst condicional, identidade Caça)
  // ---- 4a/4b. morro G2–G3 + Porto morde ----
  xpMultByGroup: [1, 1.7, 2.3, 0.7, 0.7, 1],
  portoHpScaleByArea: { 9: 18, 10: 16, 11: 18, 12: 10, 13: 4.5, 14: 14 },  // iter 10: per-area (HTK entrada alvo ~8-11; arrival power varia: coroa acende na conv 10 = meio do G5)
  portoHpScale: 10,     // ×HP nas áreas 10–15 (idx 9–14); mobAtk NÃO muda (TTD intacto)
  // ---- 4c. deserto pré-FL: material escala por área no G6 (área 16 < 17 < 18) ----
  matAreaMult: { 15: 1.1, 16: 1.5, 17: 2.1 },
};

// ---- arrays: aplica o portoHpScale sobre os fitados ----
const HP = HP_BASE.map((pair, i) => (D.portoHpScaleByArea && D.portoHpScaleByArea[i] != null)
  ? [Math.round(pair[0] * D.portoHpScaleByArea[i]), Math.round(pair[1] * D.portoHpScaleByArea[i])]
  : pair.slice());
const ATK = ATK_BASE.slice();

// ---- dataPatch ----
const dataPatch = `
;(function (G) {
  const HP = ${JSON.stringify(HP)};
  G.data.areas.forEach((a, i) => { a.hp = HP[i]; });
  G.data.balance.mobAtkByArea = ${JSON.stringify(ATK)};
  G.data.balance.playerAtkCoef = ${D.playerAtkCoef};
  G.data.balance.playerAtkExp  = ${D.playerAtkExp};
  G.data.balance.playerHpCoef  = ${D.playerHpCoef};
  G.data.balance.playerHpExp   = ${D.playerHpExp};
  const gb = G.data.gearBase;
  gb.weapon.affixes[0].perLevel = ${D.weaponPerLevel};
  gb.armor.affixes[0].perLevel  = ${D.armorPerLevel};
  const BM = ${JSON.stringify(D.bossHpMult)};
  G.data.areas.forEach((a, i) => { if (a.boss && BM[i] != null) a.boss.hpMult = BM[i]; });
  const last = G.data.areas[G.data.areas.length - 1];
  if (last.mapBoss) last.mapBoss.hpMult = ${D.okhraHpMult};
  G.data.balance.xpMultByGroup = ${JSON.stringify(D.xpMultByGroup)};
})(G);
`;

// ---- econPatch: escala de material por área no G6 (4c) ----
const econPatch = `
;(function (G) {
  const M = ${JSON.stringify(D.matAreaMult)};
  const dt = G.economy.dropTable;
  for (const t of ['common', 'rare', 'boss']) {
    const d = dt[t] && dt[t].awakenMaterial;
    if (d) d.qtyAreaMult = M;
  }
})(G);
`;

// ---- passivesPatch: coroa ×4 + First Spark flat UNIT + sustain + herdados ----
const passivesPatch = `
;(function (G) {
  const S = ${D.treeCostScale};
  G.passives.unlockByDepth = G.passives.unlockByDepth.map(function (c) { return Math.max(1, Math.round(c * S)); });
  G.passives.evoFactor = ${D.treeEvoFactor};
  G.passives.evoRamp   = ${D.treeEvoRamp};
  G.passives.UNIT.atkPct = ${D.treeAtkPctUnit};
  G.passives.UNIT.ringCloses = ${D.ringCloses};
  G.passives.UNIT.firstSpark = ${D.firstSparkUnit};
  G.passives.UNIT.hpRegen    = ${D.hpRegenUnit};
  G.passives.UNIT.healOnKill = ${D.healOnKillUnit};
})(G);
`;

const cand = {
  dial: {
    v9r5: `coroa ${D.ringCloses} · okhra ${D.okhraHpMult} · firstSpark FLAT ${D.firstSparkUnit}/nv · ` +
          `regen ${D.hpRegenUnit} heal ${D.healOnKillUnit} · xpMult ${JSON.stringify(D.xpMultByGroup)} · ` +
          `porto ×${D.portoHpScale} (áreas 10–15) · matG6 ${JSON.stringify(D.matAreaMult)}`,
  },
  dataPatch,
  econPatch,
  passivesPatch,
};

fs.writeFileSync(path.join(__dirname, 'candidate_v9r5.json'), JSON.stringify(cand, null, 2));
console.log('candidate_v9r5.json escrito. dials: ' + cand.dial.v9r5);
