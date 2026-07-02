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

  // quantos inimigos por onda (boss é sempre solo) — P2.4: por grupo
  _packSize() {
    const b   = G.data.balance;
    const idx = G.util.clamp(G.state.data.areaIndex || 0, 0, G.data.areas.length - 1);
    const g   = G.util.clamp(Math.floor(idx / b.groupSize), 0, b.packByGroup.length - 1);
    return b.packByGroup[g];
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

    let maxHp = hp, dmg = atk, xp = b.baseXp * level;
    let isBoss = false, isElite = false, name, rarity = null;

    if (isBossSpawn) {
      isBoss = true;
      maxHp *= (def.hpMult != null ? def.hpMult : b.bossHpMult); dmg *= (def.dmgMult != null ? def.dmgMult : b.bossDmgMult); xp *= b.bossRewardMult;
      name = def.name;
    } else {
      name = def.name;
      const em = G.data.eliteMob, rm = G.data.rareMobs;
      const eliteBonus = G.passives ? (G.passives.effect("eliteChance") || 0) / 100 : 0;
      if (em && aIdx >= em.minAreaIndex && G.util.chance(em.chance * (1 + eliteBonus))) {
        maxHp *= em.hpMult; dmg *= em.dmgMult; xp *= em.rewardMult;
        name = G.util.pick(em.names);
        rarity = { tag: em.tag, color: em.color };
        isElite = true;
      } else if (rm && G.util.chance(rm.chance)) {
        const r = G.util.chance(rm.plusChance) ? rm.plus : rm.rare;
        maxHp *= r.hpMult; dmg *= r.dmgMult; xp *= r.rewardMult;
        name = G.util.pick(r.names);
        rarity = { tag: r.tag, color: r.color };
      }
    }

    let lumens = maxHp * b.goldRatio;
    if (isBoss) lumens *= b.bossLumenMult;
    this.spawnCount++;

    return {
      name, sprite: def.sprite, img: def.img,
      level, isBoss, isElite,
      rarity: rarity ? { tag: rarity.tag, color: rarity.color } : null,
      maxHp:  Math.ceil(maxHp), hp: Math.ceil(maxHp),
      dmg:    Math.max(1, Math.ceil(dmg)),
      lumens: Math.ceil(lumens), xp: Math.ceil(xp),
      atkTimer: 0,   // per-enemy attack timer
    };
  },

  // spawna a próxima onda
  spawn() {
    const d    = G.state.data;
    const area = G.data.currentArea();

    // trocou de área → re-grind o threshold do novo Boss
    if (d.areaIndex !== this._lastAreaIndex) {
      this._lastAreaIndex = d.areaIndex;
      this._bossKills = 0;
    }

    const n    = this._packSize();
    this.enemies = [];

    // Boss de Área aparece por THRESHOLD DE KILL — nunca solo, sempre com escolta de mobs.
    const bossTime = area.boss && this._bossKills >= this._bossThreshold();
    if (bossTime) this.enemies.push(this._buildOne(true, area.boss));   // boss à frente
    const pool = this.enemyPool();
    for (let i = 0; i < n; i++)
      this.enemies.push(this._buildOne(false, G.util.pick(pool)));      // escolta (ou onda normal)

    this.enemy = this.enemies[0];
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
    // lightbane: dano vs acesos (rares & elites, NÃO boss) — passiva Lightbane
    if ((target.rarity || target.isElite) && !target.isBoss)
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
      this.pendingHits.push({ side: "mob", dmg, travel: this.mobProjectileTravel });
    } else {
      this.applyHitToHero(dmg);
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
      else                     this.applyHitToHero(h.dmg);
    }
    this.pendingHits = still;
  },

  applyHitToEnemy(dmg, crit) {
    const target = this.enemies.find(e => !e.dead);
    if (!target) return;
    if (G.ui && G.ui.floater) G.ui.floater(dmg, crit ? "crit" : "hit", this.enemies.indexOf(target));
    target.hp -= dmg;
    if (target.hp <= 0) this.onKill();
    else if (G.ui && G.ui.renderEnemy) G.ui.renderEnemy();
  },

  applyHitToHero(dmg) {
    const s = G.state.stats();
    // siegeWard (armor despertar): redução extra só quando há 2+ inimigos vivos na onda; clamp total = dmgReductionCap
    let dr = s.damageReduction || 0;
    if (s.siegeWard && this.enemies.filter(e => !e.dead).length >= 2) dr += s.siegeWard;
    dr = G.util.clamp(dr, 0, G.data.balance.dmgReductionCap);
    const reduced = Math.max(1, Math.ceil(dmg * (1 - dr / 100)));
    if (G.ui && G.ui.floater) G.ui.floater(reduced, "enemy");
    G.state.data.hp -= reduced;
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

    if (e.isBoss) this.markBossCleared();
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

  // boss derrotado: libera próxima área (ou conclui o Mapa 1)
  markBossCleared() {
    const d = G.state.data;
    d.runBosses = (d.runBosses || 0) + 1;
    if (d.areaIndex < G.data.areas.length - 1) {
      this.unlockNext();
    } else if (!d.mapOneCleared) {
      d.mapOneCleared = true;
      if (G.ui && G.ui.log) {
        G.ui.log("✦ The Starving Tide is stilled. Okhra is undone at the bottom of the Sunken Port — Map 1 complete.", "boss");
        G.ui.log("✦ In the hush, the tide recedes — but a colder current stirs far below. Something deeper begins to wake.", "boss");
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

    // player attacks first living enemy
    this.atkTimer += dt;
    const interval = G.state.attackInterval();
    while (this.atkTimer >= interval) {
      this.atkTimer -= interval;
      this.playerHit();
      if (!this.enemies.some(e => !e.dead)) return;
    }

    // each living enemy attacks player on its own timer
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (!e || e.dead) continue;
      e.atkTimer += dt;
      while (e.atkTimer >= this.enemyInterval) {
        e.atkTimer -= this.enemyInterval;
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

    const realUi = G.ui;
    G.ui = null;
    let done = 0;
    try { for (; done < ticks && done < 50000; done++) this.tick(step); }
    finally { G.ui = realUi; }
    return { seconds: done * step };
  },
};
