// combat.js — loop central: ataques automáticos, ondas de inimigos, kill, death
//
// Wave system: areas 0-1 = 1 enemy/wave, areas 2-4 = 2/wave, areas 5+ = 3/wave.
// Boss (at level cap) is always solo. Each enemy in a wave attacks simultaneously.
// Player targets enemies[0] (front); on kill the next enemy auto-engages.

G.combat = {
  enemies:          [],     // current wave (array); enemy = enemies[0]
  enemy:            null,   // alias for enemies[0]; kept for ui/convergence compat
  atkTimer:         0,
  respawnTimer:     0,
  pendingHits:      [],
  paused:           false,
  projectileTravel: 0.5,    // bolt do Seeker
  mobProjectileTravel: 0.9, // bolt do mob — mais lento/telegrafado (decisão do dono)
  enemyInterval:    0.99,
  spawnCount:       0,
  _lastAreaIndex:   -1,
  _bossKills:       0,    // kills sem morrer na área atual; ≥ bossKillThreshold → Boss de Área spawna (com escolta). Zera na morte e ao trocar de área.
  _okhraManifest:   false, // P8.4: Okhra (mapBoss) manifestou nesta visita à área 18? (persiste até a morte dele → sem loop de re-grind)
  _tideTimer:       0,    // P8.4: acumulador da mecânica The Tide Rises
  _tideRisen:       false, // P8.4: a maré já subiu ao menos 1× nesta luta? (log temático só na 1ª)

  // tracker de taxas (Gold/Min, XP/Min) — janela rolante
  _clock:      0,
  _gains:      [],
  rateWindow:  60,   // segundos

  getRates() {
    const cutoff = this._clock - this.rateWindow;
    const g = this._gains;
    while (g.length && g[0].t < cutoff) g.shift();
    let lum = 0, xp = 0;
    for (let i = 0; i < g.length; i++) { lum += g[i].lumens; xp += g[i].xp; }
    const mins = this.rateWindow / 60;
    return { lumens: lum / mins, xp: xp / mins, kills: g.length / mins };
  },

  // pool de mobs da área atual (acumula mobs de todas as áreas anteriores)
  enemyPool() {
    const idx  = G.util.clamp(G.state.data.areaIndex || 0, 0, G.data.areas.length - 1);
    const pool = [], seen = {};
    for (let i = 0; i <= idx; i++)
      for (const e of G.data.areas[i].enemies)
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

  // P2.5: threshold do Harbinger escalado por grupo (base + perGroup×(grupo+1))
  _bossThreshold() {
    const b = G.data.balance;
    const g = Math.floor((G.state.data.areaIndex || 0) / b.groupSize);
    return b.bossKillThresholdBase + b.bossKillThresholdPerGroup * (g + 1);
  },

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
    this.spawnCount++;

    return {
      name, sprite: def.sprite, img: def.img,
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
      G.ui.log(`✦ A ${T[tierKey]} light kindles within a creature — rarer, fiercer, richer prey.`, "boss");
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
        lightshell: "shrugs off the first blows — batter through its shell.",
        quickened:  "strikes faster than the eye can follow — brace and endure.",
        siphoning:  "drinks the light of every wound it deals — out-damage its thirst.",
        escorted:   "never walks alone — a full tide of the drowned comes with it.",
      };
      G.ui.log(`✦ ${M.label} — this Corona ${desc[key] || "carries a stranger light."}`, "boss");
    }
  },

  // spawna a próxima onda
  spawn() {
    const d    = G.state.data;
    const area = G.data.currentArea();

    // trocou de área → re-grind o threshold do novo Boss; encerra o estágio do Okhra
    if (d.areaIndex !== this._lastAreaIndex) {
      this._lastAreaIndex = d.areaIndex;
      this._bossKills = 0;
      this._tideTimer = 0; this._tideRisen = false;
      if (this._okhraManifest) { this._okhraManifest = false; if (G.ui && G.ui.setOkhraStage) G.ui.setOkhraStage(false); }
    }

    const lastIdx      = G.data.areas.length - 1;
    const isFinalArea  = d.areaIndex === lastIdx;
    const thresholdMet = this._bossKills >= this._bossThreshold();

    // P8.4 — o finale encenado: a área 18 tem DOIS estágios.
    //  1) H6 (area.boss) spawna por threshold, SEM exigir First Light (emenda ao P7.4).
    //  2) Okhra (area.mapBoss) só manifesta DEPOIS do H6 morto E com o First Light desperto
    //     (imediatamente na morte do H6, ou no próximo threshold se despertou depois).
    // Sem First Light (H6 já morto): PORTÃO — nenhum boss, a área farma (a UI explica).
    let bossDef = null, isMapBoss = false;
    if (isFinalArea) {
      const h6Felled = Array.isArray(d.harbingersFelled) && d.harbingersFelled.indexOf(lastIdx) !== -1;
      const awake    = !!(G.awaken && G.awaken.isDone("first_light"));
      if (!h6Felled) {
        if (area.boss && thresholdMet) bossDef = area.boss;
      } else if (awake && area.mapBoss && (this._okhraManifest || thresholdMet)) {
        bossDef = area.mapBoss; isMapBoss = true;
      }
    } else if (area.boss && thresholdMet) {
      bossDef = area.boss;
    }

    this.enemies = [];
    let n = this._packSize();
    let escortBumped = false;

    if (bossDef) {
      const boss = this._buildOne(true, bossDef);
      if (isMapBoss) {
        boss.isMapBoss = true;
        if (!this._okhraManifest) { this._okhraManifest = true; this._tideTimer = 0; this._tideRisen = false; }
        if (G.ui && G.ui.setOkhraStage) G.ui.setOkhraStage(true);
      }
      this.enemies.push(boss);   // boss à frente
      if (this._hasMod(boss, "escorted")) { n = this._escortedSize(n); escortBumped = true; }
    }

    const pool = this.enemyPool();
    for (let i = 0; i < n; i++) {
      const mob = this._buildOne(false, G.util.pick(pool));            // escolta (ou onda normal)
      this.enemies.push(mob);
      if (!escortBumped && this._hasMod(mob, "escorted")) { n = this._escortedSize(n); escortBumped = true; }
    }

    this.enemy = this.enemies[0];
    if (G.ui && G.ui.renderEnemy) G.ui.renderEnemy();
  },

  // The Tide Rises (P8.4): Okhra re-invoca a escolta — enche até tide.maxEscort comuns vivos.
  _tideRise() {
    const tide = G.data.modifiers.tide;
    const aliveEscort = this.enemies.filter((e) => !e.dead && !e.isBoss && !e.isMapBoss).length;
    const room = tide.maxEscort - aliveEscort;
    if (room <= 0) return;
    const add  = Math.min(this._packSize(), room);
    const pool = this.enemyPool();
    for (let i = 0; i < add; i++) this.enemies.push(this._buildOne(false, G.util.pick(pool)));
    if (!this._tideRisen) {
      this._tideRisen = true;
      if (G.ui && G.ui.log) G.ui.log("🌊 The Starving Tide rises — the drowned surge to Okhra's call.", "boss");
    }
    if (G.ui && G.ui.renderEnemy) G.ui.renderEnemy();
  },

  // ataque do Seeker → primeiro inimigo VIVO
  playerHit() {
    const target = this.enemies.find(e => !e.dead);
    if (!target) return;
    const targetIdx = this.enemies.indexOf(target);
    const s    = G.state.stats();
    const crit = G.util.chance(s.crit / 100);
    let raw    = s.atk * (crit ? s.critMult : 1);
    // specialDmg: rares & bosses (gear + passiva, já somados em s.specialDmg)
    if (target.isBoss || target.rarity)
      raw *= 1 + (s.specialDmg || 0) / 100;
    // bossDmg: bosses only (passiva Harbinger's Bane)
    if (target.isBoss && G.passives)
      raw *= 1 + (G.passives.effect("bossDmg") || 0) / 100;
    // lightbane: dano vs acesos (Ember/Lumen/Corona, NÃO boss) — passiva Lightbane
    if (target.rarity && !target.isBoss)
      raw *= 1 + (s.lightbane || 0) / 100;
    const dmg = Math.ceil(raw);
    if (G.ui && G.ui.projectile) {
      G.ui.projectile("seeker", targetIdx);
      this.pendingHits.push({ side: "player", dmg, crit, travel: this.projectileTravel });
    } else {
      this.applyHitToEnemy(dmg, crit);
    }
  },

  // ataque de um mob específico (idx = posição na onda, pro projétil sair do mob certo)
  enemyHit(enemy, idx) {
    if (!enemy) return;
    const dmg = enemy.dmg;
    if (G.ui && G.ui.projectile) {
      G.ui.projectile("mob", idx);
      this.pendingHits.push({ side: "mob", dmg, travel: this.mobProjectileTravel, enemy });
    } else {
      this.applyHitToHero(dmg, enemy);
    }
  },

  // resolve projéteis que chegaram ao alvo
  resolvePending(dt) {
    if (!this.pendingHits.length) return;
    const still = [];
    for (const h of this.pendingHits) {
      h.travel -= dt;
      if (h.travel > 0) { still.push(h); continue; }
      if (h.side === "player") this.applyHitToEnemy(h.dmg, h.crit);
      else                     this.applyHitToHero(h.dmg, h.enemy);
    }
    this.pendingHits = still;
  },

  applyHitToEnemy(dmg, crit) {
    const target = this.enemies.find(e => !e.dead);
    if (!target) return;
    // Lightshell (P8.2): absorve os primeiros N golpes — 0 dano até o escudo quebrar.
    if (target.lightshell > 0) {
      target.lightshell--;
      if (G.ui && G.ui.renderEnemy) G.ui.renderEnemy();
      return;
    }
    if (G.ui && G.ui.floater) G.ui.floater(dmg, crit ? "crit" : "hit", this.enemies.indexOf(target));
    target.hp -= dmg;
    if (target.hp <= 0) this.onKill();
    else if (G.ui && G.ui.renderEnemy) G.ui.renderEnemy();
  },

  applyHitToHero(dmg, source) {
    const s = G.state.stats();
    // siegeWard (armor despertar): redução extra só quando há 2+ inimigos vivos na onda; clamp total = dmgReductionCap
    let dr = s.damageReduction || 0;
    if (s.siegeWard && this.enemies.filter(e => !e.dead).length >= 2) dr += s.siegeWard;
    dr = G.util.clamp(dr, 0, G.data.balance.dmgReductionCap);
    const reduced = Math.max(1, Math.ceil(dmg * (1 - dr / 100)));
    if (G.ui && G.ui.floater) G.ui.floater(reduced, "enemy");
    G.state.data.hp -= reduced;
    // Siphoning (P8.2): o mob cura-se de healFrac do dano que causou (clamp no maxHp dele).
    if (source && !source.dead && this._hasMod(source, "siphoning")) {
      const sip  = G.data.modifiers.siphoning;
      const frac = source.isBoss ? sip.bossHealFrac : sip.healFrac;
      source.hp  = Math.min(source.maxHp, source.hp + reduced * frac);
    }
    if (G.state.data.hp <= 0) this.onDeath();
    if (G.ui && G.ui.renderHeroHp) G.ui.renderHeroHp();
  },

  // Seeker morreu: cura total, limpa onda
  onDeath() {
    G.state.data.hp = G.state.maxHp();
    this._bossKills = 0;   // morreu → perde o progresso rumo ao Boss de Área
    if (G.ui && G.ui.log) G.ui.log("☠ The Seeker fell — recovered and returned.", "bad");
    this.pendingHits = [];
    this.enemies = [];
    this.enemy   = null;
    this.respawnTimer = G.data.balance.respawnDelay;
  },

  // inimigo (primeiro vivo) morreu: recompensas, marca como morto, avança onda se limpa
  onKill() {
    const e = this.enemies.find(e => !e.dead);
    if (!e) return;
    const s = G.state.stats();
    const lumens = Math.ceil(e.lumens * (1 + s.lumensBonus / 100));
    const xp     = Math.round(e.xp    * (1 + s.xpBonus    / 100));

    // Overkill Echo (passiva): dano excedente ALÉM da morte vira Lumens extra.
    // e.hp já está negativo aqui (o golpe fatal ainda não foi zerado). Cap = lumens base do mob.
    let overkillLumens = 0;
    const echo = G.passives ? (G.passives.effect("overkillEcho") || 0) : 0;
    if (echo > 0) {
      const overkill = Math.max(0, -e.hp);
      overkillLumens = Math.min(Math.ceil(overkill * G.data.balance.goldRatio * (echo / 100)), e.lumens);
    }

    const d = G.state.data;
    d.lumens    += lumens + overkillLumens;
    d.xp        += xp;
    if (G.ui) this._gains.push({ t: this._clock, lumens: lumens + overkillLumens, xp });
    d.totalKills = (d.totalKills || 0) + 1;
    d.runKills   = (d.runKills  || 0) + 1;
    if (!e.isBoss) this._bossKills++;   // progresso rumo ao Boss de Área (mortes de boss não contam)
    if ((d.runMaxAreaIndex || 0) < d.areaIndex) d.runMaxAreaIndex = d.areaIndex;

    if (G.ui && G.ui.log)
      G.ui.log((e.isBoss ? "👑 " : "") + `Defeated ${e.name} · +${G.util.fmt(lumens)} ✦`, e.isBoss ? "boss" : "good");

    const drops = G.economy ? G.economy.rollDrops(e) : {};
    if (G.ui && G.ui.materialDrop && Object.keys(drops).length) G.ui.materialDrop(drops);
    const healFrac = G.data.balance.healOnKillFrac + (s.healOnKill || 0) / 100;
    G.state.data.hp = Math.min(G.state.maxHp(), G.state.data.hp + G.state.maxHp() * healFrac);

    if (e.isBoss) this.markBossCleared(e);
    this.checkLevelUp();

    // marca como morto (permanece visível mas greyed-out até a onda limpar)
    e.dead = true;
    e.hp   = 0;
    this.enemy = this.enemies.find(e => !e.dead) || null;

    const anyAlive = this.enemies.some(e => !e.dead);
    if (anyAlive) {
      if (G.ui && G.ui.renderEnemy) G.ui.renderEnemy();
      if (G.ui && G.ui.renderAll)   G.ui.renderAll();
    } else {
      // onda limpa: mantém mortos visíveis um tick, inicia respawn
      this.respawnTimer = G.data.balance.respawnDelay;
      if (G.ui && G.ui.renderEnemy) G.ui.renderEnemy();
      if (G.ui && G.ui.renderAll)   G.ui.renderAll();
    }
  },

  // boss derrotado: libera próxima área, encena o finale, ou conclui o Mapa 1
  markBossCleared(e) {
    const d = G.state.data;
    d.runBosses = (d.runBosses || 0) + 1;
    const lastIdx    = G.data.areas.length - 1;
    const idx        = d.areaIndex;
    const isMapBoss  = !!(e && e.isMapBoss);   // Okhra (mapBoss) NÃO é Marco

    // Marco (Harbinger): a 1ª morte levanta os tetos do Rarity Find em 1/6 (permanente,
    // sobrevive à Convergence). H6 (Harbinger da área 18) É Marco — fecha os caps 6/6.
    if (!isMapBoss && G.data.areas[idx].boss) {
      if (!Array.isArray(d.harbingersFelled)) d.harbingersFelled = [];
      if (d.harbingersFelled.indexOf(idx) === -1) {
        d.harbingersFelled.push(idx);
        G.state.invalidateStats();   // o teto mudou → recomputa rarityCaps
        if (G.ui && G.ui.log) {
          const rc = G.data.rarityCaps;
          G.ui.log(`✦ The stolen light disperses — Rarity Find caps rise (Ember +${(rc.ember / 6).toFixed(1)}% · Lumen +${(rc.lumen / 6).toFixed(1)}% · Corona +${(rc.corona / 6).toFixed(2)}%).`, "boss");
        }
      }
    }

    if (isMapBoss) {
      // Okhra caiu → Mapa 1 completo. Encerra o estágio do Okhra (palco/maré).
      if (!d.mapOneCleared) {
        d.mapOneCleared = true;
        if (G.ui && G.ui.log) {
          G.ui.log("✦ The Starving Tide is stilled. Okhra is undone at the bottom of the Sunken Port — Map 1 complete.", "boss");
          G.ui.log("✦ In the hush, the tide recedes — but a colder current stirs far below. Something deeper begins to wake.", "boss");
        }
      }
      this._okhraManifest = false; this._tideTimer = 0; this._tideRisen = false;
      if (G.ui && G.ui.setOkhraStage) G.ui.setOkhraStage(false);
    } else if (idx < lastIdx) {
      this.unlockNext();
    } else {
      // H6 caiu na área 18 (P8.4): com First Light → Okhra manifesta (spawn no ciclo seguinte);
      // sem → portão. A invocação/spawn efetivo do Okhra acontece em spawn().
      const awake = !!(G.awaken && G.awaken.isDone("first_light"));
      if (G.ui && G.ui.log) {
        if (awake) G.ui.log("✦ The Tidebound Choir is silenced — and far below, the Starving Tide answers your light. Okhra rises.", "boss");
        else       G.ui.log("The tide stirs... but your light sleeps. Awaken the First Light.", "bad");
      }
    }
  },

  unlockNext() {
    const d = G.state.data;
    if (typeof d.maxAreaUnlocked !== "number") d.maxAreaUnlocked = d.areaIndex;
    if (d.areaIndex < G.data.areas.length - 1 && d.areaIndex + 1 > d.maxAreaUnlocked) {
      d.maxAreaUnlocked = d.areaIndex + 1;
      if (G.ui && G.ui.log) {
        const next = G.data.areas[d.areaIndex + 1];
        G.ui.log(`✦ ${next.name} unlocked — advance when ready.`, "good");
      }
      if (G.ui && G.ui.renderResources) G.ui.renderResources();
    }
  },

  checkLevelUp() {
    while (G.state.data.xp >= G.state.xpToNext()) {
      G.state.data.xp -= G.state.xpToNext();
      G.state.data.level += 1;
      if (G.state.data.level > (G.state.data.highestLevel || 0)) G.state.data.highestLevel = G.state.data.level;
      G.state.invalidateStats();
      G.state.data.hp = G.state.maxHp();
      if (G.ui && G.ui.log) G.ui.log(`★ Level ${G.state.data.level}!`, "level");
    }
    this.checkGroupUnlock();
  },

  // Dentro de um grupo, a próxima área destrava por NÍVEL (a fronteira de grupo continua
  // travada pelo Harbinger via unlockNext). Estende a fronteira desbloqueada enquanto o
  // nível qualificar e a área seguinte for do MESMO grupo.
  checkGroupUnlock() {
    const d  = G.state.data;
    const gs = G.data.balance.groupSize;
    if (typeof d.maxAreaUnlocked !== "number") d.maxAreaUnlocked = d.areaIndex;
    while (true) {
      const idx = d.maxAreaUnlocked, nextIdx = idx + 1;
      if (nextIdx >= G.data.areas.length) return;
      if (Math.floor(idx / gs) !== Math.floor(nextIdx / gs)) return;   // fronteira de grupo → gate do Harbinger
      if (d.level < G.data.areas[nextIdx].levelRange[0]) return;
      d.maxAreaUnlocked = nextIdx;
      if (G.ui && G.ui.log) G.ui.log(`✦ ${G.data.areas[nextIdx].name} unlocked — the grove deepens.`, "good");
      if (G.ui && G.ui.renderResources) G.ui.renderResources();
    }
  },

  // avança o tempo
  tick(dt) {
    this._clock += dt;
    this.resolvePending(dt);

    const anyAlive = this.enemies.length > 0 && this.enemies.some(e => !e.dead);

    if (!anyAlive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.spawn();
      return;
    }

    // P2.4: regen contínuo (sustain via passiva) — só quando vivo, em combate e ferido
    const rs = G.state.stats();
    if (rs.hpRegen > 0) {
      const d = G.state.data, maxHp = G.state.maxHp();
      if (d.hp < maxHp) d.hp = Math.min(maxHp, d.hp + maxHp * (rs.hpRegen / 100) * dt);
    }

    // The Tide Rises (P8.4): enquanto Okhra vive, a maré sobe a cada tide.interval
    if (this.enemies.some((e) => e.isMapBoss && !e.dead)) {
      this._tideTimer += dt;
      if (this._tideTimer >= G.data.modifiers.tide.interval) {
        this._tideTimer -= G.data.modifiers.tide.interval;
        this._tideRise();
      }
    }

    // player attacks first living enemy
    this.atkTimer += dt;
    const interval = G.state.attackInterval();
    while (this.atkTimer >= interval) {
      this.atkTimer -= interval;
      this.playerHit();
      if (!this.enemies.some(e => !e.dead)) return;
    }

    // each living enemy attacks player on its own timer.
    // Quickened (P8.2): mob ataca +40% mais rápido (intervalo ÷ atkSpeedFactor).
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e || e.dead) continue;
      const eInt = this._hasMod(e, "quickened")
        ? this.enemyInterval / G.data.modifiers.quickened.atkSpeedFactor
        : this.enemyInterval;
      e.atkTimer += dt;
      while (e.atkTimer >= eInt) {
        e.atkTimer -= eInt;
        this.enemyHit(e, i);
        if (!this.enemies.some(e => !e.dead)) return;
      }
    }
  },

  // simula tempo offline de forma simplificada (sem UI)
  simulateIdle(seconds) {
    if (seconds < 5) return null;
    const capped = Math.min(seconds, 8 * 3600);
    const step   = Math.max(G.state.attackInterval(), G.data.balance.respawnDelay);
    const ticks  = Math.floor(capped / step);
    if (ticks <= 0) return null;
    // sem cap de ticks: step tem piso de 0.5s (respawnDelay), então ticks ≤ ~57.6k @ 8h — CPU ok
    const realUi = G.ui;
    G.ui = null;
    let done = 0;
    try { for (; done < ticks; done++) this.tick(step); }
    finally { G.ui = realUi; }
    return { seconds: done * step };
  },
};
