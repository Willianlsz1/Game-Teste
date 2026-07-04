#!/usr/bin/env node
// P9 RODADA 4 — maker do candidato v9-r6 (§9 vars 18–21 sobre o r5; r5 PRESERVADO).
// QUATRO mudanças sobre o candidate_v9r5:
//   1. PAREDE PARCIAL NO G6 (var 21): áreas 16–18 HP re-fitado p/ 1ª passagem em HTK ~3–5
//      (r5 media 0.7–0.8) — a Garganta volta a ser atrito sem matar a colheita. H6/Okhra
//      re-fitam no par (cavalgam o mob HP); matAreaMult re-ajusta (reta final segue
//      acelerando, gap de eventos ≤6h; clear esperado ~38–40h).
//   2. GOLDEN WAKE 15× (var 18): folha vira jackpot Lumens 15× — MECÂNICA em src (combat:
//      escada 15×→4×→2×, primeiro que acerta ganha; UNIT 1.0 e lore/FMT baked em passives.js).
//      Economia: média +140% no cap — vigiar gear vs HP (re-fit se disparar).
//   3. PILGRIM GORDO (var 19): 5 níveis de +70% XP — maxLevel/costMult POR NÓ em src
//      (costMult 16 mantém custo total ≈ nó de 10 níveis; UNIT.xpPct 70 baked, banda 60–80).
//   4. Mantidos do r5 (var 20-21): Okhra lado-alto aceito · xpMult G3 2.3 (2.6 = death loop) ·
//      coroa 300 · First Spark flat 4000 · sustain 0.25/1.5 · Porto por área · demais dials.
//
// Uso: node p9_make_v9r6.js   (lê arrays fitados de candidate_v9.json; grava candidate_v9r6.json)
'use strict';
const fs = require('fs');
const path = require('path');

// ---- base: arrays fitados do v9-r4 ----
const BASE = JSON.parse(fs.readFileSync(path.join(__dirname, 'candidate_v9.json'), 'utf8'));
const HP_BASE = JSON.parse(BASE.dataPatch.match(/const HP = (\[\[.*?\]\]);/s)[1]);
const ATK_BASE = JSON.parse(BASE.dataPatch.match(/mobAtkByArea = (\[.*?\]);/s)[1]);

// ================= DIALS v9-r6 =================
const D = {
  // herdados do v9-r4/r5 (inalterados)
  playerAtkCoef: 4.0,  playerAtkExp: 1.30,
  playerHpCoef:  2.0,  playerHpExp:  1.30,
  weaponPerLevel: 55,  armorPerLevel: 22,
  treeAtkPctUnit: 60,
  treeCostScale: 0.85, treeEvoFactor: 0.45, treeEvoRamp: 1.60,
  ringCloses: 300,
  firstSparkUnit: 4000,
  hpRegenUnit:    0.25,
  healOnKillUnit: 1.5,
  xpMultByGroup: [1, 1.7, 2.3, 0.6, 0.6, 1],  // iter 3: Pilgrim gordo (+350% XP) afinou G4/G5 p/ 3.7/3.2h -> re-estica pro alvo 4-6h
  portoHpScaleByArea: { 9: 18, 10: 16, 11: 18, 12: 10, 13: 4.5, 14: 14 },
  // ---- 1. PAREDE PARCIAL NO G6 (var 21) ----
  g6HpScaleByArea: { 15: 5.5, 16: 5.5, 17: 5.5 },  // HTK 1ª passagem 0.7-0.8 → alvo 3-5
  // H6/Okhra cavalgam o mob HP ×5.5 da área 18 → re-fit no par (r5: H6 200 · okhra 6800)
  bossHpMult: { 2: 3.5, 5: 3.0, 8: 3.2, 11: 4.8, 14: 7, 17: 36 },
  okhraHpMult: 1240,
  // matAreaMult re-fit: kills ~2.5× mais lentos no G6 com a parede; reta final segue acelerando
  matAreaMult: { 15: 1.7, 16: 2.3, 17: 3.2 },  // iter 2: FL caia na conv 13 (arvore 92%) -> desacelera p/ FL ~conv 14
};

// ---- arrays: Porto (r5) + parede parcial do G6 (r6) sobre os fitados ----
const HP = HP_BASE.map((pair, i) => {
  const sc = (D.portoHpScaleByArea[i] != null) ? D.portoHpScaleByArea[i]
    : (D.g6HpScaleByArea[i] != null) ? D.g6HpScaleByArea[i] : 1;
  return sc === 1 ? pair.slice() : [Math.round(pair[0] * sc), Math.round(pair[1] * sc)];
});
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

// ---- econPatch: escala de material por área no G6 ----
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

// ---- passivesPatch: dials da árvore (Golden Wake 15×/Pilgrim gordo já BAKED em src) ----
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
    v9r6: `G6 parede ×5.5 (áreas 16-18, HTK alvo 3-5) · H6 ${D.bossHpMult[17]} · okhra ${D.okhraHpMult} · ` +
          `matG6 ${JSON.stringify(D.matAreaMult)} · GW 15× e Pilgrim gordo BAKED em src · ` +
          `herdados r5: coroa ${D.ringCloses} · FS ${D.firstSparkUnit} · xpMult ${JSON.stringify(D.xpMultByGroup)}`,
  },
  dataPatch,
  econPatch,
  passivesPatch,
};

fs.writeFileSync(path.join(__dirname, 'candidate_v9r6.json'), JSON.stringify(cand, null, 2));
console.log('candidate_v9r6.json escrito. dials: ' + cand.dial.v9r6);
