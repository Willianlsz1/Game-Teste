#!/usr/bin/env node
// P9.1 — gerador de candidato: família de inimigos com gap de expoente.
// Lê os módulos reais (levelRanges atuais), resolve a família por álgebra e
// emite um patch JS (candidate_vN.js) que o p9_run.js injeta no sim.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = 'C:\\Users\\KABUM\\Desktop\\eclats_of_lumiere\\src';
global.window = global;
for (const f of ['util.js', 'data.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(SRC, f), 'utf8'), { filename: f });
}
const G = global.G;

// ================= DIALS DO CANDIDATO =================
const V = process.argv[2] || 'v1';
const DIAL = {
  // inimigo
  hp1: 2500,          // HP do mob nível 1 (HTK 2.5 no ATK inicial 1000)
  hpEndTarget: 1e11,  // HP no topo da área 18 (espetáculo)
  gap: 0.5,           // expoente ATK = expoente HP - gap (a parede estrutural)
  atk1: 40,           // ATK do mob nível 1 (TTD ~25s no HP inicial 1000)
  yRampShape: [0, 1, 2, 3, 4, 5],  // forma da subida de expoente por grupo (escala resolvida)
  yBase: 1.35,        // expoente do G1 (resolve-se k para bater hpEndTarget)
  // player (patch no state.js)
  pAtkCoef: 8, pAtkExp: 1.5,    // atk = 1000 + coef × L^exp
  pHpCoef: 4,  pHpExp: 1.45,    // hp  = 1000 + coef × L^exp
  // gear
  uncommonStatMult: 8,          // promoção dramática (era 1.5)
  weaponPerLevel: 220,          // ATK flat por nível de arma (era 80)
  armorPerLevel: 60,            // HP flat por nível (era 20)
};

// ---- lê estrutura real ----
const areas = G.data.areas;
const gs = G.data.balance.groupSize;
const groups = [];
for (let g = 0; g < 6; g++) {
  const a0 = areas[g * gs], a2 = areas[g * gs + gs - 1];
  groups.push({ g, L0: a0.levelRange[0], L1: a2.levelRange[1] });
}
const L1 = Math.max(groups[0].L0, 1);
const Lend = groups[5].L1;

// ---- resolve k da rampa de expoente: sum(y_g * ln(span_g)) = ln(hpEnd/hp1) ----
const lnTarget = Math.log(DIAL.hpEndTarget / DIAL.hp1);
const lnSpans = groups.map(({ L0, L1: Lf }) => Math.log(Math.max(Lf, 2) / Math.max(L0, 1)));
const baseSum = lnSpans.reduce((s, ls) => s + DIAL.yBase * ls, 0);
const shapeSum = lnSpans.reduce((s, ls, i) => s + DIAL.yRampShape[i] * ls, 0);
const k = (lnTarget - baseSum) / shapeSum;
const hpY = groups.map((_, i) => DIAL.yBase + k * DIAL.yRampShape[i]);
const atkY = hpY.map(y => y - DIAL.gap);

// ---- constrói curvas contínuas por trechos: HP(L), ATK(L) ----
function familyValue(L, y, A1) {
  // contínua: A_g encadeado nas fronteiras de grupo
  let val = A1, prevL = L1;
  for (let i = 0; i < groups.length; i++) {
    const { L0, L1: Lf } = groups[i];
    const from = Math.max(L0, prevL);
    if (L <= Lf) return val * Math.pow(Math.max(L, 1) / Math.max(from, 1), y[i]);
    val *= Math.pow(Math.max(Lf, 1) / Math.max(from, 1), y[i]);
    prevL = Lf;
  }
  return val;
}
const hpAt  = (L) => familyValue(L, hpY, DIAL.hp1);
const atkAt = (L) => familyValue(L, atkY, DIAL.atk1);

// ---- emite arrays por área ----
const hpArrays = areas.map(a => [Math.round(hpAt(a.levelRange[0])), Math.round(hpAt(a.levelRange[1]))]);
const mobAtkByArea = areas.map(a => Math.round(atkAt(a.levelRange[0])));

// ---- relatório ----
console.log(`P9 candidato ${V} — família resolvida`);
console.log(`hpY por grupo:  ${hpY.map(y => y.toFixed(3)).join('  ')}`);
console.log(`atkY por grupo: ${atkY.map(y => y.toFixed(3)).join('  ')}`);
console.log(`HP:  area1=${hpArrays[0][0]}  area18 topo=${hpArrays[17][1].toExponential(2)}`);
console.log(`ATK: area1=${mobAtkByArea[0]}  area18=${mobAtkByArea[17].toExponential(2)}`);

// ---- patch data.js (aplicado pós-load pelo p9_run) ----
const dataPatch = `
;(function (G) {
  const HP = ${JSON.stringify(hpArrays)};
  G.data.areas.forEach((a, i) => { a.hp = HP[i]; });
  G.data.balance.mobAtkByArea = ${JSON.stringify(mobAtkByArea)};
  G.data.rarities[1].statMult = ${DIAL.uncommonStatMult};
  const gb = G.data.gearBase;
  gb.weapon.affixes[0].perLevel = ${DIAL.weaponPerLevel};
  gb.armor.affixes[0].perLevel = ${DIAL.armorPerLevel};
})(G);
`;

// ---- patch state.js (string replace nas linhas hardcoded) ----
const statePatch = {
  from1: 'add("atk", "flat", (d.level - 1) * 5, "Character Level");',
  to1:   `add("atk", "flat", ${DIAL.pAtkCoef} * Math.pow(d.level, ${DIAL.pAtkExp}), "Character Level");`,
  from2: 'add("hp",  "flat", (d.level - 1) * 2, "Character Level");',
  to2:   `add("hp",  "flat", ${DIAL.pHpCoef} * Math.pow(d.level, ${DIAL.pHpExp}), "Character Level");`,
};

const OUT = path.join(__dirname, `candidate_${V}.json`);
fs.writeFileSync(OUT, JSON.stringify({ dial: DIAL, dataPatch, statePatch }, null, 2));
console.log(`\ncandidato salvo: ${OUT}`);
