#!/usr/bin/env node
// P9.6 (v8) — probe de COMPOSICAO do ATK + CRIT real no fim do Mapa 1.
// Roda a campanha (sim.js campaign) e:
//  (A) nos checkpoints fim-de-grupo (última área de G2/G4/G6 = áreas 6/12/18),
//      na 1ª vez que o jogador alcança aquela área, lê o breakdown de ATK por fonte
//      (G.state.stats()._breakdown.atk) e reporta a fração (gear+passivas)/total.
//      Gate v8: >= 0.75 nos 3.
//  (B) no fim (Okhra caído/timeout): G.state.stats().crit (clamp 0-100) + critRaw.
//      Gate v8: crit <= 50.
//
// Atribuição do ATK (exata: as parcelas somam ao total):
//   total = flatTot × (1+pctTot/100) × mult.  Decompomos em camadas ANINHADAS:
//     • cada fonte FLAT f  -> f × (1+pctTot/100) × mult
//     • cada fonte PCT  p  -> flatTot × (p/100) × mult
//     • cada fonte MULT m  -> flatTot × (1+pctTot/100) × (m-1)  (só a coroa, Passives)
//   A soma dessas parcelas = flatTot×(1+pctTot/100)×mult exatamente (o bloco flat
//   soma flatTot; o bloco pct soma flatTot×(pctTot/100)×mult; juntos = flatTot×(1+pctTot/100)×mult;
//   a mult adiciona ×(m-1) sobre a base sem-mult flatTot×(1+pctTot/100)). Normalizamos pela soma.
//   gear+passivas = Equipment(flat) + Equipment(pct) + Passives(pct) + Passives(mult/coroa).
//
// Uso: node p9_comp_probe.js [candidate_v8.json] --seed 1
//      (sem candidato: mede o src atual = bake v7)
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let candFile = null;
if (args[0] && !args[0].startsWith('--')) candFile = args.shift();
const cand = candFile ? JSON.parse(fs.readFileSync(path.join(__dirname, candFile), 'utf8')) : null;

process.argv = [process.argv[0], 'sim.js', 'campaign', '--max-hours', '120', ...args];

const realRead = fs.readFileSync;
const CAPTURE_ANCHOR = 'const sim = freshSim({ converge: true, push, allowAwaken: true });';
fs.readFileSync = function (p, enc) {
  let src = realRead.call(fs, p, enc);
  const base = typeof p === 'string' ? path.basename(p) : '';
  if (cand && base === 'data.js') src += '\n' + cand.dataPatch;
  else if (cand && base === 'economy.js' && cand.econPatch) src += '\n' + cand.econPatch;
  else if (cand && base === 'passives.js' && cand.passivesPatch) src += '\n' + cand.passivesPatch;
  else if (cand && base === 'state.js' && cand.statePatch) {
    const sp = cand.statePatch;
    src = src.replace(sp.from1, sp.to1).replace(sp.from2, sp.to2);
  } else if (base === 'sim.js') {
    src = src.replace(CAPTURE_ANCHOR,
      'const sim = global.__p9cap = freshSim({ converge: true, push, allowAwaken: true }); global.__installCompHook();');
    // PREPEND: define __installCompHook + registra o exit-reporter ANTES do dispatch da campanha.
    // remove o shebang (linha 1) do sim.js — ele só é válido na 1ª linha do arquivo.
    src = src.replace(/^#![^\n]*\n/, '');
    src = HOOK + '\n' + src;
  }
  return src;
};

const HOOK = `
;(function () {
  const seen = {};
  const CKPT = [{ a: 6, k: 'G2' }, { a: 12, k: 'G4' }, { a: 18, k: 'G6' }];

  function atkComposition() {
    const G = global.G;
    const s = G.state.stats();
    const BD = s._breakdown && s._breakdown.atk;
    if (!BD) return null;
    let flatTot = 0, pctTot = 0, mult = 1;
    const flatBy = {}, pctBy = {}, multBy = {};
    for (const e of BD) {
      if (e.type === 'flat') { flatTot += e.amount; flatBy[e.source] = (flatBy[e.source] || 0) + e.amount; }
      else if (e.type === 'pct') { pctTot += e.amount; pctBy[e.source] = (pctBy[e.source] || 0) + e.amount; }
      else if (e.type === 'mult') { mult *= e.amount; multBy[e.source] = (multBy[e.source] || 1) * e.amount; }
    }
    const total = flatTot * (1 + pctTot / 100) * mult;
    const fE = flatBy['Equipment'] || 0, fL = flatBy['Character Level'] || 0, fB = flatBy['Base'] || 0;
    const pE = pctBy['Equipment'] || 0, pP = pctBy['Passives'] || 0, pC = pctBy['Convergence Legacy'] || 0;
    const k = (1 + pctTot / 100) * mult;
    const cFlatE = fE * k, cFlatL = fL * k, cFlatB = fB * k;
    const cPctE = flatTot * (pE / 100) * mult, cPctP = flatTot * (pP / 100) * mult, cPctC = flatTot * (pC / 100) * mult;
    const cMultP = flatTot * (1 + pctTot / 100) * (mult - 1);
    const sum = cFlatE + cFlatL + cFlatB + cPctE + cPctP + cPctC + cMultP;
    const gearPass = cFlatE + cPctE + cPctP + cMultP;
    return {
      total: Math.round(total), frac: sum > 0 ? gearPass / sum : 0,
      gearFlat: fE, levelFlat: fL, pE, pP, mult,
      cFlatE, cFlatL, cFlatB, cPctE, cPctP, cPctC, cMultP, sum,
    };
  }

  global.__installCompHook = function () {
    const G = global.G;
    const _tick = G.combat.tick.bind(G.combat);
    G.combat.tick = function (dt) {
      const r = _tick(dt);
      const ai = (G.state.data.areaIndex || 0) + 1;
      for (const c of CKPT) if (!seen[c.a] && ai >= c.a) { const comp = atkComposition(); if (comp) seen[c.a] = comp; }
      return r;
    };
  };

  process.on('exit', () => {
    const G = global.G;
    const s = G.state.stats();
    console.log('\\n=== COMPOSICAO DE ATK (gear+passivas / total) nos checkpoints fim-de-grupo ===');
    console.log('ckpt area total_ATK     frac(g+p)  gearFlat%   levelFlat%  passPct%   coroa%    gear+pass=Equip(flat+pct)+Pass(pct+coroa)');
    for (const cp of CKPT) {
      const c = seen[cp.a];
      if (!c) { console.log(cp.k.padEnd(5) + String(cp.a).padEnd(5) + '(nao amostrado — grupo nao alcancado)'); continue; }
      const pc = (x) => (100 * x / c.sum).toFixed(1) + '%';
      console.log(
        cp.k.padEnd(5) + String(cp.a).padEnd(5) +
        c.total.toExponential(2).padEnd(12) +
        c.frac.toFixed(3).padEnd(11) +
        pc(c.cFlatE).padEnd(12) + pc(c.cFlatL).padEnd(12) +
        pc(c.cPctP).padEnd(11) + pc(c.cMultP).padEnd(10) +
        (c.frac >= 0.75 ? '  >=0.75 OK' : '  <0.75 FAIL'));
    }
    console.log('  gate v8: frac(g+p) >= 0.75 nos 3 checkpoints');
    console.log('\\n=== CRIT no fim do Mapa 1 ===');
    console.log('crit (clamp 0-100): ' + s.crit.toFixed(2) + '  |  critRaw (sem teto): ' + s.critRaw.toFixed(2) + '  |  critDmg: ' + s.critDmg.toFixed(0) + '%');
    console.log('  gate v8: crit final <= 50');
  });
}());
`;

require('C:\\Users\\KABUM\\Desktop\\eclats_of_lumiere\\tools\\sim.js');
