// =============================================================
// tests/hygiene.test.js — PRE_BALANCE_HYGIENE_FINAL
// slots, attack speed, efeitos órfãos resolvidos, unificação matPct, deferidos.
// Rodar: node tests/hygiene.test.js
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
// liga um efeito de passiva por nó (bypass de gating) com magnitude de teste
function setEffect(tree, idx, key, mag) { G.passives.UNIT[key] = mag; G.state.data.passives[tree][idx] = 1; G.state.invalidateStats(); }
function clearEffect(tree, idx, key) { G.passives.UNIT[key] = 0; G.state.data.passives[tree][idx] = 0; G.state.invalidateStats(); }

// ---------- Task 1: slots ----------
ok(G.gear.buildPiece("gloves", "common").affixes[0].stat === "crit", "Gloves primário = Crit");
ok(G.gear.buildPiece("boots", "common").affixes[0].stat === "atkSpeed", "Boots primário = Attack Speed");
ok(G.gear.buildPiece("cloak", "common").affixes[0].stat === "lumensBonus", "Cloak primário = Economia (lumens)");

// ---------- Task 2: attack speed (cap agora é map-aware) ----------
fresh();
ok(Math.abs(G.state.stats().atkSpeed - 0.9) < 1e-9, "Attack Speed base = 0.9");
G.state.data.equipped.boots.level = 3000; G.state.invalidateStats();
// Mapa 1 (mapOneCleared = false): teto-assíntota = map1AtkSpeedCap (softCap comprime, nunca encosta)
const soft1 = G.data.balance.map1AtkSpeedCap * G.data.balance.atkSpeedSoftFrac;
ok(G.state.stats().atkSpeed < G.data.balance.map1AtkSpeedCap && G.state.stats().atkSpeed > soft1,
  "Attack Speed Mapa 1: comprimido entre soft e teto (assíntota)");
ok(G.state.attackInterval() >= 1 / G.data.balance.map1AtkSpeedCap - 1e-9, "attackInterval respeita o teto do Mapa 1");
// Mapa 2 (mapOneCleared = true): teto-assíntota = map2AtkSpeedCap
G.state.data.mapOneCleared = true; G.state.invalidateStats();
ok(G.state.stats().atkSpeed <= G.data.balance.map2AtkSpeedCap && G.state.stats().atkSpeed > soft1,
  "Attack Speed Mapa 2: teto sobe para map2AtkSpeedCap");
ok(G.state.attackInterval() >= 1 / G.data.balance.map2AtkSpeedCap - 1e-9, "attackInterval respeita o teto do Mapa 2");

// ---------- Task 3: bossDmg / eliteDmg agora aplicados inline em combat.playerHit ----------
// (a função typeDamageMult foi removida; o bônus entra direto no cálculo do golpe)
fresh();
G.passives.UNIT.bossDmg = 100; G.state.data.passives.eclat[6] = 1; G.state.invalidateStats();
ok(G.passives.effect("bossDmg") === 100, "bossDmg: efeito da passiva = +100% (×2 contra Boss no playerHit)");
G.passives.UNIT.bossDmg = 0; G.state.data.passives.eclat[6] = 0;
G.passives.UNIT.eliteDmg = 50; G.state.data.passives.eclat[7] = 1; G.state.invalidateStats();
ok(G.passives.effect("eliteDmg") === 50, "eliteDmg: efeito da passiva = +50% (×1.5 contra Elite/Rare)");
G.passives.UNIT.eliteDmg = 0; G.state.data.passives.eclat[7] = 0;

// capstoneEclat -> atk & hp ×
fresh();
const atk0 = G.state.stats().atk, hp0 = G.state.stats().hp;
setEffect("eclat", 14, "capstoneEclat", 100);
ok(Math.abs(G.state.stats().atk - atk0 * 2) < 2 && Math.abs(G.state.stats().hp - hp0 * 2) < 2, "capstoneEclat: ATK e HP ×2");
clearEffect("eclat", 14, "capstoneEclat");

// capstoneVestige -> lumens & xp ×
fresh();
const lum0 = G.state.stats().lumensBonus;
setEffect("vestige", 14, "capstoneVestige", 100);
ok(Math.abs(G.state.stats().lumensBonus - lum0 * 2) < 1e-6, "capstoneVestige: Lumens Bonus ×2");
clearEffect("vestige", 14, "capstoneVestige");

// capstoneFracture -> pontos de Convergence ×
fresh(); G.state.data.level = 200;
const pts0 = G.convergence.points();
G.passives.UNIT.capstoneFracture = 100; G.state.data.passives.fracture[14] = 1;
ok(G.convergence.points() === pts0 * 2, "capstoneFracture: pontos de Convergence ×2");
G.passives.UNIT.capstoneFracture = 0; G.state.data.passives.fracture[14] = 0;

// (upgradeCostReduction foi cortado da árvore Fracture — nó 10 hoje é "Refined Methods" → xpPct)

// awakenReqReduction -> reduz limiares numéricos do Awaken
fresh();
const needLv0 = G.awaken.requirements("first_light").find((r) => r.key === "level").need;
G.passives.UNIT.awakenReqReduction = 50; G.state.data.passives.fracture[5] = 1;
const needLv1 = G.awaken.requirements("first_light").find((r) => r.key === "level").need;
ok(needLv1 === Math.ceil(needLv0 * 0.5), "awakenReqReduction 50%: requisito de nível pela metade");
const areaReq = G.awaken.requirements("first_light").find((r) => r.key === "area").need;
ok(areaReq === G.awaken.def("first_light").requirements.area, "awakenReqReduction NÃO reduz o requisito de Área");
G.passives.UNIT.awakenReqReduction = 0; G.state.data.passives.fracture[5] = 0;

// awakenEfficiency -> amplifica o bônus do Awaken
fresh();
const req = G.awaken.def("first_light").requirements;
G.state.data.maxAreaUnlocked = req.area - 1; G.state.data.level = req.level;
G.state.data.totalKills = req.kills; G.state.data.convergences = req.convergences;
G.state.data.awakenMaterials.firstLight = req.materials.firstLight;
G.state.invalidateStats();                       // nível mudou → recomputar baseline
const atkNoAwk = G.state.stats().atk;
G.awaken.awaken("first_light"); G.state.invalidateStats();
const atkAwk = G.state.stats().atk;            // base × 2.5
G.passives.UNIT.awakenEfficiency = 100; G.state.data.passives.fracture[13] = 1; G.state.invalidateStats();
const atkEff = G.state.stats().atk;            // base × (1 + 1.5×2) = ×4
ok(atkEff > atkAwk && Math.abs(atkEff / atkNoAwk - 4) < 0.01, "awakenEfficiency 100%: bônus 2.5× vira 4×");
G.passives.UNIT.awakenEfficiency = 0; G.state.data.passives.fracture[13] = 0;

// ---------- Task 4: unificação matPct / matGeneralPct ----------
fresh();
ok(G.passives.trees.vestige.list[13][1] === "matGeneralPct", "nó 'Materials %' agora usa matGeneralPct");
ok(G.passives.UNIT.matPct === undefined, "chave matPct removida do UNIT");
G.passives.UNIT.matGeneralPct = 100; G.state.data.passives.vestige[8] = 1;
ok(Math.abs(G.economy.passiveQtyMult("commonMaterial") - 2) < 1e-9, "matGeneralPct 100%: quantidade de material ×2 (unificado)");
G.passives.UNIT.matGeneralPct = 0; G.state.data.passives.vestige[8] = 0;

// ---------- Task 3 (deferidos): moreEnemies / gearXp -> Mapa 2 ----------
fresh();
ok(G.passives.isDeferred("fracture", 8) && G.passives.isDeferred("fracture", 9), "moreEnemies e gearXp marcados como Mapa 2");
G.state.data.convergences = 1; // árvore desbloqueada
ok(G.passives.canBuy("fracture", 8) === false && G.passives.canBuy("fracture", 9) === false, "nós Mapa 2 não são compráveis");
ok(G.passives.treeProgress("fracture").total === 13, "treeProgress ignora os 2 nós Mapa 2 (15→13)");
// efeito 0 mesmo se houvesse nível
G.passives.UNIT.moreEnemies = 100; G.state.data.passives.fracture[8] = 5;
ok(G.passives.effect("moreEnemies") === 0, "nó Mapa 2 não produz efeito (excluído de effects())");
G.passives.UNIT.moreEnemies = 0; G.state.data.passives.fracture[8] = 0;
// gating de grupo ignora os deferidos
G.state.data.passives.fracture[5] = 12; G.state.data.passives.fracture[6] = 12; G.state.data.passives.fracture[7] = 12;
ok(G.passives.groupUnlocked("fracture", 2) === true, "grupo 2 libera com 5/6/7 no máx (8/9 Mapa 2 ignorados)");

// ---------- PASSO 4: a MATRIZ de afixos (P4.2a) ----------
// primários (Common) por peça
const P1 = (slot, i) => G.gear.buildPiece(slot, "common").affixes[i];
ok(P1("weapon", 0).stat === "atk"  && P1("weapon", 0).layer === "flat", "Weapon P1 = ATK flat (Gilded Edge)");
ok(P1("weapon", 1).stat === "atk"  && P1("weapon", 1).layer === "pct",  "Weapon P2 = ATK% (Searing Light)");
ok(P1("helmet", 0).stat === "xpBonus",                                  "Helmet P1 = XP% (Watcher's Lens)");
ok(P1("helmet", 1).stat === "damageReduction",                          "Helmet P2 = Dmg Reduction (Steadfast Guard)");
ok(P1("armor",  0).stat === "hp"   && P1("armor", 0).layer === "flat",  "Armor P1 = HP flat (Sealed Vessel)");
ok(P1("armor",  1).stat === "hp"   && P1("armor", 1).layer === "pct",   "Armor P2 = HP% (Golden Seam)");
ok(P1("gloves", 0).stat === "crit" && P1("gloves", 0).layer === "flat", "Gloves P1 = Crit Rate (Bare Hand's Instinct)");
ok(P1("gloves", 1).stat === "critDmg",                                  "Gloves P2 = Crit Damage (Crackfinder)");
ok(P1("boots",  0).stat === "atkSpeed",                                 "Boots P1 = Attack Speed (Pathfinder's Pace)");
ok(P1("boots",  1).stat === "rarityFindEmber",                          "Boots P2 = Ember Trail (rarityFindEmber, inerte)");
ok(P1("cloak",  0).stat === "lumensBonus" && P1("cloak", 0).layer === "flat", "Cloak P1 = Lumens flat (Gilded Fringe)");
ok(P1("cloak",  1).stat === "lumensBonus" && P1("cloak", 1).layer === "pct",  "Cloak P2 = Lumens% (Fortune's Weave)");
// o ATK% do cloak MORRE (conserta o glass-cannon acidental)
ok(G.gear.buildPiece("cloak", "uncommon").affixes.every((a) => a.stat !== "atk"), "Cloak não tem mais nenhum afixo de ATK");

// despertares (afixo exclusivo do Uncommon)
const hasStat = (slot, stat) => G.gear.buildPiece(slot, "uncommon").affixes.some((a) => a.stat === stat);
ok(hasStat("weapon", "specialDmg"),        "Weapon despertar = specialDmg (Marked Blade)");
ok(hasStat("armor",  "siegeWard"),         "Armor despertar = siegeWard (Siege Ward)");
ok(G.gear.buildPiece("gloves", "uncommon").affixes.some((a) => a.stat === "crit" && a.layer === "pct"), "Gloves despertar = Crit% (Fracture Sense)");
ok(hasStat("helmet", "rarityFindLumen"),   "Helmet despertar = rarityFindLumen (Second Sight)");
ok(hasStat("boots",  "xpBonus"),           "Boots despertar = XP menor (Long Road)");
ok(hasStat("cloak",  "rarityFindCorona"),  "Cloak despertar = rarityFindCorona (Corona Call)");

// specialDmg NÃO dobra: stats() expõe gear (Marked Blade) + passiva (Giant Slayer) como soma ÚNICA
fresh();
G.state.data.equipped.weapon = G.gear.buildPiece("weapon", "uncommon");
G.state.data.equipped.weapon.level = 100;
G.state.invalidateStats();
const wSD = G.state.data.equipped.weapon.affixes.find((a) => a.stat === "specialDmg");
const gearSD = G.gear.affixValue(G.state.data.equipped.weapon, wSD);
ok(gearSD > 0, "specialDmg de gear > 0 no Uncommon");
G.state.data.passives.eclat[4] = 1; G.state.invalidateStats();       // Giant Slayer (UNIT.specialDmg = 12)
const passSD = G.passives.effect("specialDmg");
ok(Math.abs(G.state.stats().specialDmg - (gearSD + passSD)) < 1e-6, "specialDmg = gear + passiva (soma única, sem dobrar)");
G.state.data.passives.eclat[4] = 0; G.state.invalidateStats();

// siegeWard: exposto, e a redução extra SÓ conta com 2+ inimigos vivos (combat.applyHitToHero)
fresh();
G.state.data.equipped.armor = G.gear.buildPiece("armor", "uncommon");
G.state.data.equipped.armor.level = G.gear.cap(G.state.data.equipped.armor);   // max uncommon
G.state.invalidateStats();
ok(G.state.stats().siegeWard > 0, "siegeWard exposto (>0 no armor Uncommon maxado)");
const realUi = G.ui; G.ui = null;
G.state.data.hp = 1e15;
G.combat.enemies = [{ dead: false }];                 // 1 vivo → siegeWard NÃO aplica
let b0 = G.state.data.hp; G.combat.applyHitToHero(1e6); const dmg1 = b0 - G.state.data.hp;
G.state.data.hp = 1e15;
G.combat.enemies = [{ dead: false }, { dead: false }]; // 2 vivos → siegeWard aplica (dano menor)
b0 = G.state.data.hp; G.combat.applyHitToHero(1e6); const dmg2 = b0 - G.state.data.hp;
G.ui = realUi; G.combat.enemies = [];
ok(dmg2 < dmg1, "siegeWard reduz dano só com 2+ inimigos vivos na onda");

// siegeWard: boss sozinho (1 vivo) NÃO conta; boss + 1 escolta (2 vivos) conta certo
G.state.data.hp = 1e15;
G.combat.enemies = [{ isBoss: true, dead: false }];                       // só o boss → 1 vivo
b0 = G.state.data.hp; G.combat.applyHitToHero(1e6); const dmgBoss1 = b0 - G.state.data.hp;
G.state.data.hp = 1e15;
G.combat.enemies = [{ isBoss: true, dead: false }, { dead: false }];      // boss + escolta → 2 vivos
b0 = G.state.data.hp; G.combat.applyHitToHero(1e6); const dmgBossEscort = b0 - G.state.data.hp;
G.combat.enemies = [];
ok(dmgBoss1 === dmg1, "siegeWard: boss sozinho (1 vivo) não aplica, igual ao caso genérico de 1 vivo");
ok(dmgBossEscort < dmgBoss1, "siegeWard: boss + 1 escolta (2 vivos) aplica a redução extra");

// siegeWard: clamp do TOTAL (damageReduction + siegeWard) em 75, não de cada termo isolado
G.state.data.equipped.helmet = G.gear.buildPiece("helmet", "uncommon");
G.state.data.equipped.helmet.level = G.gear.cap(G.state.data.equipped.helmet);   // dmgRed alto do helmet
G.state.invalidateStats();
ok(G.state.stats().damageReduction + G.state.stats().siegeWard > 75,
  "setup: damageReduction + siegeWard isolados somam > 75 (pré-condição do clamp)");
G.state.data.hp = 1e15;
G.combat.enemies = [{ dead: false }, { dead: false }];   // 2 vivos → siegeWard entra na soma
b0 = G.state.data.hp; G.combat.applyHitToHero(1e6);
const reducedClamped = b0 - G.state.data.hp;
G.combat.enemies = [];
ok(Math.abs(reducedClamped - Math.ceil(1e6 * 0.25)) < 1, "siegeWard: total clampado em 75% (dano final = 25% do bruto), não cada termo isolado");

// rarityFind* expostos e INERTES (stats() os expõe; nada os consome até o P8)
fresh();
G.state.data.equipped.helmet = G.gear.buildPiece("helmet", "uncommon"); G.state.data.equipped.helmet.level = 100;
G.state.data.equipped.cloak  = G.gear.buildPiece("cloak",  "uncommon"); G.state.data.equipped.cloak.level  = 100;
G.state.invalidateStats();
const rf = G.state.stats();
ok("rarityFindLumen"  in rf && rf.rarityFindLumen  > 0, "rarityFindLumen exposto em stats()");
ok("rarityFindEmber"  in rf && rf.rarityFindEmber >= 0, "rarityFindEmber exposto em stats()");
ok("rarityFindCorona" in rf && rf.rarityFindCorona > 0, "rarityFindCorona exposto em stats()");

// save antigo (afixos velhos, cloak com ATK%) → reconcile reconstrói do gearBase novo, nível preservado
store = {};
store[G.state.SAVE_KEY] = JSON.stringify({
  level: 500,
  equipped: {
    cloak:  { slot: "cloak",  rarity: "uncommon", level: 1200, affixes: [{ id: "atkp", stat: "atk", layer: "pct" }] },
    weapon: { slot: "weapon", rarity: "common",   level: 400 },
  },
});
G.state.data = null; G.state.load();
ok(G.state.data.equipped.cloak.level === 1200, "save antigo: nível do cloak preservado (1200)");
ok(G.state.data.equipped.weapon.level === 400,  "save antigo: nível da weapon preservado (400)");
ok(G.state.data.equipped.cloak.affixes.every((a) => a.stat !== "atk"), "save antigo: cloak reconstruído sem ATK% (afixos novos)");
ok(G.state.data.equipped.cloak.affixes.some((a) => a.stat === "rarityFindCorona"), "save antigo: cloak ganha o despertar novo (rarityFindCorona)");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
