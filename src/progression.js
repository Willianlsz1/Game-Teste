// progression.js — desbloqueio de áreas e level-up. Extraído de combat.js.
// combat.onKill chama G.progression.checkLevelUp; combat.markBossCleared chama G.progression.unlockNext.

G.progression = {
  unlockNext() {
    const d = G.state.data;
    if (typeof d.maxAreaUnlocked !== "number") d.maxAreaUnlocked = d.areaIndex;
    if (d.areaIndex < G.data.areas.length - 1 && d.areaIndex + 1 > d.maxAreaUnlocked) {
      d.maxAreaUnlocked = d.areaIndex + 1;
      if (G.ui && G.ui.log) {
        const next = G.data.areas[d.areaIndex + 1];
        G.ui.log(`✦ ${next.name} unlocked, advance when ready.`, "good");
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
      if (G.ui && G.ui.log) G.ui.log(`✦ ${G.data.areas[nextIdx].name} unlocked, the grove deepens.`, "good");
      if (G.ui && G.ui.renderResources) G.ui.renderResources();
    }
  },
};
