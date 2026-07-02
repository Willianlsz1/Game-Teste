// =============================================================
// tests/convergence.test.js — P5 gate escalonado + pontos (CONVERGENCE_V2)
// Rodar: node tests/convergence.test.js
// Sem framework: carrega os módulos de src/ num sandbox e usa asserts simples.
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

const b = G.data.balance;

// 1) escada exata — gate(n) = round(convGateBase × convGateGrowth^n), spec travada
//    (BALANCE_FRAMEWORK_MAP1.md §PASSO 5): 276·359·466·606·788·1025·1332·1732·2251·2927·3805·4946
const LADDER = [276, 359, 466, 606, 788, 1025, 1332, 1732, 2251, 2927, 3805, 4946];
store = {}; G.state.data = null; G.state.load();
for (let n = 0; n < LADDER.length; n++) {
  G.state.data.convergences = n;
  ok(G.convergence.currentGate() === LADDER[n], `currentGate() na convergence ${n} = ${LADDER[n]} (round(${b.convGateBase}×${b.convGateGrowth}^${n}))`);
}

// 2) convergences=0 → gate exato de fim de G1 (276), sem off-by-one
G.state.data.convergences = 0;
ok(G.convergence.currentGate() === b.convGateBase, "convergence 0: gate === convGateBase (276), fim do G1");

// 3) rawPoints/pointsFor — fórmula travada: 400 × (nível/276)^1.55
store = {}; G.state.data = null; G.state.load();
G.state.data.convergences = 0;
const expAt276 = b.convPointsBase * Math.pow(276 / b.convGateBase, b.convPointsExp);
ok(Math.abs(G.convergence.pointsFor(276) - expAt276) < 1e-9, "pointsFor(276) == convPointsBase × (276/276)^exp == convPointsBase");
ok(G.convergence.pointsFor(276) === b.convPointsBase, "pointsFor no gate 1 é exatamente convPointsBase (400) — sem passivas");

G.state.data.level = 276;
ok(G.convergence.rawPoints() === Math.floor(b.convPointsBase), "rawPoints() no nível do gate 1 == floor(convPointsBase)");

// razão entre convergences sucessivas no gate deve ficar perto de ×1.5 (spec: "cada convergence
// no gate rende ~×1.5 a anterior")
let prevPts = null, ratios = [];
for (let n = 0; n < LADDER.length; n++) {
  const pts = b.convPointsBase * Math.pow(LADDER[n] / b.convGateBase, b.convPointsExp);
  if (prevPts != null) ratios.push(pts / prevPts);
  prevPts = pts;
}
const avgRatio = ratios.reduce((a, x) => a + x, 0) / ratios.length;
ok(avgRatio > 1.4 && avgRatio < 1.75, `razão média de pontos entre gates sucessivos (${avgRatio.toFixed(2)}) dentro de 1.4–1.75 (alvo ~1.5)`);

// 4) points() com multiplicadores de passiva empilhando por cima da base (P5 spec)
store = {}; G.state.data = null; G.state.load();
G.state.data.convergences = 0;
G.state.data.level = 276; // == gate 1, rawPoints == 400
const realEffect = G.passives.effect.bind(G.passives);
G.passives.effect = (key) => {
  if (key === "convPointsPct")   return 20;  // +20%
  if (key === "convEfficiency")  return 10;  // +10%
  if (key === "capstoneFracture") return 50; // +50%
  if (key === "convPointsMin")   return 0;
  return realEffect(key);
};
const base = G.convergence.rawPoints(); // 400
const expected = Math.floor(base * 1.20 * 1.10 * 1.50);
ok(G.convergence.points() === expected, `points() aplica convPointsPct×convEfficiency×capstoneFracture multiplicativamente (esperado ${expected}, obtido ${G.convergence.points()})`);
G.passives.effect = realEffect;

// 4b) convPointsMin age como PISO (Math.max), não como bônus somado
store = {}; G.state.data = null; G.state.load();
G.state.data.convergences = 0;
G.state.data.level = 1; // nível baixíssimo -> rawPoints ~0
G.passives.effect = (key) => (key === "convPointsMin" ? 999 : (key === "convPointsPct" || key === "convEfficiency" || key === "capstoneFracture" ? 0 : realEffect(key)));
ok(G.convergence.points() === 999, `convPointsMin funciona como piso (Math.max) quando rawPoints é desprezível (obtido ${G.convergence.points()})`);
G.passives.effect = realEffect;

// 5) converge() credita pontos ANTES de incrementar convergences (usa o gate do CICLO que
// terminou, não o próximo) e a UI (currentGate) já reflete o próximo ciclo logo depois
store = {}; G.state.data = null; G.state.load();
ok(G.state.data.convergences === 0, "estado fresco: 0 convergences");
const gate1 = G.convergence.currentGate(); // 276
ok(gate1 === 276, "gate da 1ª convergence é 276");
G.state.data.level = gate1;
const expectedGain = Math.floor(b.convPointsBase * Math.pow(gate1 / b.convGateBase, b.convPointsExp));
const gained = G.convergence.pending();
ok(gained === expectedGain, `pending() no gate exato da 1ª convergence == ${expectedGain} (obtido ${gained})`);
const didConverge = G.convergence.converge();
ok(didConverge === true, "converge() executa quando level >= currentGate()");
ok(G.state.data.convergencePoints === expectedGain, `convergencePoints creditado com o valor do CICLO QUE TERMINOU (${expectedGain}), não recalculado pós-reset`);
ok(G.state.data.convergences === 1, "convergences incrementa para 1 após converge()");
ok(G.convergence.currentGate() === LADDER[1], `após a 1ª convergence, currentGate() já mostra o próximo gate (${LADDER[1]})`);
ok(G.state.data.level === 1, "converge() reseta level para 1");

// 6) canConverge() abaixo do gate é false; exatamente no gate é true
store = {}; G.state.data = null; G.state.load();
G.state.data.level = G.convergence.currentGate() - 1;
ok(G.convergence.canConverge() === false, "canConverge() falso 1 nível abaixo do gate");
G.state.data.level = G.convergence.currentGate();
ok(G.convergence.canConverge() === true, "canConverge() verdadeiro exatamente no gate");

// 7) pós-cap — após ~12 convergences o gate ultrapassa o teto de nível do Mapa 1 (área 18,
// levelRange[1] = 6000). Documenta a decisão: canConverge() NÃO tem lógica especial de cap —
// segue sendo uma comparação simples (level >= currentGate()), então em teoria um nível
// suficientemente alto (fora do alcance prático simulado) ainda converge. Isso é INTENCIONAL
// (ver tools/sim.js: "a convergência para sozinha quando o gate ultrapassa o cap de nível");
// o teste apenas fixa o comportamento observável, não impõe um hard-stop que não existe no código.
store = {}; G.state.data = null; G.state.load();
const mapCap = G.data.areas[G.data.areas.length - 1].levelRange[1];
G.state.data.convergences = 12;
const gate13 = G.convergence.currentGate();
ok(gate13 > mapCap, `gate da convergence 13 (${gate13}) excede o teto de nível do Mapa 1 (${mapCap}) — próxima convergence é inatingível em jogo normal`);
G.state.data.level = mapCap;
ok(G.convergence.canConverge() === false, `no teto de nível do mapa (${mapCap}), canConverge() é false pós-cap (gate ${gate13})`);
G.state.data.level = gate13; // nível hipotético/fora do mapa
ok(G.convergence.canConverge() === true, "canConverge() não tem trava de hard-cap: um nível hipotético igual ao gate 13 ainda converge (decisão aceita, não um bug)");

// 8) Legacy (+atk%/+hp% por convergence) intacto e independente da mudança de fórmula de pontos
store = {}; G.state.data = null; G.state.load();
G.state.data.convergences = 3;
ok(G.convergence.legacyAtkPct() === 3 * b.convLegacyAtkPct, "legacyAtkPct() escala linear com convergences × convLegacyAtkPct");
ok(G.convergence.legacyHpPct() === 3 * b.convLegacyHpPct, "legacyHpPct() escala linear com convergences × convLegacyHpPct");

// 9) integração REAL (sem mock): Deep Memory (nó 9, key convPointsPct) comprado pela árvore de
// verdade — respeitando a topologia (0 raiz -> 1 Regeneration -> 4 Hardened Light -> 9 Deep
// Memory) — precisa mesmo elevar convergence.points(). O teste #4 acima só prova que a FÓRMULA
// multiplica certo quando G.passives.effect é mockado; isto prova que o NÓ real está no índice
// certo, com a key certa, e que o gating não impede a compra de chegar até ele.
store = {}; G.state.data = null; G.state.load();
G.state.data.convergences = 1;
G.state.data.convergencePoints = 1e9;
G.state.data.level = 276; // == gate 1
ok(G.passives.nodes[9].key === "convPointsPct", "nó 9 é mesmo Deep Memory (key convPointsPct)");
const rawAtGate1 = G.convergence.rawPoints();
ok(G.convergence.points() === rawAtGate1, "sem Deep Memory comprado: points() == rawPoints() (convPointsPct inerte)");
ok(G.passives.buy(0) && G.passives.buy(1) && G.passives.buy(4) && G.passives.buy(9),
  "compra real da cadeia até Deep Memory (respeita canBuy em cada passo)");
const expectedWithNode = Math.floor(rawAtGate1 * (1 + G.passives.effect("convPointsPct") / 100));
ok(G.convergence.points() === expectedWithNode,
  `Deep Memory real (nível 1) eleva points() de ${rawAtGate1} para ${expectedWithNode} (obtido ${G.convergence.points()})`);
ok(G.convergence.points() > rawAtGate1, "points() com Deep Memory comprado > rawPoints() sem passiva nenhuma");

// 10) P8.4: converge() no MEIO do finale do Okhra limpa o estágio (senão `.okhra-manifest`
// e a maré ficam presos sobre a área 1 até o próximo spawn() — que pode nunca vir se pausado).
store = {}; G.state.data = null; G.state.load();
const realUi = G.ui;
let stageCalls = [];
G.ui = { setOkhraStage: (on) => stageCalls.push(on), onAreaChange() {}, renderAll() {}, log() {} };
G.state.data.areaIndex = G.data.areas.length - 1;
G.state.data.level = G.convergence.currentGate();
Object.assign(G.combat, { _okhraManifest: true, _tideTimer: 4.2, _tideRisen: true, _lastAreaIndex: G.data.areas.length - 1 });
const didFinale = G.convergence.converge();
G.ui = realUi;
ok(didFinale === true, "converge() executou com Okhra manifesto (nível >= gate)");
ok(G.combat._okhraManifest === false, "converge() no meio do finale: _okhraManifest desliga");
ok(G.combat._tideTimer === 0 && G.combat._tideRisen === false, "converge() no meio do finale: _tideTimer/_tideRisen zeram");
ok(stageCalls.indexOf(false) !== -1, "converge() no meio do finale: setOkhraStage(false) chamado (classe CSS não fica presa)");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
