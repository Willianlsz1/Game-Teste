// =============================================================
// passives.js — Árvore I (Mapa 1) · árvore ÚNICA binária de 15 nós
// =============================================================
// P6 (jul/2026): as 3 árvores paralelas (Éclat/Vestige/Fracture) MORRERAM.
// Entra a Árvore I: 1 raiz → 2 → 4 → 8 folhas (=15 nós), abre-ao-comprar
// (um filho fica comprável quando o pai tem nível ≥1), maxLevel 10 por nó.
//
// Coroa "The Ring Closes": AUTO-CONCEDIDA (não comprável) quando as 8 folhas
// têm nível ≥1 — bônus multiplicativo pequeno em ATK, HP, Lumens e XP. É
// permanente na prática (folhas não des-compram). Marca "Árvore I completa".
//
// Cada nó declara um EFEITO (chave semântica) com magnitude configurável (UNIT).
// Árvore II (Mapa 2) traz versões amplificadas + poucas novas — fora de escopo.

G.passives = {
  maxLevel: 10,

  // ---- gating / custo ----
  // custo de UNLOCK (1º nível) por PROFUNDIDADE do nó (D1..D4). Upgrades por nível
  // seguem o padrão geométrico: unlock × evoFactor × evoRamp^(nível-1).
  // P9 r4: tools/p9 — não editar à mão, re-fitar (era [100,220,500,1200] / evoFactor 0.5 / evoRamp 1.7;
  // antes disso [80,120,200,350] / evoFactor 0.4 / evoRamp 1.5). unlockByDepth escalado ×0.85 (r4 var 8).
  unlockByDepth: [85, 187, 425, 1020],
  evoFactor: 0.45, evoRamp: 1.6,

  // ================= MAGNITUDES POR NÍVEL (UNIT) =================
  // apenas o que a Árvore I usa. ringCloses = bônus da coroa (aplicado 1× ao acender).
  // P9 (tools/p9): ×3 nas chaves de stat antigas (firstSpark, hpRegen, healOnKill, hpPct,
  // damageReduction, atkPct, critRate, xpPct, convPointsPct, overkillEcho, critDmg,
  // lightbane, bossDmg, ringCloses) + ×2 EXTRA (total ×6) nas ofensivas
  // (firstSpark, atkPct, critRate, critDmg, lightbane). goldenWake/executioner (folhas
  // novas P9) e o resto ficam só no ×3. Não editar à mão, re-fitar via tools/p9.
  UNIT: {
    firstSpark:     4000,  // raiz — +ATK e +HP FLAT por nível (P9 r4/r5: tools/p9 — não editar à mão, re-fitar; o SOCO de entrada, ~30–50% do ATK nas convs 1–5)
    hpRegen:        0.25,  // % do HP máx regenerado por segundo (P9 r4: tools/p9 — não editar à mão, re-fitar; era 1.5)
    healOnKill:      1.5,  // % do HP máx curado por kill (P9 r4: tools/p9 — não editar à mão, re-fitar; era 7.5)
    hpPct:           15,   // +% HP por nível
    damageReduction: 3.75, // +% redução de dano por nível (fonte passiva NOVA)
    atkPct:          60,   // +% ATK por nível (P9 r4: tools/p9 — não editar à mão, re-fitar; era 45)
    critRate:         2,   // +% chance de crítico por nível (P9 v8: era 15)
    goldenWake:     1.0,   // P9 r6 (§9 var 18): +1%/nível de chance de Lumens 15× (jackpot, topo da escada 15×→4×→2×; cap 10% = 10 níveis)
    xpPct:           70,   // P9 r6 (§9 var 19): +70% XP por nível GORDO (Pilgrim = 5 níveis; banda de fit 60–80)
    convPointsPct:   18,   // +% Pontos de Convergence por nível (Deep Memory)
    overkillEcho:    36,   // dano excedente do golpe fatal → Lumens extra (mecânica NOVA)
    critDmg:        108,   // +% dano crítico por nível
    lightbane:       60,   // +% dano vs acesos (rares & elites, não boss) — NOVO
    executioner:    0.8,   // P9 — inimigo não-boss abaixo de X% do HP máx morre (folha 13; máx 8% = cap Mapa 1)
    bossDmg:         36,   // +% dano vs Marcos (Harbinger's Bane) — chave existente
    ringCloses:     300,   // COROA — ×(1+300/100) em ATK, HP, Lumens e XP (aplicado 1×) (P9 r4 §9 var 17: tools/p9 — não editar à mão, re-fitar; era 54)
    _default: 0,
  },

  // efeitos LIVE (têm alvo no motor de stats). ringCloses é injetado à parte.
  // goldenWake/executioner são mecânicas de COMBATE (combat.js), não camada de stat — fora daqui.
  LIVE: ["firstSpark", "hpPct", "damageReduction", "atkPct", "critRate",
         "xpPct", "critDmg", "lightbane",
         "hpRegen", "healOnKill"],

  // ---- topologia: nodes[i] = { name, key, parent (índice, -1 = raiz), depth } ----
  // 0=raiz · 1,2=D2 · 3..6=D3 · 7..14=D4 (folhas). Binária: cada nó tem 2 filhos.
  nodes: [
    { name: "First Spark",      key: "firstSpark",      parent: -1, depth: 1 }, // 0 raiz
    { name: "Regeneration",     key: "hpRegen",         parent: 0,  depth: 2 }, // 1  sustain: Provisão
    { name: "Heal on Kill",     key: "healOnKill",      parent: 0,  depth: 2 }, // 2  sustain: Caça
    { name: "Vessel's Growth",  key: "hpPct",           parent: 1,  depth: 3 }, // 3  Provisão
    { name: "Hardened Light",   key: "damageReduction", parent: 1,  depth: 3 }, // 4  Provisão
    { name: "Whetted Light",    key: "atkPct",          parent: 2,  depth: 3 }, // 5  Caça
    { name: "Bare Instinct",    key: "critRate",        parent: 2,  depth: 3 }, // 6  Caça
    { name: "Golden Wake",      key: "goldenWake",      parent: 3,  depth: 4 }, // 7  folha (P9 r6 var 18 — jackpot Lumens 15×)
    // P9 r6 (var 19): Pilgrim = 5 níveis GORDOS (+70%/nível). costMult mantém o custo TOTAL do
    // nó ≈ igual ao de 10 níveis (com evoFactor/evoRamp do src: total10 ≈ 85×unlock → costMult 16).
    { name: "Pilgrim's Wisdom", key: "xpPct",           parent: 3,  depth: 4, maxLevel: 5, costMult: 16 }, // 8  folha
    { name: "Deep Memory",      key: "convPointsPct",   parent: 4,  depth: 4 }, // 9  folha
    { name: "Overkill Echo",    key: "overkillEcho",    parent: 4,  depth: 4 }, // 10 folha
    { name: "Deepcrack",        key: "critDmg",         parent: 5,  depth: 4 }, // 11 folha
    { name: "Lightbane",        key: "lightbane",       parent: 5,  depth: 4 }, // 12 folha
    { name: "Executioner's Light", key: "executioner",  parent: 6,  depth: 4 }, // 13 folha (P9 — execute abaixo do limiar)
    { name: "Harbinger's Bane", key: "bossDmg",         parent: 6,  depth: 4 }, // 14 folha
  ],
  CROWN: { name: "The Ring Closes", key: "ringCloses" },

  // índices das 8 folhas (depth 4) — acender todas concede a coroa
  leaves() {
    const out = [];
    for (let i = 0; i < this.nodes.length; i++) if (this.nodes[i].depth === 4) out.push(i);
    return out;
  },

  // lore lines por nó (copy aprovada — literal). Índice 15 = coroa.
  LORE: [
    "Every dawn the world has ever known began as one refusal to go dark.", // 0
    "The light does not hurry. It returns.",                                // 1
    "What the hunt takes, the hunter keeps.",                               // 2
    "A vessel is not measured by what it holds, but by what it can bear.",  // 3
    "Light, folded enough times, learns to be a wall.",                     // 4
    "The light does not cut because it is sharp. It cuts because it has decided to.", // 5
    "Before there were eyes, something already knew where to strike.",      // 6
    "Where the light passes, the world pays fifteenfold.",                  // 7  (P9 r6 var 18)
    "Every road remembers the ones who walked it burning.",                 // 8
    "The ring keeps what the flesh forgets.",                               // 9
    "No blow is wasted. The excess sings back as gold.",                    // 10
    "Every wound has a bottom. Reach it.",                                  // 11
    "The kindled burn brighter, and fall harder.",                         // 12
    "Mercy, delivered at the speed of light.",                             // 13
    "Crowns break. The light remembers how.",                              // 14
  ],
  CROWN_LORE: "What was broken above the world closes here, in you.",

  // arte por nó: sprite solto (png com alpha, sem disco/borda) ou null (sem sprite ainda —
  // nó mostra o anel-placeholder). Só o nó 0 tem sprite hoje; os outros 14 chegam 1/semana.
  ICONS: [
    "assets/passives/pv_1.png", // 0 First Spark
    "assets/passives/pv_2.png", // 1 Regeneration
    "assets/passives/pv_3.png", // 2 Heal on Kill
    "assets/passives/pv_4.png", // 3 Vessel's Growth
    "assets/passives/pv_5.png", // 4 Hardened Light
    "assets/passives/pv_6.png", // 5 Whetted Light
    "assets/passives/pv_7.png", // 6 Bare Instinct
    "assets/passives/pv_8.png", // 7 Golden Wake
    "assets/passives/pv_9.png", // 8 Pilgrim's Wisdom
    "assets/passives/pv_10.png", // 9 Deep Memory
    "assets/passives/pv_11.png", // 10 Overkill Echo
    "assets/passives/pv_12.png", // 11 Deepcrack
    "assets/passives/pv_13.png", // 12 Lightbane
    "assets/passives/pv_14.png", // 13 Executioner's Light
    "assets/passives/pv_15.png", // 14 Harbinger's Bane
  ],
  CROWN_ICON: "assets/passives/pv_16.png",

  iconOf(i) { return this.ICONS[i] || null; },
  loreOf(i) { return this.LORE[i] || ""; },

  EFFECT_DESC: {
    firstSpark:      "The first ember, raises both ATK and HP.",
    hpRegen:         "Regenerates % of max HP per second.",
    healOnKill:      "Restores % of max HP on each kill.",
    hpPct:           "Increases your HP.",
    damageReduction: "Reduces the damage you take.",
    atkPct:          "Increases your ATK.",
    critRate:        "Increases your critical chance.",
    goldenWake:      "Each kill has a chance to drop fifteenfold Lumens.",
    xpPct:           "Increases XP gained.",
    convPointsPct:   "Increases Convergence Points earned.",
    overkillEcho:    "Damage spilled past a killing blow returns as extra Lumens.",
    critDmg:         "Increases your critical damage.",
    lightbane:       "Deals more damage to the kindled (rares & elites).",
    executioner:     "Strikes fell any lesser enemy below a fraction of its health.",
    bossDmg:         "Increases damage dealt to Harbingers & Bosses.",
    ringCloses:      "The ring closes, a lasting boost to ATK, HP, Lumens and XP.",
  },

  // posição de cada nó (%x,%y) na Árvore-Mundo: raiz embaixo, folhas na copa,
  // coroa como 16º marcador no topo. Topologia 1/2/4/8 espelhada nos filhos.
  // % relativos ao RETÂNGULO DA IMAGEM (não à viewport) — o stage é a imagem em modo
  // cover, então os nós assentam no lugar certo em qualquer proporção de janela.
  // Posições finais do dono (bake do design aprovado).
  POSITIONS: [
    { x: 50.0, y: 84.5 },                                          // 0  First Spark (raiz)
    { x: 44.0, y: 75.5 }, { x: 55.5, y: 74.5 },                    // 1  Regeneration · 2 Heal on Kill (D2)
    { x: 33.7, y: 52.9 }, { x: 44.3, y: 57.8 }, { x: 59.4, y: 58.2 }, { x: 71.6, y: 55.8 }, // 3-6 D3
    { x: 20.8, y: 44.4 }, { x: 27.1, y: 35.6 }, { x: 37.0, y: 40.0 }, { x: 45.5, y: 35.5 }, // 7-10 folhas
    { x: 54.5, y: 35.5 }, { x: 63.0, y: 40.0 }, { x: 72.9, y: 35.6 }, { x: 79.2, y: 44.4 }, // 11-14 folhas
  ],
  CROWN_POS: { x: 50.0, y: 26.0 },
  // split decorativo (soquete pintado sem nó, a estrela do tronco) onde o galho bifurca
  // para os nós 1 e 2 — waypoint puramente visual da curva, não é um nó comprável.
  SPLIT_POS: { x: 50.0, y: 71.0 },

  // ---- estado / metadados de nó ----
  freshSet() { return new Array(15).fill(0); },
  unlocked() { return (G.state.data.convergences || 0) >= 1; },
  level(i) {
    const p = G.state.data.passives;
    return (p && p.tree1 && p.tree1[i]) || 0;
  },
  parentOf(i) { return this.nodes[i].parent; },
  // P9 r6 (var 19): maxLevel POR NÓ — nodes[i].maxLevel opcional (default = maxLevel global 10).
  // Pilgrim's Wisdom = 5 níveis gordos.
  nodeMax(i) { const n = this.nodes[i]; return (n && n.maxLevel) || this.maxLevel; },
  isMax(i) { return this.level(i) >= this.nodeMax(i); },
  parentBought(i) { const p = this.nodes[i].parent; return p === -1 || this.level(p) >= 1; },

  // ---- custo / gating ----
  unlockCost(i) { return this.unlockByDepth[this.nodes[i].depth - 1]; },
  // nodes[i].costMult (opcional, default 1): multiplica os UPGRADES (não o unlock) — usado por
  // nós de menos níveis pra manter o custo TOTAL ≈ igual ao de 10 níveis (var 19).
  nextCost(i) {
    const lv = this.level(i);
    if (lv === 0) return this.unlockCost(i);
    const cm = this.nodes[i].costMult || 1;
    return Math.ceil(this.unlockCost(i) * this.evoFactor * cm * Math.pow(this.evoRamp, lv - 1));
  },
  canBuy(i) {
    return this.unlocked() && !this.isMax(i) && this.parentBought(i) &&
      (G.state.data.convergencePoints || 0) >= this.nextCost(i);
  },
  buy(i) {
    if (!this.canBuy(i)) return false;
    G.state.data.convergencePoints -= this.nextCost(i);
    G.state.data.passives.tree1[i] += 1;
    G.state.invalidateStats();
    G.state.save();
    return true;
  },

  // ---- coroa ----
  crownActive() {
    const leaves = this.leaves();
    for (let k = 0; k < leaves.length; k++) if (this.level(leaves[k]) < 1) return false;
    return true;
  },

  // ================= EFEITOS =================
  unit(key) { return this.UNIT[key] != null ? this.UNIT[key] : this.UNIT._default; },
  effects() {
    const out = {};
    for (let i = 0; i < this.nodes.length; i++) {
      const lv = this.level(i);
      if (!lv) continue;
      const key = this.nodes[i].key;
      out[key] = (out[key] || 0) + lv * this.unit(key);
    }
    if (this.crownActive()) out.ringCloses = this.unit("ringCloses");
    return out;
  },
  effect(key) { return this.effects()[key] || 0; },

  // formatação textual por chave de efeito (usada pelo tooltip por-nó E pelo painel
  // agregado Tree Blessings). Fonte única — nunca duplicar este mapa.
  EFFECT_FMT: {
    firstSpark:      (v) => `+${G.util.fmt(v)} ATK & HP`,   // P9 r5 (var 15): FLAT, não %
    hpRegen:         (v) => `+${v}% max HP / s`,
    healOnKill:      (v) => `+${v}% max HP on kill`,
    hpPct:           (v) => `+${v}% HP`,
    damageReduction: (v) => `+${v}% Damage Reduction`,
    atkPct:          (v) => `+${v}% ATK`,
    critRate:        (v) => `+${v}% Crit Rate`,
    goldenWake:      (v) => `+${v}% fifteenfold Lumens chance`,   // P9 r6 (var 18): jackpot 15×
    xpPct:           (v) => `+${v}% XP`,
    convPointsPct:   (v) => `+${v}% Convergence Points`,
    overkillEcho:    (v) => `+${v}% of overkill as Lumens`,
    critDmg:         (v) => `+${v}% Crit Damage`,
    lightbane:       (v) => `+${v}% vs kindled`,
    executioner:     (v) => `execute below ${v}% HP`,
    bossDmg:         (v) => `+${v}% vs Harbingers`,
    ringCloses:      (v) => `+${v}% ATK, HP, Lumens & XP`,
  },

  // texto da magnitude real de um nó (p/ o tooltip): { perLevel, current }
  magnitude(i) {
    const key = this.nodes[i].key;
    const per = this.unit(key);
    const fmt = this.EFFECT_FMT[key];
    if (!fmt || per === 0) return null;
    const r = (x) => +(+x).toFixed(2);
    const lvl = this.level(i);
    return { perLevel: fmt(r(per)), current: lvl > 0 ? fmt(r(per * lvl)) : null,
      next: fmt(r(per * (lvl + 1))) };
  },

  // nome legível de uma chave de efeito (p/ o painel Tree Blessings — reusa EFFECT_DESC
  // como fallback do nome do nó dono da chave, já que 1 chave = 1 nó nesta árvore).
  effectLabel(key) {
    for (let i = 0; i < this.nodes.length; i++) if (this.nodes[i].key === key) return this.nodes[i].name;
    if (key === "ringCloses") return this.CROWN.name;
    return key;
  },

  // soma agregada de TODOS os bônus concedidos pelos níveis já comprados, formatada
  // no mesmo padrão de texto do tooltip. Usado pelo painel "Tree Blessings" (UI).
  // Retorna [{ key, label, text }], só com chaves de valor não-zero.
  blessingsSummary() {
    const eff = this.effects();
    const out = [];
    for (const key in eff) {
      const v = eff[key];
      if (!v) continue;
      const fmt = this.EFFECT_FMT[key];
      if (!fmt) continue;
      const r = +(+v).toFixed(2);
      out.push({ key, label: this.effectLabel(key), text: fmt(r) });
    }
    return out;
  },

  // ---- progresso (UI/sim) ----
  // consumidor: tools/sim.js e tests/ apenas (G.passives.treeProgress) — mantido aqui por decisão do lote 2
  treeProgress() {
    const arr = (G.state.data.passives && G.state.data.passives.tree1) || [];
    let unlocked = 0, maxed = 0, levels = 0;
    for (let i = 0; i < this.nodes.length; i++) {
      const lv = arr[i] || 0;
      levels += lv;
      if (lv > 0) unlocked++;
      if (lv >= this.nodeMax(i)) maxed++;
    }
    // maxLevels = Σ nodeMax(i) — P9 r6 (var 19): com maxLevel por nó, o denominador do "% da
    // árvore" deixa de ser total×10 (consumidores: sim/tests usam prog.maxLevels).
    let maxLevels = 0;
    for (let i = 0; i < this.nodes.length; i++) maxLevels += this.nodeMax(i);
    return { unlocked, maxed, levels, maxLevels, total: this.nodes.length, crown: this.crownActive() };
  },
};
