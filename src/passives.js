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
  unlockByDepth: [80, 120, 200, 350],
  evoFactor: 0.4, evoRamp: 1.5,

  // ================= MAGNITUDES POR NÍVEL (UNIT) =================
  // apenas o que a Árvore I usa. ringCloses = bônus da coroa (aplicado 1× ao acender).
  // Magnitudes finais = sugeridas do framework × ESCALA GLOBAL ~1.25 (a grade do P6
  // ajustou a escala p/ os âncoras do P5 segurarem com a Árvore I dentro — ver relatório).
  UNIT: {
    firstSpark:     2.5,   // raiz — +% ATK e +% HP por nível (efeito duplo)
    hpRegen:        0.5,   // % do HP máx regenerado por segundo
    healOnKill:     2.5,   // % do HP máx curado por kill
    hpPct:            5,   // +% HP por nível
    damageReduction: 1.25, // +% redução de dano por nível (fonte passiva NOVA)
    atkPct:           5,   // +% ATK por nível
    critRate:       2.5,   // +% chance de crítico por nível
    lumensPct:       10,   // +% Lumens por nível
    xpPct:          7.5,   // +% XP por nível
    convPointsPct:    6,   // +% Pontos de Convergence por nível (Deep Memory)
    overkillEcho:    12,   // dano excedente do golpe fatal → Lumens extra (mecânica NOVA)
    critDmg:         18,   // +% dano crítico por nível
    lightbane:       10,   // +% dano vs acesos (rares & elites, não boss) — NOVO
    atkSpeed:     0.037,   // +atkSpeed flat por nível (soft cap cuida do resto)
    bossDmg:         12,   // +% dano vs Marcos (Harbinger's Bane) — chave existente
    ringCloses:      18,   // COROA — ×(1+18/100) em ATK, HP, Lumens e XP (aplicado 1×)
    _default: 0,
  },

  // efeitos LIVE (têm alvo no motor de stats). ringCloses é injetado à parte.
  LIVE: ["firstSpark", "hpPct", "damageReduction", "atkPct", "critRate",
         "lumensPct", "xpPct", "critDmg", "lightbane", "atkSpeed",
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
    { name: "Prospector's Eye", key: "lumensPct",       parent: 3,  depth: 4 }, // 7  folha
    { name: "Pilgrim's Wisdom", key: "xpPct",           parent: 3,  depth: 4 }, // 8  folha
    { name: "Deep Memory",      key: "convPointsPct",   parent: 4,  depth: 4 }, // 9  folha
    { name: "Overkill Echo",    key: "overkillEcho",    parent: 4,  depth: 4 }, // 10 folha
    { name: "Deepcrack",        key: "critDmg",         parent: 5,  depth: 4 }, // 11 folha
    { name: "Lightbane",        key: "lightbane",       parent: 5,  depth: 4 }, // 12 folha
    { name: "Quickened Pulse",  key: "atkSpeed",        parent: 6,  depth: 4 }, // 13 folha
    { name: "Harbinger's Bane", key: "bossDmg",         parent: 6,  depth: 4 }, // 14 folha
  ],
  CROWN: { name: "The Ring Closes", key: "ringCloses" },

  // índices das 8 folhas (depth 4) — acender todas concede a coroa
  leaves() {
    const out = [];
    for (let i = 0; i < this.nodes.length; i++) if (this.nodes[i].depth === 4) out.push(i);
    return out;
  },

  EFFECT_DESC: {
    firstSpark:      "The first ember, raises both ATK and HP.",
    hpRegen:         "Regenerates % of max HP per second.",
    healOnKill:      "Restores % of max HP on each kill.",
    hpPct:           "Increases your HP.",
    damageReduction: "Reduces the damage you take.",
    atkPct:          "Increases your ATK.",
    critRate:        "Increases your critical chance.",
    lumensPct:       "Increases Lumens gained.",
    xpPct:           "Increases XP gained.",
    convPointsPct:   "Increases Convergence Points earned.",
    overkillEcho:    "Damage spilled past a killing blow returns as extra Lumens.",
    critDmg:         "Increases your critical damage.",
    lightbane:       "Deals more damage to the kindled (rares & elites).",
    atkSpeed:        "Increases your attack speed.",
    bossDmg:         "Increases damage dealt to Harbingers & Bosses.",
    ringCloses:      "The ring closes, a lasting boost to ATK, HP, Lumens and XP.",
  },

  // posição de cada nó (%x,%y) na Árvore-Mundo: raiz embaixo, folhas na copa,
  // coroa como 16º marcador no topo. Topologia 1/2/4/8 espelhada nos filhos.
  POSITIONS: [
    { x: 50, y: 84 },                                    // 0 raiz
    { x: 26, y: 65 }, { x: 74, y: 65 },                  // 1,2 D2
    { x: 13, y: 46 }, { x: 38, y: 46 }, { x: 62, y: 46 }, { x: 87, y: 46 },  // 3-6 D3
    { x: 4, y: 25 }, { x: 17, y: 25 }, { x: 30, y: 25 }, { x: 43, y: 25 },   // 7-10 folhas
    { x: 57, y: 25 }, { x: 70, y: 25 }, { x: 83, y: 25 }, { x: 96, y: 25 },  // 11-14 folhas
  ],
  CROWN_POS: { x: 50, y: 7 },

  // ---- estado / metadados de nó ----
  freshSet() { return new Array(15).fill(0); },
  unlocked() { return (G.state.data.convergences || 0) >= 1; },
  level(i) {
    const p = G.state.data.passives;
    return (p && p.tree1 && p.tree1[i]) || 0;
  },
  keyOf(i) { return this.nodes[i].key; },
  depthOf(i) { return this.nodes[i].depth; },
  parentOf(i) { return this.nodes[i].parent; },
  nodeMax() { return this.maxLevel; },
  isMax(i) { return this.level(i) >= this.maxLevel; },
  parentBought(i) { const p = this.nodes[i].parent; return p === -1 || this.level(p) >= 1; },

  // ---- custo / gating ----
  unlockCost(i) { return this.unlockByDepth[this.nodes[i].depth - 1]; },
  nextCost(i) {
    const lv = this.level(i);
    if (lv === 0) return this.unlockCost(i);
    return Math.ceil(this.unlockCost(i) * this.evoFactor * Math.pow(this.evoRamp, lv - 1));
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

  // texto da magnitude real de um nó (p/ o tooltip): { perLevel, current }
  magnitude(i) {
    const key = this.nodes[i].key;
    const per = this.unit(key);
    const FMT = {
      firstSpark:      (v) => `+${v}% ATK & HP`,
      hpRegen:         (v) => `+${v}% max HP / s`,
      healOnKill:      (v) => `+${v}% max HP on kill`,
      hpPct:           (v) => `+${v}% HP`,
      damageReduction: (v) => `+${v}% Damage Reduction`,
      atkPct:          (v) => `+${v}% ATK`,
      critRate:        (v) => `+${v}% Crit Rate`,
      lumensPct:       (v) => `+${v}% Lumens`,
      xpPct:           (v) => `+${v}% XP`,
      convPointsPct:   (v) => `+${v}% Convergence Points`,
      overkillEcho:    (v) => `+${v}% of overkill as Lumens`,
      critDmg:         (v) => `+${v}% Crit Damage`,
      lightbane:       (v) => `+${v}% vs kindled`,
      atkSpeed:        (v) => `+${v} Attack Speed`,
      bossDmg:         (v) => `+${v}% vs Harbingers`,
    };
    const fmt = FMT[key];
    if (!fmt || per === 0) return null;
    const r = (x) => +(+x).toFixed(2);
    const lvl = this.level(i);
    return { perLevel: fmt(r(per)), current: lvl > 0 ? fmt(r(per * lvl)) : null };
  },

  // ---- progresso (UI/sim) ----
  treeProgress() {
    const arr = (G.state.data.passives && G.state.data.passives.tree1) || [];
    let unlocked = 0, maxed = 0, levels = 0;
    for (let i = 0; i < this.nodes.length; i++) {
      const lv = arr[i] || 0;
      levels += lv;
      if (lv > 0) unlocked++;
      if (lv >= this.maxLevel) maxed++;
    }
    return { unlocked, maxed, levels, total: this.nodes.length, crown: this.crownActive() };
  },
};
