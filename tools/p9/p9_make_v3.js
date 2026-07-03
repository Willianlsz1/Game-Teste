#!/usr/bin/env node
// P9.1c — candidato v3 = v2 + relogio (desaceleracao) + bosses ratio-fitados:
//   (1) mata o acelerador de XP do P7 (xpMultByGroup -> 1s) e sobe xpCurveExp
//   (2) hpMult POR BOSS ratio-fitado da campanha v2 (alvo HTK ~30; Okhra ~90)
//   (3) requisito de material 75k (meio da banda 30k-100k do dono)
'use strict';
const fs = require('fs');
const path = require('path');

const v2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'candidate_v2.json'), 'utf8'));

// ratio-fit dos bosses (medidos na campanha v2, seed 1):
// H1 87 -> 30 · H2 68 -> 30 · H3 11 -> 30 · H4 2 -> 30 · H5 9 -> 30 · H6 1 -> 30 · Okhra 1 -> 90
const BOSS_MULT = { 2: 1.9, 5: 2.4, 8: 15, 11: 82, 14: 18, 17: 165 };
const OKHRA_MULT = 810;

const dataExtra = `
;(function (G) {
  G.data.balance.xpMultByGroup = [1, 1, 1, 1, 1, 1];
  G.data.balance.xpCurveExp = 1.78;
  G.data.awakens[0].requirements.materials.firstLight = 75000;
  const BM = ${JSON.stringify(BOSS_MULT)};
  G.data.areas.forEach((a, i) => { if (a.boss && BM[i] != null) a.boss.hpMult = BM[i]; });
  const last = G.data.areas[G.data.areas.length - 1];
  if (last.mapBoss) last.mapBoss.hpMult = ${OKHRA_MULT};
})(G);
`;

const v3 = {
  dial: Object.assign({}, v2.dial, {
    v3: 'xpMult 1s · xpCurveExp 1.78 · firstLight 75k · boss hpMult ratio-fit v2 · okhra 810',
  }),
  dataPatch: v2.dataPatch + dataExtra,
  econPatch: v2.econPatch,
  passivesPatch: v2.passivesPatch,
  statePatch: v2.statePatch,
};

fs.writeFileSync(path.join(__dirname, 'candidate_v3.json'), JSON.stringify(v3, null, 2));
console.log('candidate_v3.json gerado (base: v2 + relogio + bosses)');
