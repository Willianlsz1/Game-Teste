// spotlight.js — L2.5: onboarding GUIADO de 2 passos por desbloqueio (docs/design/LAUNCH_ITCHIO.md §L2.5).
// Constrói SOBRE o L2 (reveals.js) e o beacon do P-UI-1 (ui-core.js): quando um sistema novo
// é revelado, em vez de só o beacon passivo, mostramos:
//   Passo 1 (HUD): overlay escurece a tela, um "furo" iluminado destaca o botão novo na
//   toolbar, seta apontando + 1 linha de texto. Clicar no botão iluminado abre a tela e
//   segue pro passo 2. Clicar em QUALQUER outro lugar pula o guia inteiro (marca visto) —
//   o beacon dourado do L2 (ui-core.js) continua existindo como fallback normal.
//   Passo 2 (dentro da tela): UM spotlight no elemento central da tela + 1 linha. Clique em
//   qualquer lugar dispensa. Nunca repete (persistido em d.hints, chaves guide_<sistema>).
//
// Passives é especial: a tela JÁ abre sozinha na 1ª Convergence (reveals.js:onConvergenceComplete
// -> G.ui.openModal) — pulamos o passo 1 e vamos direto ao passo 2 dentro da tela auto-aberta.
//
// Técnica do "furo": overlay full-screen semi-opaco (não bloqueia clique fora do alvo — o
// clique fora é justamente o que pula o guia) + um box-shadow GIGANTE invertido no próprio
// elemento-alvo (spread enorme, cor semi-opaca) faz o resto da tela escurecer ao redor dele
// SEM precisar de clip-path/máscara recortada na forma exata do botão. É a técnica mais
// simples e robusta pedida no brief: funciona em qualquer formato de alvo (botão redondo,
// retângulo, ícone irregular) porque box-shadow segue o border-radius do próprio elemento.
G.spotlight = {
  // ---- configuração por sistema (dono, LAUNCH_ITCHIO.md §L2.5) — 5 configs, 1 componente ----
  CONFIG: {
    forge: {
      hintKey: "guide_forge",
      step1: { targetSel: "#btn-forge", text: "The Forge has awakened — open it.", modalId: "modal-forge" },
      step2: { targetSel: "#forge-promote", text: "Promotion awaits — rarity is power." },
    },
    worldmap: {
      hintKey: "guide_worldmap",
      step1: { targetSel: "#btn-worldmap", text: "New paths call — open the map.", modalId: "modal-worldmap" },
      // "next area" = a fronteira do progresso (maxAreaUnlocked), não necessariamente a área
      // ATUAL (d.areaIndex pode já ter avançado até lá). resolve() escolhe o nó certo pelo
      // índice em vez de depender de qual classe CSS o primeiro nó do DOM tem.
      step2: {
        text: "Your next hunt lies ahead.",
        resolve() {
          const d = G.state.data;
          const total = G.data.areas.length;
          const idx = Math.min(d.maxAreaUnlocked || 0, total - 1);
          return document.querySelector(`.wmap-node[data-area="${idx}"]`) ||
            document.querySelector(".wmap-node:not(.is-locked)");
        },
      },
    },
    convergence: {
      hintKey: "guide_convergence",
      step1: { targetSel: "#btn-convergence", text: "The light can converge now — see how.", modalId: "modal-convergence" },
      step2: { targetSel: "#btn-converge", text: "Convergence resets the climb — and pays in permanent power." },
    },
    passives: {
      hintKey: "guide_passives",
      // sem step1: a tela já abre sozinha (reveals.js:onConvergenceComplete). Alvo do passo 2
      // é o nó raiz (First Spark, índice 0) da Árvore I.
      step2: { targetSel: '.pv-node[data-i="0"]', text: "Spend your Convergence Points here. First Spark is where it begins." },
    },
    awaken: {
      hintKey: "guide_awaken",
      step1: { targetSel: "#btn-awaken", text: "A distant light calls — answer it.", modalId: "modal-awaken" },
      step2: { targetSel: "#awaken-preview", text: "The rite asks four proofs. Gather them." },
    },
  },

  // ---------- estado interno (nós DOM do overlay ativo, se houver) ----------
  _active: null, // { key, step, overlay, cleanup() }

  hintSeen(hintKey) {
    return !!(G.reveals && G.reveals.hintSeen(hintKey));
  },
  markSeen(hintKey) {
    if (G.reveals) G.reveals.markHintSeen(hintKey);
  },

  // chamado por G.ui.onReveal(key) — decide se mostra o passo 1 (ou pula reto pro passo 2,
  // caso do Passives, cujo caller cuida de abrir a tela antes de chamar startStep2 direto).
  onReveal(key) {
    const cfg = this.CONFIG[key];
    if (!cfg || this.hintSeen(cfg.hintKey)) return;
    if (!cfg.step1) return; // Passives: sem passo 1, o próprio fluxo de auto-open chama startStep2
    this._startStep1(key, cfg);
  },

  // chamado por G.ui.openModal() depois de a tela abrir — se o sistema tem um passo 2
  // pendente (guia não visto) E o passo 1 (se existir) já foi resolvido (clicado, não pulado),
  // mostra o passo 2. Se o guia foi pulado no passo 1, a flag já está marcada e isto não roda.
  //
  // SÍNCRONO de propósito: openModal() já chama render<Tela>() (innerHTML do alvo) ANTES de
  // zerar `hidden`, e chama isto DEPOIS de `hidden=false` — logo o alvo já existe no DOM com
  // layout válido (getBoundingClientRect não dá 0×0) no mesmo tick, sem precisar de
  // requestAnimationFrame. (Um rAF puro depende do laço de renderização do navegador rodar de
  // novo, o que não acontece de forma confiável enquanto a aba não pinta — ex. automação
  // headless — então evitamos essa dependência para o caminho comum.) Mantém 1 rAF de
  // fallback só se o alvo ainda não existir na primeira tentativa (telas com render assíncrono
  // futuro), sem bloquear o caminho síncrono de hoje.
  maybeStartStep2(key) {
    const cfg = this.CONFIG[key];
    if (!cfg || !cfg.step2) return;
    if (this.hintSeen(cfg.hintKey)) return;
    const found = cfg.step2.resolve ? cfg.step2.resolve() : document.querySelector(cfg.step2.targetSel);
    if (found) { this._startStep2(key, cfg); return; }
    requestAnimationFrame(() => this._startStep2(key, cfg));
  },

  // ---------- PASSO 1 ----------
  // NOTA DE IMPLEMENTAÇÃO: a toolbar (.hud) é `position:fixed; z-index:10` — isso cria um
  // stacking context PRÓPRIO, então nenhum z-index aplicado ao botão-alvo (dentro do .hud)
  // consegue "furar" acima de um overlay solto em document.body por z-index sozinho (z-index
  // só compete DENTRO do mesmo contexto de empilhamento; o .hud inteiro já está pregado no
  // z-index 10 do PAI). Por isso o overlay aqui é decorativo/visual (box-shadow do alvo cuida
  // do escurecimento) e NÃO é o que decide dentro/fora — quem decide é um listener de CAPTURA
  // no document, que roda ANTES de qualquer handler nos elementos da UI (então nunca é
  // bloqueado por stacking) e distingue "clicou no alvo" vs "clicou em qualquer outra coisa"
  // olhando o e.target real do clique.
  _startStep1(key, cfg) {
    const target = document.querySelector(cfg.step1.targetSel);
    if (!target) return; // alvo ausente (DOM incompleto) — falha silenciosa, beacon cobre o fallback
    this._teardown();

    const overlay = document.createElement("div");
    overlay.className = "spotlight-overlay";
    document.body.appendChild(overlay);

    const caption = document.createElement("div");
    caption.className = "spotlight-caption spotlight-caption--step1";
    caption.innerHTML = `<span class="spotlight-arrow">▲</span><span class="spotlight-text">${cfg.step1.text}</span>`;
    document.body.appendChild(caption);

    target.classList.add("spotlight-hole");
    this._positionCaption(caption, target, "below");

    // captura no document: clique DENTRO do alvo -> só desmonta (o clique real do botão segue
    // seu fluxo normal, abre o modal); clique FORA -> pula o guia inteiro (marca visto).
    const onDocClick = (e) => {
      if (target.contains(e.target)) { this._teardown(); return; }
      this.markSeen(cfg.hintKey);
      this._teardown();
    };
    document.addEventListener("click", onDocClick, true);

    this._active = {
      key, step: 1,
      cleanup: () => {
        target.classList.remove("spotlight-hole");
        document.removeEventListener("click", onDocClick, true);
        overlay.remove();
        caption.remove();
      },
    };
  },

  // ---------- PASSO 2 ----------
  _startStep2(key, cfg) {
    // se o guia já foi marcado visto entre o agendamento (rAF) e agora (ex.: pulado no passo 1
    // de outra revelação concorrente), não mostra.
    if (this.hintSeen(cfg.hintKey)) return;
    const target = cfg.step2.resolve ? cfg.step2.resolve() : document.querySelector(cfg.step2.targetSel);
    if (!target) return;
    this._teardown();

    const overlay = document.createElement("div");
    overlay.className = "spotlight-overlay spotlight-overlay--step2";
    document.body.appendChild(overlay);

    const caption = document.createElement("div");
    caption.className = "spotlight-caption spotlight-caption--step2";
    caption.innerHTML = `<span class="spotlight-text">${cfg.step2.text}</span>`;
    document.body.appendChild(caption);

    target.classList.add("spotlight-hole", "spotlight-hole--step2");
    this._positionCaption(caption, target, "auto");

    // clique em QUALQUER lugar (dentro ou fora do alvo) dispensa o passo 2 e marca visto —
    // nunca mais repete pra este sistema. Mesma técnica de captura do passo 1 (stacking-safe).
    const onDocClick = () => { this.markSeen(cfg.hintKey); this._teardown(); };
    document.addEventListener("click", onDocClick, true);

    this._active = {
      key, step: 2,
      cleanup: () => {
        target.classList.remove("spotlight-hole", "spotlight-hole--step2");
        document.removeEventListener("click", onDocClick, true);
        overlay.remove();
        caption.remove();
      },
    };
  },

  // posiciona a legenda perto do alvo sem sair da viewport (heurística simples: abaixo se
  // couber, senão acima; sempre centralizada horizontalmente sobre o alvo e clampada às bordas).
  _positionCaption(caption, target, pref) {
    const r = target.getBoundingClientRect();
    const capH = 60, capW = Math.min(320, window.innerWidth - 24);
    let top = pref === "below" ? r.bottom + 14 : r.top - capH - 14;
    if (pref === "auto") top = r.bottom + capH + 14 <= window.innerHeight ? r.bottom + 14 : Math.max(10, r.top - capH - 14);
    top = Math.max(10, Math.min(top, window.innerHeight - capH - 10));
    let left = r.left + r.width / 2 - capW / 2;
    left = Math.max(10, Math.min(left, window.innerWidth - capW - 10));
    caption.style.top = top + "px";
    caption.style.left = left + "px";
    caption.style.width = capW + "px";
  },

  _teardown() {
    if (this._active) { this._active.cleanup(); this._active = null; }
  },
};
