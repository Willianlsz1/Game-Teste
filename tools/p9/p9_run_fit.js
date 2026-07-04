#!/usr/bin/env node
// P9.1 — variante do runner que CAPTURA sim.areaEntries em JSON (pro fitter).
// Uso: node p9_run_fit.js candidate.json out_entries.json [args do sim...]
'use strict';
const fs = require('fs');
const path = require('path');

const candFile = process.argv[2];
const outFile = process.argv[3];
const cand = JSON.parse(fs.readFileSync(path.join(__dirname, candFile), 'utf8'));

process.argv = [process.argv[0], 'sim.js', ...process.argv.slice(4)];

const realRead = fs.readFileSync;
const CAPTURE_ANCHOR = 'const sim = freshSim({ gate: 1e9 });';
fs.readFileSync = function (p, enc) {
  let src = realRead.call(fs, p, enc);
  const base = typeof p === 'string' ? path.basename(p) : '';
  if (base === 'data.js') {
    src = src + '\n' + cand.dataPatch;
  } else if (base === 'economy.js' && cand.econPatch) {
    src = src + '\n' + cand.econPatch;
  } else if (base === 'passives.js' && cand.passivesPatch) {
    src = src + '\n' + cand.passivesPatch;
  } else if (base === 'state.js' && cand.statePatch) {
    const sp = cand.statePatch;
    if (!src.includes(sp.from1) || !src.includes(sp.from2)) throw new Error('P9 statePatch: ancora nao encontrada');
    src = src.replace(sp.from1, sp.to1).replace(sp.from2, sp.to2);
  } else if (base === 'sim.js') {
    if (!src.includes(CAPTURE_ANCHOR)) throw new Error('P9 capture: ancora nao encontrada no sim.js');
    src = src.replace(CAPTURE_ANCHOR, 'const sim = global.__p9cap = freshSim({ gate: 1e9 });');
    const absOut = path.join(__dirname, outFile);
    src += `\n;process.on('exit', () => { try { if (global.__p9cap) require('fs').writeFileSync(${JSON.stringify(absOut)}, JSON.stringify({ entries: global.__p9cap.areaEntries, timedOut: !!global.__p9cap.timedOut, finalLevel: G.state.data.level })); } catch (e) {} });\n`;
  }
  return src;
};

require('C:\\Users\\KABUM\\Desktop\\eclats_of_lumiere\\tools\\sim.js');
