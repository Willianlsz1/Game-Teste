// =============================================================
// tests/rarityfind.test.js — Rarity Find (P8.1)
// Rodar: node tests/rarityfind.test.js
// Cobre: roll min(find,cap) · caps por Marco (1ª morte sim, 2ª não) · sobrevive à
// Convergence · degrau do afixo (49→0, 50→1) · clamp no teto máximo.
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
for (const f of ["util", "data", "gear", "passives", "awaken", "state", "economy", "convergence", "combat"])
  eval(fs.readFileSync(path.join(SRC, f + ".js"), "utf8"));

let failed = 0;
function ok(c, m) { console.log((c ? "PASS" : "FAIL") + " — " + m); if (!c) failed++; }
function fresh() { store = {}; G.state.data = null; G.state.load(); }
const near = (a, b) => Math.abs(a - b) < 1e-9;

// ---------- 1) caps por número de Marcos abatidos (stats().rarityCaps) ----------
fresh();
G.state.invalidateStats();
let caps = G.state.stats().rarityCaps;
ok(caps.ember === 0 && caps.lumen === 0 && caps.corona === 0, "0 Marcos: todos os tetos = 0 (base 0%, só Common)");

G.state.data.harbingersFelled = [2]; G.state.invalidateStats();
caps = G.state.stats().rarityCaps;
ok(near(caps.ember, 0.05) && near(caps.lumen, 0.025) && near(caps.corona, 5 / 6 / 100),
  "1 Marco: teto sobe 1/6 (Ember 5% · Lumen 2.5% · Corona 0.833%)");

G.state.data.harbingersFelled = [2, 5, 8, 11, 14]; G.state.invalidateStats();
caps = G.state.stats().rarityCaps;
ok(near(caps.ember, 0.25) && near(caps.lumen, 0.125) && near(caps.corona, 5 * 5 / 6 / 100),
  "5 Marcos (roster atual): 25% / 12.5% / 4.17% (5/6 do máximo)");

// clamp: 6+ Marcos nunca passam do teto máximo (30/15/5)
G.state.data.harbingersFelled = [2, 5, 8, 11, 14, 17, 99, 100]; G.state.invalidateStats();
caps = G.state.stats().rarityCaps;
ok(near(caps.ember, 0.30) && near(caps.lumen, 0.15) && near(caps.corona, 0.05),
  "clamp: 6+ Marcos travam nos tetos máximos 30% / 15% / 5% (nunca ultrapassa)");

// ---------- 2) roll em _buildOne respeita min(find, cap), ordem corona→lumen→ember ----------
fresh();
const realStats = G.state.stats.bind(G.state);
// find (gear) alto de propósito; cap (Marcos) baixo → o efetivo é o cap (min)
G.state.stats = () => ({
  rarityFind: { ember: 0.30, lumen: 0.20, corona: 0.10 },
  rarityCaps: { ember: 0.05, lumen: 0.02, corona: 0.008 },
});
const seen = [];
const realChance = G.util.chance;
G.util.chance = (p) => { seen.push(p); return false; };   // registra a prob e nunca spawna
G.state.data.areaIndex = 0;
G.combat._buildOne(false, { name: "x", sprite: "", img: "" });
G.util.chance = realChance;
G.state.stats = realStats;
ok(seen.length === 3 && near(seen[0], 0.008) && near(seen[1], 0.02) && near(seen[2], 0.05),
  "roll usa min(find,cap) por tier, na ordem Corona→Lumen→Ember");

// cap 0 → chance 0 → o tier nem é rolado (nada acha sem Marco)
G.state.stats = () => ({ rarityFind: { ember: 0.9, lumen: 0.9, corona: 0.9 }, rarityCaps: { ember: 0, lumen: 0, corona: 0 } });
const seen2 = [];
G.util.chance = (p) => { seen2.push(p); return false; };
const mob = G.combat._buildOne(false, { name: "x", sprite: "", img: "" });
G.util.chance = realChance;
G.state.stats = realStats;
ok(seen2.length === 0 && mob.rarity === null, "cap 0: nenhum tier é rolado — só Common spawna (base 0%)");

// tier acende quando o roll passa: aplica poder e tag
G.state.stats = () => ({ rarityFind: { ember: 1, lumen: 1, corona: 1 }, rarityCaps: { ember: 1, lumen: 1, corona: 1 } });
G.util.chance = () => true;   // Corona (1º da ordem) vence
const lit = G.combat._buildOne(false, { name: "base", sprite: "", img: "" });
G.util.chance = realChance;
G.state.stats = realStats;
const corona = G.data.rarityTiers.find((t) => t.key === "corona");
ok(lit.rarity && lit.rarity.tier === "corona" && lit.rarity.tag === "Corona", "roll vencido: mob vira Corona (tag/tier)");
ok(lit.modifier === null, "Corona traz o campo modifier: null (hook do P8.2 / Parte 2)");

// ---------- 3) markBossCleared: 1ª morte do Marco levanta o teto, 2ª NÃO ----------
fresh();
const realUi = G.ui; G.ui = null;
G.state.data.areaIndex = 2;      // idx 2 = Harbinger do G1 (tem boss)
G.combat.markBossCleared();
ok(G.state.data.harbingersFelled.length === 1 && G.state.data.harbingersFelled[0] === 2,
  "1ª morte do Harbinger: registra o Marco (harbingersFelled = [2])");
ok(near(G.state.stats().rarityCaps.ember, 0.05), "1ª morte: teto Ember sobe para 5%");
G.combat.markBossCleared();       // mata o MESMO Harbinger de novo
ok(G.state.data.harbingersFelled.length === 1, "2ª morte do MESMO Harbinger: NÃO levanta o teto de novo");

// Okhra (última área) NÃO é Marco — não levanta teto
G.state.data.areaIndex = G.data.areas.length - 1;
G.combat.markBossCleared();
ok(G.state.data.harbingersFelled.indexOf(G.data.areas.length - 1) === -1,
  "Okhra (última área) NÃO conta como Marco — não entra em harbingersFelled");
G.ui = realUi;

// ---------- 4) caps sobrevivem à Convergence ----------
fresh();
G.state.data.harbingersFelled = [2, 5]; G.state.invalidateStats();
const capsBefore = G.state.stats().rarityCaps.ember;
G.state.data.level = G.convergence.currentGate();   // habilita converge
const realUi2 = G.ui; G.ui = null;
const did = G.convergence.converge();
G.ui = realUi2;
ok(did === true, "converge() executou (nível ≥ gate)");
ok(G.state.data.level === 1, "convergence resetou o nível (sanidade)");
ok(G.state.data.harbingersFelled.length === 2, "harbingersFelled SOBREVIVE à Convergence (permanente)");
ok(near(G.state.stats().rarityCaps.ember, capsBefore) && near(capsBefore, 0.10),
  "tetos do Rarity Find intactos após a Convergence (2 Marcos = 10% Ember)");

// ---------- 5) degrau do afixo de gear (perStep): 49→0, 50→1, 100→2 ----------
fresh();
const boots = G.gear.buildPiece("boots", "common");
const ember = boots.affixes.find((a) => a.stat === "rarityFindEmber");
ok(ember && ember.perStep === 0.5 && ember.step === 50, "Ember Trail é afixo em degraus (perStep 0.5 / step 50)");
boots.level = 49; ok(G.gear.affixValue(boots, ember) === 0, "nível 49 → 0 degraus → 0%");
boots.level = 50; ok(G.gear.affixValue(boots, ember) === 0.5, "nível 50 → 1 degrau → +0.5%");
boots.level = 100; ok(G.gear.affixValue(boots, ember) === 1.0, "nível 100 → 2 degraus → +1.0%");
boots.level = 500; ok(G.gear.affixValue(boots, ember) === 5.0, "nível 500 (cap common) → 10 degraus → +5%");

// clamp no teto do afixo (= teto global do tier): boots Uncommon podem ir além, mas o afixo trava no cap
const bootsU = G.gear.buildPiece("boots", "uncommon");
const emberU = bootsU.affixes.find((a) => a.stat === "rarityFindEmber");
bootsU.level = 3100;   // 62 degraus × 0.5 = 31% → clampa em 30
ok(G.gear.affixValue(bootsU, emberU) === 30, "clamp: afixo Ember trava no teto global do tier (30%), sem ultrapassar");

// ---------- 6) integração: gear alimenta stats().rarityFind (fração) ----------
fresh();
G.state.data.equipped.boots.level = 100;   // 2 degraus × 0.5 = 1% Ember
G.state.invalidateStats();
ok(near(G.state.stats().rarityFind.ember, 0.01), "stats().rarityFind.ember = valor do gear em fração (1% → 0.01)");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
