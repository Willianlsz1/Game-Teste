#!/usr/bin/env node
// Diagnóstico da re-subida: captura areaEntries e imprime, por área de parede,
// o nível/atk/mobHp/htk de CADA re-entrada (runs 2+) — pra entender o gap real.
// Uso: node p9_resubida_probe.js candidate_v7.json --seed 1
'use strict';
const fs = require('fs');
const path = require('path');

const candFile = process.argv[2];
const cand = JSON.parse(fs.readFileSync(path.join(__dirname, candFile), 'utf8'));
process.argv = [process.argv[0], 'sim.js', 'campaign', '--max-hours', '120', ...process.argv.slice(3)];

const realRead = fs.readFileSync;
const CAPTURE_ANCHOR = 'const sim = freshSim({ converge: true, push, allowAwaken: true });';
fs.readFileSync = function (p, enc) {
  let src = realRead.call(fs, p, enc);
  const base = typeof p === 'string' ? path.basename(p) : '';
  if (base === 'data.js') src += '\n' + cand.dataPatch;
  else if (base === 'economy.js' && cand.econPatch) src += '\n' + cand.econPatch;
  else if (base === 'passives.js' && cand.passivesPatch) src += '\n' + cand.passivesPatch;
  else if (base === 'state.js') {
    const sp = cand.statePatch;
    src = src.replace(sp.from1, sp.to1).replace(sp.from2, sp.to2);
  } else if (base === 'sim.js') {
    src = src.replace(CAPTURE_ANCHOR, 'const sim = global.__p9cap = freshSim({ converge: true, push, allowAwaken: true });');
    src += `\n;process.on('exit', () => {
      const sim = global.__p9cap; if (!sim) return;
      const es = sim.areaEntries;
      let maxPrev = -1, curRun = null, curMax = -1;
      const rows = [];
      for (const e of es) {
        const r = e.run || 1;
        if (r !== curRun) { maxPrev = Math.max(maxPrev, curMax); curRun = r; curMax = -1; }
        curMax = Math.max(curMax, e.area - 1);
        if (r >= 2 && (e.area - 1) <= maxPrev && e.htk != null && [3,4,5,12,13,14,15,16,17,18].includes(e.area)) {
          rows.push({ area: e.area, run: r, lvl: e.level, atk: e.atk, mobHp: e.mobHp, htk: +e.htk.toFixed(2) });
        }
      }
      console.log('\\n=== re-entradas nas áreas de parede ===');
      console.log('area run  lvl      atk           mobHp          htk');
      for (const r of rows) console.log(
        String(r.area).padEnd(5) + String(r.run).padEnd(4) + String(r.lvl).padEnd(9) +
        r.atk.toExponential(2).padEnd(14) + r.mobHp.toExponential(2).padEnd(15) + r.htk);
    });\n`;
  }
  return src;
};
require('C:\\Users\\KABUM\\Desktop\\eclats_of_lumiere\\tools\\sim.js');
