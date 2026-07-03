#!/usr/bin/env node
// P9.1b — candidato v2 = arrays fitados do v1 + 3 decisões do dono:
//   (1) awaken material vira MASSA: drop por mob comum G5+, requisito 50k
//   (2) boss hpMult por formula (alvo HTK ~30 no meio da banda => ~5.5)
//   (3) poder da re-subida na ARVORE: UNIT x3, custos socados, convLegacy 8->2
'use strict';
const fs = require('fs');
const path = require('path');

const v1 = JSON.parse(fs.readFileSync(path.join(__dirname, 'candidate_v1.json'), 'utf8'));

const econPatch = `
;(function (G) {
  const dt = G.economy.dropTable;
  dt.common.awakenMaterial = { chance: 1, min: 1, max: 3, minAreaIndex: 12 };
  dt.rare.awakenMaterial   = { chance: 1, min: 4, max: 10, minAreaIndex: 12 };
  dt.boss.awakenMaterial   = { chance: 1, min: 600, max: 1500, minAreaIndex: 12 };
})(G);
`;

const dataExtra = `
;(function (G) {
  G.data.awakens[0].requirements.materials.firstLight = 50000;
  G.data.areas.forEach((a) => { if (a.boss) a.boss.hpMult = 5.5; });
  const last = G.data.areas[G.data.areas.length - 1];
  if (last.mapBoss) last.mapBoss.hpMult = 9;
  G.data.balance.convLegacyAtkPct = 2;
  G.data.balance.convLegacyHpPct = 2;
})(G);
`;

const passivesPatch = `
;(function (G) {
  const U = G.passives.UNIT;
  for (const k of Object.keys(U)) if (k !== '_default' && k !== 'atkSpeed') U[k] = U[k] * 3;
  U.atkSpeed = U.atkSpeed * 2;
  G.passives.unlockByDepth = [150, 300, 700, 1600];
  G.passives.evoFactor = 0.5;
  G.passives.evoRamp = 1.9;
})(G);
`;

const v2 = {
  dial: Object.assign({}, v1.dial, {
    v2: 'awaken massa 50k · boss hpMult 5.5 · arvore x3 custosa · convLegacy 2%',
  }),
  dataPatch: v1.dataPatch + dataExtra,
  econPatch,
  passivesPatch,
  statePatch: v1.statePatch,
};

fs.writeFileSync(path.join(__dirname, 'candidate_v2.json'), JSON.stringify(v2, null, 2));
console.log('candidate_v2.json gerado (base: arrays fitados do v1)');
