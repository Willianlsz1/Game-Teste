// ui-intro.js — L3b: cena de intro em 3 tempos "o juramento da Ordre" (docs/design/LAUNCH_ITCHIO.md §L3b).
// Full-screen, skippável só pelo botão "Accept" no tempo 3 (clique fora do card NÃO fecha —
// clique em qualquer lugar da cena apenas ADIANTA o tempo, não fecha a intro).
// Aparece 1x na vida de um save NOVO (flag d.hints.introSeen, reveals.js). Save antigo
// (veterano) nunca vê: reveals._deriveFromLegacyState já marca introSeen=true na migração.
//
// 3 tempos, avanço SÓ por clique do jogador (nenhum timer automático — a cena fica
// parada no tempo 1 até o jogador clicar; "Click to continue" reforça isso).

Object.assign(G.ui, {

  _introBeatTimers: [],
  _introBeatIndex: 0,

  bindIntro() {
    const scene = document.getElementById("intro-screen");
    const btn = document.getElementById("intro-begin-btn");
    if (btn) {
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation(); // não deixa o clique do Accept também "adiantar" o tempo
        this.dismissIntro();
      });
    }
    if (scene) {
      // clique em qualquer lugar da cena (menos o Accept) adianta o próximo tempo —
      // NUNCA fecha a intro (contrato L3: só o botão fecha).
      scene.addEventListener("click", () => this._introAdvance());
    }
    // fallback de arte: se intro_bg.png não existir, troca pra awaken_bg.png
    if (scene) {
      const probe = new Image();
      probe.onerror = () => { scene.style.setProperty("--intro-bg-url", "url('assets/ui/awaken_bg.png')"); };
      probe.src = "assets/ui/intro_bg.png";
    }
  },

  // chamado 1x no boot (main.js), depois de G.state.load(): mostra a intro se ainda não vista.
  maybeShowIntro() {
    if (!G.reveals || G.reveals.hintSeen("introSeen")) return;
    const el = document.getElementById("intro-screen");
    if (!el) return;
    // L6 (dono jul/05): a intro CONGELA o jogo por completo — zero tick enquanto o jogador
    // lê a cena (save novo). O combate só arranca no Accept (dismissIntro libera). Sem isto,
    // o loop rodava por baixo e o jogador chegava ~nível 7 antes de aceitar.
    if (G.combat) G.combat.frozen = true;
    el.hidden = false;
    this._introStart();
  },

  // reseta a cena para o tempo 1. Sem timers — o jogador avança clicando.
  _introStart() {
    this._introClearTimers();
    this._introBeatIndex = 1;
    const beats = [
      document.getElementById("intro-beat-1"),
      document.getElementById("intro-beat-2"),
      document.getElementById("intro-beat-3"),
    ];
    beats.forEach((b, i) => { if (b) b.hidden = i !== 0; });
    const hint = document.getElementById("intro-skip-hint");
    if (hint) hint.classList.remove("is-hidden");
  },

  _introClearTimers() {
    this._introBeatTimers.forEach((t) => clearTimeout(t));
    this._introBeatTimers = [];
  },

  _introShowBeat(n) {
    if (n <= this._introBeatIndex) return; // já adiantado (por clique ou timer anterior)
    this._introBeatIndex = n;
    for (let i = 1; i <= 3; i++) {
      const el = document.getElementById("intro-beat-" + i);
      if (el) el.hidden = i !== n;
    }
    // beat 3 é a "ordem de missão" + Accept — o CTA "click to continue" some, pois o
    // Accept passa a ser a única ação (clicar fora do botão só reforça o clique, não fecha).
    const hint = document.getElementById("intro-skip-hint");
    if (hint) hint.classList.toggle("is-hidden", n >= 3);
  },

  // clique na cena: pula direto pro próximo tempo (impaciente pula a encenação).
  _introAdvance() {
    if (this._introBeatIndex >= 3) return; // já no tempo final — só o Accept fecha
    this._introClearTimers();
    this._introShowBeat(this._introBeatIndex + 1);
  },

  dismissIntro() {
    this._introClearTimers();
    if (G.reveals) G.reveals.markHintSeen("introSeen");
    if (G.state && G.state.save) G.state.save();
    const el = document.getElementById("intro-screen");
    if (el) el.hidden = true;
    // L6: libera o START — o combate arranca AGORA (do nível 1, nada morto), não antes.
    if (G.combat) G.combat.frozen = false;
  },
});
