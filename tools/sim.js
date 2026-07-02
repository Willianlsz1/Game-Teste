#!/usr/bin/env node
// tools/sim.js — simulador de balance headless: roda os MÓDULOS REAIS do jogo em Node.
// Nada de fórmula espelhada — carrega src/*.js num contexto global (como <script>),
// injeta um jogador-política ("persona Marina") e mede tempo/kills/pontos.
//
// Uso:
//   node tools/sim.js baseline  [--hours 40] [--to-level 1150] [--seed 1]
//   node tools/sim.js gates     [--gates 80,150,200,351] [--seed 1]
//   node tools/sim.js campaign  [--gate 150] [--push 1.0] [--max-hours 200] [--seed 1]
//
// baseline  = uma run sem Convergence: tempo até níveis/áreas, TTK/TTD por área.
// gates     = para cada gate candidato: tempo ativo até o gate, pontos da 1ª
//             convergence e o que eles compram na árvore (greedy).
// campaign  = loop completo: converge no gate até 8 convergences, depois empurra
//             até o First Light. Mede o Mapa 1 inteiro.
//
// Determinismo: Math.random é trocado por um PRNG seedado (--seed).
// Caveat conhecido: headless não tem projéteis (dano instantâneo) — DPS é o mesmo,
// só o atraso visual de 0.5s/0.9s some. Não afeta as métricas de pacing.

'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ---------- args ----------
const argv = process.argv.slice(2);
const cmd = argv[0] || 'baseline';
function arg(name, def) {
  const i = argv.indexOf('--' + name);
  if (i === -1 || i === argv.length - 1) return def;
  return argv[i + 1];
}
const SEED = +arg('seed', 1);
const DT = +arg('dt', 0.1);
const VERBOSE = argv.includes('--verbose');

// ---------- RNG seedado (mulberry32) ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- shims de navegador + load dos módulos reais ----------
global.window = global;
const LOAD_ORDER = ['util.js', 'data.js', 'gear.js', 'state.js', 'economy.js', 'combat.js', 'convergence.js', 'awaken.js', 'passives.js'];
for (const f of LOAD_ORDER) {
  const p = path.join(__dirname, '..', 'src', f);
  vm.runInThisContext(fs.readFileSync(p, 'utf8'), { filename: p });
}
const G = global.G;

// ---------- instrumentação (não toca nos arquivos do jogo) ----------
const M = { income: 0, deaths: 0 };
const _onKill = G.combat.onKill;
G.combat.onKill = function () {
  const before = G.state.data.lumens;
  _onKill.call(this);
  M.income += G.state.data.lumens - before;
};
const _onDeath = G.combat.onDeath;
G.combat.onDeath = function () { M.deaths++; _onDeath.call(this); };

// ---------- helpers ----------
function fmtT(sec) {
  if (sec < 90) return sec.toFixed(0) + 's';
  const m = sec / 60;
  if (m < 90) return m.toFixed(1) + 'm';
  const h = Math.floor(m / 60), mm = Math.round(m % 60);
  return h + 'h' + String(mm).padStart(2, '0') + 'm';
}
const fmtN = (n) => G.util.fmt(n);
function pad(v, w) { v = String(v); return v.length >= w ? v : v + ' '.repeat(w - v.length); }
function row(cols, widths) { return cols.map((c, i) => pad(c, widths[i])).join(' '); }

function gearAvgLevel() {
  const d = G.state.data; let s = 0, n = 0;
  for (const slot of G.data.slots) { s += d.equipped[slot.id].level || 1; n++; }
  return (s / n).toFixed(0);
}

function combatSnapshot() {
  const d = G.state.data, s = G.state.stats();
  const area = G.data.currentArea();
  const lvl = G.util.clamp(d.level, area.levelRange[0], area.levelRange[1]);
  const mobHp = G.data.mobHpAt(lvl, area);
  const eDps = s.atk * (1 + (s.crit / 100) * (s.critMult - 1)) / G.state.attackInterval();
  const aIdx = G.util.clamp(d.areaIndex, 0, G.data.balance.mobAtkByArea.length - 1);
  const pack = G.combat._packSize();
  const incoming = pack * G.data.balance.mobAtkByArea[aIdx] * (1 - (s.damageReduction || 0) / 100) / G.combat.enemyInterval;
  return { ttk: mobHp / eDps, ttd: s.hp / incoming, mobHp, atk: s.atk, hp: s.hp };
}

// ---------- políticas do jogador ----------
function bestAreaFor(level) {
  const d = G.state.data;
  let best = 0;
  for (let i = 0; i <= (d.maxAreaUnlocked || 0) && i < G.data.areas.length; i++)
    if (G.data.areas[i].levelRange[0] <= level) best = i;
  return best;
}

function policyTick(sim) {
  const d = G.state.data;

  // 1. mover pra melhor área desbloqueada
  const best = bestAreaFor(d.level);
  if (best !== d.areaIndex) {
    d.areaIndex = best;
    G.combat.enemies = []; G.combat.enemy = null;
    G.combat.pendingHits = []; G.combat.respawnTimer = 0;
    if (best > (sim.lastAreaEntered || -1)) {
      sim.lastAreaEntered = best;
      const snap = combatSnapshot();
      sim.areaEntries.push({ area: best + 1, t: sim.t, level: d.level, ...snap });
    }
  }

  // 2. gastar Lumens em gear (greedy: peça mais barata primeiro)
  for (let i = 0; i < 500; i++) {
    let cheapest = null, cost = Infinity;
    for (const slot of G.data.slots) {
      const item = d.equipped[slot.id];
      if (G.gear.isMaxed(item)) continue;
      const c = G.gear.cost(item);
      if (c < cost) { cost = c; cheapest = item; }
    }
    if (!cheapest || d.lumens < cost) break;
    G.gear.levelUp(cheapest);
  }

  // 3. promover raridade quando possível
  for (const slot of G.data.slots) {
    const item = d.equipped[slot.id];
    if (G.gear.canPromote(item)) G.gear.promote(item);
  }

  // 4. Awaken quando possível
  if (sim.allowAwaken && G.awaken.canAwaken('first_light')) {
    G.awaken.awaken('first_light');
    sim.firstLightAt = sim.t;
  }

  // 5. Convergence conforme estratégia
  if (sim.convergeAt && d.level >= sim.convergeAt && G.convergence.canConverge()) {
    const pts = G.convergence.pending();
    const lvl = d.level, kills = d.runKills, areaMax = (d.runMaxAreaIndex || 0) + 1;
    G.convergence.converge();
    sim.runs.push({ n: d.convergences, t: sim.t, dur: sim.t - (sim.lastConvT || 0), level: lvl, areaMax, kills, pts, cum: d.convergencePoints, nodesBought: sim.nodeLevelsBought });
    sim.lastConvT = sim.t;
    sim.lastAreaEntered = -1;
    if (sim.onConverge) sim.onConverge(sim);
  }

  // 6. comprar passivas (greedy: nó mais barato da ordem de foco)
  if ((d.convergences || 0) >= 1) {
    for (let i = 0; i < 200; i++) {
      let bought = false;
      for (const tree of sim.treeFocus) {
        let cheapest = -1, cost = Infinity;
        for (let n = 0; n < 15; n++) {
          if (!G.passives.canBuy(tree, n)) continue;
          const c = G.passives.nextCost(tree, n);
          if (c < cost) { cost = c; cheapest = n; }
        }
        if (cheapest !== -1) { G.passives.buy(tree, cheapest); sim.nodeLevelsBought++; bought = true; break; }
      }
      if (!bought) break;
    }
  }
}

// ---------- núcleo da simulação ----------
function freshSim(opts) {
  Math.random = mulberry32(opts.seed != null ? opts.seed : SEED);
  G.state.reset();
  G.state.invalidateStats();
  Object.assign(G.combat, {
    enemies: [], enemy: null, atkTimer: 0, respawnTimer: 0,
    pendingHits: [], spawnCount: 0, _lastAreaIndex: -1, _bossKills: 0,
    _clock: 0, _gains: [],
  });
  M.income = 0; M.deaths = 0;
  G.convergence.gateLevel = opts.gate != null ? opts.gate : 1e9;
  return {
    t: 0,
    convergeAt: opts.convergeAt || null,
    allowAwaken: !!opts.allowAwaken,
    treeFocus: opts.treeFocus || ['eclat', 'vestige', 'fracture'],
    onConverge: opts.onConverge || null,
    milestones: [], areaEntries: [], runs: [],
    lastAreaEntered: -1, lastConvT: 0, nodeLevelsBought: 0, firstLightAt: null,
  };
}

function run(sim, opts) {
  const maxT = (opts.maxHours || 40) * 3600;
  const levels = opts.levelMilestones || [];
  let nextMilestone = 0;
  let nextPolicy = 0;
  const stop = opts.stop || (() => false);

  while (sim.t < maxT) {
    G.combat.tick(DT);
    sim.t += DT;
    if (sim.t >= nextPolicy) { if (sim.onStep) sim.onStep(sim); policyTick(sim); nextPolicy = sim.t + 1; }
    const d = G.state.data;
    while (nextMilestone < levels.length && d.level >= levels[nextMilestone]) {
      sim.milestones.push({
        level: levels[nextMilestone], t: sim.t, kills: d.totalKills,
        gear: gearAvgLevel(), income: M.income, deaths: M.deaths,
      });
      nextMilestone++;
    }
    if (stop(sim)) return sim;
    if (VERBOSE && Math.floor(sim.t) % 3600 < DT)
      console.error(`  [t=${fmtT(sim.t)}] lvl ${d.level} area ${d.areaIndex + 1} kills ${d.totalKills}`);
  }
  sim.timedOut = true;
  return sim;
}

// ---------- cenários ----------
function scenarioBaseline() {
  const toLevel = +arg('to-level', 1150);
  const hours = +arg('hours', 40);
  const LV = [10, 25, 50, 80, 150, 200, 351, 500, 700, 1150, 1701, 2351, 3151, 4051].filter(l => l <= toLevel);
  console.log(`\n═══ BASELINE — sem Convergence · seed ${SEED} · alvo nível ${toLevel} · cap ${hours}h ═══\n`);
  const sim = freshSim({ gate: 1e9 });
  run(sim, { maxHours: hours, levelMilestones: LV, stop: (s) => G.state.data.level >= toLevel });

  const W1 = [7, 9, 8, 7, 9, 7];
  console.log(row(['nível', 'tempo', 'kills', 'gear', 'income', 'mortes'], W1));
  for (const m of sim.milestones)
    console.log(row([m.level, fmtT(m.t), m.kills, m.gear, fmtN(m.income), m.deaths], W1));

  const gs = G.data.balance.groupSize || 3;
  const W2 = [6, 6, 9, 7, 10, 9, 9, 10, 10];
  console.log('\n' + row(['área', 'grupo', 'entrada', 'nível', 'mobHP', 'TTK', 'TTD', 'ATK', 'HP'], W2));
  for (const a of sim.areaEntries) {
    const flag = a.ttk > 60 ? ' ⛔ WALL' : a.ttk > 15 ? ' ⚠' : '';
    const grp = 'G' + (Math.floor((a.area - 1) / gs) + 1);
    console.log(row([a.area, grp, fmtT(a.t), a.level, fmtN(a.mobHp), a.ttk.toFixed(1) + 's', a.ttd.toFixed(1) + 's', fmtN(a.atk), fmtN(a.hp)], W2) + flag);
  }
  if (sim.timedOut) console.log(`\n⚠ timeout em ${hours}h — nível final ${G.state.data.level} (área ${G.state.data.areaIndex + 1})`);

  // ---- tempo por grupo: duração real (entrada do 1º da área do grupo → entrada do grupo seguinte) vs orçamento-alvo do PASSO 1 ----
  const budget = [1.0, 1.6, 2.4, 3.2, 4.2, 5.6];   // horas-alvo por grupo (curva crescente)
  const groupEntry = {};
  for (const a of sim.areaEntries) {
    const g = Math.floor((a.area - 1) / gs);
    if (groupEntry[g] === undefined) groupEntry[g] = a.t;
  }
  const gseen = Object.keys(groupEntry).map(Number).sort((x, y) => x - y);
  const W3 = [7, 10, 12, 16];
  console.log('\n' + row(['grupo', 'entrada', 'duração', 'alvo (desvio)'], W3));
  for (let gi = 0; gi < gseen.length; gi++) {
    const g = gseen[gi], start = groupEntry[g], nextG = gseen[gi + 1];
    const open = nextG === undefined;             // grupo ainda em andamento no fim da run
    const end = open ? sim.t : groupEntry[nextG];
    const durH = (end - start) / 3600;
    const tgt = budget[g];
    const dev = tgt ? (durH - tgt) / tgt * 100 : 0;
    const devStr = tgt ? (dev >= 0 ? '+' : '') + dev.toFixed(0) + '%' : 'n/a';
    console.log(row(['G' + (g + 1), fmtT(start), durH.toFixed(2) + 'h' + (open ? '*' : ' '), (tgt != null ? tgt + 'h ' : '—  ') + '(' + devStr + ')'], W3));
  }
  console.log('  * grupo não fechado no fim da run (duração parcial)');
}

function scenarioGates() {
  const gates = String(arg('gates', '80,150,200,351')).split(',').map(Number);
  console.log(`\n═══ GATES — tempo ativo até a 1ª Convergence · seed ${SEED} ═══\n`);
  const W = [6, 9, 8, 8, 8, 14, 10];
  console.log(row(['gate', 'tempo', 'kills', 'área', 'pontos', 'compra (nós·lvls)', 'legacy'], W));
  for (const g of gates) {
    const sim = freshSim({ gate: g, convergeAt: g });
    run(sim, { maxHours: 60, stop: (s) => s.runs.length >= 1 });
    if (!sim.runs.length) { console.log(row([g, 'timeout', '-', '-', '-', '-', '-'], W)); continue; }
    const r = sim.runs[0];
    // o que os pontos compraram (greedy já rodou no policyTick pós-converge)
    const p = G.state.data.passives;
    let nodes = 0, lvls = 0;
    for (const tree of ['eclat', 'vestige', 'fracture'])
      for (let n = 0; n < 15; n++) if (p[tree][n] > 0) { nodes++; lvls += p[tree][n]; }
    console.log(row([g, fmtT(r.t), r.kills, r.areaMax, fmtN(r.pts), `${nodes} nós · ${lvls} lvls`, '+' + G.convergence.legacyAtkPct() + '%/+'+ G.convergence.legacyHpPct() + '%'], W));
  }
  console.log('\n(alvo de gênero: 1º prestige em 20–40min · fonte: BALANCE_REPORT §1)');
}

function scenarioCampaign() {
  const gate = +arg('gate', 150);
  const push = +arg('push', 1.0);
  const maxHours = +arg('max-hours', 200);
  const convergeAt = Math.round(gate * push);
  console.log(`\n═══ CAMPAIGN — Mapa 1 completo · gate ${gate} · converge no nível ${convergeAt} · seed ${SEED} · cap ${maxHours}h ═══\n`);

  const sim = freshSim({
    gate, convergeAt, allowAwaken: true,
    onConverge: (s) => {
      // depois de 8 convergences: para de convergir e empurra até o First Light
      if (G.state.data.convergences >= 8) s.convergeAt = null;
    },
  });
  run(sim, {
    maxHours,
    stop: (s) => s.firstLightAt != null,
  });

  const W = [5, 9, 9, 7, 6, 8, 9, 9];
  console.log(row(['run', 't', 'duração', 'nível', 'área', 'pontos', 'acum.', 'nós·lvls'], W));
  for (const r of sim.runs)
    console.log(row([r.n, fmtT(r.t), fmtT(r.dur), r.level, r.areaMax, fmtN(r.pts), fmtN(r.cum), r.nodesBought], W));

  const d = G.state.data;
  console.log('');
  if (sim.firstLightAt != null) {
    console.log(`✦ FIRST LIGHT em ${fmtT(sim.firstLightAt)} — ${d.convergences} convergences · ${d.totalKills} kills · ${M.deaths} mortes`);
  } else {
    const reqs = G.awaken.requirements('first_light').map(r => `${r.key}: ${fmtN(r.have)}/${fmtN(r.need)}${r.met ? ' ✓' : ' ✗'}`).join(' · ');
    console.log(`⚠ First Light NÃO alcançado em ${fmtT(sim.t)} — nível ${d.level}, área ${d.areaIndex + 1}, ${d.convergences} convergences`);
    console.log(`  requisitos: ${reqs}`);
  }
  const s = G.state.stats();
  console.log(`  final: ATK ${fmtN(s.atk)} · HP ${fmtN(s.hp)} · gear médio ${gearAvgLevel()} · passivas ${sim.nodeLevelsBought} níveis de nó`);
}

// ---------- calibração (P2 — deriva HP/mobAtk/hpMult das bandas HTK C3) ----------
function scenarioCalibrate() {
  const candidates = String(arg('growths', '1.022,1.028,1.034')).split(',').map(Number);
  const passes = +arg('passes', 3);
  const measHours = +arg('meas-hours', 150);
  const doWrite = argv.includes('--write');
  const gate = +arg('gate', 276);
  const N = G.data.areas.length;

  // ---- alvos (P2.1/P2.3/P2.4/P2.5) ----
  const HTK_ENTRY = [], WAVECOST = [];
  for (let i = 0; i < N; i++) {
    const pos = i % 3;
    let htk = pos === 0 ? 10 : pos === 1 ? 5.5 : 6.5;   // parede de grupo / 2ª / 3ª
    if (i >= 9) htk += 1.5;                              // Tema B (áreas 10–18)
    HTK_ENTRY[i] = htk;
    WAVECOST[i] = pos === 0 ? 0.42 : 0.15;               // entrada de grupo / interna
  }
  const HTK_END = 1.5;
  const BOSS_HTK = {}; [2, 5, 8, 11, 14].forEach(i => BOSS_HTK[i] = 30); BOSS_HTK[17] = 90;
  const budget = [1.0, 1.6, 2.4, 3.2, 4.2, 5.6];
  const gs = G.data.balance.groupSize || 3;

  // ---- seed das tabelas (p/ reiniciar cada candidato do mesmo ponto) ----
  const seedHp = G.data.areas.map(a => a.hp.slice());
  const seedAtk = G.data.balance.mobAtkByArea.slice();
  const seedBossHp = {}; G.data.areas.forEach((a, i) => { if (a.boss) seedBossHp[i] = a.boss.hpMult; });
  const restoreSeed = () => {
    G.data.areas.forEach((a, i) => { a.hp = seedHp[i].slice(); if (a.boss) a.boss.hpMult = seedBossHp[i]; });
    for (let i = 0; i < seedAtk.length; i++) G.data.balance.mobAtkByArea[i] = seedAtk[i];
  };

  // ---- amostragem ----
  const dmgHitNow = () => { const s = G.state.stats(); return s.atk * (1 + (s.crit / 100) * (s.critMult - 1)); };
  const snapNow = () => { const s = G.state.stats(); return { dmgHit: dmgHitNow(), hp: s.hp, atkInt: G.state.attackInterval(), pack: G.combat._packSize() }; };

  let ENTRY, END, BOSS;
  const origMBC = G.combat.markBossCleared;
  G.combat.markBossCleared = function () {
    const d = G.state.data, idx = d.areaIndex, area = G.data.areas[idx];
    if (BOSS && !BOSS[idx]) {
      const lvl = G.util.clamp(d.level, area.levelRange[0], area.levelRange[1]);
      BOSS[idx] = { dmgHit: dmgHitNow(), baseMobHp: G.data.mobHpAt(lvl, area) };
    }
    return origMBC.call(this);
  };

  function measureRun(seed) {
    ENTRY = {}; END = {}; BOSS = {};
    // allowAwaken:false → o push não para no First Light (área 9), segue até Okhra,
    // amostrando as 18 áreas + os 6 Marcos.
    const sim = freshSim({ gate, convergeAt: gate, allowAwaken: false, seed,
      onConverge: (s) => { if (G.state.data.convergences >= 8) { s.convergeAt = null; if (s.pushStart == null) s.pushStart = s.t; } } });
    sim.onStep = (s) => {
      const d = G.state.data, idx = d.areaIndex, area = G.data.areas[idx];
      if (!ENTRY[idx]) ENTRY[idx] = snapNow();
      if (!END[idx] && d.level >= area.levelRange[1]) END[idx] = snapNow();
    };
    run(sim, { maxHours: measHours, stop: () => BOSS[17] != null });
    sim._entry = ENTRY; sim._end = END; sim._boss = BOSS;
    return sim;
  }

  // aplica as amostras às tabelas em memória (retorna quais áreas ficaram sem amostra)
  function applySamples(entry, end, boss) {
    const missing = [];
    for (let i = 0; i < N; i++) {
      const area = G.data.areas[i];
      const e = entry[i];
      if (!e) { missing.push(i + 1); continue; }
      const hp0 = HTK_ENTRY[i] * e.dmgHit;
      const endDmg = end[i] ? end[i].dmgHit : (entry[i + 1] ? entry[i + 1].dmgHit : e.dmgHit);
      const hp1 = HTK_END * endDmg;
      area.hp = [Math.max(1, hp0), Math.max(1, hp1)];
      const hitsRecv = 0.6 * e.pack * (e.pack * HTK_ENTRY[i] * e.atkInt) / G.combat.enemyInterval;
      const mobAtk = WAVECOST[i] * e.hp / Math.max(1e-6, hitsRecv);
      G.data.balance.mobAtkByArea[i] = Math.max(1, mobAtk);
      if (area.boss && boss[i]) area.boss.hpMult = BOSS_HTK[i] * boss[i].dmgHit / Math.max(1, boss[i].baseMobHp);
    }
    return missing;
  }

  console.log(`\n═══ CALIBRATE — deriva HP/mobAtk/hpMult (HTK C3) · gate ${gate} · ${passes} passadas · seed ${SEED} ═══\n`);
  const results = [];
  for (const growth of candidates) {
    restoreSeed();
    G.data.balance.gearCostGrowth = growth;
    let sim, missing;
    for (let p = 0; p < passes; p++) {
      sim = measureRun(SEED);
      const reached = Math.max(...Object.keys(sim._entry).map(Number)) + 1;
      missing = applySamples(sim._entry, sim._end, sim._boss);
      if (VERBOSE) {
        const e0 = sim._entry[0];
        console.log(`  [growth ${growth} pass ${p}] reached área ${reached} · lvl ${G.state.data.level} · conv ${G.state.data.convergences} · 1L ${sim.firstLightAt != null ? fmtT(sim.firstLightAt) : '—'} · sampled ${Object.keys(sim._entry).length} · A1 hp[${fmtN(G.data.areas[0].hp[0])},${fmtN(G.data.areas[0].hp[1])}] atk ${fmtN(G.data.balance.mobAtkByArea[0])} · e0.dmgHit ${e0 ? fmtN(e0.dmgHit) : '—'} e0.hp ${e0 ? fmtN(e0.hp) : '—'}`);
      }
    }
    // passada de medição final (tabelas já convergidas)
    sim = measureRun(SEED);
    const entry = sim._entry, end = sim._end, boss = sim._boss;

    // tempos por grupo (primeira entrada de cada grupo na campanha inteira)
    const groupEntry = {};
    for (const a of sim.areaEntries) { const g = Math.floor((a.area - 1) / gs); if (groupEntry[g] === undefined) groupEntry[g] = a.t; }
    const gks = Object.keys(groupEntry).map(Number).sort((x, y) => x - y);
    const groupDur = [];
    for (let gi = 0; gi < 6; gi++) {
      const start = groupEntry[gi];
      if (start === undefined) { groupDur[gi] = null; continue; }
      const nextStart = groupEntry[gi + 1];
      const endT = nextStart !== undefined ? nextStart : (sim.firstLightAt != null ? sim.firstLightAt : sim.t);
      groupDur[gi] = (endT - start) / 3600;
    }
    let devSum = 0, devN = 0;
    for (let gi = 0; gi < 6; gi++) { if (groupDur[gi] == null) { devSum += 100; devN++; continue; } devSum += Math.abs((groupDur[gi] - budget[gi]) / budget[gi]) * 100; devN++; }
    const meanDev = devSum / devN;
    const totalH = (sim.firstLightAt != null ? sim.firstLightAt : sim.t) / 3600;

    results.push({ growth, meanDev, totalH, groupDur, entry, end, boss, missing,
      hp: G.data.areas.map(a => a.hp.slice()), atk: G.data.balance.mobAtkByArea.slice(),
      bossHp: (() => { const o = {}; G.data.areas.forEach((a, i) => { if (a.boss) o[i] = a.boss.hpMult; }); return o; })(),
      firstLight: sim.firstLightAt, deaths: M.deaths });

    console.log(`growth ${growth}: 1st Light ${sim.firstLightAt != null ? fmtT(sim.firstLightAt) : 'NÃO (' + fmtT(sim.t) + ')'} · total ${totalH.toFixed(1)}h · desvio médio grupos ${meanDev.toFixed(0)}%` + (missing.length ? ` · sem amostra: ${missing.join(',')}` : ''));
  }

  // escolhe o melhor (menor desvio médio absoluto vs contrato)
  results.sort((a, b) => a.meanDev - b.meanDev);
  const best = results[0];
  console.log(`\n➤ ESCOLHIDO: gearCostGrowth ${best.growth} (menor desvio médio de grupo: ${best.meanDev.toFixed(0)}%)\n`);

  // aplica as tabelas do melhor candidato em memória p/ o relatório e a escrita
  restoreSeed();
  G.data.balance.gearCostGrowth = best.growth;
  applySamples(best.entry, best.end, best.boss);

  // ---- tabela TTK por área ----
  const W = [6, 6, 5, 12, 12, 9, 9, 8];
  console.log(row(['área', 'grupo', 'pos', 'HP entrada', 'HP fim', 'HTK ent', 'HTK fim', 'mobAtk'], W));
  for (let i = 0; i < N; i++) {
    const area = G.data.areas[i], e = best.entry[i], en = best.end[i];
    const pos = i % 3, grp = 'G' + (Math.floor(i / gs) + 1);
    const htkE = e ? (area.hp[0] / e.dmgHit) : NaN;
    const endDmg = en ? en.dmgHit : (best.entry[i + 1] ? best.entry[i + 1].dmgHit : (e ? e.dmgHit : NaN));
    const htkEnd = endDmg ? (area.hp[1] / endDmg) : NaN;
    const tgtE = HTK_ENTRY[i];
    const okE = isFinite(htkE) && Math.abs(htkE - tgtE) / tgtE < 0.25 ? '✓' : '✗';
    console.log(row([i + 1, grp, pos === 0 ? 'entry' : pos === 1 ? 'mid' : 'boss', fmtN(area.hp[0]), fmtN(area.hp[1]),
      (isFinite(htkE) ? htkE.toFixed(1) : '—') + okE, isFinite(htkEnd) ? htkEnd.toFixed(1) : '—', fmtN(G.data.balance.mobAtkByArea[i])], W));
  }

  // ---- bosses ----
  console.log('\n' + row(['boss área', 'HTK alvo', 'hpMult', 'HTK obtido', 'dmgMult'], [10, 9, 9, 11, 8]));
  for (const i of [2, 5, 8, 11, 14, 17]) {
    const area = G.data.areas[i], b = best.boss[i];
    const mult = area.boss.hpMult;
    const htk = b ? (b.baseMobHp * mult / b.dmgHit) : NaN;
    console.log(row([i + 1, BOSS_HTK[i], (+mult).toFixed(2), isFinite(htk) ? htk.toFixed(1) : 'sem amostra', area.boss.dmgMult], [10, 9, 9, 11, 8]));
  }

  // ---- tempos por grupo vs contrato ----
  console.log('\n' + row(['grupo', 'duração', 'alvo', 'desvio'], [7, 10, 8, 10]));
  for (let gi = 0; gi < 6; gi++) {
    const d = best.groupDur[gi];
    const dev = d == null ? 'n/a' : ((d - budget[gi] >= 0 ? '+' : '') + ((d - budget[gi]) / budget[gi] * 100).toFixed(0) + '%');
    console.log(row(['G' + (gi + 1), d == null ? '—' : d.toFixed(2) + 'h', budget[gi] + 'h', dev], [7, 10, 8, 10]));
  }
  console.log(`\n  total até First Light: ${best.totalH.toFixed(1)}h (contrato-soma 18h) · mortes ${best.deaths}`);
  console.log('  ⚠ política gate-fixo-276: as 8 convergências acontecem todas no G1 (área 3), inflando G1 e comprimindo G2–G6.');

  if (doWrite) {
    const p = path.join(__dirname, '..', 'src', 'data.js');
    let text = fs.readFileSync(p, 'utf8');
    const orig = text;
    text = text.replace(/gearCostGrowth:\s*[\d.]+,[^\n]*/, `gearCostGrowth:    ${best.growth},   // P2.2: freio principal — testado no sim`);
    const atkStr = best.atk.map(x => Math.round(x)).join(', ');
    text = text.replace(/mobAtkByArea:\s*\[[\s\S]*?\]/, `mobAtkByArea:      [${atkStr}]`);
    let hi = 0;
    text = text.replace(/hp:\s*\[[^\]]*\](,?)[^\n]*/g, (m, comma) => {
      const pair = best.hp[hi]; hi++;
      return `hp: [${Math.round(pair[0])}, ${Math.round(pair[1])}]${comma}  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar`;
    });
    const bossOrder = [2, 5, 8, 11, 14, 17]; let bi = 0;
    text = text.replace(/boss:\s*\{[^}]*\}/g, (blk) => {
      const idx = bossOrder[bi]; bi++;
      const mult = best.bossHp[idx];
      return (mult == null) ? blk : blk.replace(/hpMult:\s*[\d.]+/, `hpMult: ${(+mult).toFixed(2)}`);
    });
    // safety: o data.js reescrito precisa avaliar sem erro
    let ok = true;
    try { vm.runInNewContext('var G={};\n' + text, {}); } catch (e) { ok = false; console.error('\n✗ ABORTADO: data.js reescrito não avalia — ' + e.message); }
    if (ok && hi === N && bi === bossOrder.length) { fs.writeFileSync(p, text); console.log(`\n✓ escrito em src/data.js (${hi} áreas · mobAtk · ${bi} bosses · growth ${best.growth})`); }
    else if (ok) console.error(`\n✗ ABORTADO: contagem inesperada (hp ${hi}/${N}, boss ${bi}/${bossOrder.length}) — data.js não tocado`);
  } else {
    console.log('\n(dry-run — use --write para gravar em src/data.js)');
  }
  G.combat.markBossCleared = origMBC;
}

// ---------- main ----------
const t0 = Date.now();
if (cmd === 'baseline') scenarioBaseline();
else if (cmd === 'gates') scenarioGates();
else if (cmd === 'campaign') scenarioCampaign();
else if (cmd === 'calibrate') scenarioCalibrate();
else { console.error(`comando desconhecido: ${cmd} (use baseline | gates | campaign | calibrate)`); process.exit(1); }
console.log(`\n(sim real: ${((Date.now() - t0) / 1000).toFixed(1)}s wall-clock)`);
