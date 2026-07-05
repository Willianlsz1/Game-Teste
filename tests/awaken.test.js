// =============================================================
// tests/awaken.test.js — sistema Awaken (AWAKEN_V1)
// Rodar: node tests/awaken.test.js
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
const FL = "first_light";

// satisfaz as TRÊS PROVAS do First Light (P7.3): área 18 + coroa acesa + N materiais
function lightCrown()  { for (const i of G.passives.leaves()) G.state.data.passives.tree1[i] = 1; }
function darkenCrown() { for (const i of G.passives.leaves()) G.state.data.passives.tree1[i] = 0; }
function satisfyAll() {
  const d = G.state.data, req = G.awaken.def(FL).requirements;
  d.maxAreaUnlocked = req.area - 1;          // area (1-based) alcançada
  lightCrown();                              // coroa acesa (crownActive)
  d.awakenMaterials.firstLight = req.materials.firstLight;
  if (req.lumens != null) d.lumens = req.lumens;   // P8: oferenda de Lumens
  G.state.invalidateStats();
}

// 1) estrutura de requisitos = as três provas (área/coroa/materiais); crus removidos
store = {}; G.state.data = null; G.state.load();
const req = G.awaken.def(FL).requirements;
ok(req && "area" in req && "crown" in req && "materials" in req,
  "requirements tem area/crown/materials (as provas)");
ok("lumens" in req && req.lumens >= 1, "P8: requirements tem a Oferenda de Lumens");
ok(!("level" in req) && !("convergences" in req) && !("kills" in req),
  "requisitos crus removidos: level/convergences/kills fora");
ok(req.area === 18 && req.crown === true && req.materials.firstLight >= 1,
  "área 18 + coroa exigida + N≥1 material");
const reqList = G.awaken.requirements(FL);
ok(reqList.length === 4, "requirements(id) lista as quatro provas (área/coroa/oferenda/material)");
ok(reqList.some((r) => r.key === "crown"), "requirements(id) inclui a prova da coroa");
ok(reqList.some((r) => r.key === "lumens"), "requirements(id) inclui a Oferenda de Lumens (P8)");
ok(!reqList.some((r) => r.key === "level" || r.key === "convergences" || r.key === "kills"),
  "requirements(id) NÃO exige campos ausentes (level/convergences/kills)");

// 2) requisitos pendentes no início
ok(G.awaken.meetsRequirements(FL) === false, "no início, requisitos NÃO atendidos");
ok(G.awaken.canAwaken(FL) === false, "no início, não pode realizar Awaken");
const pend = G.awaken.requirements(FL).filter((r) => !r.met);
ok(pend.length > 0, "há requisitos pendentes listados (para a UI)");

// 3) cada requisito vira "met" ao ser satisfeito
satisfyAll();
const all = G.awaken.requirements(FL);
ok(all.every((r) => r.met), "todos os requisitos ficam concluídos quando satisfeitos");
ok(G.awaken.canAwaken(FL) === true, "com tudo satisfeito, pode realizar Awaken");

// 4) negativos: cada prova ausente BLOQUEIA, e provas ausentes do spec não são exigidas
// 4a) material insuficiente bloqueia (N-1 não basta)
G.state.data.awakenMaterials.firstLight = req.materials.firstLight - 1;
ok(G.awaken.canAwaken(FL) === false, "material insuficiente (N-1) -> não pode");
ok(G.awaken.requirements(FL).find((r) => r.key.indexOf("material:") === 0).met === false,
  "prova dos materiais marcada não-cumprida com N-1");
G.state.data.awakenMaterials.firstLight = 0;
ok(G.awaken.canAwaken(FL) === false, "sem Awaken Material -> não pode");
G.state.data.awakenMaterials.firstLight = req.materials.firstLight;
// 4b) coroa apagada bloqueia (mesmo com área + materiais ok)
darkenCrown(); G.state.invalidateStats();
ok(G.passives.crownActive() === false, "coroa apagada (folhas zeradas)");
ok(G.awaken.requirements(FL).find((r) => r.key === "crown").met === false, "prova da coroa não-cumprida com folhas apagadas");
ok(G.awaken.canAwaken(FL) === false, "coroa apagada -> não pode despertar");
lightCrown(); G.state.invalidateStats();
ok(G.awaken.canAwaken(FL) === true, "coroa re-acesa + área + materiais -> pode despertar");
// 4c) área insuficiente bloqueia
G.state.data.maxAreaUnlocked = req.area - 2;   // uma área abaixo do limiar do Okhra
ok(G.awaken.canAwaken(FL) === false, "área abaixo da 18 -> não pode");
G.state.data.maxAreaUnlocked = req.area - 1;

// 5) realizar Awaken consome material + oferenda de Lumens, marca concluído, sobe tier
const beforeMat = G.state.data.awakenMaterials.firstLight;
G.state.data.lumens = req.lumens + 123;   // sobra pra ver o consumo exato da oferenda (P8)
const did = G.awaken.awaken(FL);
ok(did === true, "awaken() executou");
ok(G.state.data.awakenMaterials.firstLight === beforeMat - req.materials.firstLight, "consumiu Awaken Material");
ok(G.state.data.lumens === 123, "P8: consumiu a Oferenda de Lumens (sobra o excedente)");
ok(G.awaken.isDone(FL) === true, "First Light marcado como concluído");
ok(G.state.data.awakens.indexOf(FL) !== -1 && G.state.data.awakenTier === 1, "awakens[] e awakenTier atualizados");
ok(G.awaken.canAwaken(FL) === false, "não pode realizar o mesmo Awaken duas vezes");

// 6) bônus do Awaken é aplicado aos stats (baseline medido NO MESMO nível)
store = {}; G.state.data = null; G.state.load();
satisfyAll(); G.state.invalidateStats();
const atkBefore = G.state.stats().atk, hpBefore = G.state.stats().hp;
G.awaken.awaken(FL); G.state.invalidateStats();
const b = G.awaken.def(FL).bonus;
// tolerância ∝ mult (o round interno × mult amplia o erro de arredondamento; P9 r4 mults ×5/×3)
ok(G.state.stats().atk > atkBefore && Math.abs(G.state.stats().atk - atkBefore * b.atkMult) <= b.atkMult + 1,
  "bônus aplicado: ATK ×atkMult");
ok(Math.abs(G.state.stats().hp - hpBefore * b.hpMult) <= b.hpMult + 1, "bônus aplicado: HP ×hpMult");

// 7) persistência: awaken concluído sobrevive a save/load
G.state.save(); G.state.data = null; G.state.load();
ok(G.awaken.isDone(FL) && G.state.data.awakenTier === 1, "save/load preserva Awaken concluído e tier");

// 8) totalKills acumula em onKill e NÃO reseta na Convergence
store = {}; G.state.data = null; G.state.load();
const mob8 = { name: "m", level: 1, maxHp: 1, hp: 0, dmg: 1, lumens: 1, xp: 1, isBoss: false };
G.combat.enemies = [mob8]; G.combat.enemy = mob8;   // onKill opera sobre enemies[]
G.combat.onKill();
ok(G.state.data.totalKills === 1, "totalKills incrementa em onKill");
G.state.data.level = G.convergence.currentGate(); G.convergence.converge();  // P5: gate escalonado (≥276)
ok(G.state.data.totalKills === 1 && G.state.data.runKills === 0, "Convergence reseta runKills mas NÃO totalKills");

// 9) MIGRAÇÃO de save: awakenTier ausente é derivado da lista awakens; concluído sobrevive
store = {};
const oldSave = G.state.fresh();
delete oldSave.awakenTier;        // save sem o tier explícito
oldSave.awakens = [FL];           // campo canônico atual
oldSave.awakenMaterials = { firstLight: 3 };
store[G.state.SAVE_KEY] = JSON.stringify(oldSave);
G.state.data = null; G.state.load();
ok(G.state.data.awakens.indexOf(FL) !== -1, "migração: awakens preservado no load");
ok(G.state.data.awakensUnlocked.indexOf(FL) !== -1, "migração: awakensUnlocked espelha awakens");
ok(G.state.data.awakenTier === 1, "migração: awakenTier derivado da lista (ausente -> 1)");
ok(G.state.data.awakenMaterials.firstLight === 3, "migração: awakenMaterials preservado");
ok(G.awaken.isDone(FL) === true, "migração: Awaken concluído continua concluído");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
