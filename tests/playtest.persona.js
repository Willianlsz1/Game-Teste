// =============================================================
// tests/playtest.persona.js — PERSONA DE QA ("Marina, a Completista")
// Rodar: node tests/playtest.persona.js
//
// Marina joga o jogo inteiro de forma headless e relata achados.
// Perfil: metódica, gasta TODO lumen em gear, promove quando tem material,
// converge no gate e investe em passivas, empurra o mais longe possível.
//
// Não usa framework. Carrega os módulos de src/ num sandbox (G.ui = null) e
// dirige o motor real (combat/state/economy/convergence/passives/gear).
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
// Date.now é usado por state.save/fresh; ok no Node.
const SRC = path.join(__dirname, "..", "src");
for (const f of ["util", "data", "gear", "passives", "awaken", "state", "economy", "rates", "enemyFactory", "income", "progression", "convergence", "combat"])
  eval(fs.readFileSync(path.join(SRC, f + ".js"), "utf8"));
G.ui = null; // headless: combat resolve hits na hora (sem projéteis)

// ---------- coletor de achados ----------
const findings = [];
function flag(sev, area, msg) { findings.push({ sev, area, msg }); }
const num = (n) => G.util.fmt(n);
function finite(x) { return Number.isFinite(x); }

// ---------- IA da Marina: gasto de lumens ----------
function spendLumens() {
  // promove peças maximizadas se houver material
  for (const slot of G.data.slots) {
    const item = G.state.data.equipped[slot.id];
    if (G.gear.isMaxed(item) && G.gear.canPromote(item)) G.gear.promote(item);
  }
  // sobe o nível da peça mais barata enquanto puder pagar (esvazia o lumen)
  let guard = 100000;
  while (guard-- > 0) {
    let cheapest = null, cost = Infinity;
    for (const slot of G.data.slots) {
      const item = G.state.data.equipped[slot.id];
      if (G.gear.isMaxed(item)) continue;
      const c = G.gear.cost(item);
      if (c < cost) { cost = c; cheapest = item; }
    }
    if (!cheapest || G.state.data.lumens < cost) break;
    G.gear.levelUp(cheapest);
  }
}

// compra passivas acessíveis na Árvore I (respeita topologia via canBuy)
function spendPassives() {
  let bought = 0, guard = 5000;
  while (guard-- > 0) {
    let did = false;
    for (let i = 0; i < 15; i++)
      if (G.passives.canBuy(i)) { G.passives.buy(i); bought++; did = true; }
    if (!did) break;
  }
  return bought;
}

// ============================================================
// PART A — LOOP VIVO (early game, simulação literal na Área 1)
// ============================================================
function partA() {
  console.log("\n===== PART A — Loop vivo (Área 1, simulação real) =====");
  store = {}; G.state.data = null; G.state.load();
  const d = G.state.data;

  // sanity inicial
  const s0 = G.state.stats();
  if (!finite(s0.atk) || !finite(s0.hp)) flag("BUG", "A", "Stats iniciais não-finitos");
  const firstMobHp = G.data.mobHpParam(1);
  const htk0 = firstMobHp / s0.atk;
  const ttk0 = Math.ceil(htk0) * G.state.attackInterval();
  console.log(`Início: ATK ${num(s0.atk)} | HP ${num(s0.hp)} | atkSpeed ${s0.atkSpeed} | 1º mob HP ${num(firstMobHp)} | HTK ${htk0.toFixed(2)} | TTK ${ttk0.toFixed(2)}s`);
  if (htk0 < 3) flag("BAL", "A", `1º mob exige só ${htk0.toFixed(2)} golpe(s) — alvo pelado é 3-4`);
  if (htk0 > 4) flag("BAL", "A", `1º mob exige ${htk0.toFixed(2)} golpes — acima do alvo pelado 3-4`);

  // simula até ~25 min de jogo OU subir de área
  let t = 0, kills0 = d.totalKills, deaths = 0, dropEvents = 0, maxAtkSpeed = 0;
  const T_MAX = 25 * 60;
  const hpBefore = () => d.hp;
  // hook de drops: detecta se cai material na Área 1/2 (não deveria)
  const origRoll = G.economy.rollDrops.bind(G.economy);
  G.economy.rollDrops = function (e, opts) {
    const out = origRoll(e, opts);
    if (Object.keys(out).length) {
      dropEvents++;
      if ((d.areaIndex || 0) < 2) flag("BUG", "A", `Material dropou na área ${d.areaIndex + 1} (gate é Área 3+)`);
    }
    return out;
  };

  // checkpoints de PACE
  const gearLevels = () => G.data.slots.reduce((s, sl) => s + (d.equipped[sl.id].level || 1), 0);
  const gearMaxed  = () => G.data.slots.every(sl => G.gear.isMaxed(d.equipped[sl.id]));
  let cpArea1 = null, cpGearMax = null;

  let oneShotReported = false, lastLevel = d.level, levelStalls = 0, lastKills = d.totalKills;
  while (t < T_MAX) {
    const dt = 0.1; // dt fino: tempo realista (~60fps no jogo), não amarrado ao attackInterval
    const hp0 = hpBefore();
    G.combat.tick(dt);
    t += dt;
    if (d.hp < hp0 && d.hp === G.state.maxHp() && hp0 <= G.state.maxHp()) {} // ignore
    maxAtkSpeed = Math.max(maxAtkSpeed, G.state.stats().atkSpeed);
    // detecta morte (respawn cura total): heurística via log seria melhor, mas
    // checamos hp que voltou ao máximo após cair a 0 — aproximamos por respawnTimer
    spendLumens();
    if (d.level !== lastLevel) { lastLevel = d.level; }
    // checkpoint: Área 1 limpa (entrou na Área 2)
    if (!cpArea1 && d.areaIndex >= 1)
      cpArea1 = { t, kills: d.totalKills - kills0, lumens: d.lumens, gearLv: gearLevels(), level: d.level };
    // checkpoint: gear totalmente maximizado
    if (!cpGearMax && gearMaxed())
      cpGearMax = { t, level: d.level, area: d.areaIndex + 1, lumens: d.lumens };
    // sobe de área ao desbloquear (Marina viaja assim que pode)
    if ((d.maxAreaUnlocked || 0) > d.areaIndex) { d.areaIndex = d.maxAreaUnlocked; }
    // verifica one-shot recorrente: se mob morre em 1 swing consistentemente em nível alto
    if (!oneShotReported && d.totalKills - kills0 > 50) {
      const s = G.state.stats();
      const mhp = G.data.mobHpParam(G.enemyFactory.mobLevelFor(d.areaIndex));
      const dmgPerSwing = s.atk * (1 + s.critDmg / 100 * (s.crit / 100));
      if (dmgPerSwing > mhp * 3) { flag("BAL", "A", `One-shot fácil: dano/golpe (${num(dmgPerSwing)}) >> HP do mob (${num(mhp)}) por volta do nível ${d.level}`); oneShotReported = true; }
    }
  }
  G.economy.rollDrops = origRoll; // restaura

  const killsA = d.totalKills - kills0;
  const kpm = killsA / (t / 60);
  console.log(`Após ${(t/60).toFixed(0)} min: nível ${d.level} | kills ${killsA} (${kpm.toFixed(1)}/min) | lumens ${num(d.lumens)} | área ${d.areaIndex + 1} | atkSpeed máx ${maxAtkSpeed}`);
  console.log(`Drops na Área 1-2: ${dropEvents} evento(s) (esperado 0 até Área 3)`);
  // ---- PACE (alvo: Área 1 em ~10-15 min; gear não maximizar antes da Área 3) ----
  if (cpArea1)
    console.log(`PACE · Área 1 limpa: ${(cpArea1.t/60).toFixed(1)} min | nível ${cpArea1.level} | ${cpArea1.kills} kills | gear total Lv ${cpArea1.gearLv}/3000 | lumens ${num(cpArea1.lumens)}`);
  else
    console.log(`PACE · Área 1 NÃO limpa em ${(t/60).toFixed(0)} min`);
  if (cpGearMax)
    console.log(`PACE · Gear maximizado: ${(cpGearMax.t/60).toFixed(1)} min | nível ${cpGearMax.level} | Área ${cpGearMax.area} | lumens sobrando ${num(cpGearMax.lumens)}`);
  else
    console.log(`PACE · Gear NÃO maximizou em ${(t/60).toFixed(0)} min (bom: ainda há ralo)`);
  // avaliações de pace vs alvos
  if (cpArea1) {
    const m = cpArea1.t / 60;
    // alvo ~8 min (P5: escala de XP reaberta p/ First Light ~18h). O beat inicial que importa
    // é a 1ª Convergence (~38min, dentro da banda P0 25–40min), não a Área 1 isolada.
    if (m < 3)  flag("BAL", "A", `Área 1 rápida demais (${m.toFixed(1)} min; alvo ~8)`);
    if (m > 14) flag("BAL", "A", `Área 1 lenta demais (${m.toFixed(1)} min; alvo ~8)`);
  }
  if (cpGearMax && cpGearMax.area < 3)
    flag("BAL", "A", `Gear maximiza na Área ${cpGearMax.area} (antes da Área 3, onde abre a promoção) → lumens transbordam`);
  // valida cap de atk speed no Mapa 1
  if (maxAtkSpeed > G.data.balance.map1AtkSpeedCap + 1e-9)
    flag("BUG", "A", `atkSpeed ${maxAtkSpeed} passou do cap do Mapa 1 (${G.data.balance.map1AtkSpeedCap})`);
  // progresso mínimo (não soft-lock)
  if (d.level < 3) flag("BAL", "A", `Progresso muito lento: só nível ${d.level} após ${(t/60).toFixed(0)} min`);
  return { level: d.level, kpm, lumens: d.lumens, area: d.areaIndex + 1 };
}

// ============================================================
// PART B — META LOOP (convergence × passivas, analítico)
// ============================================================
function partB() {
  console.log("\n===== PART B — Convergence × Passivas =====");
  store = {}; G.state.data = null; G.state.load();
  const levels = [80, 150, 400, 700, 1000, 2000, 5000];
  console.log("Pontos por convergence (P5: " + G.data.balance.convPointsBase + " × (nível/" + G.data.balance.convGateBase + ")^" + G.data.balance.convPointsExp + "):");
  for (const L of levels) {
    G.state.data.level = L;
    const pts = G.convergence.points();
    if (!finite(pts)) flag("BUG", "B", `Pontos não-finitos no nível ${L}`);
    console.log(`  Lv ${String(L).padStart(4)} → ${num(pts)} pts`);
  }
  // custo p/ ABRIR a Árvore I inteira (15 nós no nível 1) e p/ MAXAR (todos no nível 10)
  let openCost = 0, maxCost = 0;
  for (let i = 0; i < 15; i++) {
    openCost += G.passives.unlockCost(i);
    let c = G.passives.unlockCost(i);
    for (let lv = 1; lv < G.passives.nodeMax(i); lv++)
      c += Math.ceil(G.passives.unlockCost(i) * G.passives.evoFactor * Math.pow(G.passives.evoRamp, lv - 1));
    maxCost += c;
  }
  console.log(`Custo p/ abrir a Árvore I inteira (15 nós, nível 1): ${num(openCost)} pts`);
  console.log(`Custo p/ MAXAR a Árvore I (todos nível 10): ${num(maxCost)} pts`);

  // simula convergences (política P5: gate escalonado) até a coroa acender e até maxar
  store = {}; G.state.data = null; G.state.load();
  let conv = 0, guard = 500, crownConv = null, maxedConv = null;
  while (guard-- > 0) {
    G.state.data.level = G.convergence.currentGate(); // P5: gate escalonado sobe a cada convergence
    if (!G.convergence.converge()) break;
    conv++;
    spendPassives();
    if (crownConv == null && G.passives.crownActive()) crownConv = conv;
    const prog = G.passives.treeProgress();
    if (prog.maxed === prog.total) { maxedConv = conv; break; }
  }
  console.log(`Coroa "The Ring Closes" acesa na convergence analítica: ${crownConv == null ? "não acendeu" : crownConv} (campanha real é a régua autoritativa)`);
  console.log(`Árvore I 100% maxada na convergence: ${maxedConv == null ? "não maxou" : maxedConv} (alvo 11-12)`);
  if (crownConv == null) flag("BUG", "B", "Coroa nunca acendeu na projeção analítica");
  return { conv, crownConv, maxedConv };
}

// ============================================================
// PART C — INVARIANTES POR ÁREA + sistemas (promote, drops, forge)
// ============================================================
function partC() {
  console.log("\n===== PART C — Invariantes por área e sistemas =====");
  store = {}; G.state.data = null; G.state.load();
  const d = G.state.data;

  console.log("Área | mob HP (início→teto) | boss HP | mob dmg@teto");
  for (let i = 0; i < G.data.areas.length; i++) {
    const a = G.data.areas[i];
    d.level = a.levelRange[0];
    const hpLo = G.data.mobHpParam(a.levelRange[0]);
    const hpHi = G.data.mobHpParam(a.levelRange[1]);
    const bossHp = hpHi * G.data.balance.bossHpMult;
    const mobAtk = G.data.mobAtkParam(a.levelRange[1]);
    if (![hpLo, hpHi, bossHp, mobAtk].every(finite)) flag("BUG", "C", `Valores não-finitos na área ${i + 1}`);
    if (hpHi < hpLo) flag("BAL", "C", `Área ${i + 1}: HP do teto (${num(hpHi)}) < HP do início (${num(hpLo)})`);
    console.log(`  ${String(i+1).padStart(2)} | ${num(hpLo)} → ${num(hpHi)} | ${num(bossHp)} | ${num(Math.ceil(mobAtk))}`);
  }

  // salto de dificuldade entre áreas (paradox of power): HP início da área N vs teto da N-1
  for (let i = 1; i < G.data.areas.length; i++) {
    const prevHi = G.data.mobHpParam(G.data.areas[i-1].levelRange[1]);
    const curLo  = G.data.mobHpParam(G.data.areas[i].levelRange[0]);
    const ratio  = curLo / prevHi;
    if (ratio > 1.0) {} // esperado subir
    if (ratio < 0.3) flag("BAL", "C", `Área ${i+1} começa com HP ${(ratio*100).toFixed(0)}% do teto anterior — queda de dificuldade`);
  }

  // atkSpeed cap respeitado em ambos os mapas
  store = {}; G.state.data = null; G.state.load();
  G.state.data.mapOneCleared = false;
  // injeta atkSpeed gigante via passiva? Mais simples: checa o clamp diretamente
  const capMap1 = G.state.currentAtkSpeedCap();
  G.state.data.mapOneCleared = true; G.state.invalidateStats();
  const capMap2 = G.state.currentAtkSpeedCap();
  console.log(`atkSpeed cap: Mapa 1 = ${capMap1} | Mapa 2 = ${capMap2}`);
  if (capMap1 !== G.data.balance.map1AtkSpeedCap) flag("BUG", "C", "Cap do Mapa 1 incorreto");
  if (capMap2 !== G.data.balance.map2AtkSpeedCap) flag("BUG", "C", "Cap do Mapa 2 incorreto");
  if (G.data.balance.map2AtkSpeedCap >= G.data.balance.atkSpeedCap)
    flag("BUG", "C", "Cap do Mapa 2 deveria ficar abaixo do teto final (15)");

  // PROMOTE: common → uncommon preservando nível e consumindo material
  store = {}; G.state.data = null; G.state.load();
  const weapon = G.state.data.equipped.weapon;
  weapon.level = G.gear.cap(weapon); // maxa
  G.economy.addGear("common", G.data.balance.promoteCommonCost);
  G.economy.addGear("uncommon", G.data.balance.promoteUncommonCost);
  const lvlBefore = weapon.level;
  const matsBefore = {
    common: G.economy.getGear("common"),
    uncommon: G.economy.getGear("uncommon"),
  };
  const promoted = G.gear.promote(weapon);
  const w2 = G.state.data.equipped.weapon;
  if (!promoted) flag("BUG", "C", "Promote common→uncommon falhou mesmo com material e nível máximo");
  else {
    if (w2.rarity !== "uncommon") flag("BUG", "C", "Promote não mudou a raridade para uncommon");
    if (w2.level !== lvlBefore)   flag("BUG", "C", `Promote não preservou o nível (${lvlBefore} → ${w2.level})`);
    if (G.economy.getGear("common") !== matsBefore.common - G.data.balance.promoteCommonCost)
      flag("BUG", "C", "Promote não consumiu a quantidade certa de material Common");
    if (G.economy.getGear("uncommon") !== matsBefore.uncommon - G.data.balance.promoteUncommonCost)
      flag("BUG", "C", "Promote não consumiu a quantidade certa de material Uncommon");
  }
  console.log(`Promote weapon: ${promoted ? "OK" : "FALHOU"} (raridade ${w2.rarity}, nível ${w2.level})`);

  // DROP GATING por área
  store = {}; G.state.data = null; G.state.load();
  const R0 = { rng: () => 0 };
  for (const [idx, expect] of [[0, false], [1, false], [2, true]]) {
    const out = G.economy.rollDrops({}, Object.assign({ type: "elite", areaIndex: idx }, R0));
    const got = Object.keys(out).length > 0;
    if (got !== expect) flag("BUG", "C", `Drop gating errado: área ${idx+1} elite deu drop=${got}, esperado ${expect}`);
  }
  console.log("Drop gating Área 1-2 bloqueado / Área 3 liberado: verificado");
}

// ---------- run ----------
const A = partA();
const B = partB();
partC();

console.log("\n========== ACHADOS DA MARINA ==========");
if (!findings.length) console.log("Nenhum problema crítico encontrado nos aspectos testados.");
const order = { BUG: 0, BAL: 1, DEAD: 2 };
findings.sort((a, b) => (order[a.sev] - order[b.sev]) || a.area.localeCompare(b.area));
for (const f of findings) console.log(`[${f.sev}] (Part ${f.area}) ${f.msg}`);
console.log(`\nTotal: ${findings.length} achado(s) — ` +
  `${findings.filter(f=>f.sev==="BUG").length} bug, ` +
  `${findings.filter(f=>f.sev==="BAL").length} balance, ` +
  `${findings.filter(f=>f.sev==="DEAD").length} dead-content.`);
