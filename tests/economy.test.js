// =============================================================
// tests/economy.test.js — fundação econômica (materiais + drops)
// Rodar: node tests/economy.test.js
// Sem framework: carrega os módulos de src/ num sandbox e usa asserts simples.
// =============================================================
const fs = require("fs");
const path = require("path");

global.window = global; // util.js faz window.G = ...; bare G resolve no global
let store = {};
global.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};
const SRC = path.join(__dirname, "..", "src");
for (const f of ["util", "data", "gear", "passives", "awaken", "state", "economy", "convergence", "combat"])
  eval(fs.readFileSync(path.join(SRC, f + ".js"), "utf8"));

let failed = 0;
function ok(c, m) { console.log((c ? "PASS" : "FAIL") + " — " + m); if (!c) failed++; }
const R0 = { rng: () => 0 }; // rng determinístico: chance passa, qty = min

// 1) fresh inicializa materiais zerados
store = {}; G.state.data = null; G.state.load();
ok(G.state.data.gearMaterials.common === 0 && G.state.data.gearMaterials.uncommon === 0, "fresh: gearMaterials zerados");
ok(G.state.data.awakenMaterials.firstLight === 0, "fresh: awakenMaterials.firstLight zerado");

// 2) compat: save antigo sem materiais -> inicializa com zero, resto preservado
const old = G.state.fresh(); delete old.gearMaterials; delete old.awakenMaterials; old.lumens = 777;
store[G.state.SAVE_KEY] = JSON.stringify(old);
G.state.data = null; G.state.load();
ok(G.state.data.lumens === 777 && G.state.data.gearMaterials.common === 0 && G.state.data.awakenMaterials.firstLight === 0,
  "save antigo: materiais criados com zero, resto preservado");

// 3) reconcile preenche subcampo faltante sem apagar existente
const part = G.state.fresh(); part.gearMaterials = { common: 5 };
store[G.state.SAVE_KEY] = JSON.stringify(part);
G.state.data = null; G.state.load();
ok(G.state.data.gearMaterials.common === 5 && G.state.data.gearMaterials.uncommon === 0,
  "reconcile preenche subcampo faltante sem apagar existente");

// 4) mob comum na Área 3 (idx 2, onde abre o drop) -> só Common material
store = {}; G.state.data = null; G.state.load(); G.state.data.areaIndex = 2;
let d = G.economy.rollDrops({}, Object.assign({ type: "common", areaIndex: 2 }, R0));
ok(d.commonMaterial >= 1 && !d.uncommonMaterial && !d.awakenMaterial, "common dropa só Common material (Área 3)");
ok(G.economy.getGear("common") >= 1, "Common material foi ao inventário");

// 5) Harbinger em G5+ (idx>=12) -> Common + Awaken, NUNCA Uncommon (Rare/Forge = Mapa 2)
d = G.economy.rollDrops({ isBoss: true }, Object.assign({ areaIndex: 14 }, R0));
ok(d.commonMaterial && !d.uncommonMaterial && d.awakenMaterial, "Harbinger (G5+, idx 14) dropa Common+Awaken, sem Uncommon");
ok(G.economy.getAwaken("firstLight") >= 1, "Awaken material (firstLight) foi ao inventário");

// 6) gate de drops: Áreas 1-2 (idx 0-1) não dropam nada; Área 3 (idx 2) só Common (Awaken=G5+)
let d0 = G.economy.rollDrops({ isBoss: true }, Object.assign({ areaIndex: 0 }, R0));
ok(Object.keys(d0).length === 0, "gate: Área 1 (idx 0) não dropa material algum");
let d2 = G.economy.rollDrops({ isBoss: true }, Object.assign({ areaIndex: 2 }, R0));
ok(d2.commonMaterial && !d2.uncommonMaterial && !d2.awakenMaterial, "gate: Área 3 (idx 2) só Common (Awaken=G5+/idx 12)");

// 7) as passivas de material NÃO existem na Árvore I (voltam na Árvore II) — logo os
// multiplicadores da economia são inertes (=1). O PLUMBING segue correto: injetar um
// efeito via mock ainda multiplica (à prova de futuro p/ a Árvore II).
store = {}; G.state.data = null; G.state.load();
ok(Math.abs(G.economy.passiveQtyMult("commonMaterial") - 1) < 1e-9, "Árvore I sem nós de material: passiveQtyMult inerte (=1)");
const realEffects = G.passives.effects.bind(G.passives);
const realEffect = G.passives.effect.bind(G.passives);
G.passives.effects = () => ({ matGeneralPct: 100 });
ok(Math.abs(G.economy.passiveQtyMult("commonMaterial") - 2) < 1e-9, "plumbing: matGeneralPct 100% -> quantidade ×2");
G.passives.effects = realEffects;

// 8) plumbing de chance (dropRate) e de awaken (awakenMatPct) via mock — inertes no roster atual
G.passives.effect = (key) => (key === "dropRate" ? 50 : realEffect(key));
ok(Math.abs(G.economy.passiveChanceMult() - 1.5) < 1e-9, "plumbing: dropRate 50% -> chance ×1.5");
G.passives.effect = realEffect;
G.passives.effects = () => ({ awakenMatPct: 100 });
ok(Math.abs(G.economy.passiveQtyMult("awakenMaterial") - 2) < 1e-9, "plumbing: awakenMatPct 100% -> awaken qty ×2");
G.passives.effects = realEffects;

// 9) save/load preserva materiais
store = {}; G.state.data = null; G.state.load();
G.economy.addGear("common", 12); G.economy.addGear("uncommon", 4); G.economy.addAwaken("firstLight", 3); G.state.save();
G.state.data = null; G.state.load();
ok(G.economy.getGear("common") === 12 && G.economy.getGear("uncommon") === 4 && G.economy.getAwaken("firstLight") === 3,
  "save/load preserva materiais");

// 10) integração combat.onKill concede materiais (Harbinger em G5+/idx 12)
store = {}; G.state.data = null; G.state.load(); G.state.data.areaIndex = 14;
const cBefore = G.economy.getGear("common"), aBefore = G.economy.getAwaken("firstLight");
const realRandom = Math.random; Math.random = () => 0;
// onKill agora opera sobre o array enemies[] (encontra o primeiro vivo)
const mob = { name: "x", isBoss: true, maxHp: 10, hp: 0, dmg: 1, lumens: 10, xp: 5, level: 1, rarity: null };
G.combat.enemies = [mob]; G.combat.enemy = mob;
G.combat.onKill();
Math.random = realRandom;
ok(G.economy.getGear("common") > cBefore && G.economy.getAwaken("firstLight") > aBefore,
  "combat.onKill (Harbinger G5+) concede Common+Awaken via rollDrops");

// 11) inventário de Awaken existe (awakenEssence legado virou awakenMaterials.firstLight)
ok(G.state.data.awakenMaterials && typeof G.state.data.awakenMaterials.firstLight === "number",
  "awakenMaterials.firstLight presente no estado");

// 12) tipos elite/miniBoss já existem na tabela (prontos p/ inimigos futuros)
ok(!!(G.economy.dropTable.elite && G.economy.dropTable.miniBoss), "dropTable tem elite e miniBoss (prontos p/ futuro)");

// 13) save antigo com peça 'rare' equipada (Rare saiu de data.rarities no P3) -> reconcile
// não crasha, rebaixa a peça pra Common e clampa o nível ao novo cap (500), sem travar stats()
store = {};
const oldRareSave = G.state.fresh();
oldRareSave.equipped.weapon = {
  slot: "weapon", slotLabel: "Weapon", name: "Old Rare Blade",
  rarity: "rare", rarityName: "Rare", color: "#7fb0ff", level: 2800, affixes: [],
};
oldRareSave.lumens = 12345;
store[G.state.SAVE_KEY] = JSON.stringify(oldRareSave);
G.state.data = null; G.state.load();
const wpn = G.state.data.equipped.weapon;
ok(wpn.rarity === "common", "save antigo com peça 'rare': reconcile rebaixa para 'common' (rare saiu do Mapa 1)");
ok(wpn.level === G.gear.cap(wpn), "save antigo com peça 'rare': nível clampado ao cap da nova raridade (common=500)");
ok(G.state.data.lumens === 12345, "save antigo com peça 'rare': resto do save preservado (lumens)");
let statsThrew = false;
try { G.state.stats(); } catch (e) { statsThrew = true; }
ok(!statsThrew, "save antigo com peça 'rare': G.state.stats() não crasha após reconcile");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
