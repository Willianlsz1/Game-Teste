#!/usr/bin/env node
// P9.1 — runner de candidato: intercepta o load dos módulos feito pelo
// tools/sim.js e injeta o patch do candidato. O sim roda INTACTO (zero fork).
// Uso: node p9_run.js candidate_v1.json baseline --hours 40 --seed 1
'use strict';
const fs = require('fs');
const path = require('path');

const candFile = process.argv[2];
const cand = JSON.parse(fs.readFileSync(path.join(__dirname, candFile), 'utf8'));

// argv que o sim.js vai enxergar
process.argv = [process.argv[0], 'sim.js', ...process.argv.slice(3)];

const realRead = fs.readFileSync;
fs.readFileSync = function (p, enc) {
  let src = realRead.call(fs, p, enc);
  const base = typeof p === 'string' ? path.basename(p) : '';
  if (base === 'data.js') {
    src = src + '\n' + cand.dataPatch;
  } else if (base === 'economy.js' && cand.econPatch) {
    src = src + '\n' + cand.econPatch;
  } else if (base === 'passives.js' && cand.passivesPatch) {
    src = src + '\n' + cand.passivesPatch;
  } else if (base === 'state.js') {
    const sp = cand.statePatch;
    if (!src.includes(sp.from1) || !src.includes(sp.from2)) {
      throw new Error('P9 statePatch: âncora não encontrada no state.js — atualizar gerador');
    }
    src = src.replace(sp.from1, sp.to1).replace(sp.from2, sp.to2);
  }
  return src;
};

require('C:\\Users\\KABUM\\Desktop\\eclats_of_lumiere\\tools\\sim.js');
