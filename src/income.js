// income.js — projeção read-only do farm (World Map). Extraído de combat.js.
// NÃO muta estado, não toca RNG. Consumido por ui (openAreaInfo / renderWorldMap).

G.income = {
  // Projeção read-only do farm do jogador atual na área idx. NÃO muta estado, não toca RNG.
  // Usa SÓ as fórmulas reais já existentes (data.js + state.js); nada de constante numérica copiada.
  estimateAreaIncome(idx) {
    const b     = G.data.balance;
    const areas = G.data.areas;
    idx = G.util.clamp(idx || 0, 0, areas.length - 1);
    const area  = areas[idx];
    // P1: nível do mob = nível FIXO da área (não do Seeker) → HP/XP de zona.
    const lvl   = G.enemyFactory.mobLevelFor(idx);

    const mobHp  = G.data.mobHpAt(lvl, area);
    const mobAtk = b.mobAtkByArea[G.util.clamp(idx, 0, b.mobAtkByArea.length - 1)];

    // XP/kill: mesma expressão do _buildOne (base × nível × xpMultByGroup[grupo])
    const grp = G.util.clamp(Math.floor(idx / b.groupSize), 0, (b.xpMultByGroup || []).length - 1);
    const xpGroupMult = (b.xpMultByGroup && b.xpMultByGroup[grp] != null) ? b.xpMultByGroup[grp] : 1;
    const baseXpPerKill = b.baseXp * lvl * xpGroupMult;

    // dano esperado por golpe: atk com expectativa de crit. crit é % (0-100), critMult é fração (=1+critDmg/100).
    const s = G.state.stats();
    const critChance = G.util.clamp(s.crit, 0, 100) / 100;
    let dmgPerHit  = s.atk * (1 + critChance * (s.critMult - 1));
    // Overcrit (gloves): crit acima de 100% vira chance de golpe duplo, mesma fórmula de playerHit.
    // Cleave/Golden Wake/Momentum ficam FORA da projeção (dinâmicos demais) — isto é um PISO, não a média real.
    const doubleChance = G.util.clamp(Math.max((s.critRaw || 0) - 100, 0), 0, s.overcrit || 0) / 100;
    dmgPerHit *= (1 + doubleChance);
    const interval   = G.state.attackInterval();

    // Rarity Find (P8.1): mesma ordem de roll do _buildOne — rarityTiers do mais raro pro mais
    // comum, chance efetiva = min(find, cap). find/caps já vêm em FRAÇÃO 0-1 de state.stats()
    // (ver state.js: rarityFind.* = fin(...)/100, rarityCaps.* = capFrac(...)/100 já dividido) —
    // sem dividir por 100 de novo aqui. remaining = probabilidade de "ainda não caiu" tier raro.
    let remaining = 1;
    const tierProbs = [];
    for (const t of G.data.rarityTiers) {
      const ch = G.util.clamp(Math.min(s.rarityFind[t.findKey], s.rarityCaps[t.findKey]), 0, 1);
      const p  = remaining * ch;
      if (p > 0) tierProbs.push({ p, hpMult: t.hpMult, rewardMult: t.rewardMult });
      remaining -= p;
    }
    tierProbs.push({ p: remaining, hpMult: 1, rewardMult: 1 });   // mob comum

    // valor esperado por kill. P3: Lumens = curva própria da área × rewardMult (não HP × goldRatio).
    //   rare = mais HP (mais TTK) E MUITO mais reward (P5: ratio reward/hp cresce por tier).
    const lumensBase = G.data.lumensBaseFor(idx);
    let eLumensPerKill = 0, eXpPerKill = 0, eTtk = 0;
    for (const t of tierProbs) {
      const hpT   = mobHp * t.hpMult;
      const hitsT = Math.ceil(hpT / dmgPerHit);
      // flight = projectileTravel do Seeker (o par no tick: pendingHits.push({..., travel: this.projectileTravel}))
      const ttkT  = hitsT * interval + G.combat.projectileTravel;
      eLumensPerKill += t.p * lumensBase * t.rewardMult;
      eXpPerKill     += t.p * baseXpPerKill * t.rewardMult;
      eTtk           += t.p * ttkT;
    }

    const pack        = G.enemyFactory.packSizeFor(idx);
    const waveSeconds = pack * eTtk + b.respawnDelay;
    const killsPerMin = 60 * pack / waveSeconds;

    // letalidade: dps recebido ≈ atk do mob × (front+resto)/2, no intervalo fixo do inimigo (enemyInterval, 0.99s)
    // raridade não muda a letalidade média de forma relevante (atkMult dos tiers ignorado aqui, como no mob comum).
    const dpsIn = mobAtk * ((pack + 1) / 2) / G.combat.enemyInterval;
    const ttd   = s.hp / dpsIn;
    const deadly = ttd < eTtk;   // morre antes do 1º kill → income real ~0

    return {
      killsPerMin,
      lumensPerMin: eLumensPerKill * killsPerMin,
      xpPerMin:     eXpPerKill * killsPerMin,
      lumensPerKill: eLumensPerKill,
      xpPerKill:     eXpPerKill,
      ttk: eTtk,
      deadly,
    };
  },
};
