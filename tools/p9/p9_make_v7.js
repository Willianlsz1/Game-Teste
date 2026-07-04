#!/usr/bin/env node
// P9.5 — v7 = tuning final por cima de candidate_v6.json (mecânicas P9 já em src/).
// Todos os dials parametrizados no topo. Editar os DIALS e re-rodar
// `node p9_make_v7.js` a cada iteração; depois
// `node p9_run.js candidate_v7.json campaign --max-hours 120 --seed 1`.
//
// Alavancas (ordem de preferência do dono):
//  1. OKHRA_MULT     — mapBoss hpMult ratio-fit (v6: 208 → 126 golpes; alvo 60-120, mira 90).
//  2. MAT_SCALE      — escala do fluxo do material de Awaken (multiplica min/max do dropTable).
//                      < 1 => material mais lento => First Light mais tarde. NÃO mexer no req 100000.
//  2b XP_CURVE_EXP   — só se o material não bastar (passos ±0.02; exige re-fit das áreas via p9_fit.js).
//  3. TREE_OFF_MULT  — multiplicador EXTRA sobre as UNITs OFENSIVAS da árvore (firstSpark, atkPct,
//                      critRate, critDmg, lightbane), aplicado POR CIMA do ×3 do v6.
//                      Ex.: 1.0 = mantém ×3 do v6; 1.5 = ×4.5; 2.0 = ×6. Derrete a re-subida.
//     TREE_DEF_MULT  — idem pras defensivas (hpPct, damageReduction) se a re-subida reclamar TTD.
//  3b EVO_RAMP / UNLOCKS — custos da árvore, pra compensar o pacing (gates D: coroa 8-11, árvore <100%).
'use strict';
const fs = require('fs');
const path = require('path');

const v6 = JSON.parse(fs.readFileSync(path.join(__dirname, 'candidate_v6.json'), 'utf8'));

// ============================ DIALS v7 ============================
// -- Lever 1: Okhra --
let OKHRA_MULT = 323;          // v6 = 208

// -- Lever 2: relógio via material de Awaken --
let MAT_SCALE = 0.54;          // multiplica min/max do awakenMaterial (v6 = 1.0)
let XP_CURVE_EXP = 1.9;        // v6 = 1.9 (só mexer se material não bastar; exige re-fit)

// -- Lever 3: força da árvore (por cima do ×3 do v6) --
let TREE_OFF_MULT = 2.0;       // ofensivas: firstSpark, atkPct, critRate, critDmg, lightbane
let TREE_DEF_MULT = 1.0;       // defensivas: hpPct, damageReduction

// -- Lever 3b: custos da árvore (pacing) --
let EVO_RAMP = 1.7;            // v6 = 1.9 (pode subir até ~2.2)
let UNLOCKS = [100, 220, 500, 1200]; // v6 [150,300,700,1600]
// =================================================================

const OFF_KEYS = ['firstSpark', 'atkPct', 'critRate', 'critDmg', 'lightbane'];
const DEF_KEYS = ['hpPct', 'damageReduction'];

// v7 patch de dados: sobrescreve Okhra + xpCurveExp (aplicado por último, vence o v6)
const dataExtra = `
;(function (G) {
  const last = G.data.areas[G.data.areas.length - 1];
  if (last.mapBoss) last.mapBoss.hpMult = ${OKHRA_MULT};
  G.data.balance.xpCurveExp = ${XP_CURVE_EXP};
})(G);
`;

// v7 patch de economia: escala o fluxo do material (por cima do econPatch do v6)
const econExtra = `
;(function (G) {
  const S = ${MAT_SCALE};
  const dt = G.economy.dropTable;
  for (const t of ['common', 'rare', 'boss']) {
    const d = dt[t] && dt[t].awakenMaterial;
    if (d) { d.min = Math.max(0, Math.round(d.min * S)); d.max = Math.max(d.min, Math.round(d.max * S)); }
  }
})(G);
`;

// v7 patch de passivas: multiplicador EXTRA nas UNITs ofensivas/defensivas + custos
const passivesExtra = `
;(function (G) {
  const U = G.passives.UNIT;
  const OFF = ${JSON.stringify(OFF_KEYS)}, OFFM = ${TREE_OFF_MULT};
  const DEF = ${JSON.stringify(DEF_KEYS)}, DEFM = ${TREE_DEF_MULT};
  for (const k of OFF) if (U[k] != null) U[k] = U[k] * OFFM;
  for (const k of DEF) if (U[k] != null) U[k] = U[k] * DEFM;
  G.passives.unlockByDepth = ${JSON.stringify(UNLOCKS)};
  G.passives.evoRamp = ${EVO_RAMP};
})(G);
`;

const v7 = {
  dial: Object.assign({}, v6.dial, {
    v7: `okhra=${OKHRA_MULT} · matScale=${MAT_SCALE} · xpExp=${XP_CURVE_EXP} · treeOff=×${TREE_OFF_MULT} treeDef=×${TREE_DEF_MULT} · evoRamp=${EVO_RAMP} unlocks=${JSON.stringify(UNLOCKS)}`,
  }),
  dataPatch: v6.dataPatch + dataExtra,
  econPatch: v6.econPatch + econExtra,
  passivesPatch: v6.passivesPatch + passivesExtra,
  statePatch: v6.statePatch,
};

fs.writeFileSync(path.join(__dirname, 'candidate_v7.json'), JSON.stringify(v7, null, 2));
console.log('candidate_v7.json gerado — okhra=' + OKHRA_MULT + ' matScale=' + MAT_SCALE +
  ' xpExp=' + XP_CURVE_EXP + ' treeOff=×' + TREE_OFF_MULT + ' treeDef=×' + TREE_DEF_MULT +
  ' evoRamp=' + EVO_RAMP + ' unlocks=' + JSON.stringify(UNLOCKS));
