// combat.js — loop central: ataques automáticos, ondas de inimigos, kill, death
//
// Wave system: areas 0-1 = 1 enemy/wave, areas 2-4 = 2/wave, areas 5+ = 3/wave.
// Boss (at level cap) is always solo. Each enemy in a wave attacks simultaneously.
// Player targets enemies[0] (front); on kill the next enemy auto-engages.
//
// Fábrica de inimigos / pool / thresholds → G.enemyFactory · taxas → G.rates
// projeção de income → G.income · unlock/level-up → G.progression.

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
  _momentumStacks:  0,    // P9: stacks de Momentum (boots) — cada kill +1 até momentumMaxStacks
  _momentumTimer:   0,    // P9: segundos restantes antes de zerar os stacks de Momentum
  _cleaving:        false, // P9: guarda anti-recursão do Cleave (1 salto só — a cadeia não re-propaga)
  _vesselShield:    0,     // P9 r4 (Vessel of Dawn): golpes recebidos ainda absorvidos NESTA onda (reseta por spawn)

  // reset comum da onda: usado ao trocar/viajar de área, ao converger e à morte do Seeker.
  // cada site com semântica extra (ex.: onDeath zera bossKills/momentum) mantém seu próprio delta.
  clearWave() {
    this.enemies = [];
    this.enemy = null;
    this.pendingHits = [];
    this.respawnTimer = G.data.balance.respawnDelay;
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
      this._momentumStacks = 0; this._momentumTimer = 0;   // P9: Momentum não atravessa troca de área
      if (this._okhraManifest) { this._okhraManifest = false; if (G.ui && G.ui.setOkhraStage) G.ui.setOkhraStage(false); }
    }

    const lastIdx      = G.data.areas.length - 1;
    const isFinalArea  = d.areaIndex === lastIdx;
    const thresholdMet = this._bossKills >= G.enemyFactory._bossThreshold();

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
    let n = G.enemyFactory._packSize();
    let escortBumped = false;

    if (bossDef) {
      const boss = G.enemyFactory._buildOne(true, bossDef);
      if (isMapBoss) {
        boss.isMapBoss = true;
        if (!this._okhraManifest) { this._okhraManifest = true; this._tideTimer = 0; this._tideRisen = false; }
        if (G.ui && G.ui.setOkhraStage) G.ui.setOkhraStage(true);
      }
      this.enemies.push(boss);   // boss à frente
      if (G.enemyFactory._hasMod(boss, "escorted")) { n = G.enemyFactory._escortedSize(n); escortBumped = true; }
    }

    const pool = G.enemyFactory.enemyPool();
    for (let i = 0; i < n; i++) {
      const mob = G.enemyFactory._buildOne(false, G.util.pick(pool));            // escolta (ou onda normal)
      this.enemies.push(mob);
      if (!escortBumped && G.enemyFactory._hasMod(mob, "escorted")) { n = G.enemyFactory._escortedSize(n); escortBumped = true; }
    }

    this.enemy = this.enemies[0];
    // Vessel of Dawn (First Light): o Seeker absorve os N primeiros golpes de CADA onda.
    // O escudo reseta a cada spawn de onda. Só existe com o First Light desperto (bonus.vesselOfDawn).
    this._vesselShield = this._vesselAbsorb();
    if (G.ui && G.ui.renderEnemy) G.ui.renderEnemy();
  },

  // P9 r4: quantos golpes o Vessel of Dawn absorve por onda (0 sem First Light desperto).
  _vesselAbsorb() {
    if (!(G.awaken && G.awaken.isDone("first_light"))) return 0;
    const a = G.awaken.def && G.awaken.def("first_light");
    return (a && a.bonus && a.bonus.vesselOfDawn) || 0;
  },

  // The Tide Rises (P8.4): Okhra re-invoca a escolta — enche até tide.maxEscort comuns vivos.
  _tideRise() {
    const tide = G.data.modifiers.tide;
    const aliveEscort = this.enemies.filter((e) => !e.dead && !e.isBoss && !e.isMapBoss).length;
    const room = tide.maxEscort - aliveEscort;
    if (room <= 0) return;
    const add  = Math.min(G.enemyFactory._packSize(), room);
    const pool = G.enemyFactory.enemyPool();
    for (let i = 0; i < add; i++) this.enemies.push(G.enemyFactory._buildOne(false, G.util.pick(pool)));
    if (!this._tideRisen) {
      this._tideRisen = true;
      if (G.ui && G.ui.log) G.ui.log("🌊 The Starving Tide rises. The drowned surge to Okhra's call.", "boss");
    }
    if (G.ui && G.ui.renderEnemy) G.ui.renderEnemy();
  },

  // P9: intervalo de ataque do jogador com o embalo do Momentum (boots).
  // Dinâmico por kill (fora do stats()/cache): base / (1 + stacks × momentum%/100).
  playerInterval() {
    const base = G.state.attackInterval();
    const per  = G.state.stats().momentum || 0;
    if (this._momentumStacks <= 0 || per <= 0) return base;
    return base / (1 + this._momentumStacks * per / 100);
  },

  // ataque do Seeker → primeiro inimigo VIVO
  playerHit() {
    const target = this.enemies.find(e => !e.dead);
    if (!target) return;
    const targetIdx = this.enemies.indexOf(target);
    const s    = G.state.stats();
    const crit = G.util.chance(s.crit / 100);
    let raw    = s.atk * (crit ? s.critMult : 1);
    // Overcrit (gloves): crit acima de 100% vira chance de GOLPE DUPLO (teto = s.overcrit).
    // O crit do golpe em si continua clampado a 100 (s.crit); aqui só o excedente vira duplo.
    if (s.overcrit > 0) {
      const doubleChance = G.util.clamp((s.critRaw || 0) - 100, 0, s.overcrit);
      if (doubleChance > 0 && G.util.chance(doubleChance / 100)) raw *= 2;
    }
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

  // caminho de dano ÚNICO contra um inimigo (lightshell + executioner). Usado pelo golpe
  // normal do jogador (front) e pelo spillover do Cleave (alvo explícito, sem projétil/floater
  // de "hit" do jogador) — ver applyHitToEnemy e o bloco de Cleave em onKill.
  _dealDamage(target, dmg, opts) {
    opts = opts || {};
    if (!target) return;
    // Lightshell (P8.2): absorve os primeiros N golpes — 0 dano até o escudo quebrar.
    if (target.lightshell > 0) {
      target.lightshell--;
      if (G.ui && G.ui.floater) G.ui.floater(0, "shell", this.enemies.indexOf(target));
      if (target.lightshell === 0 && G.ui && G.ui.log)
        G.ui.log(`✦ The Lightshell shatters. ${target.name} can be wounded now.`, "good");
      if (G.ui && G.ui.renderEnemy) G.ui.renderEnemy();
      return;
    }
    if (opts.floater !== false && G.ui && G.ui.floater)
      G.ui.floater(dmg, opts.floaterType || "hit", this.enemies.indexOf(target));
    target.hp -= dmg;
    // Executioner's Light (folha): inimigo NÃO-boss que fique abaixo de exec% do HP máx após
    // o golpe MORRE na hora (morte normal, com recompensas). Bosses e Okhra (Marcos) excluídos.
    if (target.hp > 0 && !target.isBoss && !target.isMapBoss && G.passives) {
      let exec = G.passives.effect("executioner") || 0;
      exec = G.util.clamp(exec, 0, G.data.balance.executionerCap);
      if (exec > 0 && target.hp < target.maxHp * exec / 100) target.hp = 0;
    }
    if (target.hp <= 0) this.onKill();
    else if (G.ui && G.ui.renderEnemy) G.ui.renderEnemy();
  },

  applyHitToEnemy(dmg, crit) {
    const target = this.enemies.find(e => !e.dead);
    if (!target) return;
    this._dealDamage(target, dmg, { floaterType: crit ? "crit" : "hit" });
  },

  applyHitToHero(dmg, source) {
    const s = G.state.stats();
    // Vessel of Dawn (First Light): absorve por completo os N primeiros golpes de cada onda (0 dano).
    if (this._vesselShield > 0) {
      this._vesselShield--;
      if (G.ui && G.ui.floater) G.ui.floater(0, "enemy");
      if (G.ui && G.ui.renderHeroHp) G.ui.renderHeroHp();
      return;
    }
    // Bulwark (armor assinatura): redução EXTRA só quando o HP atual está abaixo de bulwarkHpThreshold% do máx.
    // A SOMA (damageReduction + bulwark) continua clampada em dmgReductionCap.
    let dr = s.damageReduction || 0;
    if (s.bulwark && G.state.data.hp < G.state.maxHp() * G.data.balance.bulwarkHpThreshold / 100) dr += s.bulwark;
    dr = G.util.clamp(dr, 0, G.data.balance.dmgReductionCap);
    const reduced = Math.max(1, Math.ceil(dmg * (1 - dr / 100)));
    if (G.ui && G.ui.floater) G.ui.floater(reduced, "enemy");
    G.state.data.hp -= reduced;
    // Siphoning (P8.2): o mob cura-se de healFrac do dano que causou (clamp no maxHp dele).
    if (source && !source.dead && G.enemyFactory._hasMod(source, "siphoning")) {
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
    this._momentumStacks = 0; this._momentumTimer = 0;   // P9: morte zera o embalo do Momentum
    if (G.ui && G.ui.log) G.ui.log("☠ The Seeker fell, recovered and returned.", "bad");
    this.clearWave();
  },

  // inimigo (primeiro vivo) morreu: recompensas, marca como morto, avança onda se limpa
  onKill() {
    const e = this.enemies.find(e => !e.dead);
    if (!e) return;
    const s = G.state.stats();
    // overkill do golpe fatal: e.hp está negativo aqui (ainda não zerado). Fonte comum de
    // Overkill Echo (Lumens) e Cleave (dano transferido) — capturado antes de qualquer zeragem.
    const overkill = Math.max(0, -e.hp);

    let lumens = Math.ceil(e.lumens * (1 + s.lumensBonus / 100));
    const xp     = Math.round(e.xp    * (1 + s.xpBonus    / 100));

    // Lumens multiplier por kill — a ESCADA de apostas do eixo Lumens (P9 r6, §9 var 18):
    // Golden Wake 15× (folha, topo) → Fortune's Torrent 4× (assinatura) → Twice-Gilded 2×
    // (primário). Rola do topo pra base; o PRIMEIRO que acerta ganha — não empilham.
    {
      let gw = G.passives ? (G.passives.effect("goldenWake") || 0) : 0;
      gw = G.util.clamp(gw, 0, G.data.balance.goldenWakeCap);
      const torrent = G.util.clamp(s.fortuneTorrent || 0, 0, G.data.balance.fortuneTorrentCap);
      const dbl = G.util.clamp(s.twiceGilded || 0, 0, G.data.balance.twiceGildedCap);
      if (gw > 0 && G.util.chance(gw / 100)) lumens *= 15;
      else if (torrent > 0 && G.util.chance(torrent / 100)) lumens *= 4;
      else if (dbl > 0 && G.util.chance(dbl / 100)) lumens *= 2;
    }

    // Overkill Echo (passiva): dano excedente ALÉM da morte vira Lumens extra. Cap = lumens base do mob.
    let overkillLumens = 0;
    const echo = G.passives ? (G.passives.effect("overkillEcho") || 0) : 0;
    if (echo > 0) {
      overkillLumens = Math.min(Math.ceil(overkill * G.data.balance.goldRatio * (echo / 100)), e.lumens);
    }

    const d = G.state.data;
    d.lumens    += lumens + overkillLumens;
    d.xp        += xp;
    if (G.ui) G.rates._gains.push({ t: G.rates._clock, lumens: lumens + overkillLumens, xp });
    d.totalKills = (d.totalKills || 0) + 1;
    d.runKills   = (d.runKills  || 0) + 1;
    // Momentum (boots): cada kill +1 stack (teto momentumMaxStacks) e reseta o timer.
    if (s.momentum > 0) {
      this._momentumStacks = Math.min(G.data.balance.momentumMaxStacks, this._momentumStacks + 1);
      this._momentumTimer  = G.data.balance.momentumDuration;
    }
    if (!e.isBoss) this._bossKills++;   // progresso rumo ao Boss de Área (mortes de boss não contam)
    if ((d.runMaxAreaIndex || 0) < d.areaIndex) d.runMaxAreaIndex = d.areaIndex;

    if (G.ui && G.ui.log)
      G.ui.log((e.isBoss ? "👑 " : "") + `Defeated ${e.name} · +${G.util.fmt(lumens)} ✦`, e.isBoss ? "boss" : "good");

    const drops = G.economy ? G.economy.rollDrops(e) : {};
    if (G.ui && G.ui.materialDrop && Object.keys(drops).length) G.ui.materialDrop(drops);
    const healFrac = G.data.balance.healOnKillFrac + (s.healOnKill || 0) / 100;
    G.state.data.hp = Math.min(G.state.maxHp(), G.state.data.hp + G.state.maxHp() * healFrac);

    if (e.isBoss) this.markBossCleared(e);
    G.progression.checkLevelUp();

    // marca como morto (permanece visível mas greyed-out até a onda limpar)
    e.dead = true;
    e.hp   = 0;

    // Cleave (weapon assinatura): o overkill do golpe fatal atinge o próximo inimigo VIVO,
    // roteado pelo MESMO caminho de dano do golpe normal (_dealDamage) — respeita Lightshell
    // (consome carga, 0 dano) e Executioner (vale pra qualquer dano em não-boss). 1 salto só
    // (Mapa 1): _cleaving impede que uma morte em cadeia re-propague outro cleave.
    if (!this._cleaving && s.cleave > 0 && overkill > 0) {
      const next = this.enemies.find(x => !x.dead);
      if (next && !next.isBoss && !next.isMapBoss) {
        const spill = Math.ceil(overkill * s.cleave / 100);
        if (spill > 0) {
          this._cleaving = true;
          try { this._dealDamage(next, spill, { floaterType: "hit" }); } finally { this._cleaving = false; }
        }
      }
    }

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
    // Harbinger caiu → re-grind parcial do threshold pra re-invocá-lo (mata o farm de boss em toda onda).
    // O mapBoss (Okhra) NÃO re-invoca por re-grind: sua re-luta é gated por threshold cheio, não pelo re-grind parcial.
    if (!isMapBoss)
      this._bossKills = Math.floor(G.enemyFactory._bossThreshold() * (1 - (G.data.balance.bossRegrindFrac != null ? G.data.balance.bossRegrindFrac : 1)));

    // Marco (Harbinger): a 1ª morte levanta os tetos do Rarity Find em 1/6 (permanente,
    // sobrevive à Convergence). H6 (Harbinger da área 18) É Marco — fecha os caps 6/6.
    if (!isMapBoss && G.data.areas[idx].boss) {
      if (!Array.isArray(d.harbingersFelled)) d.harbingersFelled = [];
      if (d.harbingersFelled.indexOf(idx) === -1) {
        d.harbingersFelled.push(idx);
        G.state.invalidateStats();   // o teto mudou → recomputa rarityCaps
        if (G.ui && G.ui.log) {
          const rc = G.data.rarityCaps;
          G.ui.log(`✦ The stolen light disperses. Rarity Find caps rise (Ember +${(rc.ember / 6).toFixed(1)}% · Lumen +${(rc.lumen / 6).toFixed(1)}% · Corona +${(rc.corona / 6).toFixed(2)}%).`, "boss");
        }
      }
    }

    if (isMapBoss) {
      // Okhra caiu → Mapa 1 completo. Encerra o estágio do Okhra (palco/maré).
      if (!d.mapOneCleared) {
        d.mapOneCleared = true;
        if (G.ui && G.ui.log) {
          G.ui.log("✦ The Starving Tide is stilled. Okhra is undone at the bottom of the Sunken Port. Map 1 complete.", "boss");
          G.ui.log("✦ In the hush, the tide recedes, but a colder current stirs far below. Something deeper begins to wake.", "boss");
        }
      }
      this._okhraManifest = false; this._tideTimer = 0; this._tideRisen = false;
      if (G.ui && G.ui.setOkhraStage) G.ui.setOkhraStage(false);
    } else if (idx < lastIdx) {
      G.progression.unlockNext();
    } else {
      // H6 caiu na área 18 (P8.4): com First Light → Okhra manifesta (spawn no ciclo seguinte);
      // sem → portão. A invocação/spawn efetivo do Okhra acontece em spawn().
      // _okhraManifest garante a manifestação IMEDIATA mesmo com o threshold re-zerado acima.
      const awake = !!(G.awaken && G.awaken.isDone("first_light"));
      if (awake) { this._okhraManifest = true; this._tideTimer = 0; this._tideRisen = false; }
      if (G.ui && G.ui.log) {
        if (awake) G.ui.log("✦ The Tidebound Choir is silenced. Far below, the Starving Tide answers your light. Okhra rises.", "boss");
        else       G.ui.log("The tide stirs... but your light sleeps. Awaken the First Light.", "bad");
      }
    }
  },

  // avança o tempo
  tick(dt) {
    G.rates._clock += dt;
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

    // P9: Momentum (boots) — os stacks acumulados por kill expiram quando o timer zera.
    if (this._momentumStacks > 0) {
      this._momentumTimer -= dt;
      if (this._momentumTimer <= 0) { this._momentumStacks = 0; this._momentumTimer = 0; }
    }

    // player attacks first living enemy
    this.atkTimer += dt;
    const interval = this.playerInterval();
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
      const eInt = G.enemyFactory._hasMod(e, "quickened")
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
