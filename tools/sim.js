#!/usr/bin/env node
// tools/sim.js — simulador de balance headless: roda os MÓDULOS REAIS do jogo em Node.
// Nada de fórmula espelhada — carrega src/*.js num contexto global (como <script>),
// injeta um jogador-política ("persona Marina") e mede tempo/kills/pontos.
//
// Uso:
//   node tools/sim.js baseline  [--hours 40] [--to-level 1150] [--seed 1]
//   node tools/sim.js gates     [--gates 80,150,200,351] [--seed 1]
//   node tools/sim.js campaign  [--gate 150] [--push 1.0] [--max-hours 200] [--seed 1]
//   node tools/sim.js first-hour [--hours 1] [--seed 1]
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
const LOAD_ORDER = ['util.js', 'data.js', 'gear.js', 'state.js', 'economy.js', 'rates.js', 'enemyFactory.js', 'income.js', 'progression.js', 'combat.js', 'convergence.js', 'awaken.js', 'passives.js'];
for (const f of LOAD_ORDER) {
  const p = path.join(__dirname, '..', 'src', f);
  vm.runInThisContext(fs.readFileSync(p, 'utf8'), { filename: p });
}
const G = global.G;

// ---------- instrumentação (não toca nos arquivos do jogo) ----------
const M = { income: 0, deaths: 0, matByGroup: {}, litByGroup: {} };   // matByGroup[g]={common,awaken} · litByGroup[g]={common,ember,lumen,corona}
const _onKill = G.combat.onKill;
G.combat.onKill = function () {
  const before = G.state.data.lumens;
  // frequência de acesos por grupo (P8.1): tally do tier do mob que está morrendo
  const dying = this.enemies.find((e) => !e.dead);
  if (dying && !dying.isBoss) {
    const gs = G.data.balance.groupSize || 3;
    const g = Math.floor((G.state.data.areaIndex || 0) / gs);
    const b = M.litByGroup[g] || (M.litByGroup[g] = { common: 0, ember: 0, lumen: 0, corona: 0 });
    b[(dying.rarity && dying.rarity.tier) || "common"]++;
  }
  _onKill.call(this);
  M.income += G.state.data.lumens - before;
};
const _onDeath = G.combat.onDeath;
G.combat.onDeath = function () { M.deaths++; _onDeath.call(this); };
// tally de materiais por grupo (grupo = área atual / groupSize)
const _rollDrops = G.economy.rollDrops.bind(G.economy);
G.economy.rollDrops = function (enemy, opts) {
  const out = _rollDrops(enemy, opts);
  const gs = G.data.balance.groupSize || 3;
  const g = Math.floor((G.state.data.areaIndex || 0) / gs);
  const bucket = M.matByGroup[g] || (M.matByGroup[g] = { common: 0, awaken: 0 });
  if (out.commonMaterial) bucket.common += out.commonMaterial;
  if (out.awakenMaterial) bucket.awaken += out.awakenMaterial;
  return out;
};

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

// Override genérico em memória. Vale para TODOS os cenários, inclusive first-hour.
// Nunca grava data.js; serve para comparar candidatos antes de travar um dial.
function applySimOverride() {
  if (!process.env.SIM_OVERRIDE) return;
  try {
    const ov = JSON.parse(process.env.SIM_OVERRIDE);
    if (ov.balance) for (const k in ov.balance) G.data.balance[k] = ov.balance[k];
    if (ov.uncCap != null) { const r = G.data.rarities.find(r => r.id === 'uncommon'); if (r) r.cap = ov.uncCap; }
    if (ov.commonCap != null) { const r = G.data.rarities.find(r => r.id === 'common'); if (r) r.cap = ov.commonCap; }
    if (ov.drop) for (const p in ov.drop) {
      const parts = p.split('.'); let o = G.economy.dropTable;
      for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
      o[parts[parts.length - 1]] = ov.drop[p];
    }
    if (ov.awakenMat != null) G.data.awakens[0].requirements.materials.firstLight = ov.awakenMat;
    if (ov.offering != null) G.data.awakens[0].requirements.lumens = ov.offering;
    console.log('  [SIM_OVERRIDE applied]', JSON.stringify(ov).slice(0, 400));
  } catch (e) {
    console.error('SIM_OVERRIDE parse error:', e.message);
    process.exit(1);
  }
}

function gearAvgLevel() {
  const d = G.state.data; let s = 0, n = 0;
  for (const slot of G.data.slots) { s += d.equipped[slot.id].level || 1; n++; }
  return (s / n).toFixed(0);
}

function combatSnapshot() {
  const d = G.state.data, s = G.state.stats();
  const area = G.data.currentArea();
  // P10 (modelo Gaiadon): nível do mob ACOMPANHA o jogador na banda da área; HP/ATK paramétricos.
  const lvl = G.enemyFactory.mobLevelFor(d.areaIndex);
  const mobHp = G.data.mobHpParam(lvl);
  const dmgHit = s.atk * (1 + (s.crit / 100) * (s.critMult - 1));
  const eDps = dmgHit / G.state.attackInterval();
  const pack = G.enemyFactory._packSize();
  const incoming = pack * G.data.mobAtkParam(lvl) * (1 - (s.damageReduction || 0) / 100) / G.combat.enemyInterval;
  return { ttk: mobHp / eDps, htk: mobHp / dmgHit, ttd: s.hp / incoming, mobHp, atk: s.atk, hp: s.hp };
}

// ---------- políticas do jogador ----------
// P9 (porta dupla): a persona avança quando bate o NÍVEL DE PORTA (dial levelGateByArea via
// progression.levelGateFor) — não mais o levelRange do mob (que agora é SÓ stat do mob).
function bestAreaFor(level) {
  const d = G.state.data;
  let best = 0;
  for (let i = 0; i <= (d.maxAreaUnlocked || 0) && i < G.data.areas.length; i++)
    if (G.progression.levelGateFor(i) <= level) best = i;
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
  }
  // P10 fase1b (PROJEÇÃO por ÁREA): amostra o estado do jogador NA área corrente a cada tick,
  //   guardando a ÚLTIMA leitura de CADA área (cobertura completa — o areaEntries só registra
  //   a entrada quando o "best" AVANÇA, o que pula áreas na re-subida). Read-only.
  if (sim.areaProj) {
    const inc = G.income.estimateAreaIncome(d.areaIndex);
    const s = G.state.stats();
    const dpsHit = s.atk * (1 + (s.crit / 100) * (s.critMult - 1));
    const dps = dpsHit / G.state.attackInterval();
    let cheapGear = Infinity, allMaxed = true;
    for (const slot of G.data.slots) { const it = d.equipped[slot.id]; if (!G.gear.isMaxed(it)) { allMaxed = false; cheapGear = Math.min(cheapGear, G.gear.cost(it)); } }
    const lvl = G.enemyFactory.mobLevelFor(d.areaIndex);
    const pack = G.enemyFactory.packSizeFor(d.areaIndex);
    const dpsIn = G.data.mobAtkParam(lvl) * ((pack + 1) / 2) / G.combat.enemyInterval;
    sim.areaProj[d.areaIndex] = { t: sim.t, level: d.level, mobHp: G.data.mobHpParam(lvl),
      dps, ttk: inc.ttk, ttd: s.hp / Math.max(1e-9, dpsIn),
      lumensPerMin: inc.lumensPerMin, xpPerMin: inc.xpPerMin, gearCost: allMaxed ? 0 : cheapGear, gearMaxed: allMaxed,
      matCommon: G.economy.getGear('common'), matUncommon: G.economy.getGear('uncommon'), matAwaken: G.economy.getAwaken('firstLight'), hp: s.hp, atk: s.atk };
  }
  // registra a entrada (inclusive área 1 — pós-converge best === areaIndex === 0,
  // e a re-subida precisa da amostra), com o nº da run p/ a métrica de re-subida.
  if (best > (sim.lastAreaEntered != null ? sim.lastAreaEntered : -1)) {
    sim.lastAreaEntered = best;
    const snap = combatSnapshot();
    // P10 fase1b (PROJEÇÃO): income read-only na entrada da área (Lumens/min, XP/min, DPS, gear cost).
    const inc = G.income.estimateAreaIncome(best);
    const s = G.state.stats();
    const dpsHit = s.atk * (1 + (s.crit / 100) * (s.critMult - 1));
    const dps = dpsHit / G.state.attackInterval();
    let cheapGear = Infinity;
    for (const slot of G.data.slots) { const it = d.equipped[slot.id]; if (!G.gear.isMaxed(it)) cheapGear = Math.min(cheapGear, G.gear.cost(it)); }
    sim.areaEntries.push({ area: best + 1, t: sim.t, run: (d.convergences || 0) + 1, level: d.level, gear: gearAvgLevel(), ...snap,
      lumensPerMin: inc.lumensPerMin, xpPerMin: inc.xpPerMin, dps, gearCost: (cheapGear === Infinity ? 0 : cheapGear),
      matCommon: G.economy.getGear('common'), matUncommon: G.economy.getGear('uncommon'), matAwaken: G.economy.getAwaken('firstLight') });
  }
  // P2 (âncora TTK): amostra ROLANTE de TTK na área atual — a última leitura antes de sair vira
  // o "TTK de SAÍDA" (o mob é fixo, o jogador cresce → TTK derrete da entrada pra saída).
  if (sim.areaExit) { const ex = combatSnapshot(); sim.areaExit[d.areaIndex] = { ttk: ex.ttk, level: d.level }; }

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
    const paid = cost, beforeLevel = cheapest.level || 1;
    G.gear.levelUp(cheapest);
    if (sim.gearPurchases) sim.gearPurchases.push({
      t: sim.t, area: d.areaIndex + 1, slot: cheapest.slot,
      from: beforeLevel, to: cheapest.level, cost: paid,
    });
  }

  // 3. promover raridade quando possível (registra o beat: peça · tempo · grupo)
  const gs = G.data.balance.groupSize || 3;
  for (const slot of G.data.slots) {
    const item = d.equipped[slot.id];
    if (G.gear.canPromote(item)) {
      const before = item.rarity;
      if (G.gear.promote(item) && before === 'common')
        sim.promotions.push({ slot: slot.id, t: sim.t, group: Math.floor((d.areaIndex || 0) / gs) + 1 });
    }
  }
  // marca quando o material de Awaken (First Light) fica disponível
  if (sim.awakenMatAt == null && G.economy.getAwaken('firstLight') >= 1) sim.awakenMatAt = sim.t;

  // 4. Awaken quando possível
  if (sim.allowAwaken && G.awaken.canAwaken('first_light')) {
    G.awaken.awaken('first_light');
    sim.firstLightAt = sim.t;
  }

  // 5. Convergence: gate dinâmico (converge ao bater o gate corrente × push)
  if (sim.convergeEnabled && G.convergence.canConverge() && d.level >= G.convergence.currentGate() * sim.push) {
    const pts = G.convergence.pending();
    const gate = G.convergence.currentGate();
    const lvl = d.level, kills = d.runKills, areaMax = (d.runMaxAreaIndex || 0) + 1;
    const grpMax = Math.floor((d.runMaxAreaIndex || 0) / (G.data.balance.groupSize || 3)) + 1;
    const prog = G.passives.treeProgress();
    G.convergence.converge();
    sim.runs.push({ n: d.convergences, t: sim.t, dur: sim.t - (sim.lastConvT || 0), gate, level: lvl, areaMax, grpMax, kills, pts, cum: d.convergencePoints, nodesBought: sim.nodeLevelsBought,
      treePct: Math.round(prog.levels / (prog.maxLevels || prog.total * G.passives.maxLevel) * 100), treeNodes: prog.unlocked, crown: prog.crown });   // P9 r6: maxLevel por nó (prog.maxLevels)
    sim.lastConvT = sim.t;
    sim.lastAreaEntered = -1;
    if (sim.onConverge) sim.onConverge(sim);
  }

  // 6. comprar passivas na Árvore I (greedy: nó comprável mais barato, respeita topologia
  //    via canBuy — filho só abre com o pai ≥1). Registra quando a coroa acende.
  if ((d.convergences || 0) >= 1) {
    for (let i = 0; i < 200; i++) {
      let cheapest = -1, cost = Infinity;
      for (let n = 0; n < 15; n++) {
        if (!G.passives.canBuy(n)) continue;
        const c = G.passives.nextCost(n);
        if (c < cost) { cost = c; cheapest = n; }
      }
      if (cheapest === -1) break;
      G.passives.buy(cheapest); sim.nodeLevelsBought++;
    }
    if (sim.crownAt == null && G.passives.crownActive()) sim.crownAt = sim.t;
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
    _okhraManifest: false, _tideTimer: 0, _tideRisen: false,
  });
  Object.assign(G.rates, { _clock: 0, _gains: [] });
  M.income = 0; M.deaths = 0; M.matByGroup = {}; M.litByGroup = {};
  // P5: gate escalonado — a política converge quando canConverge() (o gate JÁ força
  // profundidade). push = multiplicador opcional sobre o gate corrente (empurrar mais fundo).
  return {
    t: 0,
    convergeEnabled: !!opts.converge,
    push: opts.push || 1,
    allowAwaken: !!opts.allowAwaken,
    onConverge: opts.onConverge || null,
    milestones: [], areaEntries: [], runs: [], areaExit: {},
    lastAreaEntered: -1, lastConvT: 0, nodeLevelsBought: 0, firstLightAt: null,
    promotions: [], gearPurchases: [], awakenMatAt: null, crownAt: null,
    areaProj: opts.areaProj ? {} : null,   // P10 fase1b: sampler de projeção por área (só quando pedido)
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
  // P2 (âncora TTK): TTK em SEGUNDOS na ENTRADA (mob fresco, jogador sob-nível) e na SAÍDA
  //   (última leitura antes de avançar: jogador cresceu, mob fixo → derrete). O par entrada→saída
  //   é o sinal de zona (entra difícil, sai fácil) do paradigma novo.
  const W2 = [6, 6, 9, 7, 10, 10, 10, 9, 10, 10];
  console.log('\n' + row(['área', 'grupo', 'entrada', 'nível', 'mobHP', 'TTK ent', 'TTK saí', 'TTD', 'ATK', 'HP'], W2));
  for (const a of sim.areaEntries) {
    const flag = a.ttk > 60 ? ' ⛔ WALL' : a.ttk > 15 ? ' ⚠' : '';
    const grp = 'G' + (Math.floor((a.area - 1) / gs) + 1);
    const ex = sim.areaExit[a.area - 1];
    const ttkExit = (ex && ex.level > a.level) ? ex.ttk.toFixed(1) + 's' : '—';
    console.log(row([a.area, grp, fmtT(a.t), a.level, fmtN(a.mobHp), a.ttk.toFixed(1) + 's', ttkExit, a.ttd.toFixed(1) + 's', fmtN(a.atk), fmtN(a.hp)], W2) + flag);
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

// Recorte de lançamento: mede somente a primeira hora usando a política real da campanha.
// É o cenário autoritativo para o hook, Área 1 e 1ª Convergence.
function scenarioFirstHour() {
  const hours = +arg('hours', 1);
  console.log(`\n═══ FIRST HOUR — seed ${SEED} · cap ${hours}h ═══\n`);
  const sim = freshSim({ converge: true, allowAwaken: false, areaProj: true });
  run(sim, { maxHours: hours });

  const d = G.state.data;
  const W1 = [6, 9, 8, 8, 9, 9];
  console.log(row(['área', 'entrada', 'nível', 'HTK ent', 'TTD ent', 'gear méd'], W1));
  for (const a of sim.areaEntries.filter(a => a.run === 1))
    console.log(row([a.area, fmtT(a.t), a.level, a.htk.toFixed(2), a.ttd.toFixed(1) + 's', a.gear], W1));

  const buys = sim.gearPurchases;
  console.log('\nUPGRADES DE GEAR');
  if (!buys.length) console.log('  nenhum upgrade comprado');
  else {
    const first = buys.slice(0, 4);
    for (let i = 0; i < first.length; i++) {
      const prevT = i ? first[i - 1].t : 0;
      console.log(`  #${i + 1} ${first[i].slot} ${first[i].from}→${first[i].to} · ${fmtT(first[i].t)} · espera ${fmtT(first[i].t - prevT)} · custo ${fmtN(first[i].cost)}`);
    }
    const byArea = {};
    for (const b of buys) byArea[b.area] = b;
    console.log('  última compra observada por área: ' + Object.keys(byArea).map(k => `A${k} ${fmtT(byArea[k].t)} (${fmtN(byArea[k].cost)})`).join(' · '));
  }

  const firstConv = sim.runs[0];
  console.log(`\n1ª CONVERGENCE: ${firstConv ? fmtT(firstConv.t) + ' · Lv ' + firstConv.level + ' · área máxima ' + firstConv.areaMax : 'não ocorreu'}`);
  console.log(`FINAL: ${fmtT(sim.t)} · Lv ${d.level} · área ${d.areaIndex + 1} · ${d.convergences} convergence(s) · ${fmtN(d.totalKills)} kills · ${M.deaths} mortes · gear médio ${gearAvgLevel()}`);
}

// P5: o gate agora é uma ESCADA (convGateBase × convGateGrowth^n). Este cenário compara
// candidatos de convGateGrowth: nº de convergences no mapa, 1ª conv, spread por grupo, razões.
function scenarioGates() {
  const growths = String(arg('growths', '1.25,1.30,1.35')).split(',').map(Number);
  const maxHours = +arg('max-hours', 60);
  const origGrowth = G.data.balance.convGateGrowth;
  console.log(`\n═══ GATES — comparação de convGateGrowth (gate escalonado) · seed ${SEED} ═══\n`);
  const W = [8, 8, 9, 11, 9, 8, 20];
  console.log(row(['growth', '#conv', '1ª conv', 'First Light', 'Okhra', 'razão méd', 'convs por grupoMax'], W));
  for (const growth of growths) {
    G.data.balance.convGateGrowth = growth;
    const sim = freshSim({ converge: true, allowAwaken: true });
    run(sim, { maxHours, stop: (s) => G.state.data.mapOneCleared });
    const nconv = sim.runs.length;
    const firstConv = nconv ? fmtT(sim.runs[0].t) : '—';
    const ratios = sim.runs.slice(1).map((r, i) => r.pts / sim.runs[i].pts);
    const avgR = ratios.length ? (ratios.reduce((a, b) => a + b, 0) / ratios.length).toFixed(2) : '—';
    const spread = {}; for (const r of sim.runs) spread['G' + r.grpMax] = (spread['G' + r.grpMax] || 0) + 1;
    const okhra = G.state.data.mapOneCleared ? fmtT(sim.t) : (sim.timedOut ? 'timeout' : '—');
    console.log(row([growth, nconv, firstConv, sim.firstLightAt != null ? fmtT(sim.firstLightAt) : '—', okhra, avgR,
      Object.keys(spread).map(k => k + ':' + spread[k]).join(' ')], W));
  }
  G.data.balance.convGateGrowth = origGrowth;
  console.log('\n(alvo: 1ª conv 25–40min · convergences espalhadas por G1–G5 · razão de pontos 1.4–1.7)');
}

function scenarioCampaign() {
  const push = +arg('push', 1.0);
  // P10 fase1b (modo DESCOBERTA, dono jul/05): --uncapped roda até o clear NATURAL do Mapa 1
  //   (First Light/Okhra) SEM o relógio cortar. Sem a flag, o cap de segurança é 200h (evita
  //   loop infinito se um dial impedir o clear). Com --uncapped o teto sobe pra 100000h (efetivo
  //   ∞) — a run só para em mapOneCleared. NÃO se fita pra alvo de relógio; mede-se e reporta-se.
  const uncapped = argv.includes('--uncapped');
  const maxHours = uncapped ? 100000 : +arg('max-hours', 200);
  // overrides em memória p/ testar candidatos do P3 (custo de promoção × chance de material)
  const promoteCost = arg('promote-cost', null);
  const commonChance = arg('common-chance', null);
  const uncCap = arg('unc-cap', null);
  if (promoteCost != null) G.data.balance.promoteCommonCost = +promoteCost;
  if (commonChance != null) {
    G.economy.dropTable.common.commonMaterial.chance = +commonChance;
    G.economy.dropTable.rare.commonMaterial.chance = +commonChance * 3;
  }
  if (uncCap != null) { const r = G.data.rarities.find(r => r.id === 'uncommon'); if (r) r.cap = +uncCap; }
  const ovr = (promoteCost != null || commonChance != null || uncCap != null)
    ? ` · override[cost ${G.data.balance.promoteCommonCost}, chance ${G.economy.dropTable.common.commonMaterial.chance}, uncCap ${G.data.rarities.find(r=>r.id==='uncommon').cap}]` : '';
  console.log(`\n═══ CAMPAIGN — Mapa 1 completo · gate escalonado ×${G.data.balance.convGateGrowth} · push ${push} · seed ${SEED} · ${uncapped ? 'UNCAPPED (clear natural)' : 'cap ' + maxHours + 'h'}${ovr} ═══\n`);

  // P5: sem parada artificial — o gate escalonado (× convGateGrowth) ultrapassa o cap de nível
  // após ~12 convergences, então a convergência PÁRA sozinha e o jogador empurra até Okhra.
  const sim = freshSim({ converge: true, push, allowAwaken: true, areaProj: true });

  // P7.4/P8.4: conta os GOLPES na luta do Okhra (mapBoss) COM a maré ativa — banda 60–120.
  // P8.3: conta os golpes de cada Harbinger H1–H6 (1ª queda de cada) — banda 20–40.
  // Headless não tem projétil: cada playerHit resolve direto em applyHitToEnemy.
  let okhraHits = 0, okhraFightStart = null, okhraDeaths = 0, area18Deaths = 0;
  const bossHitsCur = {};    // areaIdx -> golpes acumulados na luta corrente
  const bossHTK = {};        // areaIdx -> HTK da 1ª queda (Harbinger)
  const _applyHitEnemy = G.combat.applyHitToEnemy.bind(G.combat);
  G.combat.applyHitToEnemy = function (dmg, crit) {
    const t = this.enemies.find((e) => !e.dead);
    if (t && t.isMapBoss) {
      okhraHits++;
      if (okhraFightStart == null) okhraFightStart = sim.t;
    } else if (t && t.isBoss) {
      const k = G.state.data.areaIndex;
      bossHitsCur[k] = (bossHitsCur[k] || 0) + 1;
    }
    return _applyHitEnemy(dmg, crit);
  };
  const _markBoss = G.combat.markBossCleared.bind(G.combat);
  G.combat.markBossCleared = function (e) {
    if (e && e.isBoss && !e.isMapBoss) {
      const k = G.state.data.areaIndex;
      if (bossHTK[k] == null) bossHTK[k] = bossHitsCur[k] || 0;   // 1ª queda = mais dura (menos gear)
      bossHitsCur[k] = 0;
    }
    return _markBoss(e);
  };
  const _onDeathC = G.combat.onDeath.bind(G.combat);
  G.combat.onDeath = function () {
    if (G.state.data.areaIndex === G.data.areas.length - 1) {
      area18Deaths++;
      if (this.enemies.some((x) => x.isMapBoss && !x.dead)) okhraDeaths++;
    }
    return _onDeathC();
  };

  // não para no First Light — segue até Okhra (área 18) p/ medir o mapa inteiro
  try {
    run(sim, { maxHours, stop: (s) => G.state.data.mapOneCleared });
  } finally {
    G.combat.applyHitToEnemy = _applyHitEnemy;
    G.combat.markBossCleared = _markBoss;
    G.combat.onDeath = _onDeathC;
  }

  const W = [5, 9, 8, 7, 7, 5, 9, 7, 8, 7, 6];
  console.log(row(['run', 't', 'dur', 'gate', 'nível', 'gMax', 'pontos', 'razão', 'nós·lvls', 'árvore', 'coroa'], W));
  for (let i = 0; i < sim.runs.length; i++) {
    const r = sim.runs[i];
    const ratio = i > 0 ? (r.pts / sim.runs[i - 1].pts).toFixed(2) : '—';
    console.log(row([r.n, fmtT(r.t), fmtT(r.dur), r.gate, r.level, 'G' + r.grpMax, fmtN(r.pts), ratio, r.nodesBought,
      (r.treePct || 0) + '% (' + r.treeNodes + '/15)', r.crown ? '✦' : '—'], W));
  }
  const crownRun = sim.runs.find(r => r.crown);
  console.log(`  coroa "The Ring Closes": ${sim.crownAt != null ? 'acesa em ' + fmtT(sim.crownAt) + (crownRun ? ` (conv ${crownRun.n})` : '') : 'NÃO acendeu'} · alvo: 8ª–11ª convergence`);
  const gateRatios = sim.runs.slice(1).map((r, i) => r.pts / sim.runs[i].pts);
  if (gateRatios.length) {
    const avgR = gateRatios.reduce((a, b) => a + b, 0) / gateRatios.length;
    console.log(`  razão de pontos média entre convergences: ${avgR.toFixed(2)} (alvo do gate ~1.4–1.7)`);
  }
  const grpSeen = {}; for (const r of sim.runs) grpSeen[r.grpMax] = (grpSeen[r.grpMax] || 0) + 1;
  console.log(`  convergences por grupoMax: ${JSON.stringify(grpSeen)}`);

  const d = G.state.data;
  console.log('');
  if (sim.firstLightAt != null) {
    console.log(`✦ FIRST LIGHT em ${fmtT(sim.firstLightAt)} — ${d.convergences} convergences · ${d.totalKills} kills · ${M.deaths} mortes`);
  } else {
    const reqs = G.awaken.requirements('first_light').map(r => `${r.key}: ${fmtN(r.have)}/${fmtN(r.need)}${r.met ? ' ✓' : ' ✗'}`).join(' · ');
    console.log(`⚠ First Light NÃO alcançado em ${fmtT(sim.t)} — nível ${d.level}, área ${d.areaIndex + 1}, ${d.convergences} convergences`);
    console.log(`  requisitos: ${reqs}`);
  }
  if (d.mapOneCleared) console.log(`🌊 OKHRA (área 18 · Map 1 completo) em ${fmtT(sim.t)} — ${okhraHits} golpes · luta ${okhraFightStart != null ? fmtT(sim.t - okhraFightStart) : '—'} (spawn→morte) · mortes na área 18: ${area18Deaths} (durante o Okhra: ${okhraDeaths}) (alvo P2.5 60–120, ~90 · SEM loop de morte)`);
  else console.log(`⚠ Okhra NÃO derrotado em ${fmtT(sim.t)} — área ${d.areaIndex + 1}, nível ${d.level}${sim.timedOut ? ' (timeout)' : ''} · mortes na área 18: ${area18Deaths}`);
  const s = G.state.stats();
  console.log(`  final: ATK ${fmtN(s.atk)} · HP ${fmtN(s.hp)} · gear médio ${gearAvgLevel()} · passivas ${sim.nodeLevelsBought} níveis de nó`);

  // ═══ P10 fase1b — PROJEÇÃO do Mapa 1 (por ÁREA e por GRUPO) ═══════════════════════════
  //   Modo DESCOBERTA: mede-se e reporta-se o que o modelo Gaiadon produz — mob HP · DPS do
  //   jogador · Lumens/min · custo de gear · materiais acumulados · TTK entrada/saída · tempo.
  //   Por área usa a ÚLTIMA amostra do sampler areaProj (estado com que o jogador de fato passou
  //   pela área na última vez — cobertura completa das 18 áreas, incl. as puladas na re-subida).
  const AP = sim.areaProj || {};
  const gsP = G.data.balance.groupSize || 3;
  console.log('\n── PROJEÇÃO por ÁREA (última passagem amostrada) ──');
  const WA = [5, 4, 8, 7, 10, 10, 9, 9, 11, 11, 10];
  console.log(row(['área', 'grp', 'entrada', 'nível', 'mobHP', 'DPS jog', 'TTK', 'TTD', 'Lumens/min', 'custo gear', 'HP jog'], WA));
  for (let i = 0; i < G.data.areas.length; i++) {
    const a = AP[i];
    if (!a) { console.log(row([i + 1, 'G' + (Math.floor(i / gsP) + 1), '—', '—', '—', '—', '—', '—', '—', '—', '—'], WA)); continue; }
    console.log(row([i + 1, 'G' + (Math.floor(i / gsP) + 1), fmtT(a.t), a.level, fmtN(a.mobHp), fmtN(a.dps),
      a.ttk.toFixed(1) + 's', a.ttd > 1e6 ? '∞' : a.ttd.toFixed(0) + 's', fmtN(a.lumensPerMin),
      a.gearMaxed ? 'maxed' : fmtN(a.gearCost), fmtN(a.hp)], WA));
  }
  console.log('\n── PROJEÇÃO por GRUPO (duração · materiais acumulados no fim do grupo) ──');
  const WG = [6, 10, 10, 12, 12, 13];
  console.log(row(['grupo', 'entrada', 'duração', 'common mat', 'awaken mat', 'Lumens/min'], WG));
  // duração de grupo pela 1ª entrada de cada grupo (areaEntries), materiais/renda do sampler areaProj
  const groupEntryP = {};
  for (const a of sim.areaEntries) { const g = Math.floor((a.area - 1) / gsP); if (groupEntryP[g] === undefined) groupEntryP[g] = a.t; }
  const gseenP = Object.keys(groupEntryP).map(Number).sort((x, y) => x - y);
  for (let gi = 0; gi < gseenP.length; gi++) {
    const g = gseenP[gi], start = groupEntryP[g], nextG = gseenP[gi + 1];
    const end = (nextG === undefined) ? sim.t : groupEntryP[nextG];
    const durH = (end - start) / 3600;
    // pega a amostra da ÚLTIMA área do grupo (maior índice amostrado dentro do grupo)
    let gl = null;
    for (let ai = g * gsP + gsP - 1; ai >= g * gsP; ai--) { if (AP[ai]) { gl = AP[ai]; break; } }
    console.log(row(['G' + (g + 1), fmtT(start), durH.toFixed(2) + 'h', gl ? fmtN(gl.matCommon) : '—',
      gl ? fmtN(gl.matAwaken) : '—', gl ? fmtN(gl.lumensPerMin) : '—'], WG));
  }
  const clearT = d.mapOneCleared ? sim.t : null;
  console.log(`\n  ✦ TEMPO TOTAL de clear do Mapa 1: ${clearT != null ? fmtT(clearT) : 'NÃO clarou'} · First Light ${sim.firstLightAt != null ? fmtT(sim.firstLightAt) : '—'} · ${d.convergences} convergences · ${fmtN(d.totalKills)} kills · ${M.deaths} mortes`);

  // ---- P8.3: HTK da 1ª (e única) queda de cada Harbinger H1–H6 na campanha ----
  // NB: cada Harbinger é lutado 1× (maxAreaUnlocked sobrevive à Convergence). Este HTK reflete
  // o GEAR no 1º contato da política greedy (H1 = parede-tutorial P2.4 sob-gear; Harbingers fundos
  // derretem por over-gear). O HTK CANÔNICO (gear de referência) = 30 p/ os 6, via `sim calibrate`.
  // A assinatura contribui pouco: Lightshell +N absorvidos, Siphoning ~0 (HP boss >> atk), Quickened/Escorted +0 ao HTK.
  const HLABEL = { 2: 'H1 Lightshell', 5: 'H2 Escorted', 8: 'H3 Siphoning', 11: 'H4 Quickened', 14: 'H5 Lightshell+Quickened', 17: 'H6 Siphoning+Escorted' };
  console.log('\n' + row(['Harbinger', 'área', 'HTK 1º contato', 'canônico (calibrate)'], [26, 6, 15, 22]));
  for (const idx of [2, 5, 8, 11, 14, 17]) {
    const htk = bossHTK[idx];
    console.log(row([HLABEL[idx], idx + 1, htk != null ? htk.toFixed(0) : '—', '30 (banda 20–40)'], [26, 6, 15, 22]));
  }

  // ---- ECONOMIA (P3): promoções Common→Uncommon · alvo dos 6 beats = G2–G4 ----
  const WP = [10, 10, 8, 16];
  console.log('\n' + row(['peça', 'tempo', 'grupo', 'alvo G2–G4'], WP));
  const slotLabel = {}; G.data.slots.forEach(sl => slotLabel[sl.id] = sl.label);
  for (const p of sim.promotions) {
    const ok = p.group >= 2 && p.group <= 4;
    console.log(row([slotLabel[p.slot] || p.slot, fmtT(p.t), 'G' + p.group, ok ? '✓' : '✗ (fora)'], WP));
  }
  if (!sim.promotions.length) console.log('  (nenhuma promoção ocorreu)');
  else {
    const groups = sim.promotions.map(p => p.group);
    const spread = (Math.min(...groups) >= 2 && Math.max(...groups) <= 4) ? '✓ todas em G2–G4' : '✗ fora da janela';
    const allG2 = groups.every(g => g === 2) ? ' ⚠ trivial (todas no G2)' : '';
    console.log(`  → ${sim.promotions.length}/6 promoções · 1ª ${fmtT(sim.promotions[0].t)} (G${groups[0]}) · 6ª ${fmtT(sim.promotions[sim.promotions.length-1].t)} (G${groups[groups.length-1]}) · ${spread}${allG2}`);
  }

  // ---- materiais por grupo ----
  const WM = [7, 12, 12];
  console.log('\n' + row(['grupo', 'common mat', 'awaken mat'], WM));
  const gKeys = Object.keys(M.matByGroup).map(Number).sort((a, b) => a - b);
  for (const g of gKeys) {
    const b = M.matByGroup[g];
    console.log(row(['G' + (g + 1), fmtN(b.common), fmtN(b.awaken)], WM));
  }
  const awT = sim.awakenMatAt != null ? fmtT(sim.awakenMatAt) : '—';
  const flT = sim.firstLightAt != null ? fmtT(sim.firstLightAt) : '—';
  console.log(`  awaken mat ≥ 1 em ${awT} · First Light em ${flT}` +
    (sim.awakenMatAt != null && sim.firstLightAt != null ? ` (folga ${fmtT(sim.firstLightAt - sim.awakenMatAt)})` : ''));

  // ---- acesos por grupo (P8.1): frequência do Rarity Find (kills por tier) ----
  const WL = [7, 11, 15, 15, 15];
  console.log('\n' + row(['grupo', 'common', 'Ember', 'Lumen', 'Corona'], WL));
  const lKeys = Object.keys(M.litByGroup).map(Number).sort((a, b) => a - b);
  let tC = 0, tE = 0, tL = 0, tCo = 0;
  const pctOf = (n, tot) => tot ? (100 * n / tot).toFixed(n / tot < 0.001 ? 3 : 2) + '%' : '0%';
  for (const g of lKeys) {
    const b = M.litByGroup[g];
    tC += b.common; tE += b.ember; tL += b.lumen; tCo += b.corona;
    const tot = b.common + b.ember + b.lumen + b.corona;
    console.log(row(['G' + (g + 1), fmtN(b.common),
      b.ember + ' (' + pctOf(b.ember, tot) + ')', b.lumen + ' (' + pctOf(b.lumen, tot) + ')', b.corona + ' (' + pctOf(b.corona, tot) + ')'], WL));
  }
  const totAll = tC + tE + tL + tCo;
  console.log(`  total: common ${fmtN(tC)} · Ember ${tE} (${pctOf(tE, totAll)}) · Lumen ${tL} (${pctOf(tL, totAll)}) · Corona ${tCo} (${pctOf(tCo, totAll)})`);

  // ---- TTK de RE-SUBIDA (Opção A): nas runs 2+, HTK real ao re-entrar em área já
  // visitada em run ANTERIOR — valida que "derreter" (HTK ≤ 2) vem do prestige.
  const reclimb = {};   // areaIdx → { n, min, max, runs: [..] }
  let maxAreaPrevRuns = -1, curRun = null, curRunMax = -1;
  for (const e of sim.areaEntries) {
    const r = e.run || 1;
    if (r !== curRun) { maxAreaPrevRuns = Math.max(maxAreaPrevRuns, curRunMax); curRun = r; curRunMax = -1; }
    curRunMax = Math.max(curRunMax, e.area - 1);
    if (r >= 2 && e.area - 1 <= maxAreaPrevRuns && e.htk != null) {
      const rc = reclimb[e.area - 1] || (reclimb[e.area - 1] = { n: 0, min: Infinity, max: -Infinity });
      rc.n++; rc.min = Math.min(rc.min, e.htk); rc.max = Math.max(rc.max, e.htk);
    }
  }
  const rcKeys = Object.keys(reclimb).map(Number).sort((a, b) => a - b);
  if (rcKeys.length) {
    const WR = [6, 12, 10, 10, 10];
    console.log('\n' + row(['área', 're-entradas', 'HTK min', 'HTK máx', 'derrete?'], WR));
    for (const i of rcKeys) {
      const rc = reclimb[i];
      console.log(row([i + 1, rc.n, rc.min.toFixed(2), rc.max.toFixed(2), rc.max <= 2 ? '✓ (≤2)' : '✗ (>2)'], WR));
    }
    console.log('  (re-subida = entrada em área já visitada em run anterior, runs 2+ · alvo do dono: HTK ≤ 2)');
  } else {
    console.log('\n  (sem re-subidas amostradas — nenhuma área re-entrada em runs 2+)');
  }
}

// ---------- calibração (P2 — deriva HP/mobAtk/hpMult das bandas HTK C3) ----------
function scenarioCalibrate() {
  const candidates = String(arg('growths', '1.022,1.028,1.034')).split(',').map(Number);
  const passes = +arg('passes', 3);
  const measHours = +arg('meas-hours', 150);
  const doWrite = argv.includes('--write');
  const gate = +arg('gate', 276);
  const uncCap = arg('unc-cap', null);   // override do cap provisório do uncommon (P3/P4)
  if (uncCap != null) { const r = G.data.rarities.find(r => r.id === 'uncommon'); if (r) r.cap = +uncCap; }
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
  // Opção A (dono, jul/2026): HTK-fim 1.5 vale pra RE-SUBIDA pós-Convergence, não pra
  // 1ª passada — a calibração fixa SÓ paredes de entrada + bosses; hp[1] vira rampa.
  // P8.4: idx 17 agora é o H6 (Harbinger, HTK 30); o Okhra é area.mapBoss (hpMult 48 travado, fora da calibração).
  const BOSS_HTK = {}; [2, 5, 8, 11, 14, 17].forEach(i => BOSS_HTK[i] = 30);
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
  const snapNow = () => { const s = G.state.stats(); return { dmgHit: dmgHitNow(), hp: s.hp, atkInt: G.state.attackInterval(), pack: G.enemyFactory._packSize() }; };

  let ENTRY, END, BOSS;
  const origMBC = G.combat.markBossCleared;
  G.combat.markBossCleared = function (e) {
    const d = G.state.data, idx = d.areaIndex, area = G.data.areas[idx];
    if (BOSS && !BOSS[idx] && !(e && e.isMapBoss)) {   // Okhra (mapBoss) fora da calibração
      const lvl = G.util.clamp(d.level, area.levelRange[0], area.levelRange[1]);
      BOSS[idx] = { dmgHit: dmgHitNow(), baseMobHp: G.data.mobHpAt(lvl, area) };
    }
    return origMBC.call(this, e);
  };

  function measureRun(seed) {
    ENTRY = {}; END = {}; BOSS = {};
    // allowAwaken:false → o push não para no First Light (área 9), segue até Okhra,
    // amostrando as 18 áreas + os 6 Marcos.
    // P5: convergência para sozinha quando o gate ultrapassa o cap de nível; marca o push então.
    const levelCap = G.data.areas[G.data.areas.length - 1].levelRange[1];
    const sim = freshSim({ converge: true, allowAwaken: false, seed,
      onConverge: (s) => { if (G.convergence.currentGate() > levelCap && s.pushStart == null) s.pushStart = s.t; } });
    sim.onStep = (s) => {
      const d = G.state.data, idx = d.areaIndex, area = G.data.areas[idx];
      if (!ENTRY[idx]) ENTRY[idx] = snapNow();
      if (!END[idx] && d.level >= area.levelRange[1]) END[idx] = snapNow();
    };
    // para quando Okhra cai (amostra completa) OU quando área 18 foi alcançada e
    // já se deu tempo de tentar Okhra (o teto de XP trava o nível ~5150, então Okhra
    // raramente é amostrável — fallback analítico no relatório).
    run(sim, { maxHours: measHours, stop: (s) => BOSS[17] != null || (ENTRY[17] != null && s.t > (s.pushStart || 0) + 4 * 3600) });
    sim._entry = ENTRY; sim._end = END; sim._boss = BOSS;
    return sim;
  }

  // aplica as amostras às tabelas em memória (retorna quais áreas ficaram sem amostra)
  function applySamples(entry, end, boss) {
    const missing = [];
    // 1ª varredura: paredes de entrada (hp0 = HTK alvo × dano esperado na entrada)
    const hp0s = [];
    for (let i = 0; i < N; i++) {
      const e = entry[i];
      hp0s[i] = e ? Math.max(1, HTK_ENTRY[i] * e.dmgHit) : null;
    }
    for (let i = 0; i < N; i++) {
      const area = G.data.areas[i];
      const e = entry[i];
      if (!e) { missing.push(i + 1); continue; }
      const hp0 = hp0s[i];
      // Opção A: hp1 = rampa interna suave rumo à parede seguinte —
      // clamp(0.6 × hp0_da_área_seguinte, hp0×1.3, hp0×3.0); área 18 (sem seguinte): ×2.
      // Invariante hp1 >= hp0 por construção; o HTK-fim da 1ª passada é EMERGENTE
      // (reportado, não forçado) — o "derreter" (HTK ≤ 2) vem do prestige na re-subida.
      const nextHp0 = hp0s[i + 1];
      const hp1 = (i === N - 1 || nextHp0 == null)
        ? hp0 * 2
        : G.util.clamp(0.6 * nextHp0, hp0 * 1.3, hp0 * 3.0);
      area.hp = [hp0, hp1];
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
    const reached = Math.max(...Object.keys(sim._entry).map(Number)) + 1;
    const totalH = sim.t / 3600;

    results.push({ growth, meanDev, totalH, groupDur, entry, end, boss, missing, reached,
      hp: G.data.areas.map(a => a.hp.slice()), atk: G.data.balance.mobAtkByArea.slice(),
      bossHp: (() => { const o = {}; G.data.areas.forEach((a, i) => { if (a.boss) o[i] = a.boss.hpMult; }); return o; })(),
      firstLight: sim.firstLightAt, deaths: M.deaths });

    console.log(`growth ${growth}: alcançou área ${reached} · total ${totalH.toFixed(1)}h · desvio médio grupos ${meanDev.toFixed(0)}%` + (missing.length ? ` · sem amostra: ${missing.join(',')}` : ''));
  }

  // escolhe o melhor: campanha COMPLETANDO (área 18 alcançada) primeiro,
  // depois menor desvio médio absoluto vs contrato
  results.sort((a, b) => {
    const ca = a.reached >= N ? 0 : 1, cb = b.reached >= N ? 0 : 1;
    return ca !== cb ? ca - cb : a.meanDev - b.meanDev;
  });
  const best = results[0];
  console.log(`\n➤ ESCOLHIDO: gearCostGrowth ${best.growth} (${best.reached >= N ? 'campanha completa' : '⚠ NENHUM candidato completa'} · desvio médio de grupo: ${best.meanDev.toFixed(0)}%)\n`);

  // aplica as tabelas do melhor candidato em memória p/ o relatório e a escrita
  restoreSeed();
  G.data.balance.gearCostGrowth = best.growth;
  applySamples(best.entry, best.end, best.boss);

  // ---- tabela TTK por área (HTK fim = EMERGENTE da 1ª passada; Opção A não o força) ----
  const W = [6, 6, 5, 12, 12, 9, 9, 8];
  console.log(row(['área', 'grupo', 'pos', 'HP entrada', 'HP fim', 'HTK ent', 'HTKfim*', 'mobAtk'], W));
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
  console.log('  * HTKfim = emergente na 1ª passada (Opção A: o alvo 1–2 golpes vale pra RE-SUBIDA pós-Convergence)');

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
  console.log(`\n  total até alcançar área 18: ${best.totalH.toFixed(1)}h (contrato-soma 18h) · mortes ${best.deaths}`);
  console.log('  (política P5: gate escalonado ×' + G.data.balance.convGateGrowth + ' — as 8 convergências se espalham pelos grupos.)');

  if (doWrite) {
    const p = path.join(__dirname, '..', 'src', 'data.js');
    let text = fs.readFileSync(p, 'utf8');
    const orig = text;
    text = text.replace(/gearCostGrowth:\s*[\d.]+,[^\n]*/, `gearCostGrowth:    ${best.growth},   // P2.2: freio principal — testado no sim`);
    const atkStr = best.atk.map(x => Math.round(x)).join(', ');
    text = text.replace(/mobAtkByArea:\s*\[[\s\S]*?\]/, `mobAtkByArea:      [${atkStr}]`);
    let hi = 0;
    text = text.replace(/hp:\s*\[\s*\d[^\]]*\](,?)[^\n]*/g, (m, comma) => {
      const pair = best.hp[hi]; hi++;
      return `hp: [${Math.round(pair[0])}, ${Math.round(pair[1])}]${comma}  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar`;
    });
    const bossOrder = [2, 5, 8, 11, 14, 17]; let bi = 0, bossOk = 0;
    text = text.replace(/boss:\s*\{[^}]*\}/g, (blk) => {
      const idx = bossOrder[bi]; bi++;
      const mult = best.bossHp[idx];
      if (mult == null || !/hpMult:\s*[\d.]+/.test(blk)) return blk;   // sem placeholder p/ injetar — não conta como sucesso
      bossOk++;
      return blk.replace(/hpMult:\s*[\d.]+/, `hpMult: ${(+mult).toFixed(2)}`);
    });
    // safety: o data.js reescrito precisa avaliar sem erro
    let ok = true;
    try { vm.runInNewContext('var G={};\n' + text, {}); } catch (e) { ok = false; console.error('\n✗ ABORTADO: data.js reescrito não avalia — ' + e.message); }
    if (ok && hi === N && bossOk === bossOrder.length) { fs.writeFileSync(p, text); console.log(`\n✓ escrito em src/data.js (${hi} áreas · mobAtk · ${bossOk} bosses · growth ${best.growth})`); }
    else if (ok) console.error(`\n✗ ABORTADO: contagem inesperada (hp ${hi}/${N}, boss ${bossOk}/${bossOrder.length} — blocos vistos ${bi}) — data.js não tocado`);
  } else {
    console.log('\n(dry-run — use --write para gravar em src/data.js)');
  }
  G.combat.markBossCleared = origMBC;
}

// ---------- main ----------
const t0 = Date.now();
applySimOverride();
if (cmd === 'baseline') scenarioBaseline();
else if (cmd === 'first-hour') scenarioFirstHour();
else if (cmd === 'gates') scenarioGates();
else if (cmd === 'campaign') scenarioCampaign();
else if (cmd === 'calibrate') scenarioCalibrate();
else { console.error(`comando desconhecido: ${cmd} (use baseline | first-hour | gates | campaign | calibrate)`); process.exit(1); }
console.log(`\n(sim real: ${((Date.now() - t0) / 1000).toFixed(1)}s wall-clock)`);
