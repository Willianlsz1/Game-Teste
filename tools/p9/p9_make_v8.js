#!/usr/bin/env node
// P9.6 — maker do candidato v8 (rodada 2 de playtest do dono).
// O src JÁ é o bake v7; o v8 carrega SÓ os deltas da rodada 2 como patches, MAIS
// os arrays de área (HP/mobAtk) seedados do v7 para que p9_fit.js possa re-fitá-los
// depois de mexermos na composição do dano (o fitter lê/escreve `const HP=` e
// `mobAtkByArea=` no dataPatch). v8 NÃO tem statePatch (curvas do player já vivem
// em data.balance pós-bake; patchamos via dataPatch).
//
// ALVOS (docs/design/P9_REBALANCE.md §8):
//  A. crit real ~45 no fim (<=50 gate): gloves crit perLevel + tree critRate para baixo.
//  B. Overcrit sai do Mapa 1: gloves uncommonAffix vira Fracture Sense (critDmg %).
//  C. gear+passivas >= 75% do ATK: playerAtkCoef/Exp para baixo, weapon/tree atkPct para cima.
//  D. todos os gates do §7 mantidos (relógio 36±2, Okhra 60-120, coroa 8-11, re-subida).
//
// Uso: node p9_make_v8.js   (grava candidate_v8.json)
'use strict';
const fs = require('fs');
const path = require('path');

// ---- arrays seed (= v7 bake, iguais aos de src/data.js) ----
// Se candidate_v8.json JÁ existe (arrays fitados), PRESERVA-os por padrão — assim
// regenerar por mudança de dial que NÃO afeta o fit (matScale, boss, okhra) não perde
// o fit. Passe `--reseed` p/ forçar os arrays de volta ao seed v7 (quando um dial que
// afeta o dano muda e um re-fit vai rodar de qualquer forma).
const V7_HP = [[2584,104957],[349857,800178],[2667261,2667261],[6693870,6693870],[12123953,12123953],[19302327,19302327],[22818714,290026931],[966756435,966756435],[1354200911,1354200911],[1653628261,1653628261],[1858231353,20649847393],[68832824643,68832824643],[97749688304,97749688304],[113168313595,113168313595],[310162551483,310162551483],[417438402162,417438402162],[502538281661,502538281661],[431768682174,647653023261]];
const V7_ATK = [40,616,4391,4971,8342,12498,18481,23939,30245,680187,783113,954409,1174337,1348758,3475185,4402042,5221176,6638968];
let HP_SEED = V7_HP, ATK_SEED = V7_ATK;
const RESEED = process.argv.includes('--reseed');
const CAND_PATH = path.join(__dirname, 'candidate_v8.json');
if (!RESEED && fs.existsSync(CAND_PATH)) {
  try {
    const prev = JSON.parse(fs.readFileSync(CAND_PATH, 'utf8'));
    const hpM = prev.dataPatch.match(/const HP = (\[\[.*?\]\]);/s);
    const atkM = prev.dataPatch.match(/mobAtkByArea = (\[.*?\]);/s);
    if (hpM && atkM) { HP_SEED = JSON.parse(hpM[1]); ATK_SEED = JSON.parse(atkM[1]); console.error('(preservando arrays fitados de candidate_v8.json — use --reseed p/ voltar ao seed v7)'); }
  } catch (e) {}
}

// ================= DIALS v8 =================
const D = {
  // C — composição: player ATK/HP menos dominante no flat de nível
  playerAtkCoef: 8,      // v7: 8
  playerAtkExp:  1.42,   // v7: 1.5  (rebaixa o flat de Character Level, mas sem matar o alcance do baseline p/ o fit)
  playerHpCoef:  4,      // v7: 4
  playerHpExp:   1.40,   // v7: 1.45 (acompanha o ATK p/ manter TTD de entrada ~25s)
  weaponPerLevel: 300,   // v7: 220  (gear flat sobe p/ compensar o level rebaixado)
  armorPerLevel:  80,    // v7: 60   (HP do gear acompanha)
  treeAtkPctMult: 1.5,   // multiplica a UNIT.atkPct (v7 = 30 pós-×6) p/ passivas pesarem mais
  // A — crit real ~45 no fim
  glovesCritPerLevel: 0.0022,  // v7: 0.025  (×statMult 8; ~1160 níveis de gloves -> ~20 de crit)
  treeCritRateUnit:   2,       // v7: 15 (pós-×6)  (10 níveis -> +20 crit)
  // B — Overcrit -> Fracture Sense (critDmg %)
  fractureSensePerLevel: 0.010, // % critDmg por nível de gloves (uncommon)
  // D — relógio / bosses (re-ajuste pós-mudança de composição)
  xpCurveExp:    1.9,    // v7: 1.9 (relógio; sobe = late-game mais lento)
  matScaleExtra: 0.56,   // multiplicador EXTRA sobre a drop de awakenMaterial (o src já tem ×0.54; <1 estica o relógio) — alvo FL ~36h
  okhraHpMult:   690,    // fit v8 (era 323): Okhra ~90 golpes (seed 1)
  // boss hpMults por área {2,5,8,11,14,17} — re-fit v8 pós-arrays (ratio 30/HTK, 2 iterações)
  bossHpMult: { 2: 0.45, 5: 3.6, 8: 24.3, 11: 32.9, 14: 8.5, 17: 21.9 },
};

// ---- dataPatch (aplicado APÓS o data.js do bake v7; sobrescreve os dials) ----
const dataPatch = `
;(function (G) {
  // arrays de área — seed v7; re-fitados por p9_fit.js quando a composição muda o dano.
  const HP = ${JSON.stringify(HP_SEED)};
  G.data.areas.forEach((a, i) => { a.hp = HP[i]; });
  G.data.balance.mobAtkByArea = ${JSON.stringify(ATK_SEED)};

  // C — player: rebaixa o flat de Character Level (exp), sobe gear flat
  G.data.balance.playerAtkCoef = ${D.playerAtkCoef};
  G.data.balance.playerAtkExp  = ${D.playerAtkExp};
  G.data.balance.playerHpCoef  = ${D.playerHpCoef};
  G.data.balance.playerHpExp   = ${D.playerHpExp};
  const gb = G.data.gearBase;
  gb.weapon.affixes[0].perLevel = ${D.weaponPerLevel};
  gb.armor.affixes[0].perLevel  = ${D.armorPerLevel};

  // A — crit real: gloves crit afixo + fica pro tree no passivesPatch
  gb.gloves.affixes[0].perLevel = ${D.glovesCritPerLevel};

  // B — Overcrit SAI do Mapa 1: gloves uncommonAffix vira Fracture Sense (critDmg %).
  gb.gloves.uncommonAffixes = [
    { id: "critDmgP", label: "Fracture Sense", stat: "critDmg", layer: "pct", base: 0, perLevel: ${D.fractureSensePerLevel} }
  ];

  // D — relógio + bosses
  G.data.balance.xpCurveExp = ${D.xpCurveExp};
  const BM = ${JSON.stringify(D.bossHpMult)};
  G.data.areas.forEach((a, i) => { if (a.boss && BM[i] != null) a.boss.hpMult = BM[i]; });
  const last = G.data.areas[G.data.areas.length - 1];
  if (last.mapBoss) last.mapBoss.hpMult = ${D.okhraHpMult};
})(G);
`;

// ---- econPatch: SÓ um multiplicador EXTRA opcional sobre a drop de awakenMaterial ----
// O src já tem o ×0.54 do v7 bakeado; este fator (matScaleExtra) só estica/comprime o
// relógio do First Light quando != 1. Aplicado sobre o valor JÁ bakeado (não re-aplica o 0.54).
const econPatch = D.matScaleExtra === 1 ? undefined : `
;(function (G) {
  const S = ${D.matScaleExtra};
  const dt = G.economy.dropTable;
  for (const t of ['common', 'rare', 'boss']) {
    const d = dt[t] && dt[t].awakenMaterial;
    if (d) { d.min = Math.max(1, Math.round(d.min * S)); d.max = Math.max(d.min, Math.round(d.max * S)); }
  }
})(G);
`;

// ---- passivesPatch (aplicado APÓS o passives.js) ----
// v7 já aplicou ×3/×6 nas UNIT. Aqui só ajustamos critRate (A) e atkPct (C) por FATOR
// relativo ao valor já bakeado no src (passives.js do src NÃO tem os ×3 — eles vivem no
// passivesPatch do v7). PORÉM o src é o BAKE: as UNIT já estão nos valores finais v7.
// Então setamos critRate e atkPct para valores ABSOLUTOS v8.
const passivesPatch = `
;(function (G) {
  const U = G.passives.UNIT;
  // A — critRate absoluto v8 (v7: 15)
  U.critRate = ${D.treeCritRateUnit};
  // C — atkPct sobe p/ passivas pesarem no ATK (v7: 30)
  U.atkPct = Math.round(30 * ${D.treeAtkPctMult});
})(G);
`;

const cand = {
  dial: {
    v8: `A:crit real ~45 (gloves perLevel ${D.glovesCritPerLevel} + tree critRate ${D.treeCritRateUnit}) · ` +
        `B:Overcrit->Fracture Sense critDmg% ${D.fractureSensePerLevel}/lvl · ` +
        `C:playerAtkExp ${D.playerAtkExp} playerHpExp ${D.playerHpExp} weaponPL ${D.weaponPerLevel} armorPL ${D.armorPerLevel} atkPct x${D.treeAtkPctMult}`,
  },
  dataPatch,
  // econPatch só presente se matScaleExtra != 1 (o ×0.54 do v7 já está bakeado no src).
  ...(econPatch ? { econPatch } : {}),
  passivesPatch,
};

fs.writeFileSync(path.join(__dirname, 'candidate_v8.json'), JSON.stringify(cand, null, 2));
console.log('candidate_v8.json escrito. dials:', JSON.stringify(D, null, 2));
