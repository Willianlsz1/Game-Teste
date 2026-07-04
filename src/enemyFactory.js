// enemyFactory.js — construção de inimigos e parâmetros da onda. Extraído de combat.js.
// Pool de mobs, tamanho da onda, thresholds de boss, e o builder individual (_buildOne).
// combat.spawn / combat._tideRise consomem daqui via G.enemyFactory.

G.enemyFactory = {
  // pool de mobs da área atual (acumula só as áreas do mesmo tema, até a atual)
  enemyPool() {
    const areas = G.data.areas;
    const idx   = G.util.clamp(G.state.data.areaIndex || 0, 0, areas.length - 1);
    const theme = areas[idx].theme;
    let start = idx;
    while (start > 0 && areas[start - 1].theme === theme) start--;
    const pool = [], seen = {};
    for (let i = start; i <= idx; i++)
      for (const e of areas[i].enemies)
        if (!seen[e.name]) { seen[e.name] = 1; pool.push(e); }
    return pool;
  },

  // quantos inimigos por onda para uma área dada (boss é sempre solo) — P2.4: por grupo.
  // Fonte única do tamanho da onda (combat.spawn e ui.openAreaInfo consomem daqui).
  packSizeFor(idx) {
    const b = G.data.balance;
    idx = G.util.clamp(idx || 0, 0, G.data.areas.length - 1);
    const g = G.util.clamp(Math.floor(idx / b.groupSize), 0, b.packByGroup.length - 1);
    return b.packByGroup[g];
  },

  _packSize() { return this.packSizeFor(G.state.data.areaIndex || 0); },

  // P8.2/P8.3: o inimigo carrega o modificador `key`?
  _hasMod(e, key) { return !!(e && e.modifiers && e.modifiers.indexOf(key) !== -1); },

  // Escorted (P8.2): tamanho da onda com escolta CHEIA — enche até fullWave; se já cheia, +extra até cap.
  _escortedSize(base) {
    const m = G.data.modifiers.escorted;
    let t = Math.max(m.fullWave, base);
    if (base >= m.fullWave) t = base + m.extra;
    return Math.min(t, m.cap);
  },

  // P2.5: threshold do Harbinger escalado por grupo (base + perGroup×(grupo+1)) — para uma área dada.
  bossThresholdFor(idx) {
    const b = G.data.balance;
    idx = G.util.clamp(idx || 0, 0, G.data.areas.length - 1);
    const g = Math.floor(idx / b.groupSize);
    return b.bossKillThresholdBase + b.bossKillThresholdPerGroup * (g + 1);
  },

  _bossThreshold() { return this.bossThresholdFor(G.state.data.areaIndex || 0); },

  // constrói um inimigo individual (boss ou mob comum)
  _buildOne(isBossSpawn, def) {
    const b     = G.data.balance;
    const area  = G.data.currentArea();
    const level = G.util.clamp(G.state.data.level, area.levelRange[0], area.levelRange[1]);
    const hp    = G.data.mobHpAt(level, area);
    const aIdx  = G.util.clamp(G.state.data.areaIndex || 0, 0, b.mobAtkByArea.length - 1);
    const atk   = b.mobAtkByArea[aIdx];
    // P7 (First Light na banda): acelerador de XP nos grupos finais — barateia a SUBIDA,
    // não as provas (requisitos do Awaken intactos). xpMultByGroup[grupo], default 1.
    const grp   = G.util.clamp(Math.floor(aIdx / b.groupSize), 0, (b.xpMultByGroup || []).length - 1);
    const xpGroupMult = (b.xpMultByGroup && b.xpMultByGroup[grp] != null) ? b.xpMultByGroup[grp] : 1;

    let maxHp = hp, dmg = atk, xp = b.baseXp * level * xpGroupMult;
    let isBoss = false, name, rarity = null, modifiers = [];

    if (isBossSpawn) {
      isBoss = true;
      maxHp *= (def.hpMult != null ? def.hpMult : b.bossHpMult); dmg *= (def.dmgMult != null ? def.dmgMult : b.bossDmgMult); xp *= b.bossRewardMult;
      name = def.name;
      // P8.3: assinatura FIXA do Harbinger/Okhra (tutorial encarnado do modificador)
      if (Array.isArray(def.signature)) modifiers = def.signature.slice();
    } else {
      name = def.name;
      // Rarity Find (P8.1): roll do mais raro pro mais comum. chance = min(find do gear, teto dos Marcos).
      const s = G.state.stats();
      const find = s.rarityFind, caps = s.rarityCaps;
      let tier = null;
      for (const t of G.data.rarityTiers) {
        const ch = Math.min(find[t.findKey], caps[t.findKey]);
        if (ch > 0 && G.util.chance(ch)) { tier = t; break; }
      }
      if (tier) {
        maxHp *= tier.hpMult; dmg *= tier.atkMult; xp *= tier.rewardMult;
        name = G.util.pick(tier.names);
        rarity = { tag: tier.tag, color: tier.color, tier: tier.key };
        // P8.2: SÓ Corona carrega modificador — rola EXATAMENTE 1 dos 4 (uniforme).
        if (tier.key === "corona") {
          modifiers = [G.util.pick(G.data.modifiers.order)];
          this._noteFirstModifier(modifiers[0]);
        }
        this._noteFirstSpawn(tier.key);
      }
    }

    // Nome vira prefixo com o(s) modificador(es): "Lightshell <nome>" (P8.2/P8.3)
    const baseName = name;
    if (modifiers.length) {
      const pre = modifiers.map((k) => G.data.modifiers[k] && G.data.modifiers[k].label).filter(Boolean).join(" ");
      if (pre) name = pre + " " + name;
    }
    // Lightshell: contador de golpes absorvidos (N do mob ou bossAbsorb do boss)
    let lightshell = 0;
    if (modifiers.indexOf("lightshell") !== -1) {
      const ls = G.data.modifiers.lightshell;
      lightshell = isBoss ? ls.bossAbsorb : ls.absorb;
    }

    let lumens = maxHp * b.goldRatio;
    if (isBoss) lumens *= b.bossLumenMult;
    G.combat.spawnCount++;

    return {
      name, baseName, sprite: def.sprite, img: def.img,
      level, isBoss,
      rarity: rarity ? { tag: rarity.tag, color: rarity.color, tier: rarity.tier } : null,
      modifiers, lightshell,
      maxHp:  Math.ceil(maxHp), hp: Math.ceil(maxHp),
      dmg:    Math.max(1, Math.ceil(dmg)),
      lumens: Math.ceil(lumens), xp: Math.ceil(xp),
      atkTimer: 0,   // per-enemy attack timer
    };
  },

  // onboarding (P8.1 toque 3): log no 1º spawn de cada tier (flag persistida em state.data)
  _noteFirstSpawn(tierKey) {
    const d = G.state.data;
    if (!d.rarityFirstSeen) d.rarityFirstSeen = {};
    if (d.rarityFirstSeen[tierKey]) return;
    d.rarityFirstSeen[tierKey] = true;
    if (G.ui && G.ui.log) {
      const T = { ember: "Ember", lumen: "Lumen", corona: "Corona" };
      G.ui.log(`✦ A ${T[tierKey]} light kindles within a creature, rarer, fiercer, richer prey.`, "boss");
    }
  },

  // onboarding (P8.2): log no 1º spawn de cada MODIFICADOR de Corona (flag persistida)
  _noteFirstModifier(key) {
    const d = G.state.data;
    if (!d.modifierFirstSeen) d.modifierFirstSeen = {};
    if (d.modifierFirstSeen[key]) return;
    d.modifierFirstSeen[key] = true;
    if (G.ui && G.ui.log) {
      const M = G.data.modifiers[key];
      const desc = {
        lightshell: "shrugs off the first blows, batter through its shell.",
        quickened:  "strikes faster than the eye can follow, brace and endure.",
        siphoning:  "drinks the light of every wound it deals, out-damage its thirst.",
        escorted:   "never walks alone, a full tide of the drowned comes with it.",
      };
      G.ui.log(`✦ ${M.label}, this Corona ${desc[key] || "carries a stranger light."}`, "boss");
    }
  },
};
