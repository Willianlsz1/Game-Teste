#!/usr/bin/env node
// P9.4 — v6 = candidate_v5.json com o passivesPatch AJUSTADO às folhas novas do P9.
//
// A árvore antiga levava UNIT×3 em TODAS as chaves (menos atkSpeed, que ganhava ×2).
// No P9 duas folhas trocaram de efeito:
//   folha 7  Prospector's Eye (lumensPct)  → Golden Wake (goldenWake, UNIT 1.0 já calibrada)
//   folha 13 Quickened Pulse (atkSpeed)    → Executioner's Light (executioner, UNIT 0.8 já calibrada)
// goldenWake/executioner NÃO recebem ×3 (nascem no cap Mapa 1); a linha U.atkSpeed*=2 SOME.
// Só as chaves ANTIGAS de stat mantêm o ×3 do candidato v5.
'use strict';
const fs = require('fs');
const path = require('path');

const v5 = JSON.parse(fs.readFileSync(path.join(__dirname, 'candidate_v5.json'), 'utf8'));

// chaves ANTIGAS de stat que mantêm o ×3 (mecânica ou %-silencioso do tronco/folhas que ficaram).
// goldenWake e executioner ficam de FORA (já calibradas); atkSpeed/lumensPct não existem mais.
const X3_KEYS = ['firstSpark', 'hpRegen', 'healOnKill', 'hpPct', 'damageReduction', 'atkPct',
  'critRate', 'xpPct', 'convPointsPct', 'overkillEcho', 'critDmg', 'lightbane', 'bossDmg', 'ringCloses'];

const passivesPatch = `
;(function (G) {
  const U = G.passives.UNIT;
  const X3 = ${JSON.stringify(X3_KEYS)};
  for (const k of X3) if (U[k] != null) U[k] = U[k] * 3;
  G.passives.unlockByDepth = [150, 300, 700, 1600];
  G.passives.evoFactor = 0.5;
  G.passives.evoRamp = 1.9;
})(G);
`;

const v6 = {
  dial: Object.assign({}, v5.dial, {
    v6: 'passivesPatch P9: ×3 só nas chaves antigas de stat · goldenWake/executioner sem ×3 · atkSpeed×2 removido',
  }),
  dataPatch: v5.dataPatch,
  econPatch: v5.econPatch,
  passivesPatch,
  statePatch: v5.statePatch,
};

fs.writeFileSync(path.join(__dirname, 'candidate_v6.json'), JSON.stringify(v6, null, 2));
console.log('candidate_v6.json gerado — ×3 em ' + X3_KEYS.length + ' chaves antigas; goldenWake/executioner intactas; atkSpeed×2 removido');
