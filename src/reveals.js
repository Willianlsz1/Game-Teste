// reveals.js — L2: revelação progressiva das HUDs (o coração do onboarding).
// Telas/botões nascem ocultos e aparecem por gatilho (beacon + 1 linha de log na 1ª vez).
// Regras vivem AQUI; ui-hud/ui-core só leem G.reveals para esconder/mostrar botões.
//
// Tabela de gatilhos (docs/design/LAUNCH_ITCHIO.md, seção L2 — aprovada pelo dono):
//   Battle+Gear   — sempre visíveis; hint one-shot "upgrade your gear" no 1º acúmulo de
//                   Lumens suficiente pro 1º level-up de QUALQUER peça equipada.
//   Forge         — 1º material COMUM dropa.
//   World Map     — porta da área 2 batida (G.progression.levelGateFor(1)).
//   Convergence   — nível atinge ~80% do 1º gate de Convergence.
//   Passives      — 1ª Convergence CONCLUÍDA; a tela abre SOZINHA na 1ª vez.
//   Awaken        — 1º material INCOMUM dropa.
//   Corona        — já invisível pré-First Light por decisão anterior (state.js/data.js);
//                   este módulo não mexe nisso, só não vaza a palavra em lugar nenhum.
//
// Saves ANTIGOS (sem os campos d.reveals/d.hints): reconcile() deriva as flags do estado
// já alcançado — um jogador veterano NUNCA vê algo sumir. Saves NOVOS: tudo false/oculto.
//
// L3 (docs/design/LAUNCH_ITCHIO.md §L3 — onboarding dos primeiros minutos), reusa o MESMO
// mecanismo de d.hints (one-shot, persistido, nunca repete):
//   introSeen   — tela de intro de jogo novo (full-screen, só fecha no botão "Begin").
//   gearUpgrade — já existia (L2): 1º acúmulo de Lumens pro 1º level-up de QUALQUER peça.
//   death       — 1ª morte do Seeker (combat.js:onDeath).
//   promotion   — 1ª peça no cap + materiais suficientes pra promover (Forge).
//   harbinger   — 1ª vez que o contador do Harbinger fica visível.
// Save antigo (veterano): ver _deriveFromLegacyState — introSeen e os demais hints são
// marcados true junto com gearUpgrade (nunca retroativos).

G.reveals = {
  KEYS: ["forge", "worldmap", "convergence", "passives", "awaken"],
  HINT_KEYS: ["gearUpgrade", "introSeen", "death", "promotion", "harbinger"],

  // ~80% do 1º gate de Convergence (dial isolado, não mexe em balance real de Convergence)
  CONVERGENCE_GATE_FRAC: 0.8,

  freshFlags() {
    const f = {};
    for (const k of this.KEYS) f[k] = false;
    return f;
  },
  freshHints() {
    const h = {};
    for (const k of this.HINT_KEYS) h[k] = false;
    return h;
  },

  // garante os campos em qualquer save (novo OU antigo), sem nunca regredir uma flag já true.
  // saves antigos: se o jogador já tem o material/estado associado, a tela já era "conhecida" —
  // marca revelado direto (deriva de estado, não fica esperando o gatilho de novo).
  reconcile(data) {
    if (!data.reveals || typeof data.reveals !== "object") data.reveals = this.freshFlags();
    else data.reveals = Object.assign(this.freshFlags(), data.reveals);
    if (!data.hints || typeof data.hints !== "object") data.hints = this.freshHints();
    else data.hints = Object.assign(this.freshHints(), data.hints);

    const wasNewSave = !data._revealsSeeded;
    if (wasNewSave) {
      this._deriveFromLegacyState(data);
      data._revealsSeeded = true;
    }
  },

  // heurística de migração: um save que já tem progresso correspondente ao gatilho
  // não deve "perder" a tela — considera revelado retroativamente (sem beacon/log,
  // silencioso, é onboarding que o jogador já passou).
  _deriveFromLegacyState(data) {
    const gearMats = (data.gearMaterials && data.gearMaterials.common) || 0;
    const uncommonMats = (data.gearMaterials && data.gearMaterials.uncommon) || 0;
    const awakenMats = (data.awakenMaterials && data.awakenMaterials.firstLight) || 0;
    const maxArea = data.maxAreaUnlocked || 0;
    const level = data.level || 1;
    const highestLevel = data.highestLevel || level;
    const convergences = data.convergences || 0;

    // heurística "é save veterano": qualquer sinal de progresso além do fresh() literal.
    const isVeteran = gearMats > 0 || uncommonMats > 0 || awakenMats > 0 || maxArea > 0 ||
      level > 1 || highestLevel > 1 || convergences > 0 ||
      (data.totalKills || 0) > 0 || (data.equipped && this._hasAnyGearLevel(data.equipped));

    if (!isVeteran) return;   // save de fato novo (ou fresh() puro) — tudo fica oculto normalmente

    // deriva cada flag independentemente pelo estado equivalente ao gatilho já ter disparado
    if (gearMats > 0 || uncommonMats > 0 || awakenMats > 0) data.reveals.forge = true;
    if (maxArea >= 1) data.reveals.worldmap = true;
    if (convergences > 0 || level >= Math.floor(this._gateGuess(convergences) * this.CONVERGENCE_GATE_FRAC))
      data.reveals.convergence = true;
    if (convergences > 0) data.reveals.passives = true;
    if (uncommonMats > 0 || (data.awakens && data.awakens.length > 0)) data.reveals.awaken = true;

    // um save veterano já passou de todos os hints textuais — não repetir onboarding
    for (const k of this.HINT_KEYS) data.hints[k] = true;

    // fallback duro: qualquer sinal de progresso real também libera tudo (não queremos
    // um veterano preso porque uma heurística específica não bateu — better safe than hidden)
    for (const k of this.KEYS) data.reveals[k] = true;
  },

  _hasAnyGearLevel(equipped) {
    for (const slot in equipped) {
      const it = equipped[slot];
      if (it && (it.level || 1) > 1) return true;
    }
    return false;
  },

  // estimativa do 1º gate de Convergence sem depender de G.convergence (pode não estar
  // carregado ainda na ordem de reconcile) — usa o mesmo dial (convGateBase).
  _gateGuess(convergences) {
    const b = G.data.balance;
    return Math.round(b.convGateBase * Math.pow(b.convGateGrowth, convergences || 0));
  },

  isRevealed(key) {
    const d = G.state.data;
    return !!(d && d.reveals && d.reveals[key]);
  },

  hintSeen(key) {
    const d = G.state.data;
    return !!(d && d.hints && d.hints[key]);
  },

  markHintSeen(key) {
    const d = G.state.data;
    if (!d || !d.hints) return;
    d.hints[key] = true;
  },

  // dispara a revelação (idempotente): se já revelado, não faz nada. Loga + beacon 1ª vez.
  reveal(key, logMsg) {
    const d = G.state.data;
    if (!d || !d.reveals || d.reveals[key]) return false;
    d.reveals[key] = true;
    if (logMsg && G.ui && G.ui.log) G.ui.log(logMsg, "boss");
    if (G.ui && G.ui.onReveal) G.ui.onReveal(key);
    return true;
  },

  // ---------- checagens ligadas aos fluxos existentes (chamadas mínimas) ----------

  // combat.js:onKill, logo após d.lumens += ... — hint one-shot "upgrade your gear"
  checkGearHint() {
    const d = G.state.data;
    if (!d || this.hintSeen("gearUpgrade")) return;
    const equipped = d.equipped || {};
    for (const slot in equipped) {
      const item = equipped[slot];
      if (!item || (G.gear.isMaxed && G.gear.isMaxed(item))) continue;
      if (d.lumens >= G.gear.cost(item)) {
        this.markHintSeen("gearUpgrade");
        if (G.ui && G.ui.log) G.ui.log("✧ You have enough Lumens — upgrade your gear.", "level");
        break;
      }
    }
  },

  // economy.js:rollDrops — chamada com o mapa de drops { matKey: qty } dessa morte.
  // Forge: 1º material COMUM. Awaken: 1º material INCOMUM (uncommonMaterial, G3+/rare+).
  checkMaterialDrops(drops) {
    if (!drops) return;
    if (drops.commonMaterial) this.reveal("forge", "The Forge remembers fire.");
    if (drops.uncommonMaterial) this.reveal("awaken", "A distant light calls.");
  },

  // ---------- L3: hints one-shot dos primeiros minutos (docs/design/LAUNCH_ITCHIO.md §L3) ----------

  // combat.js:onDeath — hint one-shot na 1ª morte do Seeker.
  checkDeathHint() {
    if (this.hintSeen("death")) return;
    this.markHintSeen("death");
    if (G.ui && G.ui.toast) G.ui.toast("The light retreats, not you. Grow stronger and return.");
  },

  // gear.js/ui-gear.js/ui-forge.js — hint one-shot na 1ª peça que está no cap E tem
  // materiais suficientes pra promover (canPromote real, não só "maxada").
  checkPromotionHint() {
    const d = G.state.data;
    if (!d || this.hintSeen("promotion")) return;
    const equipped = d.equipped || {};
    for (const slot in equipped) {
      const item = equipped[slot];
      if (item && G.gear.canPromote && G.gear.canPromote(item)) {
        this.markHintSeen("promotion");
        if (G.ui && G.ui.toast) G.ui.toast("The Forge can awaken this piece.");
        break;
      }
    }
  },

  // ui-battle.js:renderHarbingerCounter — hint one-shot na 1ª vez que o contador aparece.
  checkHarbingerHint() {
    if (this.hintSeen("harbinger")) return;
    this.markHintSeen("harbinger");
    if (G.ui && G.ui.toast) G.ui.toast("Something stirs beneath the grove — count the kills.");
  },

  // progression.js:checkGroupUnlock/unlockNext — World Map: porta da área 2 batida.
  checkWorldMap() {
    const d = G.state.data;
    if (!d || this.isRevealed("worldmap")) return;
    const gate1 = G.progression.levelGateFor(1);
    if ((d.maxAreaUnlocked || 0) >= 1 || d.level >= gate1)
      this.reveal("worldmap", "The grove deepens.");
  },

  // progression.js:checkLevelUp — Convergence: nível atinge ~80% do 1º gate de nível.
  checkConvergence() {
    const d = G.state.data;
    if (!d || this.isRevealed("convergence")) return;
    const gate = G.convergence.currentGate();
    if (d.level >= gate * this.CONVERGENCE_GATE_FRAC)
      this.reveal("convergence", "A threshold nears — something in you could break, and begin anew.");
  },

  // convergence.js:converge() — Passives: 1ª Convergence concluída, tela ABRE SOZINHA 1x.
  onConvergenceComplete() {
    const wasRevealed = this.isRevealed("passives");
    this.reveal("passives", "The World-Tree stirs, roused by your first Convergence.");
    if (!wasRevealed && G.ui && G.ui.openModal) G.ui.openModal("modal-passives");
  },

  // agregador chamado após level-up (progression.checkLevelUp) — roda as checagens
  // dependentes de nível numa só chamada.
  checkLevelGated() {
    this.checkWorldMap();
    this.checkConvergence();
  },

  // ---------- helpers de UI (usados por ui-hud/ui-core p/ esconder botões) ----------

  // toolbar: mapeia o título do botão (data-reveal) pra chave de reveals. Ver index.html.
  BUTTON_KEYS: { worldmap: "worldmap", forge: "forge", convergence: "convergence", passives: "passives", awaken: "awaken" },
};
