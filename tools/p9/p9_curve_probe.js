#!/usr/bin/env node
// P9 r4 — probe de CURVA do run de descoberta (LEITURA — zero mudança de dial).
// Roda a campanha e captura:
//  1. 1ª entrada em cada área (timestamps) → tempo por grupo G1..G6
//  2. milestones do awakenMaterial: 25k/50k/75k/100k (cumulativo GANHO, timestamps)
//  3. timestamps das convergences (o sim já as guarda em sim.runs)
// Uso: node p9_curve_probe.js candidate_v9.json --seed 1
'use strict';
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let candFile = null;
if (args[0] && !args[0].startsWith('--')) candFile = args.shift();
const cand = candFile ? JSON.parse(fs.readFileSync(path.join(__dirname, candFile), 'utf8')) : null;

process.argv = [process.argv[0], 'sim.js', 'campaign', '--max-hours', '200', ...args];

const CAPTURE_ANCHOR = 'const sim = freshSim({ converge: true, push, allowAwaken: true });';

const HOOK = `
;(function () {
  const CAP = global.__curve = { firstEntry: {}, matMs: {}, matTotal: 0, flAt: null };
  global.__installCurveHook = function () {
    const G = global.G;
    // milestones do material (cumulativo ganho — imune ao consumo do awaken)
    const MS = [10000, 25000, 50000, 75000, 100000];
    const _addAwaken = G.economy.addAwaken.bind(G.economy);
    G.economy.addAwaken = function (kind, n) {
      if (kind === 'firstLight' && n > 0) {
        CAP.matTotal += n;
        for (const m of MS) if (!CAP.matMs[m] && CAP.matTotal >= m) CAP.matMs[m] = global.__p9cap.t;
      }
      return _addAwaken(kind, n);
    };
    // 1ª entrada global em cada área (independe de run — areaEntries reseta por conv)
    const _tick = G.combat.tick.bind(G.combat);
    let lastArea = -1;
    G.combat.tick = function (dt) {
      const r = _tick(dt);
      const ai = G.state.data.areaIndex || 0;
      if (ai !== lastArea) {
        lastArea = ai;
        if (CAP.firstEntry[ai] == null) CAP.firstEntry[ai] = global.__p9cap.t;
      }
      return r;
    };
    // mortes com posição: área + fração do levelRange (nível perto do piso = entrada prematura)
    CAP.deaths = [];
    const _onDeath = G.combat.onDeath.bind(G.combat);
    G.combat.onDeath = function () {
      const d = G.state.data, area = G.data.areas[d.areaIndex] || G.data.areas[0];
      const lo = area.levelRange[0], hi = area.levelRange[1];
      CAP.deaths.push({ area: d.areaIndex + 1, level: d.level, frac: (d.level - lo) / Math.max(1, hi - lo), t: global.__p9cap.t });
      return _onDeath();
    };
    // First Spark share do ATK no MOMENTO de cada convergence (var 15: alvo 30-50% nas convs 1-5)
    CAP.fsShare = [];
    const _converge = G.convergence.converge.bind(G.convergence);
    G.convergence.converge = function () {
      const s = G.state.stats();
      const BD = s._breakdown && s._breakdown.atk;
      if (BD) {
        let flatTot = 0, pctTot = 0, mult = 1, fP = 0;
        for (const e of BD) {
          if (e.type === 'flat') { flatTot += e.amount; if (e.source === 'Passives') fP += e.amount; }
          else if (e.type === 'pct') pctTot += e.amount;
          else if (e.type === 'mult') mult *= e.amount;
        }
        CAP.fsShare.push({ conv: (G.state.data.convergences || 0) + 1, share: flatTot > 0 ? fP / flatTot : 0 });
      }
      return _converge();
    };
  };
  process.on('exit', () => {
    const G = global.G;
    const sim = global.__p9cap;
    const fmtT = (sec) => { if (sec == null) return '—'; const h = Math.floor(sec/3600), m = Math.round((sec%3600)/60); return h + 'h' + String(m).padStart(2,'0'); };
    console.log('\\n=== CURVE 1: 1ª entrada por área (fronteiras) + tempo por grupo ===');
    const FR = [0,3,6,9,12,15];
    for (const f of FR) console.log('area ' + String(f+1).padEnd(3) + ' G' + (Math.floor(f/3)+1) + '  entrada ' + fmtT(CAP.firstEntry[f]));
    console.log('-- tempo GASTO por grupo (entrada Gn -> entrada Gn+1; G6 -> FL/clear):');
    const flT = sim.firstLightAt != null ? sim.firstLightAt : sim.t;
    for (let g = 0; g < 6; g++) {
      const t0 = CAP.firstEntry[g*3], t1 = g < 5 ? CAP.firstEntry[(g+1)*3] : flT;
      console.log('G' + (g+1) + '  ' + fmtT(t0) + ' -> ' + fmtT(t1) + '  dur ' + (t0 != null && t1 != null ? ((t1-t0)/3600).toFixed(2) + 'h' : '—'));
    }
    console.log('\\n=== CURVE 2: milestones do awakenMaterial (cumulativo ganho, req 100k) ===');
    for (const m of [10000,25000,50000,75000,100000])
      console.log(String(m).padEnd(7) + ' em ' + fmtT(CAP.matMs[m]));
    console.log('total ganho: ' + CAP.matTotal);
    console.log('\\n=== CURVE 3: convergences (timestamps) ===');
    for (const r of sim.runs) console.log('conv ' + String(r.n).padEnd(3) + fmtT(r.t) + '  dur ' + (r.dur/3600).toFixed(2) + 'h  nivel ' + r.level + '  arvore ' + (r.treePct||0) + '%');
    console.log('First Light: ' + fmtT(sim.firstLightAt) + ' · clear: ' + fmtT(sim.t));
    // TTK médio pós-coroa: HTK médio das ENTRADAS de área nas runs 10+ (proxy do TTK sentido pós-coroa)
    const post = sim.areaEntries.filter((e) => (e.run || 1) >= 10 && e.htk != null);
    if (post.length) {
      const avg = post.reduce((a, e) => a + e.htk, 0) / post.length;
      console.log('HTK medio de entrada (runs 10+): ' + avg.toFixed(2) + ' (' + post.length + ' amostras)');
    }
    // First Spark share (flat de Passives / flat total) no momento de cada conv
    if (CAP.fsShare && CAP.fsShare.length) {
      console.log('\\n=== FIRST SPARK share do flat de ATK por conv (var 15: alvo 30-50% nas convs 1-5) ===');
      console.log(CAP.fsShare.map((x) => 'c' + x.conv + ':' + (100 * x.share).toFixed(0) + '%').join('  '));
    }
    // 1ª passagem: HTK/TTD na PRIMEIRA entrada de cada área (gates: entrada 8-12 · TTD ~25s)
    const seen1 = {};
    console.log('\\n=== 1ª PASSAGEM: HTK/TTD de entrada por área ===');
    for (const e of sim.areaEntries) {
      if (seen1[e.area]) continue;
      seen1[e.area] = true;
      console.log('area ' + String(e.area).padEnd(3) + ' run ' + String(e.run).padEnd(3) + ' HTK ' + (e.htk != null ? e.htk.toFixed(1) : '—').padEnd(7) + ' TTD ' + (e.ttd != null ? e.ttd.toFixed(1) + 's' : '—'));
    }
    // mortes: entrada prematura (nível no 1º quartil do levelRange da área) vs na banda
    if (CAP.deaths && CAP.deaths.length) {
      const prem = CAP.deaths.filter((x) => x.frac < 0.25).length;
      console.log('\\n=== MORTES: ' + CAP.deaths.length + ' · prematuras (frac<0.25) ' + prem + ' · na banda ' + (CAP.deaths.length - prem) + ' ===');
      for (const x of CAP.deaths) console.log('  area ' + x.area + ' nivel ' + x.level + ' frac ' + x.frac.toFixed(2) + ' em ' + fmtT(x.t));
    }
  });
}());
`;

const realRead = fs.readFileSync;
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
      'const sim = global.__p9cap = freshSim({ converge: true, push, allowAwaken: true }); global.__installCurveHook();');
    src = src.replace(/^#![^\n]*\n/, '');
    src = HOOK + '\n' + src;
  }
  return src;
};

require('C:\\Users\\KABUM\\Desktop\\eclats_of_lumiere\\tools\\sim.js');
