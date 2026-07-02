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
// seta o nível de um nó da Árvore I direto (bypass de gating) para medir efeito
function setNode(idx, lv) { G.state.data.passives.tree1[idx] = lv; G.state.invalidateStats(); }

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

// ---------- PASSO 6: a ÁRVORE I (árvore única binária) ----------

// save v5: passives.tree1 = 15 zeros; árvores antigas (eclat/vestige/fracture) morreram
fresh();
ok(G.state.SAVE_KEY === "eclats_v5", "SAVE_KEY = eclats_v5 (bump estrutural do P6)");
ok(Array.isArray(G.state.data.passives.tree1) && G.state.data.passives.tree1.length === 15 &&
  G.state.data.passives.tree1.every((v) => v === 0), "fresh: passives.tree1 = 15 zeros");
ok(!G.state.data.passives.eclat && !G.state.data.passives.vestige && !G.state.data.passives.fracture,
  "fresh: árvores antigas removidas do save");

// topologia: 1 raiz + 2 (D2) + 4 (D3) + 8 folhas (D4) = 15; raiz sem pai
ok(G.passives.nodes.length === 15, "15 nós na Árvore I");
ok(G.passives.nodes[0].parent === -1 && G.passives.nodes[0].depth === 1, "nó 0 é a raiz (parent -1, depth 1)");
ok(G.passives.leaves().length === 8, "8 folhas (depth 4)");
ok(G.passives.nodes.filter((n) => n.depth === 2).length === 2 &&
  G.passives.nodes.filter((n) => n.depth === 3).length === 4, "2 nós em D2, 4 em D3");

// save v4 antigo (key morta) é ignorado — carrega fresh v5, sem crash
store = {}; store["eclats_v4"] = JSON.stringify({ level: 999, passives: { eclat: Array(15).fill(3) } });
G.state.data = null;
const hadSaveV4 = G.state.load();
ok(hadSaveV4 === false, "save v4 (key morta) não é encontrado sob a key v5");
ok(G.state.data.level === 1 && G.state.data.passives.tree1.every((v) => v === 0),
  "v4 ignorado: estado fresco (level 1, tree1 zerada), sem crash");

// save v5 corrompido: string não-numérica em tree1 não vira NaN persistente (senão buy()
// drena Convergence Points pra sempre sem o nó nunca subir de nível — NaN é falsy em level())
store = {};
store[G.state.SAVE_KEY] = JSON.stringify({ passives: { tree1: ["abc", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
  convergences: 1, convergencePoints: 1e6 });
G.state.data = null; G.state.load();
ok(G.state.data.passives.tree1[0] === 0, "save corrompido (string): entrada sanitizada para 0, não NaN");
const ptsBefore = G.state.data.convergencePoints;
ok(G.passives.buy(0) === true, "nó saneado ainda é comprável");
ok(G.passives.level(0) === 1, "buy() após sanear sobe de nível de verdade (não fica preso em NaN)");
ok(G.state.data.convergencePoints === ptsBefore - G.passives.unlockCost(0), "buy() cobrou o custo certo, sem dreno silencioso");

// save v5 com array curto (3 elementos): resto preenchido com 0, sem crash
store[G.state.SAVE_KEY] = JSON.stringify({ passives: { tree1: [2, 1, 1] } });
G.state.data = null; G.state.load();
ok(G.state.data.passives.tree1.length === 15 && G.state.data.passives.tree1[0] === 2 &&
  G.state.data.passives.tree1[14] === 0, "save curto: array preenchido a 15, índices faltantes = 0");

// save v5 com níveis acima do cap (>10) e negativos: reconcile clampa em [0, maxLevel]
store[G.state.SAVE_KEY] = JSON.stringify({ passives: { tree1: [99, -5, 10.9, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] } });
G.state.data = null; G.state.load();
ok(G.state.data.passives.tree1[0] === 10, "reconcile clampa nível acima do cap (99 -> 10)");
ok(G.state.data.passives.tree1[1] === 0, "reconcile clampa nível negativo (-5 -> 0)");
ok(G.state.data.passives.tree1[2] === 10, "reconcile trunca fracionário e clampa (10.9 -> 10)");

// gating abre-ao-comprar: nada sem Convergence; raiz 1ª; filho abre com pai ≥1
fresh();
ok(G.passives.canBuy(0) === false, "sem Convergence: nada comprável");
G.state.data.convergences = 1; G.state.data.convergencePoints = 1e12;
ok(G.passives.canBuy(0) === true, "com Convergence + pontos: a raiz é comprável");
ok(G.passives.canBuy(1) === false && G.passives.canBuy(3) === false, "filhos bloqueados com o pai no nível 0");
G.passives.buy(0);
ok(G.passives.canBuy(1) === true && G.passives.canBuy(2) === true, "comprar a raiz ABRE os 2 filhos D2");
ok(G.passives.canBuy(3) === false, "neto D3 ainda bloqueado (pai D2 no nível 0)");
G.passives.buy(1);
ok(G.passives.canBuy(3) === true && G.passives.canBuy(4) === true, "comprar o D2 abre seus 2 filhos D3");

// buy() direto (não só canBuy()) recusa TODO nó cujo pai ainda não foi comprado — mesmo com
// pontos infinitos, uma folha nunca é alcançável sem a cadeia de ancestrais inteira
fresh(); G.state.data.convergences = 1; G.state.data.convergencePoints = 1e12;
for (let i = 1; i < G.passives.nodes.length; i++)
  ok(G.passives.buy(i) === false && G.passives.level(i) === 0,
    `buy(${i}) direto recusado sem o pai comprado (nó bloqueado por baixo)`);
// destrava a cadeia até uma folha: 0 (raiz) -> 1 (D2 Regeneration) -> 4 (D3 Hardened Light) -> 9 (folha Deep Memory)
ok(G.passives.buy(0) === true && G.passives.buy(1) === true && G.passives.buy(4) === true && G.passives.buy(9) === true,
  "cadeia completa (raiz -> D2 -> D3 -> folha) compra em sequência");
ok(G.passives.buy(10) === true, "folha IRMÃ (10) sob o mesmo pai (4) já aberta — abre-ao-comprar é por PAI, não por caminho exato");
ok(G.passives.buy(7) === false && G.passives.buy(8) === false,
  "folhas do OUTRO D3 (3, Vessel's Growth — não comprado) seguem bloqueadas mesmo com o ramo irmão aberto");
ok(G.passives.buy(11) === false && G.passives.buy(13) === false,
  "folhas do OUTRO ramo D2 (2, Heal on Kill — não comprado) seguem totalmente bloqueadas");

// custo: maxLevel 10, unlock por profundidade, upgrade geométrico
fresh(); G.state.data.convergences = 1; G.state.data.convergencePoints = 1e12;
ok(G.passives.nodeMax() === 10, "maxLevel = 10 por nó");
ok(G.passives.unlockCost(0) === G.passives.unlockByDepth[0], "unlock da raiz = unlockByDepth[D1]");
ok(G.passives.unlockCost(7) === G.passives.unlockByDepth[3], "unlock de folha = unlockByDepth[D4]");
ok(G.passives.nextCost(0) === G.passives.unlockCost(0), "nível 0: nextCost = unlockCost");
G.passives.buy(0);
ok(G.passives.nextCost(0) === Math.ceil(G.passives.unlockCost(0) * G.passives.evoFactor),
  "nível 1→2: nextCost = unlock × evoFactor");

// First Spark (raiz): efeito DUPLO ATK% + HP%
fresh();
const atk0 = G.state.stats().atk, hp0 = G.state.stats().hp;
setNode(0, 10);
ok(G.passives.effects().firstSpark === 10 * G.passives.unit("firstSpark"), "firstSpark agrega nível × unit");
ok(G.state.stats().atk > atk0 && G.state.stats().hp > hp0, "firstSpark eleva ATK e HP (duplo)");

// Hardened Light: damageReduction como fonte de passiva (NOVO)
fresh(); G.passives.UNIT.damageReduction = 10; setNode(4, 3);
ok(Math.abs(G.state.stats().damageReduction - 30) < 1e-9, "Hardened Light: damageReduction passivo (10×3=30%)");
G.passives.UNIT.damageReduction = 1;

// Lightbane: exposto no cache; aplica vs acesos (rare/elite), NÃO vs boss
fresh();
G.state.data.equipped.weapon.affixes = []; // isola: sem specialDmg de gear
G.passives.UNIT.lightbane = 8; setNode(12, 10); // +80%
ok(Math.abs(G.state.stats().lightbane - 80) < 1e-9, "lightbane exposto em stats (8×10=80%)");
(function () {
  const realUi = G.ui, realChance = G.util.chance;
  G.ui = null; G.util.chance = () => false;   // sem projétil, sem crit
  const atk = G.state.stats().atk;
  G.combat.enemies = [{ hp: 1e9, maxHp: 1e9, rarity: { tag: "R" }, isBoss: false, dead: false }];
  let b = G.combat.enemies[0].hp; G.combat.playerHit(); const dmgRare = b - G.combat.enemies[0].hp;
  G.combat.enemies = [{ hp: 1e9, maxHp: 1e9, rarity: null, isBoss: true, dead: false }];
  b = G.combat.enemies[0].hp; G.combat.playerHit(); const dmgBoss = b - G.combat.enemies[0].hp;
  G.combat.enemies = []; G.ui = realUi; G.util.chance = realChance;
  ok(Math.abs(dmgRare - Math.ceil(atk * 1.8)) <= 1, "lightbane +80% aplicado vs aceso (rare)");
  ok(Math.abs(dmgBoss - atk) <= 1, "lightbane NÃO aplica vs boss");
})();
G.passives.UNIT.lightbane = 8;

// Overkill Echo: excedente do golpe fatal → Lumens extra, capado em 100% dos lumens base
function killWith(echoLvl, hp) {
  fresh(); setNode(10, echoLvl);
  G.state.data.lumens = 0;
  const realUi = G.ui; G.ui = null;
  const mob = { name: "m", level: 1, maxHp: 1000, hp: hp, dmg: 1, lumens: 100, xp: 1, isBoss: false, rarity: null };
  G.combat.enemies = [mob]; G.combat.enemy = mob;
  G.combat.onKill();
  G.ui = realUi;
  return G.state.data.lumens;
}
G.passives.UNIT.overkillEcho = 10;
const echoBase = killWith(0, -500);                          // sem echo
const echoBig = killWith(10, -500);                          // +100%, overkill 500 → cap 100
ok(echoBig - echoBase === Math.min(Math.ceil(500 * G.data.balance.goldRatio), 100),
  "Overkill Echo: excedente vira Lumens extra, capado em 100% dos lumens base do mob");
const echoSmall = killWith(10, -50);                         // overkill 50 → sob o cap
ok(echoSmall - echoBase === Math.ceil(50 * G.data.balance.goldRatio),
  "Overkill Echo: overkill pequeno (sob o cap) escala 1:1 com goldRatio");

// Deep Memory: convPointsPct eleva os pontos de Convergence
fresh(); G.state.data.level = 276; G.state.data.convergences = 0;
const dmPts0 = G.convergence.rawPoints();
G.passives.UNIT.convPointsPct = 5; setNode(9, 10);           // +50%
ok(G.convergence.points() === Math.floor(dmPts0 * 1.5), "Deep Memory: convPointsPct +50% nos pontos");

// Harbinger's Bane: bossDmg (chave existente, lida no playerHit)
fresh(); G.passives.UNIT.bossDmg = 100; setNode(14, 1);
ok(G.passives.effect("bossDmg") === 100, "Harbinger's Bane: bossDmg +100% (×2 vs Boss no playerHit)");
G.passives.UNIT.bossDmg = 10;

// Quickened Pulse: atkSpeed flat (soft cap comprime o excesso)
fresh();
const as0 = G.state.stats().atkSpeed;
G.passives.UNIT.atkSpeed = 0.03; setNode(13, 10);
ok(G.state.stats().atkSpeed > as0, "Quickened Pulse: atkSpeed sobe (soft cap comprime)");

// A COROA "The Ring Closes": auto-concedida com as 8 folhas ≥1; mult em ATK/HP/Lumens/XP
fresh(); G.state.data.convergences = 1;
ok(G.passives.crownActive() === false, "coroa apagada com a árvore vazia");
// 7 das 8 folhas maxadas (nível 10) NÃO acende — a coroa exige as 8, não "quase todas"
const leaves = G.passives.leaves();
for (let k = 0; k < leaves.length - 1; k++) setNode(leaves[k], 10);
ok(G.passives.crownActive() === false, "coroa NÃO acende com 7/8 folhas, mesmo todas maxadas (falta 1)");
ok(G.passives.effects().ringCloses === undefined, "sem coroa: ringCloses nem aparece em effects()");
// a 8ª folha no nível 1 (não max) já basta — a coroa é sobre ALCANÇAR todas, não maximizar
setNode(leaves[leaves.length - 1], 1);
ok(G.passives.crownActive() === true, "coroa acende com as 8 folhas ≥1 (não precisa de nível máximo)");
for (const i of G.passives.leaves()) setNode(i, 1);
ok(G.passives.crownActive() === true, "coroa acende com as 8 folhas ≥1");
ok(G.passives.effects().ringCloses === G.passives.unit("ringCloses"), "effects() injeta ringCloses com a coroa acesa");
const leaf0 = G.passives.leaves()[0];   // idx 7 = lumensPct (não toca ATK) → isola o mult da coroa
setNode(leaf0, 0); const atkNoCrown = G.state.stats().atk;
setNode(leaf0, 1); const atkCrown = G.state.stats().atk;
ok(atkCrown > atkNoCrown, "coroa eleva ATK via mult ×(1+ringCloses%)");
ok(Math.abs(atkCrown / atkNoCrown - (1 + G.passives.unit("ringCloses") / 100)) < 0.02,
  "coroa: mult de ATK ≈ 1+ringCloses%");

// chaves mortas removidas do UNIT (capstones, matPct, hpToDamage, eliteDmg, deferidos)
ok(G.passives.UNIT.capstoneEclat === undefined && G.passives.UNIT.matCommonPct === undefined &&
  G.passives.UNIT.hpToDamage === undefined && G.passives.UNIT.eliteDmg === undefined,
  "UNIT sem as chaves mortas (capstones, matCommonPct, hpToDamage, eliteDmg)");
ok(G.passives.isDeferred === undefined && G.passives.groupUnlocked === undefined,
  "helpers do modelo antigo (isDeferred/groupUnlocked) removidos");

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

// specialDmg agora é SÓ de gear (Marked Blade) — a passiva Giant Slayer morreu no P6
fresh();
G.state.data.equipped.weapon = G.gear.buildPiece("weapon", "uncommon");
G.state.data.equipped.weapon.level = 100;
G.state.invalidateStats();
const wSD = G.state.data.equipped.weapon.affixes.find((a) => a.stat === "specialDmg");
const gearSD = G.gear.affixValue(G.state.data.equipped.weapon, wSD);
ok(gearSD > 0, "specialDmg de gear > 0 no Uncommon");
ok(Math.abs(G.state.stats().specialDmg - gearSD) < 1e-6, "specialDmg = só gear (Giant Slayer removido)");

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

// siegeWard: clamp do TOTAL (damageReduction + siegeWard) em 75, não de cada termo isolado.
// damageReduction e siegeWard já vêm CADA UM clampado a 75 individualmente em stats() (state.js);
// forçamos os dois perto do teto individual (via cache) pra provar que a SOMA em combat.js
// (dr += s.siegeWard; dr = clamp(dr, 0, 75)) reclampa o total, e não deixa a soma passar de 75.
G.state.stats();   // popula o cache
G.state._cache.damageReduction = 75;
G.state._cache.siegeWard = 75;
ok(G.state._cache.damageReduction + G.state._cache.siegeWard > 75,
  "setup: damageReduction + siegeWard isolados somam > 75 (pré-condição do clamp)");
G.state.data.hp = 1e15;
G.combat.enemies = [{ dead: false }, { dead: false }];   // 2 vivos → siegeWard entra na soma
b0 = G.state.data.hp; G.combat.applyHitToHero(1e6);
const reducedClamped = b0 - G.state.data.hp;
G.combat.enemies = [];
ok(Math.abs(reducedClamped - Math.ceil(1e6 * 0.25)) < 1, "siegeWard: total clampado em 75% (dano final = 25% do bruto), não a soma de dois 75%s isolados");

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

// ---------- P8.4: o finale encenado (emenda ao PORTÃO do P7) ----------
// A área 18 tem DOIS estágios: H6 (area.boss, ungated) → Okhra (area.mapBoss, gated pelo First Light).
fresh();
const lastIdx = G.data.areas.length - 1;
ok(!!G.data.areas[lastIdx].boss && !!G.data.areas[lastIdx].mapBoss,
  "área 18 (P8.4): tem boss (H6) e mapBoss (Okhra)");
(function () {
  const realUi = G.ui; G.ui = null;
  function firstBoss(idx, opt) {
    G.state.data.areaIndex = idx; G.state.data.maxAreaUnlocked = idx;
    G.state.data.awakens = opt.awake ? ["first_light"] : [];
    G.state.data.awakensUnlocked = G.state.data.awakens;
    G.state.data.harbingersFelled = opt.h6Felled ? [idx] : [];
    G.combat._lastAreaIndex = idx; G.combat._bossKills = 1e9; G.combat._okhraManifest = false;
    G.combat.spawn();
    return G.combat.enemies.find((e) => e.isBoss) || null;
  }
  // sem First Light, H6 vivo → threshold invoca o H6 (Harbinger), NÃO o Okhra
  let b = firstBoss(lastIdx, { awake: false, h6Felled: false });
  ok(b && !b.isMapBoss, "área 18 sem First Light: threshold invoca o H6 (não o Okhra)");
  // sem First Light, H6 morto → PORTÃO: nenhum boss (Okhra nunca manifesta)
  b = firstBoss(lastIdx, { awake: false, h6Felled: true });
  ok(b === null, "área 18 sem First Light + H6 morto: portão — Okhra nunca manifesta");
  // com First Light, H6 morto → Okhra (mapBoss) manifesta
  b = firstBoss(lastIdx, { awake: true, h6Felled: true });
  ok(b && b.isMapBoss, "área 18 com First Light + H6 morto: Okhra (mapBoss) manifesta");
  // com First Light, H6 vivo → o H6 ainda vem PRIMEIRO (Okhra só depois do H6)
  b = firstBoss(lastIdx, { awake: true, h6Felled: false });
  ok(b && !b.isMapBoss, "área 18 com First Light + H6 vivo: o H6 vem primeiro (Okhra só após o H6)");
  // o portão é SÓ da última área — o Harbinger do G5 (idx 14) ignora o First Light
  b = firstBoss(14, { awake: false, h6Felled: false });
  ok(b && !b.isMapBoss, "Harbinger do G5 (idx 14) spawna por threshold sem depender do First Light");
  G.combat.enemies = []; G.ui = realUi;
})();

// =============================================================
// TRIAGE FIXES — regressão dos bugs 1-6 (correções da lista triada)
// =============================================================

// bug 2: simulateIdle não trunca as 8h (cap dinâmico derivado, não teto fixo de 50k ticks)
(function () {
  fresh();
  const orig = G.state.stats.bind(G.state);
  G.state.stats = function () { const s = orig(); s.atkSpeed = 1.999; return s; }; // lategame perto do soft-cap
  const away = 8 * 3600;
  const r = G.combat.simulateIdle(away);
  G.state.stats = orig;
  ok(r && r.seconds >= 7.99 * 3600,
    `simulateIdle(8h) @ atkSpeed 1.999 simula ≥ 7.99h (foi ${r ? (r.seconds / 3600).toFixed(3) : "null"}h — sem truncar em 50k ticks)`);
})();

// bug 5: nível de gear negativo no save vira 1 (piso), ATK volta a ser positivo
store = {};
store[G.state.SAVE_KEY] = JSON.stringify({ level: 50, equipped: { weapon: { slot: "weapon", rarity: "common", level: -50 } } });
G.state.data = null; G.state.load();
ok(G.state.data.equipped.weapon.level === 1, "reconcile: gear level negativo (-50) clampado ao piso 1");
ok(G.state.stats().atk > 0, "gear level clampado → ATK > 0 (não afixo negativo)");

// bug 6: hp não-numérico no save é coagido para maxHp (mesmo padrão do tree1)
store = {};
store[G.state.SAVE_KEY] = JSON.stringify({ hp: "abc" });
G.state.data = null; G.state.load();
ok(Number.isFinite(G.state.data.hp) && G.state.data.hp === G.state.maxHp(),
  "load: hp não-numérico ('abc') coagido para maxHp");
store = {};
store[G.state.SAVE_KEY] = JSON.stringify({ hp: 0 });
G.state.data = null; G.state.load();
ok(G.state.data.hp === G.state.maxHp(), "load: hp <= 0 ainda vira maxHp (comportamento preservado)");
store = {};
store[G.state.SAVE_KEY] = JSON.stringify({ level: 1, hp: 5 });
G.state.data = null; G.state.load();
ok(G.state.data.hp === 5, "load: hp válido (5) preservado");

// ---- bugs 1, 3, 4 precisam do ui.js (DOM falso) ----
function fakeEl() {
  return { textContent: "", innerHTML: "", style: {},
    classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
    getAttribute: () => null, setAttribute() {}, addEventListener() {},
    querySelectorAll: () => [], appendChild() {}, children: [] };
}
global.document = {
  getElementById: () => fakeEl(), querySelectorAll: () => [], querySelector: () => fakeEl(),
  addEventListener() {}, body: { classList: { toggle() {} } },
};
eval(fs.readFileSync(path.join(SRC, "ui.js"), "utf8"));
G.ui.cache();

// bug 3: mapNodePos cobre todas as áreas, sem posições duplicadas
ok(G.ui.mapNodePos.length === G.data.areas.length,
  `mapNodePos cobre as ${G.data.areas.length} áreas (era 9)`);
(function () {
  const seenPos = new Set(); let dupPos = false;
  for (const p of G.ui.mapNodePos) { const k = p.join(","); if (seenPos.has(k)) dupPos = true; seenPos.add(k); }
  ok(!dupPos, "mapNodePos sem posições duplicadas");
})();

// bug 4: pack do painel (packSizeFor) === packByGroup para os 18 índices — fonte única com combat
(function () {
  const b = G.data.balance; let packOk = true;
  for (let i = 0; i < G.data.areas.length; i++) {
    const exp = b.packByGroup[G.util.clamp(Math.floor(i / b.groupSize), 0, b.packByGroup.length - 1)];
    if (G.combat.packSizeFor(i) !== exp) packOk = false;
  }
  ok(packOk, "packSizeFor === packByGroup para os 18 índices (painel derivado da fonte de combat)");
})();

// bug 1: trocar de área (goToArea/travelTo) limpa a onda em G.combat.enemies
fresh();
G.state.data.maxAreaUnlocked = 5;
G.state.data.areaIndex = 0;
G.state.invalidateStats();
G.state.data.hp = G.state.maxHp();
G.combat.spawn();
ok(G.combat.enemies.length > 0, "setup: onda spawnada na área 0");
G.ui.goToArea(3);
ok(G.combat.enemies.length === 0, "troca de área (goToArea) limpa G.combat.enemies");
ok(G.combat.enemy === null, "troca de área zera o alias G.combat.enemy");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
