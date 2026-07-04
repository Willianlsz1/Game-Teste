#!/usr/bin/env node
// P9 RODADA 4 — maker do candidato v9-r4 (run de DESCOBERTA, sem gate de relógio).
// O src JÁ está BAKEADO com as 8 mecânicas da rodada 4 (dois materiais, Corona gateado,
// bônus do First Light, afixos novos, packByGroup 4-5, threshold 200, Golden Wake 0.6,
// player base 15/50). Este candidato carrega SÓ os NÚMEROS re-ancorados:
//   • família de inimigos (HP/mobAtk) re-gerada pro novo start (player ATK ~23 no nv1)
//     mantendo o topo do mapa ~1e11 na área 18 (o gerador resolve os expoentes).
//   • gear early re-escalado (weapon/armor perLevel) pra acompanhar a família em dezenas.
//   • Okhra hpMult + boss hpMults seedados do v8 — RE-FITADOS pelo p9_fit depois.
//
// Formato do dataPatch: `const HP = [[...]];` + `mobAtkByArea = [...];` (o p9_fit_v8.js
// lê/reescreve exatamente esses dois no re-fit dos arrays). Sem statePatch (curvas do
// player já vivem em data.balance pós-bake).
//
// Uso:
//   node p9_make_v9.js            (gera a família nova e grava candidate_v9.json)
//   node p9_make_v9.js --reseed   (força re-gerar a família, descartando arrays já fitados)
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ---- lê a estrutura real (levelRanges) do src BAKEADO ----
const SRC = 'C:\\Users\\KABUM\\Desktop\\eclats_of_lumiere\\src';
global.window = global;
for (const f of ['util.js', 'data.js']) vm.runInThisContext(fs.readFileSync(path.join(SRC, f), 'utf8'), { filename: f });
const G = global.G;

// ================= DIALS v9-r4 =================
const D = {
  // FAMÍLIA (re-ancorada no start novo — player ATK nv1 ≈ base 15 + 8×1^1.42 ≈ 23):
  hp1:         48,     // HP do mob nv1 → HTK ~2.5 no ATK inicial ~19 (base 15 + 4×1^1.30) (§9: 2-3 hits)
  atk1:        2,      // ATK do mob nv1 → TTD ~25s no HP inicial ~52 (base 50 + 2×1^1.30)
  hpEndTarget: 1e11,   // HP no topo da área 18 (espetáculo mantido)
  gap:         0.5,    // expoente ATK = expoente HP − gap (a parede estrutural — FIXO)
  yRampShape:  [0, 1, 2, 3, 4, 5],  // forma da subida de expoente por grupo
  yBase:       1.35,   // expoente do G1 (resolve-se k p/ bater hpEndTarget)
  // PLAYER curves — re-fit (§9 item 14): o Character Level flat precisa ser SUBORDINADO
  // (gate v8: gear+passivas ≥75% do ATK). Coef/exp baixos → o level pesa pouco; gear+árvore carregam.
  playerAtkCoef: 4.0,  playerAtkExp: 1.30,   // v8: 8 / 1.42 (level flat menor, mas baseline ainda alcança área 18)
  playerHpCoef:  2.0,  playerHpExp:  1.30,   // acompanha p/ TTD ~25s
  // GEAR early (re-escalado pro start em dezenas — a composição gear+passivas ≥75% do ATK).
  weaponPerLevel: 55,  // ATK flat por nível de arma (domina o level rebaixado)
  armorPerLevel:  22,  // HP flat por nível
  treeAtkPctUnit: 60,  // UNIT.atkPct (passivas pesam no ATK) — v8 pós-bake era 45
  // BOSSES / OKHRA (re-fitados pós-arrays no run de descoberta seed 1).
  //   Okhra 35 golpes @690 → alvo ~83 (mid 71-95) → ×2.37 ≈ 1635.
  //   Harbingers baixos (H1 9, H3 10, H5 14) = over-gear early (padrão v8, regra do dono: erra alto);
  //   H2/H4/H6 já na banda. Sobe H1/H3/H5 p/ aproximar 20-40 sem estourar.
  bossHpMult: { 2: 3.5, 5: 4.5, 8: 7, 11: 24, 14: 18, 17: 30 },  // re-fit 4 (H3 Siphoning baixa mais — heal infla o HTK de 1º contato)
  okhraHpMult: 1520,   // re-fit 4: 70→~83 golpes COM o piso ×5 do First Light
  // ÁRVORE: fecha 100% na banda conv 14-16 (§9 item 8). @conv14 fechou 93% → baixa o custo dos
  // UPGRADES (evoRamp/evoFactor dominam o late), não só o unlock. Forma mantida (rampa geométrica).
  treeCostScale:  0.85,   // escala global sobre unlockByDepth
  treeEvoFactor:  0.45,   // custo do 1º upgrade = unlock × evoFactor (era 0.5)
  treeEvoRamp:    1.60,   // rampa dos upgrades (era 1.7) — late-game bem mais barato
};

// ---- família por álgebra (idêntica ao p9_generate) ----
const areas = G.data.areas;
const gs = G.data.balance.groupSize;
const groups = [];
for (let g = 0; g < 6; g++) {
  const a0 = areas[g * gs], a2 = areas[g * gs + gs - 1];
  groups.push({ g, L0: a0.levelRange[0], L1: a2.levelRange[1] });
}
const L1 = Math.max(groups[0].L0, 1);
const lnTarget = Math.log(D.hpEndTarget / D.hp1);
const lnSpans = groups.map(({ L0, L1: Lf }) => Math.log(Math.max(Lf, 2) / Math.max(L0, 1)));
const baseSum = lnSpans.reduce((s, ls) => s + D.yBase * ls, 0);
const shapeSum = lnSpans.reduce((s, ls, i) => s + D.yRampShape[i] * ls, 0);
const k = (lnTarget - baseSum) / shapeSum;
const hpY = groups.map((_, i) => D.yBase + k * D.yRampShape[i]);
const atkY = hpY.map(y => y - D.gap);

function familyValue(L, y, A1) {
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
const hpAt = (L) => familyValue(L, hpY, D.hp1);
const atkAt = (L) => familyValue(L, atkY, D.atk1);

// ---- preserva arrays já fitados (a menos de --reseed) ----
let HP_SEED = areas.map(a => [Math.max(10, Math.round(hpAt(a.levelRange[0]))), Math.max(10, Math.round(hpAt(a.levelRange[1])))]);
let ATK_SEED = areas.map(a => Math.max(1, Math.round(atkAt(a.levelRange[0]))));
const RESEED = process.argv.includes('--reseed');
const CAND_PATH = path.join(__dirname, 'candidate_v9.json');
if (!RESEED && fs.existsSync(CAND_PATH)) {
  try {
    const prev = JSON.parse(fs.readFileSync(CAND_PATH, 'utf8'));
    const hpM = prev.dataPatch.match(/const HP = (\[\[.*?\]\]);/s);
    const atkM = prev.dataPatch.match(/mobAtkByArea = (\[.*?\]);/s);
    if (hpM && atkM) { HP_SEED = JSON.parse(hpM[1]); ATK_SEED = JSON.parse(atkM[1]); console.error('(preservando arrays fitados de candidate_v9.json — use --reseed p/ voltar à família nova)'); }
  } catch (e) {}
}

// ---- dataPatch (aplicado APÓS o data.js bakeado) ----
const dataPatch = `
;(function (G) {
  const HP = ${JSON.stringify(HP_SEED)};
  G.data.areas.forEach((a, i) => { a.hp = HP[i]; });
  G.data.balance.mobAtkByArea = ${JSON.stringify(ATK_SEED)};
  // player curves re-fitadas (Character Level subordinado — gate composição ≥75%)
  G.data.balance.playerAtkCoef = ${D.playerAtkCoef};
  G.data.balance.playerAtkExp  = ${D.playerAtkExp};
  G.data.balance.playerHpCoef  = ${D.playerHpCoef};
  G.data.balance.playerHpExp    = ${D.playerHpExp};
  // gear early re-escalado pro start em dezenas
  const gb = G.data.gearBase;
  gb.weapon.affixes[0].perLevel = ${D.weaponPerLevel};
  gb.armor.affixes[0].perLevel  = ${D.armorPerLevel};
  // bosses / Okhra (re-fitados por p9_fit depois)
  const BM = ${JSON.stringify(D.bossHpMult)};
  G.data.areas.forEach((a, i) => { if (a.boss && BM[i] != null) a.boss.hpMult = BM[i]; });
  const last = G.data.areas[G.data.areas.length - 1];
  if (last.mapBoss) last.mapBoss.hpMult = ${D.okhraHpMult};
})(G);
`;

// ---- passivesPatch: escala global dos custos de unlock (forma mantida; §9 item 8) ----
const passivesPatch = `
;(function (G) {
  const S = ${D.treeCostScale};
  G.passives.unlockByDepth = G.passives.unlockByDepth.map(function (c) { return Math.max(1, Math.round(c * S)); });
  G.passives.evoFactor = ${D.treeEvoFactor};
  G.passives.evoRamp   = ${D.treeEvoRamp};
  G.passives.UNIT.atkPct = ${D.treeAtkPctUnit};
})(G);
`;

const cand = {
  dial: {
    v9: `família re-ancorada (hp1 ${D.hp1} atk1 ${D.atk1} topo ${D.hpEndTarget.toExponential(1)}) · ` +
        `gear weaponPL ${D.weaponPerLevel} armorPL ${D.armorPerLevel} · okhra ${D.okhraHpMult} · tree ×${D.treeCostScale} · ` +
        `SRC bakeado c/ mecânicas r4 (dois materiais, Corona gateado, First Light novo, afixos novos, onda 4-5, threshold 200, Golden Wake 0.6, player 15/50)`,
  },
  dataPatch,
  ...(passivesPatch ? { passivesPatch } : {}),
};

fs.writeFileSync(CAND_PATH, JSON.stringify(cand, null, 2));
console.log('candidate_v9.json escrito.');
console.log(`hpY por grupo:  ${hpY.map(y => y.toFixed(3)).join('  ')}`);
console.log(`atkY por grupo: ${atkY.map(y => y.toFixed(3)).join('  ')}`);
console.log(`HP:  area1=[${HP_SEED[0][0]},${HP_SEED[0][1]}]  area18 topo=${HP_SEED[17][1].toExponential(2)}`);
console.log(`ATK: area1=${ATK_SEED[0]}  area18=${ATK_SEED[17].toExponential(2)}`);
