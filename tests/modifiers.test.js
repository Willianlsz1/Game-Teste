// =============================================================
// tests/modifiers.test.js — Modificadores + finale encenado (P8.2/P8.3/P8.4)
// Rodar: node tests/modifiers.test.js
// Cobre: cada modificador (lightshell/quickened/siphoning/escorted) · Corona rola 1 ·
// assinaturas fixas por Harbinger · sequência do finale nos 3 caminhos · caps 6/6 com H6.
// =============================================================
const fs = require("fs");
const path = require("path");

global.window = global;
let store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
const SRC = path.join(__dirname, "..", "src");
for (const f of ["util", "data", "gear", "passives", "awaken", "state", "economy", "rates", "enemyFactory", "income", "progression", "convergence", "combat"])
  eval(fs.readFileSync(path.join(SRC, f + ".js"), "utf8"));

let failed = 0;
function ok(c, m) { console.log((c ? "PASS" : "FAIL") + " — " + m); if (!c) failed++; }
function fresh() { store = {}; G.state.data = null; G.state.load(); }
const near = (a, b) => Math.abs(a - b) < 1e-9;

// ---------- 1) Lightshell: absorve os primeiros N golpes, depois passa dano ----------
(function () {
  fresh(); const realUi = G.ui; G.ui = null;
  const N = 3;
  const mob = { name: "m", hp: 1000, maxHp: 1000, dmg: 1, modifiers: ["lightshell"], lightshell: N, isBoss: false, dead: false };
  G.combat.enemies = [mob]; G.combat.enemy = mob;
  for (let i = 0; i < N; i++) G.combat.applyHitToEnemy(100, false);
  ok(mob.hp === 1000 && mob.lightshell === 0, "Lightshell absorve os primeiros N golpes (0 dano; contador zera)");
  G.combat.applyHitToEnemy(100, false);
  ok(mob.hp === 900, "após N absorvidos, o golpe seguinte causa dano normal");
  G.ui = realUi; G.combat.enemies = [];
})();

// ---------- 2) Siphoning: o mob cura-se de healFrac do dano ao herói (clamp no maxHp) ----------
(function () {
  fresh(); const realUi = G.ui; G.ui = null;
  G.state.data.hp = 1e12;   // herói não morre
  const frac = G.data.modifiers.siphoning.healFrac;
  const src = { name: "s", hp: 100, maxHp: 1000, dmg: 1, modifiers: ["siphoning"], isBoss: false, dead: false };
  G.combat.enemies = [src];   // 1 vivo → sem siegeWard
  G.combat.applyHitToHero(200, src);   // dr base 0 → reduced 200 · cura 200×frac
  ok(near(src.hp, 100 + 200 * frac), "Siphoning: mob cura-se de healFrac do dano causado ao herói");
  src.hp = 990;
  G.combat.applyHitToHero(200, src);
  ok(src.hp === 1000, "Siphoning: a cura clampa no maxHp do mob");
  // sem source (chamada legada de 1 arg) não quebra
  G.combat.applyHitToHero(50);
  ok(true, "applyHitToHero sem source (legado) não lança");
  G.ui = realUi; G.combat.enemies = [];
})();

// ---------- 3) Quickened: mob ataca em intervalo ÷ atkSpeedFactor (~1.4× golpes) ----------
(function () {
  function countHits(mods) {
    fresh(); const realUi = G.ui; G.ui = null; G.state.data.hp = 1e15;
    let hits = 0; const real = G.combat.applyHitToHero.bind(G.combat);
    G.combat.applyHitToHero = function () { hits++; };   // conta, sem dano
    const mob = { name: "x", hp: 1e12, maxHp: 1e12, dmg: 1, modifiers: mods, atkTimer: 0, dead: false };
    Object.assign(G.combat, { enemies: [mob], enemy: mob, pendingHits: [], atkTimer: 0, respawnTimer: 0 });
    for (let t = 0; t < 10; t += 0.1) G.combat.tick(0.1);
    G.combat.applyHitToHero = real; G.ui = realUi; G.combat.enemies = [];
    return hits;
  }
  const normal = countHits([]), quick = countHits(["quickened"]);
  ok(quick > normal, "Quickened: o mob ataca mais vezes que o normal");
  ok(Math.abs(quick / normal - G.data.modifiers.quickened.atkSpeedFactor) < 0.15,
    "Quickened: razão de golpes ≈ atkSpeedFactor (1.4×)");
})();

// ---------- 4) Escorted: enche a onda de comuns ----------
(function () {
  const m = G.data.modifiers.escorted;
  ok(G.enemyFactory._escortedSize(1) === m.fullWave, "Escorted: onda de 1 → cheia (fullWave)");
  ok(G.enemyFactory._escortedSize(2) === m.fullWave, "Escorted: onda de 2 → cheia (fullWave)");
  ok(G.enemyFactory._escortedSize(m.fullWave) === m.fullWave + m.extra, "Escorted: onda já cheia → +extra");
  ok(G.enemyFactory._escortedSize(m.cap) === m.cap, "Escorted: respeita o teto (cap)");

  fresh(); const realUi = G.ui; G.ui = null;
  // idx 5 = H2 (Escorted); packSize do G2 = 2 → escolta cheia = 3
  G.state.data.areaIndex = 5; G.state.data.maxAreaUnlocked = 5;
  G.combat._lastAreaIndex = 5; G.combat._bossKills = 1e9;
  G.combat.spawn();
  const boss = G.combat.enemies.find((e) => e.isBoss);
  const escort = G.combat.enemies.filter((e) => !e.isBoss).length;
  ok(boss && G.enemyFactory._hasMod(boss, "escorted"), "H2 spawna com a assinatura Escorted");
  ok(escort === G.enemyFactory._escortedSize(2), "Escorted: escolta cheia (2→3 comuns) junto do boss");
  G.ui = realUi; G.combat.enemies = [];
})();

// ---------- 5) Corona rola EXATAMENTE 1 modificador, com prefixo no nome ----------
(function () {
  fresh();
  const realStats = G.state.stats.bind(G.state), realChance = G.util.chance;
  G.state.stats = () => ({ rarityFind: { ember: 1, lumen: 1, corona: 1 }, rarityCaps: { ember: 1, lumen: 1, corona: 1 } });
  G.util.chance = () => true;   // Corona (1ª da ordem) vence
  const lit = G.enemyFactory._buildOne(false, { name: "base", sprite: "", img: "" });
  G.util.chance = realChance; G.state.stats = realStats;
  ok(lit.rarity.tier === "corona" && Array.isArray(lit.modifiers) && lit.modifiers.length === 1,
    "Corona rola EXATAMENTE 1 modificador");
  ok(G.data.modifiers.order.indexOf(lit.modifiers[0]) !== -1, "o modificador é um dos 4 do pool");
  ok(lit.name.indexOf(G.data.modifiers[lit.modifiers[0]].label) === 0, "o nome do Corona ganha o prefixo do modificador");
})();

// ---------- 6) Assinaturas FIXAS por Harbinger (P8.3) ----------
(function () {
  fresh();
  const sigOf = (idx) => { G.state.data.areaIndex = idx; return G.enemyFactory._buildOne(true, G.data.areas[idx].boss).modifiers.slice().sort().join(","); };
  ok(sigOf(2) === "lightshell", "H1 (idx 2) = Lightshell");
  ok(sigOf(5) === "escorted", "H2 (idx 5) = Escorted");
  ok(sigOf(8) === "siphoning", "H3 (idx 8) = Siphoning");
  ok(sigOf(11) === "quickened", "H4 (idx 11) = Quickened");
  ok(sigOf(14) === "lightshell,quickened", "H5 (idx 14) = par Lightshell+Quickened");
  ok(sigOf(17) === "escorted,siphoning", "H6 (idx 17) = par Siphoning+Escorted");
  G.state.data.areaIndex = 17;
  const okhra = G.enemyFactory._buildOne(true, G.data.areas[17].mapBoss);
  ok(okhra.modifiers.join(",") === "siphoning", "Okhra (mapBoss) = Siphoning (+ The Tide Rises à parte)");
  // Lightshell no boss usa bossAbsorb (N maior)
  G.state.data.areaIndex = 2;
  const h1 = G.enemyFactory._buildOne(true, G.data.areas[2].boss);
  ok(h1.lightshell === G.data.modifiers.lightshell.bossAbsorb, "Lightshell no boss usa bossAbsorb (N maior que o do mob)");
})();

// ---------- 7) The Tide Rises: Okhra re-invoca a escolta até maxEscort ----------
(function () {
  fresh(); const realUi = G.ui; G.ui = null;
  G.state.data.areaIndex = 17; G.state.data.hp = 1e18;
  const okhra = { name: "Okhra", hp: 1e18, maxHp: 1e18, dmg: 1, modifiers: ["siphoning"], isBoss: true, isMapBoss: true, atkTimer: 0, dead: false };
  Object.assign(G.combat, { enemies: [okhra], enemy: okhra, pendingHits: [], atkTimer: 0, respawnTimer: 0, _tideTimer: 0, _tideRisen: false });
  const before = G.combat.enemies.filter((e) => !e.isBoss).length;
  // avança além de 1 intervalo de maré
  for (let t = 0; t < G.data.modifiers.tide.interval + 0.5; t += 0.1) G.combat.tick(0.1);
  const after = G.combat.enemies.filter((e) => !e.isMapBoss && !e.dead).length;
  ok(after > before, "The Tide Rises: a maré adiciona escolta comum durante a luta do Okhra");
  ok(after <= G.data.modifiers.tide.maxEscort, "The Tide Rises: a escolta é limitada por maxEscort (sem runaway)");
  ok(G.combat._tideRisen === true, "The Tide Rises: flag de 1ª subida marcada (log temático 1×)");
  G.ui = realUi; G.combat.enemies = [];
})();

// ---------- 8) Sequência do finale nos 3 caminhos (P8.4) ----------
(function () {
  const realUi = G.ui; G.ui = null;
  const last = G.data.areas.length - 1;
  function setupFinal(awake) {
    fresh();
    G.state.data.areaIndex = last; G.state.data.maxAreaUnlocked = last;
    G.state.data.awakens = awake ? ["first_light"] : []; G.state.data.awakensUnlocked = G.state.data.awakens;
    G.combat._lastAreaIndex = last; G.combat._bossKills = 1e9; G.combat._okhraManifest = false;
  }
  const bossNow = () => G.combat.enemies.find((e) => e.isBoss) || null;

  // caminho A — nunca desperta: H6 spawna; morto → portão; Okhra nunca; mapa não completa
  setupFinal(false);
  G.combat.spawn();
  ok(bossNow() && !bossNow().isMapBoss, "A) sem awaken: H6 spawna");
  G.combat.markBossCleared({ isBoss: true });   // H6 felled → gate
  G.combat.spawn();
  ok(bossNow() === null, "A) sem awaken, H6 morto: portão (nenhum boss)");
  ok(G.state.data.mapOneCleared === false, "A) sem awaken: Mapa 1 não completa");

  // caminho B — desperta ANTES do H6: H6 → Okhra manifesta → mata Okhra → mapa completo
  setupFinal(true);
  G.combat.spawn();
  ok(bossNow() && !bossNow().isMapBoss, "B) com awaken: o H6 vem primeiro");
  G.combat.markBossCleared({ isBoss: true });   // H6 felled + awake → invocação
  G.combat.spawn();
  ok(bossNow() && bossNow().isMapBoss, "B) H6 morto + awaken: Okhra manifesta no ciclo seguinte");
  ok(G.combat._okhraManifest === true, "B) flag _okhraManifest ligada ao manifestar o Okhra");
  G.combat.markBossCleared({ isBoss: true, isMapBoss: true });   // Okhra morto
  ok(G.state.data.mapOneCleared === true, "B) matar o Okhra completa o Mapa 1");
  ok(G.combat._okhraManifest === false, "B) o estágio do Okhra encerra na morte dele");

  // caminho C — desperta DEPOIS do H6: portão → desperta → próximo threshold invoca Okhra (sem re-lutar H6)
  setupFinal(false);
  G.combat.markBossCleared({ isBoss: true });   // H6 morto sem awaken → gate
  G.combat.spawn();
  ok(bossNow() === null, "C) H6 morto sem awaken: portão");
  G.state.data.awakens = ["first_light"]; G.state.data.awakensUnlocked = ["first_light"];
  G.combat._bossKills = 1e9;
  G.combat.spawn();
  ok(bossNow() && bossNow().isMapBoss, "C) despertou depois do H6: próximo threshold invoca o Okhra direto (sem re-lutar H6)");

  G.combat.enemies = []; G.ui = realUi;
})();

// ---------- 9) caps fecham 6/6 com o H6 (P8.1 + P8.4) ----------
(function () {
  fresh(); const realUi = G.ui; G.ui = null;
  G.state.data.harbingersFelled = [2, 5, 8, 11, 14];   // 5 Marcos
  G.state.data.areaIndex = G.data.areas.length - 1;
  G.combat.markBossCleared({ isBoss: true });          // H6 → 6º Marco
  ok(G.state.data.harbingersFelled.indexOf(G.data.areas.length - 1) !== -1, "H6 credita o 6º Marco");
  G.state.invalidateStats();
  const caps = G.state.stats().rarityCaps;
  ok(near(caps.ember, 0.30) && near(caps.lumen, 0.15) && near(caps.corona, 0.05),
    "6 Marcos (com H6) fecham os caps do Rarity Find em 30/15/5");
  G.ui = realUi;
})();

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
