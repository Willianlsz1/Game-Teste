#!/usr/bin/env node
// P9.1 — fitter iterativo: roda o sim com o candidato, mede HTK/TTD reais nas
// entradas de área e re-ajusta hp[]/mobAtk por RAZÃO até convergir.
// Alvos (SPEC §2.3): HTK entrada — área 1 = 2.5, demais = 10 (parede visível);
// HTK saída de banda = 3 (dmg na saída da área i ≈ dmg na entrada da i+1,
// níveis contíguos). TTD entrada = 25s.
// Uso: node p9_fit.js candidate_v1.json [passes]
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const candFile = process.argv[2] || 'candidate_v1.json';
const MAX_PASS = +(process.argv[3] || 10);
const DIR = __dirname;
const HTK_ENTRY = (i) => (i === 0 ? 2.5 : 10);
const HTK_EXIT = 3;
const TTD_ENTRY = 25;

function loadCand() { return JSON.parse(fs.readFileSync(path.join(DIR, candFile), 'utf8')); }
function saveCand(c) { fs.writeFileSync(path.join(DIR, candFile), JSON.stringify(c, null, 2)); }

function parseArrays(cand) {
  const hp = JSON.parse(cand.dataPatch.match(/const HP = (\[\[.*?\]\]);/s)[1]);
  const atk = JSON.parse(cand.dataPatch.match(/mobAtkByArea = (\[.*?\]);/s)[1]);
  return { hp, atk };
}
function writeArrays(cand, hp, atk) {
  cand.dataPatch = cand.dataPatch
    .replace(/const HP = \[\[.*?\]\];/s, `const HP = ${JSON.stringify(hp)};`)
    .replace(/mobAtkByArea = \[.*?\];/s, `mobAtkByArea = ${JSON.stringify(atk)};`);
}

for (let pass = 1; pass <= MAX_PASS; pass++) {
  execSync(`node "${path.join(DIR, 'p9_run_fit.js')}" ${candFile} entries.json baseline --to-level 99999 --hours 80 --seed 1`,
    { cwd: DIR, stdio: 'pipe' });
  const cap = JSON.parse(fs.readFileSync(path.join(DIR, 'entries.json'), 'utf8'));
  const cand = loadCand();
  const { hp, atk } = parseArrays(cand);

  const measured = new Map();
  for (const e of cap.entries) measured.set(e.area - 1, e); // primeira entrada por área

  let maxDev = 0, lastHtkRatio = 1, lastTtdRatio = 1, reached = -1;
  const newHp = hp.map(r => r.slice());
  const newAtk = atk.slice();

  for (let i = 0; i < 18; i++) {
    const e = measured.get(i);
    let htkRatio, ttdRatio;
    if (e) {
      reached = i;
      htkRatio = HTK_ENTRY(i) / Math.max(e.htk, 0.01);
      ttdRatio = Math.max(e.ttd, 0.1) / TTD_ENTRY;
      lastHtkRatio = htkRatio; lastTtdRatio = ttdRatio;
      maxDev = Math.max(maxDev, Math.abs(Math.log(htkRatio)), Math.abs(Math.log(ttdRatio)));
    } else { // não alcançada: carrega a última razão medida (extrapolação)
      htkRatio = lastHtkRatio; ttdRatio = lastTtdRatio;
    }
    newHp[i][0] = Math.max(10, Math.round(hp[i][0] * htkRatio));
    newAtk[i] = Math.max(1, Math.round(atk[i] * ttdRatio));
  }
  // saídas de banda: HP[i][1] = HP_entrada[i+1] × (HTK_EXIT / HTK_ENTRY(i+1))
  for (let i = 0; i < 17; i++) newHp[i][1] = Math.max(newHp[i][0], Math.round(newHp[i + 1][0] * HTK_EXIT / HTK_ENTRY(i + 1)));
  const g17 = newHp[17][0] / Math.max(newHp[16][0], 1);
  newHp[17][1] = Math.round(newHp[17][0] * Math.max(g17 * HTK_EXIT / 10, 1.5));

  writeArrays(cand, newHp, newAtk);
  saveCand(cand);
  console.log(`pass ${pass}: alcancou area ${reached + 1} · nivel final ${cap.finalLevel} · maxDev(log) ${maxDev.toFixed(3)} · area18 topo ${newHp[17][1].toExponential(2)}`);
  if (reached === 17 && maxDev < 0.12) { console.log('CONVERGIU'); break; }
}
