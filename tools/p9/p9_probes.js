// P9 — probes unitários das 6 mecânicas novas. Descartável.
// Carrega os módulos reais de src/ num sandbox (como o convergence.test.js) e
// exercita cada mecânica isoladamente com stubs mínimos. rng seedado onde importa.
'use strict';
const fs = require('fs');
const path = require('path');

global.window = global;
let store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
const SRC = path.join(__dirname, '..', '..', 'src');
for (const f of ['util', 'data', 'gear', 'passives', 'awaken', 'state', 'economy', 'convergence', 'combat'])
  eval(fs.readFileSync(path.join(SRC, f + '.js'), 'utf8'));

let failed = 0;
function ok(c, m) { console.log((c ? 'PASS' : 'FAIL') + ' — ' + m); if (!c) failed++; }
const REAL_EFFECT = G.passives.effect.bind(G.passives);
function setEffect(fn) { G.passives.effect = fn; }
function restoreEffect() { G.passives.effect = REAL_EFFECT; }

function freshState() { store = {}; G.state.data = null; G.state.load(); G.ui = null; }
function resetCombat() {
  Object.assign(G.combat, {
    enemies: [], enemy: null, atkTimer: 0, respawnTimer: 0, pendingHits: [],
    spawnCount: 0, _lastAreaIndex: -1, _bossKills: 0, _okhraManifest: false,
    _tideTimer: 0, _tideRisen: false, _momentumStacks: 0, _momentumTimer: 0,
    _clock: 0, _gains: [], _cleaving: false,
  });
}
// stub de stats() p/ controlar os stats sem montar gear real
function stubStats(patch) {
  const base = {
    atk: 100, hp: 1000, crit: 5, critRaw: 5, critDmg: 50, critMult: 1.5,
    atkSpeed: 1, xpBonus: 0, lumensBonus: 0, damageReduction: 0, lightbane: 0,
    specialDmg: 0, cleave: 0, bulwark: 0, overcrit: 0, momentum: 0,
    healOnKill: 0, hpRegen: 0,
    rarityFind: { ember: 0, lumen: 0, corona: 0 }, rarityCaps: { ember: 0, lumen: 0, corona: 0 },
  };
  const merged = Object.assign(base, patch);
  G.state.stats = () => merged;
  return merged;
}
function mkEnemy(hp, extra) {
  return Object.assign({ name: 'M', maxHp: hp, hp, dmg: 10, lumens: 100, xp: 10, dead: false,
    isBoss: false, isMapBoss: false, lightshell: 0, atkTimer: 0, rarity: null, modifiers: [] }, extra || {});
}

// ===== (a) Cleave transfere overkill pro próximo vivo e NÃO re-propaga =====
(function () {
  freshState(); resetCombat();
  stubStats({ atk: 1000, cleave: 25, crit: 0, critRaw: 0 });   // 25% do overkill
  // e1 com 100 HP → golpe de 1000 = overkill 900. Cleave = 25% × 900 = 225 no próximo.
  const e1 = mkEnemy(100), e2 = mkEnemy(300), e3 = mkEnemy(300);
  G.combat.enemies = [e1, e2, e3];
  G.combat.applyHitToEnemy(1000, false);
  ok(e1.dead && e1.hp === 0, '(a) alvo do golpe fatal morre');
  ok(!e2.dead && e2.hp === 75, `(a) cleave transfere 25% de 900 (=225) ao próximo vivo: e2.hp 300→${e2.hp}`);
  ok(!e3.dead && e3.hp === 300, '(a) e3 intocado (cleave é 1 salto só)');

  // re-propagação: se a corrente do cleave MATAR o próximo, não salta de novo
  resetCombat();
  stubStats({ atk: 1000, cleave: 25, crit: 0, critRaw: 0 });
  const f1 = mkEnemy(100), f2 = mkEnemy(50), f3 = mkEnemy(300);  // 225 de cleave mata f2 (50 HP), f2 overkill 175
  G.combat.enemies = [f1, f2, f3];
  G.combat.applyHitToEnemy(1000, false);
  ok(f1.dead && f2.dead, '(a) cleave em cadeia mata f2 (dano 225 > 50 HP)');
  ok(!f3.dead && f3.hp === 300, '(a) cadeia do cleave NÃO re-propaga: f3 intocado');
})();

// ===== (b) Execute mata não-boss abaixo do limiar e NÃO mata boss =====
(function () {
  freshState(); resetCombat();
  stubStats({ atk: 1 });   // dano irrisório: só o execute pode matar
  setEffect((k) => (k === 'executioner' ? 8 : 0));   // 8% (cap)
  // mob 1000 HP, atual 70 (=7% < 8%) após um golpe de 1 → 69 → executa
  const mob = mkEnemy(1000, { hp: 71 });
  G.combat.enemies = [mob];
  G.combat.applyHitToEnemy(1, false);
  ok(mob.dead && mob.hp === 0, `(b) execute mata mob abaixo de 8% HP (70/1000=7%)`);

  // acima do limiar: não executa
  resetCombat();
  const mob2 = mkEnemy(1000, { hp: 200 });   // 199/1000 = 19.9% > 8%
  G.combat.enemies = [mob2];
  G.combat.applyHitToEnemy(1, false);
  ok(!mob2.dead && mob2.hp === 199, '(b) execute NÃO dispara acima do limiar (19.9% > 8%)');

  // boss abaixo do limiar: NÃO executa
  resetCombat();
  const boss = mkEnemy(1000, { hp: 51, isBoss: true });
  G.combat.enemies = [boss];
  G.combat.applyHitToEnemy(1, false);
  ok(!boss.dead && boss.hp === 50, '(b) boss abaixo do limiar NÃO é executado (Marco intocado)');

  // Okhra (mapBoss) abaixo do limiar: NÃO executa
  resetCombat();
  const okhra = mkEnemy(1000, { hp: 51, isMapBoss: true });
  G.combat.enemies = [okhra];
  G.combat.applyHitToEnemy(1, false);
  ok(!okhra.dead && okhra.hp === 50, '(b) Okhra (mapBoss) NÃO é executado');
  restoreEffect();
})();

// ===== (c) Overcrit só ativa com crit>100 e respeita o teto =====
(function () {
  freshState(); resetCombat();
  // sem crit acima de 100 → sem golpe duplo, nunca (independente de rng)
  stubStats({ atk: 100, crit: 100, critRaw: 100, critMult: 1, overcrit: 30 });
  let sumNo = 0; const N = 4000;
  const origChance = G.util.chance;
  for (let i = 0; i < N; i++) {
    resetCombat(); const t = mkEnemy(1e12); G.combat.enemies = [t];
    G.combat.playerHit();
    // resolve pending (headless não tem projétil pois G.ui=null → aplica direto)
    sumNo += (1e12 - t.hp);
  }
  ok(sumNo === N * 100, `(c) crit=100 (excesso 0): zero golpes duplos em ${N} amostras (dano total ${sumNo} = ${N}×100)`);

  // crit efetivo 130 (excesso 30), overcrit cap 30 → doubleChance 30% → ~30% dos golpes 2×
  freshState(); resetCombat();
  Math.random = (function () { let s = 12345; return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; })();
  stubStats({ atk: 100, crit: 100, critRaw: 130, critMult: 1, overcrit: 30 });
  let doubles = 0; const M = 20000;
  for (let i = 0; i < M; i++) {
    resetCombat(); const t = mkEnemy(1e12); G.combat.enemies = [t];
    G.combat.playerHit();
    const dealt = 1e12 - t.hp;
    if (dealt === 200) doubles++;
    else if (dealt !== 100) { ok(false, `(c) dano inesperado ${dealt}`); break; }
  }
  const rate = doubles / M;
  ok(Math.abs(rate - 0.30) < 0.03, `(c) crit 130 c/ overcrit cap 30 → taxa de golpe duplo ${(rate*100).toFixed(1)}% (~30% esperado)`);

  // excesso 50 mas overcrit cap 20 → doubleChance clampado a 20%
  freshState(); resetCombat();
  Math.random = (function () { let s = 999; return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; })();
  stubStats({ atk: 100, crit: 100, critRaw: 150, critMult: 1, overcrit: 20 });
  let d2 = 0; const K = 20000;
  for (let i = 0; i < K; i++) {
    resetCombat(); const t = mkEnemy(1e12); G.combat.enemies = [t];
    G.combat.playerHit();
    if (1e12 - t.hp === 200) d2++;
  }
  ok(Math.abs(d2 / K - 0.20) < 0.03, `(c) excesso 50 c/ cap 20 → taxa ${(100*d2/K).toFixed(1)}% (teto 20% respeitado)`);
  G.util.chance = origChance;
})();

// ===== (d) Momentum capa em 3 stacks e expira =====
(function () {
  freshState(); resetCombat();
  const s = stubStats({ atk: 1e9, momentum: 5, atkSpeed: 1 });   // 5% por stack
  G.state.attackInterval = () => 1.0;
  // 5 kills seguidos → stacks devem parar em 3 (momentumMaxStacks)
  for (let i = 0; i < 5; i++) {
    resetKeepMomentum(); const t = mkEnemy(1); G.combat.enemies = [t];
    G.combat.applyHitToEnemy(1e9, false);   // mata → onKill → +1 stack
  }
  ok(G.combat._momentumStacks === 3, `(d) 5 kills → stacks capam em 3 (obtido ${G.combat._momentumStacks})`);
  // intervalo = 1.0 / (1 + 3×5/100) = 1/1.15
  const expectInt = 1.0 / (1 + 3 * 5 / 100);
  ok(Math.abs(G.combat.playerInterval() - expectInt) < 1e-9, `(d) intervalo reflete 3 stacks: ${G.combat.playerInterval().toFixed(4)} = 1/1.15`);
  // expira: timer = momentumDuration (6s). tick de 6.0s sem inimigo → zera
  G.combat.enemies = [];   // sem inimigo vivo
  G.combat._momentumTimer = G.data.balance.momentumDuration;
  // sem inimigos, tick retorna cedo (respawn); então decremento manual via tick com inimigo vivo mas sem matar
  G.combat.enemies = [mkEnemy(1e18)];   // vivo, não morre (HP enorme, atk 1e9 não mata em 1 tick? mata... use HP maior)
  G.combat.enemies = [mkEnemy(1e30)];
  G.state.stats = () => Object.assign({}, s, { hpRegen: 0 });
  let elapsed = 0;
  while (elapsed < 6.1 && G.combat._momentumStacks > 0) { G.combat.tick(0.1); elapsed += 0.1; }
  ok(G.combat._momentumStacks === 0, `(d) stacks expiram após ${G.data.balance.momentumDuration}s (zerou em ~${elapsed.toFixed(1)}s)`);

  function resetKeepMomentum() {
    const ms = G.combat._momentumStacks, mt = G.combat._momentumTimer;
    Object.assign(G.combat, { enemies: [], enemy: null, atkTimer: 0, pendingHits: [], _cleaving: false });
    G.combat._momentumStacks = ms; G.combat._momentumTimer = mt;
  }
  G.state.attackInterval = G.state.__proto__ ? G.state.attackInterval : G.state.attackInterval;
})();

// ===== (e) Golden Wake dobra lumens na taxa esperada (rng seedado) =====
(function () {
  freshState(); resetCombat();
  Math.random = (function () { let s = 4242; return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; })();
  stubStats({ atk: 1e9, lumensBonus: 0 });
  setEffect((k) => (k === 'goldenWake' ? 10 : 0));   // 10% (cap)
  const N = 40000; let doubled = 0; const baseLum = 100;
  for (let i = 0; i < N; i++) {
    resetCombat(); const t = mkEnemy(1, { lumens: baseLum, xp: 0 }); G.combat.enemies = [t];
    const before = G.state.data.lumens;
    G.combat.applyHitToEnemy(1e9, false);   // mata → onKill credita lumens
    const gained = G.state.data.lumens - before;
    if (gained === baseLum * 2) doubled++;
    else if (gained !== baseLum) { ok(false, `(e) lumens inesperado ${gained}`); break; }
  }
  ok(Math.abs(doubled / N - 0.10) < 0.02, `(e) Golden Wake 10% → ${(100*doubled/N).toFixed(1)}% dos kills c/ Lumens dobrados (~10%)`);
  restoreEffect();
})();

// ===== (f) Bulwark só ativa abaixo de 35% HP e a soma de DR respeita cap 75 =====
(function () {
  freshState(); resetCombat();
  const cap = G.data.balance.dmgReductionCap;   // 75
  // acima de 35%: só damageReduction base
  stubStats({ hp: 1000, damageReduction: 20, bulwark: 20 });
  G.state.maxHp = () => 1000;
  G.state.data.hp = 500;   // 50% > 35% → bulwark inativo
  let received = 0;
  const origFloater = null;
  G.combat.enemies = [mkEnemy(1e9)];
  G.state.data.hp = 500;
  G.combat.applyHitToHero(100, null);
  received = 500 - G.state.data.hp;
  ok(received === 80, `(f) HP 50% (>35%): só DR base 20% → 100 vira ${received} (bulwark inativo)`);

  // abaixo de 35%: DR + bulwark = 40%
  G.state.data.hp = 300;   // 30% < 35%
  G.combat.applyHitToHero(100, null);
  const r2 = 300 - G.state.data.hp;
  ok(r2 === 60, `(f) HP 30% (<35%): DR 20% + bulwark 20% = 40% → 100 vira ${r2}`);

  // soma clampada no cap 75: DR 60 + bulwark 40 = 100 → clamp 75
  stubStats({ hp: 1000, damageReduction: 60, bulwark: 40 });
  G.state.maxHp = () => 1000;
  G.state.data.hp = 100;   // 10% < 35% → bulwark ativo, soma 100 clampa 75
  G.combat.applyHitToHero(100, null);
  const r3 = 100 - G.state.data.hp;
  ok(r3 === 25, `(f) DR 60 + bulwark 40 abaixo de 35% → soma clampa em ${cap}%: 100 vira ${r3}`);
})();

// ===== (g) Cleave contra alvo com Lightshell: consome 1 carga, dano 0, alvo vivo =====
(function () {
  freshState(); resetCombat();
  stubStats({ atk: 1000, cleave: 25, crit: 0, critRaw: 0 });
  const e1 = mkEnemy(100), e2 = mkEnemy(300, { lightshell: 2 });
  G.combat.enemies = [e1, e2];
  G.combat.applyHitToEnemy(1000, false);
  ok(e1.dead && e1.hp === 0, '(g) alvo do golpe fatal morre');
  ok(!e2.dead && e2.hp === 300, `(g) cleave contra Lightshell causa 0 dano: e2.hp permanece ${e2.hp}`);
  ok(e2.lightshell === 1, `(g) cleave consome 1 carga de Lightshell (2→${e2.lightshell})`);
})();

// ===== (h) Cleave que deixa alvo não-boss abaixo do limiar do Executioner: morre via execute =====
(function () {
  freshState(); resetCombat();
  stubStats({ atk: 1000, cleave: 50, crit: 0, critRaw: 0 });   // 50% do overkill
  setEffect((k) => (k === 'executioner' ? 8 : 0));   // 8% (cap)
  // e1 100 HP → golpe de 1000 = overkill 900. Cleave = 50% × 900 = 450 no próximo.
  // e2 com 500 HP: 500-450=50 HP restante = 10% > 8% → NÃO executa por essa conta isolada;
  // usa e2 com 480 HP: 480-450=30 HP = 6.25% < 8% → executa.
  const e1 = mkEnemy(100), e2 = mkEnemy(480, { hp: 480 });
  G.combat.enemies = [e1, e2];
  const before = G.state.data.totalKills || 0;
  G.combat.applyHitToEnemy(1000, false);
  ok(e1.dead, '(h) alvo do golpe fatal morre');
  ok(e2.dead && e2.hp === 0, `(h) cleave deixa e2 abaixo do limiar do Executioner (30/480=6.25%<8%) → execute mata (hp=${e2.hp})`);
  ok((G.state.data.totalKills || 0) === before + 2, '(h) execute via cleave concede kill/recompensas (totalKills +2)');
  restoreEffect();
})();

console.log(failed === 0 ? '\nALL PROBES PASS' : `\n${failed} PROBE FAIL`);
process.exit(failed === 0 ? 0 : 1);
