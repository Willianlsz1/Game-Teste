#!/usr/bin/env node
// P9.1e — v5 = v4 + boss-fit final (ratio-fit iterativo sobre a campanha v4).
// Os hpMult dos 6 Harbingers (por indice de area {2,5,8,11,14,17}) e do Okhra
// (mapBoss do ultimo) sao os UNICOS dials mexidos aqui. Editar BOSS_MULT/OKHRA
// e re-rodar `node p9_make_v5.js` a cada iteracao do ratio-fit.
// Depois: `node p9_run.js candidate_v5.json campaign --max-hours 120 --seed 1`
'use strict';
const fs = require('fs');
const path = require('path');

const v4 = JSON.parse(fs.readFileSync(path.join(__dirname, 'candidate_v4.json'), 'utf8'));

// ==== DIALS DA FASE 1 (boss-fit) ====
// chute inicial por razao: novo = mult_v4 × alvo/medido
// v4 medido (seed 1): H1 118 · H2 12 · H3 5 · H4 448 · H5 868 · H6 357 · Okhra 6477
// alvo: Harbingers 30 HTK · Okhra 90 golpes
let BOSS_MULT = { 2: 0.483, 5: 3.0, 8: 90, 11: 5.49, 14: 1.33, 17: 13.87 };
let OKHRA_MULT = 208;

// ==== DIALS DA FASE 2 (relogio fino) ==== (mexer so na fase 2)
let FIRST_LIGHT_REQ = 100000;   // teto do dono 100000
let XP_CURVE_EXP = 1.9;        // passos de +0.02

const dataExtra = `
;(function (G) {
  const BM = ${JSON.stringify(BOSS_MULT)};
  G.data.areas.forEach((a, i) => { if (a.boss && BM[i] != null) a.boss.hpMult = BM[i]; });
  const last = G.data.areas[G.data.areas.length - 1];
  if (last.mapBoss) last.mapBoss.hpMult = ${OKHRA_MULT};
  G.data.awakens[0].requirements.materials.firstLight = ${FIRST_LIGHT_REQ};
  G.data.balance.xpCurveExp = ${XP_CURVE_EXP};
})(G);
`;

const v5 = {
  dial: Object.assign({}, v4.dial, {
    v5: `boss-fit: BM=${JSON.stringify(BOSS_MULT)} okhra=${OKHRA_MULT} · firstLight=${FIRST_LIGHT_REQ} · xpCurveExp=${XP_CURVE_EXP}`,
  }),
  dataPatch: v4.dataPatch + dataExtra,
  econPatch: v4.econPatch,
  passivesPatch: v4.passivesPatch,
  statePatch: v4.statePatch,
};

fs.writeFileSync(path.join(__dirname, 'candidate_v5.json'), JSON.stringify(v5, null, 2));
console.log('candidate_v5.json gerado — BM=' + JSON.stringify(BOSS_MULT) + ' okhra=' + OKHRA_MULT +
  ' firstLight=' + FIRST_LIGHT_REQ + ' xpCurveExp=' + XP_CURVE_EXP);
