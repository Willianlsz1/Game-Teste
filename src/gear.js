// gear.js — 6 peças fixas: level-up com Lumens

G.gear = {
  // retorna valor de um afixo no nível atual da peça
  // af.step (opcional): ganho em DEGRAUS — só pula a cada `step` níveis (breakpoints).
  // A média é idêntica ao ganho liso; muda só a sensação (pop perceptível vs gota invisível).
  affixValue(item, af) {
    const r = G.data.rarities.find(r => r.id === item.rarity);
    let mult = r ? (r.statMult || 1) : 1;
    // FASE 2 R2 (fitter jul/05): critDmg NÃO recebe o statMult da promoção — senão a promoção Uncommon (×8)
    //   inflava o critMult a ~818× (one-shot que fazia gear-só-vence). O poder da promoção mora no FLAT
    //   atk/hp (×8); crit fica um modificador modesto (~2×), não o dano inteiro. Assim uncommon ~×8-11 sobre
    //   common (banda Gaiadon §4.2), não ×67000. — DIAL (estrutural)
    if (af.stat === 'critDmg') mult = 1;
    // Rarity Find (P8.1): valor em DEGRAUS — sobe perStep a cada `step` níveis (nível 50 = 1 degrau).
    // Sem multiplicador de raridade (os valores já são calibrados p/ encher o teto no gear realista).
    if (af.perStep != null) {
      const steps = Math.floor((item.level || 1) / (af.step || 50));
      const val = (af.base || 0) + af.perStep * steps;
      return af.cap != null ? Math.min(val, af.cap) : val;
    }
    const lv = (item.level || 1) - 1;
    const eff = af.step ? Math.floor(lv / af.step) * af.step : lv;
    let per = af.perLevel;
    // FASE 2 R2 (fitter jul/05, dono OPÇÃO 1): gearPowerScale reduz a MAGNITUDE do ATK do gear (flat+pct)
    //   — o gear maxado (comum e uncommon ×8) dava ATK enorme e o baseline SEM prestige alcançava a área 18,
    //   quebrando o canon "gear sozinho não vence". Com o ATK escalado + a promoção sendo o salto (×8 flat,
    //   gateada por material), o baseline no-prestige vira death-grind de horas no G1-G2 e o prestige
    //   (passivas: flat firstSpark + pct% + crown) volta a ser o caminho real. — DIAL
    const scale = G.data.balance.gearPowerScale;
    // FASE 2 R2: escala só o ATK (poder de matar = a parede). HP do jogador fica intacto — a parede é
    //   TTK/HTK (não sobrevivência), e mexer no HP do gear quebra a magnitude esperada por outros sistemas.
    if (scale != null && af.stat === 'atk') per = per * scale;
    const val = af.base + per * mult * eff;
    return af.cap != null ? Math.min(val, af.cap) : val;
  },

  // teto de nível pela raridade
  cap(item) {
    const r = G.data.rarities.find((r) => r.id === item.rarity);
    return r ? r.cap : 10;
  },

  isMaxed(item) { return (item.level || 1) >= this.cap(item); },

  // P6 (custo QUADRÁTICO): custo do próximo nível cresce LINEARMENTE no nível →
  //   custo(N) = base × (1 + gearCostLinear × (N-1)) × costMult; o ACUMULADO Σ1..N é quadrático
  //   (grind confortável logo após promover). Fallback geométrico (gearCostGrowth) só se
  //   gearCostLinear === null. (Gaiadon §4.3.)
  cost(item) {
    const b = G.data.balance;
    const r = G.data.rarities.find(r => r.id === item.rarity);
    const costMult = r ? (r.costMult || 1) : 1;
    const lvl = (item.level || 1) - 1;
    // FASE 2 (fitter): gear é progressão MAP-LONG. A renda de Lumens cresce ~nível^2.1 (goldBuckets),
    //   então um custo LINEAR no nível fica pra trás e o gear maxa na hora. gearCostExp faz o custo
    //   por nível crescer como nível^exp (exp~2 → custo/nível acompanha a renda; acumulado ~nível^(exp+1)):
    //     custo(N) = base × (1 + linear × (N-1)^exp) × costMult.
    //   Os PRIMEIROS níveis ficam ~base (hook rápido); a curva sobe forte só depois — o gear completo
    //   (Common→promover→Uncommon maxed, todos slots) só fecha ~área 17/18. gearCostExp=null = P6 (linear).
    const exp = (b.gearCostExp != null) ? b.gearCostExp : 1;
    const factor = (b.gearCostLinear != null)
      ? (1 + b.gearCostLinear * Math.pow(lvl, exp))  // FASE 2: super-linear no nível (acompanha a renda ~nível^2.1)
      : Math.pow(b.gearCostGrowth, lvl);             // legado geométrico
    return Math.ceil(b.gearCostBase * factor * costMult);
  },

  // sobe 1 nível; devolve true se conseguiu
  levelUp(item) {
    if (this.isMaxed(item)) return false;
    const cost = this.cost(item);
    if (G.state.data.lumens < cost) return false;
    G.state.data.lumens -= cost;
    item.level = (item.level || 1) + 1;
    G.state.invalidateStats();
    return true;
  },

  // sobe N níveis de uma vez (n pode ser "max")
  levelUpTimes(item, n) {
    const times = n === "max" ? this.cap(item) - (item.level || 1) : n;
    let done = 0;
    for (let i = 0; i < times; i++) {
      if (this.levelUp(item)) done++;
      else break;
    }
    return done;
  },

  // rarity helpers
  _nextRarity(rarityId) {
    const idx = G.data.rarities.findIndex(r => r.id === rarityId);
    return (idx >= 0 && idx < G.data.rarities.length - 1) ? G.data.rarities[idx + 1].id : null;
  },

  // P9 r4 (§9 item 4): promoção em DOIS materiais. Common→Uncommon consome
  //   commonMaterial (massa) + uncommonMaterial (chave). Regra geral N→N+1 = mat(N)+mat(N+1).
  // Retorna ARRAY de { kind, amount } (cada custo em seu tier), ou null se não-promovível.
  promoteCost(item) {
    if (item.rarity === 'common') return [
      { kind: 'common',   amount: G.data.balance.promoteCommonCost },
      { kind: 'uncommon', amount: G.data.balance.promoteUncommonCost },
    ];
    return null;   // uncommon é terminal no Mapa 1 (Rare volta no Mapa 2)
  },

  // tem todos os materiais do custo?
  hasPromoteMats(item) {
    const cost = this.promoteCost(item);
    if (!cost) return false;
    return cost.every(c => G.economy.getGear(c.kind) >= c.amount);
  },

  canPromote(item) {
    if (!this.isMaxed(item)) return false;
    if (!this._nextRarity(item.rarity)) return false;
    return this.hasPromoteMats(item);
  },

  // consumes materials, promotes piece to next rarity keeping current level
  promote(item) {
    if (!this.isMaxed(item)) return false;
    const nextId = this._nextRarity(item.rarity);
    if (!nextId) return false;
    const cost = this.promoteCost(item);
    if (!cost || !this.hasPromoteMats(item)) return false;
    for (const c of cost) G.economy.addGear(c.kind, -c.amount);
    const currentLevel = item.level || 1;
    const newPiece = this.buildPiece(item.slot, nextId);
    newPiece.level = currentLevel;
    G.state.data.equipped[item.slot] = newPiece;
    G.state.invalidateStats();
    return true;
  },

  // monta uma peça a partir de gearBase + raridade (inclui afixos exclusivos da raridade)
  buildPiece(slotId, rarityId) {
    const base   = G.data.gearBase[slotId];
    const slot   = G.data.slots.find((s) => s.id === slotId);
    const rarity = G.data.rarities.find((r) => r.id === rarityId) || G.data.rarities[0];
    const DISP_PCT = G.data.pctStats;
    const rarityExtras = base[rarityId + "Affixes"] || [];
    const allAffixes = [...base.affixes, ...rarityExtras];
    return {
      slot:       slotId,
      slotLabel:  slot ? slot.label : slotId,
      name:       base.name,
      rarity:     rarity.id,
      rarityName: rarity.name,
      color:      rarity.color,
      level:      1,
      affixes:    allAffixes.map((a) => ({
        id:       a.id,
        label:    a.label,
        stat:     a.stat,
        layer:    a.layer || "flat",
        pct:      a.layer === "pct" || DISP_PCT.indexOf(a.stat) !== -1,
        base:     a.base,
        perLevel: a.perLevel,
        perStep:  a.perStep,
        step:     a.step,
        cap:      a.cap,
      })),
    };
  },

  // conjunto inicial: todas as 6 peças no Lv.1, raridade Common
  freshSet() {
    const set = {};
    for (const slot of G.data.slots) set[slot.id] = this.buildPiece(slot.id, "common");
    return set;
  },

  // reconstrói as peças do save preservando nível (migra saves antigos)
  reconcile(saved) {
    const out = {};
    for (const slot of G.data.slots) {
      const prev   = saved && saved[slot.id];
      const rarity = (prev && prev.rarity && G.data.rarities.find((r) => r.id === prev.rarity))
        ? prev.rarity : "common";
      const piece  = this.buildPiece(slot.id, rarity);
      if (prev && prev.level) piece.level = Math.max(1, Math.min(prev.level, this.cap(piece)));
      out[slot.id] = piece;
    }
    return out;
  },
};
