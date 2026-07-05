// ui-intro.js — L3: tela de intro de jogo novo (docs/design/LAUNCH_ITCHIO.md §L3).
// Full-screen, skippável só pelo botão "Begin" (clique fora do card NÃO fecha).
// Aparece 1x na vida de um save NOVO (flag d.hints.introSeen, reveals.js). Save antigo
// (veterano) nunca vê: reveals._deriveFromLegacyState já marca introSeen=true na migração.

Object.assign(G.ui, {

  bindIntro() {
    const btn = document.getElementById("intro-begin-btn");
    if (btn) btn.addEventListener("click", () => this.dismissIntro());
    // Nota: sem handler de clique no overlay — clicar fora do card NÃO fecha (spec L3).
  },

  // chamado 1x no boot (main.js), depois de G.state.load(): mostra a intro se ainda não vista.
  maybeShowIntro() {
    if (!G.reveals || G.reveals.hintSeen("introSeen")) return;
    const el = document.getElementById("intro-screen");
    if (el) el.hidden = false;
  },

  dismissIntro() {
    if (G.reveals) G.reveals.markHintSeen("introSeen");
    if (G.state && G.state.save) G.state.save();
    const el = document.getElementById("intro-screen");
    if (el) el.hidden = true;
  },
});
