#!/usr/bin/env node
// P9.6 — fitter v8 (variante AMORTECIDA de p9_fit.js). O fit do v8 oscila porque o
// baseline sem prestige é bi-estável no muro de G4/G5 (alcança área 12 OU 18 conforme
// a escala do HP). Duas defesas vs a p9_fit.js original:
//   1. DAMPING: aplica a razão elevada a `damp` (<1) — move parte do caminho por passo.
//   2. BEST-PASS: guarda o candidato do MELHOR passo (área alcançada máxima, depois
//      menor maxDev) e restaura-o no fim, em vez de deixar o último passo (que pode ser
//      um passo ruim da oscilação) gravado.
// Uso: node p9_fit_v8.js candidate_v8.json [passes] [damp]
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const candFile = process.argv[2] || 'candidate_v8.json';
const MAX_PASS = +(process.argv[3] || 20);
const DAMP = +(process.argv[4] || 0.6);
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

let best = null; // { reached, maxDev, dataPatch }

for (let pass = 1; pass <= MAX_PASS; pass++) {
  execSync(`node "${path.join(DIR, 'p9_run_fit.js')}" ${candFile} entries.json baseline --to-level 99999 --hours 80 --seed 1`,
    { cwd: DIR, stdio: 'pipe' });
  const cap = JSON.parse(fs.readFileSync(path.join(DIR, 'entries.json'), 'utf8'));
  const cand = loadCand();
  const { hp, atk } = parseArrays(cand);

  const measured = new Map();
  for (const e of cap.entries) measured.set(e.area - 1, e);

  let maxDev = 0, lastHtkRatio = 1, lastTtdRatio = 1, reached = -1;
  const newHp = hp.map(r => r.slice());
  const newAtk = atk.slice();
  const damp = (r) => Math.pow(r, DAMP);

  for (let i = 0; i < 18; i++) {
    const e = measured.get(i);
    let htkRatio, ttdRatio;
    if (e) {
      reached = i;
      htkRatio = HTK_ENTRY(i) / Math.max(e.htk, 0.01);
      ttdRatio = Math.max(e.ttd, 0.1) / TTD_ENTRY;
      lastHtkRatio = htkRatio; lastTtdRatio = ttdRatio;
      maxDev = Math.max(maxDev, Math.abs(Math.log(htkRatio)), Math.abs(Math.log(ttdRatio)));
    } else { htkRatio = lastHtkRatio; ttdRatio = lastTtdRatio; }
    newHp[i][0] = Math.max(10, Math.round(hp[i][0] * damp(htkRatio)));
    newAtk[i] = Math.max(1, Math.round(atk[i] * damp(ttdRatio)));
  }
  for (let i = 0; i < 17; i++) newHp[i][1] = Math.max(newHp[i][0], Math.round(newHp[i + 1][0] * HTK_EXIT / HTK_ENTRY(i + 1)));
  const g17 = newHp[17][0] / Math.max(newHp[16][0], 1);
  newHp[17][1] = Math.round(newHp[17][0] * Math.max(g17 * HTK_EXIT / 10, 1.5));

  writeArrays(cand, newHp, newAtk);
  saveCand(cand);

  // pontuação do passo: reached (maior melhor), depois maxDev (menor melhor).
  // Guardamos o dataPatch DESTE passo (o que produziu a medição), i.e. o de ENTRADA,
  // não o recém-escrito — a medição reflete o array vigente antes da escrita.
  const scoreReached = reached;
  const better = !best || scoreReached > best.reached || (scoreReached === best.reached && maxDev < best.maxDev);
  if (reached === 17 && better) {
    // o array MEDIDO neste passo é o `hp`/`atk` de entrada (pré-escrita) — esse é o que deu HTK bom.
    const measuredCand = loadCand();
    writeArrays(measuredCand, hp, atk);
    best = { reached, maxDev, dataPatch: measuredCand.dataPatch };
  }
  console.log(`pass ${pass}: area ${reached + 1} · lvl ${cap.finalLevel} · maxDev ${maxDev.toFixed(3)} · topo ${newHp[17][1].toExponential(2)}` + (best ? ` · best(area18 maxDev ${best.maxDev.toFixed(3)})` : ''));
  if (reached === 17 && maxDev < 0.15) { console.log('CONVERGIU (passo atual)'); break; }
}

if (best) {
  const cand = loadCand();
  cand.dataPatch = best.dataPatch;
  saveCand(cand);
  console.log(`\n➤ RESTAURADO melhor passo: area 18 · maxDev ${best.maxDev.toFixed(3)}`);
} else {
  console.log('\n⚠ nenhum passo alcançou área 18 — arrays do último passo mantidos');
}
