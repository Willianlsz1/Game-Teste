// state.js — estado do jogo, stats derivados, save/load

G.state = {
  data: null,
  _cache: null,

  SAVE_KEY: "eclats_v5",   // P6: bump estrutural (Árvore I única). Sem migração de v4 — não há saves reais.
  _saveWarned: false,      // avisa 1x se localStorage falhar em runtime (quota etc.) e cair pro fallback em memória

  fresh() {
    return {
      level:           1,
      xp:              0,
      lumens:          0,
      hp:              0,
      areaIndex:       0,
      maxAreaUnlocked: 0,
      mapOneCleared:   false,
      highestLevel:    1,
      totalKills:      0,
      // ---- Convergence (prestige) ----
      convergencePoints: 0,
      convergences:      0,
      // contadores da RUN (resetam na Convergence) — fórmula de Pontos
      runKills:          0,
      runBosses:         0,
      runMaxAreaIndex:   0,
      // ---- Awaken ----
      awakens:           [],
      awakensUnlocked:   [],
      awakenTier:        0,
      // ---- Rarity Find (P8.1) ----
      // Marcos abatidos (idx da área do Harbinger) — cada 1ª morte levanta os caps em 1/6.
      // PERMANENTE: NÃO reseta na Convergence. Guardamos os ids p/ robustez de save.
      harbingersFelled:  [],
      // flags de onboarding: 1º spawn de cada tier / modificador já foi anunciado?
      rarityFirstSeen:   {},
      modifierFirstSeen: {},
      // ---- Passivas (Árvore I — árvore única binária de 15 nós) ----
      passives:          { tree1: new Array(15).fill(0) },
      // ---- Materiais (fundação econômica) ----
      gearMaterials:     { common: 0, uncommon: 0 },
      awakenMaterials:   { firstLight: 0 },
      equipped:        G.gear.freshSet(),
      lastSeen:        Date.now(),
    };
  },

  invalidateStats() { this._cache = null; },

  // flat × (1 + pct/100) × mult
  stats() {
    if (this._cache) return this._cache;
    const d = this.data;
    const L = {};
    const BD = {};   // breakdown: BD[stat] = [{ source, type, amount }]
    const layer = (k) => (L[k] || (L[k] = { flat: 0, pct: 0, mult: 1 }));
    const add = (stat, type, amount, source) => {
      const lay = layer(stat);
      if (type === "mult") { if (amount === 1) return; lay.mult *= amount; }
      else { if (!amount) return; lay[type] += amount; }
      (BD[stat] || (BD[stat] = [])).push({ source, type, amount });
    };

    // base + nível (separados p/ o breakdown: Base Game vs Character Level)
    // P9: curva de crescimento em lei de potência (era linear) — constantes em G.data.balance, ver tools/p9.
    const b = G.data.balance;
    add("atk", "flat", b.playerAtkBase, "Base");
    add("atk", "flat", b.playerAtkCoef * Math.pow(d.level, b.playerAtkExp), "Character Level");
    add("hp",  "flat", b.playerHpBase, "Base");
    add("hp",  "flat", b.playerHpCoef * Math.pow(d.level, b.playerHpExp), "Character Level");
    add("crit", "flat", 5, "Base");
    add("critDmg", "flat", 50, "Base");
    add("atkSpeed", "flat", G.data.balance.atkSpeedBase, "Base");
    add("lumensBonus", "flat", 10, "Base");
    add("lumensBonus", "flat", Math.min(G.data.balance.lumensLevelCap, d.level * G.data.balance.lumensLevelPerLevel), "Character Level");

    // equipment
    for (const slot of G.data.slots) {
      const item = d.equipped[slot.id];
      if (!item) continue;
      for (const af of item.affixes)
        add(af.stat, af.layer || "flat", G.gear.affixValue(item, af), "Equipment");
    }

    // Awaken (inerte na slice; sem breakdown por enquanto)
    if (G.awaken) G.awaken.applyTo(layer);

    // Convergence Legacy — bônus direto de atk%/hp% por convergence (no breakdown)
    if (G.convergence && G.convergence.legacyAtkPct) {
      add("atk", "pct", G.convergence.legacyAtkPct(), "Convergence Legacy");
      add("hp",  "pct", G.convergence.legacyHpPct(),  "Convergence Legacy");
    }

    // Passivas (Árvore I) — efeitos somam nas camadas; a coroa injeta mults ×(1+ringCloses%)
    let passEff = null;
    if (G.passives) {
      passEff = G.passives.effects();
      // P9 r5 (§9 var 15): First Spark (raiz) é ATK & HP FLAT por nível — o SOCO de entrada.
      // Forte nas convs 1–5 (~30–50% do ATK total), dilui no late DE PROPÓSITO (galhos % assumem).
      // Bônus de UI: Passives passa a aparecer na coluna PRIMARY do breakdown.
      add("atk", "flat", passEff.firstSpark || 0, "Passives");
      add("hp",  "flat", passEff.firstSpark || 0, "Passives");
      add("atk", "pct",  passEff.atkPct   || 0, "Passives");
      add("hp",  "pct",  passEff.hpPct    || 0, "Passives");
      add("crit", "flat", passEff.critRate || 0, "Passives");
      add("critDmg", "flat", passEff.critDmg || 0, "Passives");
      add("damageReduction", "flat", passEff.damageReduction || 0, "Passives");
      add("lightbane", "flat", passEff.lightbane || 0, "Passives");
      add("healOnKill", "flat", passEff.healOnKill || 0, "Passives");
      add("hpRegen", "flat", passEff.hpRegen || 0, "Passives");
      add("xpBonus", "flat", passEff.xpPct || 0, "Passives");
      // coroa "The Ring Closes": bônus multiplicativo pequeno em ATK, HP, Lumens e XP
      const crown = 1 + (passEff.ringCloses || 0) / 100;
      add("atk", "mult", crown, "Passives");
      add("hp",  "mult", crown, "Passives");
      add("lumensBonus", "mult", crown, "Passives");
      add("xpBonus", "mult", crown, "Passives");
    }

    const fin = (k) => { const x = layer(k); return x.flat * (1 + x.pct / 100) * x.mult; };

    // Rarity Find (P8.1): chance de gear (rarityFind, fração 0-1) e teto dos Marcos (rarityCaps).
    // Cada Harbinger abatido levanta 1/6 do teto (capMax/6), clampado no máximo. Fração p/ chance().
    // P9 r4 (§9 item 3): DOIS regimes de cap — pré-First Light (Corona 0, não existe) vs pós
    //   (worldKindles revela o Corona e abre os caps). O regime é escolhido pelo awaken.
    const felled = (d.harbingersFelled && d.harbingersFelled.length) || 0;
    const awakened = !!(G.awaken && G.awaken.isDone("first_light"));
    const rcMax = awakened ? G.data.rarityCapsAwakened : G.data.rarityCaps;
    const capFrac = (max) => Math.min(max, felled * (max / 6)) / 100;

    this._cache = {
      atk:              Math.round(fin("atk")),
      hp:               Math.round(fin("hp")),
      crit:             G.util.clamp(fin("crit"), 0, 100),
      critRaw:          Math.max(0, fin("crit")),   // crit sem teto — o excesso acima de 100 vira golpe duplo (Overcrit)
      critDmg:          fin("critDmg"),
      critMult:         1 + fin("critDmg") / 100,
      atkSpeed:         G.util.softCap(fin("atkSpeed"), this.currentAtkSpeedSoft(), this.currentAtkSpeedCap()),
      xpBonus:          fin("xpBonus"),
      lumensBonus:      fin("lumensBonus"),
      damageReduction:  G.util.clamp(fin("damageReduction"), 0, G.data.balance.dmgReductionCap),  // gear (Steadfast Guard) + passiva (Hardened Light)
      lightbane:        fin("lightbane"),             // passiva (Lightbane): +% dano vs acesos
      specialDmg:       fin("specialDmg"),            // sem fonte no Mapa 1 (afixo removido); chave viva p/ o Mapa 2
      cleave:           G.util.clamp(fin("cleave"), 0, 25),        // gear (Riven Edge): % do overkill transferido ao próximo vivo
      bulwark:          G.util.clamp(fin("bulwark"), 0, G.data.balance.dmgReductionCap),  // gear (Last Vessel): dmgRed extra abaixo de 35% HP
      overcrit:         G.util.clamp(fin("overcrit"), 0, 30),      // gear (Fracture Sense): teto de chance de golpe duplo (crit acima de 100)
      momentum:         Math.max(0, fin("momentum")),              // gear (Momentum): +atkSpeed% por stack de kill
      // P9 r4 — afixos novos: Twice-Gilded (Lumens 2×), Fortune's Torrent (Lumens 4×), Hollowing Light (−HP% do mob)
      twiceGilded:      G.util.clamp(fin("twiceGilded"),    0, G.data.balance.twiceGildedCap),
      fortuneTorrent:   G.util.clamp(fin("fortuneTorrent"), 0, G.data.balance.fortuneTorrentCap),
      hollowing:        G.util.clamp(fin("hollowing"),      0, G.data.balance.hollowingCap),
      rarityFindLumen:  fin("rarityFindLumen"),       // % Lumen do gear (Second Sight)
      rarityFindEmber:  fin("rarityFindEmber"),       // % Ember do gear (Ember Trail)
      rarityFindCorona: fin("rarityFindCorona"),      // % Corona do gear (Corona Call)
      // P8.1: chance efetiva (gear) e teto (Marcos) por tier, em fração 0-1 p/ o roll do combat
      rarityFind: {
        ember:  Math.max(0, fin("rarityFindEmber"))  / 100,
        lumen:  Math.max(0, fin("rarityFindLumen"))  / 100,
        corona: Math.max(0, fin("rarityFindCorona")) / 100,
      },
      rarityCaps: {
        ember:  capFrac(rcMax.ember),
        lumen:  capFrac(rcMax.lumen),
        corona: capFrac(rcMax.corona),
      },
      healOnKill:       fin("healOnKill"),
      hpRegen:          fin("hpRegen"),
      _layers:          L,
      _breakdown:       BD,
    };
    return this._cache;
  },

  maxHp()              { return this.stats().hp; },
  currentAtkSpeedCap() { return this.data.mapOneCleared ? G.data.balance.map2AtkSpeedCap : G.data.balance.map1AtkSpeedCap; },
  currentAtkSpeedSoft() { return this.currentAtkSpeedCap() * G.data.balance.atkSpeedSoftFrac; },
  attackInterval()     { return G.util.clamp(1 / this.stats().atkSpeed, 1 / this.currentAtkSpeedCap(), 5); },
  xpToNext()           { return Math.ceil(G.data.balance.xpCurveBase * Math.pow(this.data.level, G.data.balance.xpCurveExp)); },

  // save/load — fallback em memória quando localStorage está bloqueado (file://)
  _mem: {},
  _hasLS: null,

  storageOk() {
    if (this._hasLS !== null) return this._hasLS;
    try { localStorage.setItem("__t__", "1"); localStorage.removeItem("__t__"); this._hasLS = true; }
    catch (e) { this._hasLS = false; }
    return this._hasLS;
  },

  save() {
    this.data.lastSeen = Date.now();
    const json = JSON.stringify(this.data);
    if (this.storageOk()) {
      try { localStorage.setItem(this.SAVE_KEY, json); }
      catch (e) {
        this._mem[this.SAVE_KEY] = json;
        if (!this._saveWarned) {
          this._saveWarned = true;
          if (G.ui && G.ui.log) G.ui.log("Warning: could not write save to browser storage, progress is kept in memory only.", "bad");
        }
      }
    } else this._mem[this.SAVE_KEY] = json;
  },

  load() {
    let loaded = null;
    try {
      const raw = this.storageOk()
        ? localStorage.getItem(this.SAVE_KEY)
        : this._mem[this.SAVE_KEY];
      if (raw) loaded = JSON.parse(raw);
    } catch (e) { loaded = null; }

    this.data = Object.assign(this.fresh(), loaded || {});
    this.data.equipped = G.gear.reconcile(this.data.equipped);
    if (G.economy) G.economy.reconcile(this.data);

    // Mapa 1 cresceu de 9 → 18 áreas (P1). Saves antigos podem trazer mapOneCleared=true
    // (mapa velho de 9 áreas concluído), mas o mapa novo (Okhra, última área) não foi batido.
    // Sem isto, o jogador herdaria o teto de atkSpeed de mapa 2 cedo demais e a mensagem
    // de "Map 1 complete" nunca voltaria a disparar ao derrotar Okhra de verdade.
    if (this.data.mapOneCleared && (this.data.maxAreaUnlocked || 0) < G.data.areas.length - 1)
      this.data.mapOneCleared = false;

    // P9 r4: highestLevel (Light Remembers) — saves antigos sem o campo inicializam do nível atual
    // (Object.assign com fresh() deixa 1; se o jogador já subiu, ancora no nível salvo).
    if (typeof this.data.highestLevel !== "number" || this.data.highestLevel < this.data.level)
      this.data.highestLevel = this.data.level || 1;

    // Awaken: garante a lista canônica e o tier em saves antigos
    if (!Array.isArray(this.data.awakens)) this.data.awakens = [];
    this.data.awakensUnlocked = this.data.awakens;
    if (typeof this.data.awakenTier !== "number" || this.data.awakenTier < this.data.awakens.length)
      this.data.awakenTier = this.data.awakens.length;

    // Passivas (Árvore I): preserva níveis salvos por índice, clampando ao teto do nó.
    // Number.isFinite barra lixo não-numérico do save — um NaN aqui fica preso no array
    // (buy() faz += 1) e drena pontos sem o nó nunca subir de nível.
    if (G.passives) {
      const arr = G.passives.freshSet();
      const saved = this.data.passives;
      if (saved && Array.isArray(saved.tree1))
        for (let i = 0; i < arr.length; i++) {
          const v = Math.floor(Number(saved.tree1[i]));
          arr[i] = Number.isFinite(v) ? Math.max(0, Math.min(v, G.passives.nodeMax(i))) : 0;
        }
      this.data.passives = { tree1: arr };
    }

    this.invalidateStats();
    const hp = Number(this.data.hp);
    this.data.hp = (Number.isFinite(hp) && hp > 0) ? hp : this.maxHp();
    return !!loaded;
  },

  reset() {
    if (this.storageOk()) try { localStorage.removeItem(this.SAVE_KEY); } catch (e) {}
    delete this._mem[this.SAVE_KEY];
    this.data = this.fresh();
    this.invalidateStats();
    this.data.hp = this.maxHp();
  },
};
