// rates.js — tracker de taxas (Gold/XP/Kills) em janela rolante.
// Extraído de combat.js: combat registra ganhos via G.rates.note(); ui.renderHud lê de G.rates.getRates().

G.rates = {
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
};
