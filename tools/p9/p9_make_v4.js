#!/usr/bin/env node
// P9.1d — v4 = v3 + relogio mais duro no meio + okhra ratio-fit v3 (5 -> 90)
'use strict';
const fs = require('fs');
const path = require('path');

const v3 = JSON.parse(fs.readFileSync(path.join(__dirname, 'candidate_v3.json'), 'utf8'));

const extra = `
;(function (G) {
  G.data.balance.xpCurveExp = 1.9;
  G.data.balance.convGateGrowth = 1.35;
  const last = G.data.areas[G.data.areas.length - 1];
  if (last.mapBoss) last.mapBoss.hpMult = 15000;
})(G);
`;

const v4 = {
  dial: Object.assign({}, v3.dial, { v4: 'xpCurveExp 1.9 · gateGrowth 1.35 · okhra 15000' }),
  dataPatch: v3.dataPatch + extra,
  econPatch: v3.econPatch,
  passivesPatch: v3.passivesPatch,
  statePatch: v3.statePatch,
};
fs.writeFileSync(path.join(__dirname, 'candidate_v4.json'), JSON.stringify(v4, null, 2));
console.log('candidate_v4.json gerado');
