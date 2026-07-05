// =============================================================
// economy.js — FUNDAÇÃO ECONÔMICA: materiais + sistema de drop configurável
// =============================================================
// Apenas INFRAESTRUTURA — nenhum balanceamento (exceto awakenMaterial, ver abaixo).
// Probabilidades, quantidades e gates de área abaixo são PLACEHOLDERS configuráveis (não finais).
// awakenMaterial (common/rare/boss): P9-calibrado (tools/p9) — relógio do First Light; não editar
// à mão, re-fitar. O resto (commonMaterial, elite, miniBoss.awakenMaterial) continua placeholder.
//
// Recursos novos (em G.state.data):
//   gearMaterials:   { common, uncommon }   → futuras promoções de raridade
//   awakenMaterials: { firstLight }          → First Light / Awakens

G.economy = {
  GEAR_MATERIALS: ["common", "uncommon"],
  AWAKEN_MATERIALS: ["firstLight"],

  // estrutura inicial dos materiais (fonte única p/ fresh e reconciliação)
  freshMaterials() {
    return {
      gearMaterials: { common: 0, uncommon: 0 },
      awakenMaterials: { firstLight: 0 },
    };
  },

  // garante os campos em saves antigos; nunca sobrescreve valores existentes.
  reconcile(data) {
    const f = this.freshMaterials();
    data.gearMaterials = Object.assign({}, f.gearMaterials, data.gearMaterials || {});
    data.awakenMaterials = Object.assign({}, f.awakenMaterials, data.awakenMaterials || {});
  },

  // ---- acesso / armazenamento ----
  getGear(kind) { const m = G.state.data.gearMaterials; return (m && m[kind]) || 0; },
  getAwaken(kind) { const m = G.state.data.awakenMaterials; return (m && m[kind]) || 0; },
  addGear(kind, n) { const m = G.state.data.gearMaterials; m[kind] = (m[kind] || 0) + n; },
  addAwaken(kind, n) { const m = G.state.data.awakenMaterials; m[kind] = (m[kind] || 0) + n; },

  // ---- conversão de materiais (Forge): subir de tier ----
  // recipe: junta `rate` do material de baixo → 1 do de cima.
  CONVERSIONS: [],   // Forge volta no Mapa 2 (diretriz do dono jul/2026)
  conversionRate(c) { return G.data.balance[c.rateKey]; },
  maxConversions(c) { return Math.floor(this.getGear(c.from) / this.conversionRate(c)); },

  // converte `times` lotes (default: o máximo possível). devolve quantos lotes converteu.
  convertGear(c, times) {
    const rate = this.conversionRate(c);
    const max  = this.maxConversions(c);
    const n    = times == null ? max : Math.min(times, max);
    if (n <= 0) return 0;
    this.addGear(c.from, -n * rate);
    this.addGear(c.to, n);
    return n;
  },

  // ================= SISTEMA DE DROP (configurável) =================
  // dropTable POR TIPO de inimigo. Cada material: { chance, min, max, minAreaIndex }.
  // P3: Mapa 1 só tem Common + Awaken. uncommonMaterial/Forge = Mapa 2 (fora daqui).
  // Common mat: G1 3ª área+ (idx≥2). Awaken mat: G5+ (idx≥12). Harbinger SEM garantia (chance<1).
  // P10 fase1b (modelo Gaiadon §4.6 — drop escalado por RANK): as TAXAS estão ANCORADAS na banda
  //   do gênero — mob comum ~5% (commonMaterial 0.05 ✓), aceso/elite 15% (rare commonMaterial 0.15,
  //   aceso é a FONTE do material-chave uncommonMaterial ✓), boss token GARANTIDO 100% (boss
  //   awakenMaterial/uncommonMaterial chance 1 ✓). Estrutura do Éclats preservada (comum ×50 = massa
  //   + incomum-chave dos acesos); só as taxas seguem a banda. Provisório — fit final na Fase 2.
  dropTable: {
    common:   {
      commonMaterial: { chance: 0.05, min: 1, max: 1, minAreaIndex: 2 },
      awakenMaterial: { chance: 0.5, min: 1, max: 1, minAreaIndex: 12, qtyAreaMult: { 15: 1.7, 16: 2.3, 17: 3.2 } },  // FASE 2 (fitter jul/05): chance 1→0.5 — material pinga (não em todo kill) pro G6 ser combate+coleta
    },
    rare:     {
      commonMaterial:   { chance: 0.15, min: 1, max: 2, minAreaIndex: 2 },
      awakenMaterial:   { chance: 0.6, min: 1, max: 3, minAreaIndex: 12, qtyAreaMult: { 15: 1.7, 16: 2.3, 17: 3.2 } },  // FASE 2 (fitter jul/05): chance 1→0.6 — aceso pinga um pouco mais que comum
      // P9 r4 (§9 item 4): material INCOMUM (chave da promoção) — SÓ mobs acesos (Ember/Lumen/Corona) o dropam.
      // chance/qtd a fitar (tools/p9). rare = qualquer mob com .rarity (aceso).
      uncommonMaterial: { chance: 0.10, min: 1, max: 1, minAreaIndex: 0 },
    },
    elite:    {
      commonMaterial:   { chance: 1,   min: 1, max: 2, minAreaIndex: 2 },
    },
    miniBoss: {
      commonMaterial:   { chance: 1,   min: 2, max: 4, minAreaIndex: 2 },
      awakenMaterial:   { chance: 0.5, min: 1, max: 1, minAreaIndex: 12 },
    },
    boss:     {
      commonMaterial:   { chance: 0.45, min: 2, max: 4, minAreaIndex: 2 },
      awakenMaterial:   { chance: 1, min: 40, max: 90, minAreaIndex: 12, qtyAreaMult: { 15: 1.7, 16: 2.3, 17: 3.2 } },  // FASE 2 (fitter jul/05): {181,454}→{40,90} — token de boss garantido, re-ancorado ao requisito 40000 do FL
      uncommonMaterial: { chance: 1, min: 2, max: 4, minAreaIndex: 0 },  // P9 r4 (§9 item 4): Harbingers dropam a chave (massa por boss); qtd a fitar
    },
  },

  // roteia a chave da tabela para o campo de inventário correspondente
  MATERIAL_SINK: {
    commonMaterial:   { bucket: "gear",   kind: "common" },
    uncommonMaterial: { bucket: "gear",   kind: "uncommon" },
    awakenMaterial:   { bucket: "awaken", kind: "firstLight" },
  },

  // tipo de drop de um inimigo (deriva das flags do enemy; elite/miniBoss = futuro)
  enemyType(enemy) {
    if (!enemy) return "common";
    if (enemy.isMiniBoss) return "miniBoss";
    if (enemy.isBoss) return "boss";
    if (enemy.isElite) return "elite";
    if (enemy.rarity) return "rare";
    return "common";
  },

  // multiplicador de QUANTIDADE vindo das passivas (placeholders → 1.0 hoje)
  passiveQtyMult(materialKey) {
    if (!G.passives) return 1;
    const e = G.passives.effects();
    const general = e.matGeneralPct || 0;
    let mult = (1 + (e.matQuantity || 0) / 100) * (1 + general / 100);
    if (materialKey === "commonMaterial")   mult *= 1 + (e.matCommonPct || 0) / 100;
    if (materialKey === "uncommonMaterial") mult *= 1 + (e.matUncommonPct || 0) / 100;
    if (materialKey === "awakenMaterial")   mult *= 1 + (e.awakenMatPct || 0) / 100;
    return mult;
  },

  // multiplicador de CHANCE vindo das passivas (Vestige: dropRate) — placeholder → 1.0
  passiveChanceMult() {
    if (!G.passives) return 1;
    return 1 + (G.passives.effect("dropRate") || 0) / 100;
  },

  // rola os drops de um inimigo morto, aplica no inventário e devolve { matKey: qty }.
  rollDrops(enemy, opts) {
    opts = opts || {};
    const rng = opts.rng || Math.random;
    const areaIndex = (opts.areaIndex != null) ? opts.areaIndex : ((G.state.data && G.state.data.areaIndex) || 0);
    const type = opts.type || this.enemyType(enemy);
    const table = this.dropTable[type];
    const out = {};
    if (!table) return out;
    const chanceMult = this.passiveChanceMult();
    for (const matKey of Object.keys(table)) {
      const d = table[matKey];
      if (areaIndex < (d.minAreaIndex || 0)) continue;
      const chance = Math.min(1, (d.chance || 0) * chanceMult);
      if (rng() >= chance) continue;
      const span = (d.max - d.min);
      const baseQty = d.min + (span > 0 ? Math.floor(rng() * (span + 1)) : 0);
      // P9 r5 (§9 var 17c): escala de QUANTIDADE por área — d.qtyAreaMult = { areaIndex: mult }.
      // Usada pro drop de awakenMaterial CRESCER dentro do G6 (área 16 < 17 < 18): a reta
      // final acelera em vez de farm chapado. Ausente = 1 (nenhuma mudança nos demais drops).
      const areaMult = (d.qtyAreaMult && d.qtyAreaMult[areaIndex] != null) ? d.qtyAreaMult[areaIndex] : 1;
      const qty = Math.max(0, Math.round(baseQty * areaMult * this.passiveQtyMult(matKey)));
      if (qty <= 0) continue;
      const sink = this.MATERIAL_SINK[matKey];
      if (!sink) continue;
      if (sink.bucket === "gear") this.addGear(sink.kind, qty);
      else this.addAwaken(sink.kind, qty);
      out[matKey] = (out[matKey] || 0) + qty;
    }
    return out;
  },
};
