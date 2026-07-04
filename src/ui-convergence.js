// ui-convergence.js — tela de Convergence (prestige): pontos, contadores e o botão de
// renascimento. Regras vivem em G.convergence.

Object.assign(G.ui, {

  bindConvergence() {
    // Convergence (prestige): confirma e renasce
    if (this.el["btn-converge"])
      this.el["btn-converge"].addEventListener("click", () => {
        if (!G.convergence.canConverge()) return;
        const pts = G.convergence.pending();
        if (confirm(`Converge now for ${G.util.fmt(pts)} Convergence Points? Your level resets to 1.`)) {
          G.convergence.converge();
          this.renderConvergence();
        }
      });
  },

  // ---------- CONVERGENCE ----------
  renderConvergence() {
    const d = G.state.data;
    if (this.el["conv-points"]) this.el["conv-points"].textContent = G.util.fmt(d.convergencePoints || 0);
    if (this.el["conv-count"]) this.el["conv-count"].textContent = d.convergences || 0;
    if (this.el["conv-highest"]) this.el["conv-highest"].textContent = G.util.fmt(d.highestLevel || d.level);
    if (this.el["conv-pending"]) this.el["conv-pending"].textContent = G.util.fmt(G.convergence.pending());
    if (this.el["conv-current"]) this.el["conv-current"].textContent = `Lv ${G.util.fmt(d.level)} · ${G.data.currentArea().name}`;
    if (this.el["conv-return"]) this.el["conv-return"].textContent = `Lv 1 · ${G.data.areas[0].name}`;
    if (this.el["conv-next"]) this.el["conv-next"].textContent = G.util.fmt(G.convergence.currentGate());
    const btn = this.el["btn-converge"];
    if (btn) {
      const ok = G.convergence.canConverge();
      btn.disabled = !ok;
      btn.textContent = ok ? "Converge" : `Reach Lv ${G.util.fmt(G.convergence.currentGate())}`;
    }
  },
});
