// ui-passives.js — tela de Passivas (World-Tree I): stage full-bleed, nós, galhos,
// coroa, tooltips e o painel Tree Blessings. Regras de compra vivem em G.passives.

Object.assign(G.ui, {

  bindPassives() {
    // Passivas (World-Tree I): comprar nó (clique delegado; a coroa não é comprável).
    // buy() já faz invalidateStats + save; aqui só disparamos o floater e re-renderizamos.
    const pscreen = document.getElementById("modal-passives");
    if (pscreen)
      pscreen.addEventListener("click", (e) => {
        const node = e.target.closest(".pv-node");
        if (!node || node.classList.contains("pv-crown")) return;
        const i = +node.dataset.i;
        if (G.passives.buy(i)) { this._pvFloater(node, i); this.renderPassives(); }
      });
  },

  // ---------- PASSIVES (World-Tree I — árvore única binária + coroa) ----------
  // Design final (bake): a pintura cobre a viewport inteira em modo COVER (sem letterbox).
  // Nós são posicionados por % do RETÂNGULO DA IMAGEM (P.POSITIONS), então assentam no
  // lugar certo em qualquer proporção de janela. Chrome zero: só pintura + nós + galhos +
  // fechar. Um nó só é RENDERIZADO quando tem sprite (ICONS[i] != null) — nós sem sprite
  // ainda são totalmente invisíveis (sem placeholder, sem galho apontando pra eles). A
  // coroa segue a mesma regra (CROWN_ICON != null). Toda informação vive no tooltip.
  renderPassives() {
    const P = G.passives;
    const unlocked = P.unlocked();
    if (this.el["pv-lock"]) this.el["pv-lock"].hidden = unlocked;
    const body = this.el["pv-body"];
    if (!body) return;
    body.style.visibility = unlocked ? "" : "hidden";
    body.className = "pv-body pv-tree1";
    body.innerHTML = unlocked ? this._pvTreeHtml() : "";
    if (unlocked) {
      this._pvFitStage(body);
      this._pvBindResize();
    }
  },

  // stage full-bleed COVER: escala o retângulo 1672×941 pelo MAIOR dos dois eixos
  // (viewport width/height), centraliza, excesso cortado por overflow hidden no
  // .passives-screen. Tamanho final aplicado inline em px porque um div vazio não
  // tem conteúdo intrínseco pro CSS puro resolver "escala pelo máximo" sozinho.
  // Roda a cada renderPassives() e a cada resize da janela.
  _pvFitStage(body) {
    const stage = body.querySelector(".pv-stage");
    if (!stage) return;
    const ratio = 1672 / 941;
    const bodyRect = body.getBoundingClientRect();
    const vw = bodyRect.width, vh = bodyRect.height;
    let w = vw, h = w / ratio;
    if (h < vh) { h = vh; w = h * ratio; }   // cover: garante cobertura total, corta o excesso
    stage.style.width = w + "px";
    stage.style.height = h + "px";
  },

  // re-fita o stage no resize da janela, só enquanto a tela de passivas está aberta
  // (evita custo em telas fechadas; rAF evita disparo excessivo durante o drag do resize)
  _pvBindResize() {
    if (this._pvResizeBound) return;
    this._pvResizeBound = true;
    let raf = 0;
    window.addEventListener("resize", () => {
      const screen = document.querySelector(".passives-screen");
      if (!screen || screen.hidden) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => this._pvFitStage(this.el["pv-body"]));
    });
  },

  _pvTreeHtml() {
    const P = G.passives;
    const branches = this._pvBranches();
    let nodes = "";
    for (let i = 0; i < P.nodes.length; i++) if (P.iconOf(i)) nodes += this._pvNode(i);
    if (P.CROWN_ICON) nodes += this._pvCrown();
    const title = P.CROWN_ICON ? this._pvTitle() : "";
    return `<div class="pv-stage">
      <img class="pv-art" src="assets/passives/passives_tree.webp" alt="" draggable="false" />
      <svg class="pv-branches" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${branches}</svg>
      <div class="pv-nodes">${nodes}</div>
      ${title}
      ${this._pvBlessings()}
    </div>`;
  },

  // painel "Tree Blessings" — soma agregada de todos os bônus concedidos pelos níveis
  // já comprados (agrupado por efeito), no mesmo formato de texto do tooltip por-nó.
  // Re-renderiza no mesmo fluxo que os nós (renderPassives -> _pvTreeHtml), então
  // atualiza sozinho a cada compra (buy() -> renderPassives(), ver bindPassives).
  _pvBlessings() {
    const rows = G.passives.blessingsSummary();
    const body = rows.length
      ? `<ul class="pv-blessings-list">${rows.map((r) =>
          `<li class="pv-blessings-row"><span>${r.label}</span><span class="pv-blessings-val">${r.text}</span></li>`
        ).join("")}</ul>`
      : `<div class="pv-blessings-empty">The tree is silent. Buy your first passive.</div>`;
    return `<div class="pv-blessings">
      <div class="pv-blessings-head">Tree Blessings</div>
      ${body}
    </div>`;
  },

  // galhos de "seiva de luz" pai→filho, desenhados SÓ entre nós visíveis (ambos com
  // sprite) — um nó sem sprite não recebe galho apontando pra ele, mesmo se comprado.
  //
  // GEOMETRIA: cúbica de Bézier com a barriga puxada em direção ao eixo do tronco
  // (x=50%), não o ponto médio vertical puro do desenho anterior — os control points
  // são deslocados ~20% do delta-x em direção a x=50, o que faz a curva "nascer" do
  // tronco central como um raminho, em vez de arquear em qualquer direção genérica.
  //
  // TAPER: SVG <path stroke> não afina a espessura ao longo do traçado. Em vez de
  // recorrer a um polígono fechado (caro de calcular corretamente para uma bézier
  // arbitrária, e sensível a distorção porque o viewBox usa preserveAspectRatio="none"),
  // dividimos a curva em 2 sub-troços via De Casteljau (t=0..0.5 e t=0.5..1) e desenhamos
  // cada um com stroke-width decrescente (grosso no pai, fino no filho). É a aproximação
  // mais simples que ainda lê como afinamento contínuo a essa escala de tela.
  _pvBranches() {
    const P = G.passives, pos = P.POSITIONS, sp = P.SPLIT_POS;
    const visible = (i) => !!P.iconOf(i);
    const bought = (i) => (i === -1 ? true : P.level(i) >= 1);

    // estado da ligação pai(p)->filho(childIdx): locked / buyable / bought
    const state = (p, childIdx) => {
      if (!bought(p)) return "locked";
      return P.level(childIdx) >= 1 ? "bought" : "buyable";
    };

    // pontos de controle de uma bézier cúbica com barriga puxada pro tronco (x=50)
    const bulgeCtrl = (ax, ay, bx, by) => {
      const midY = (ay + by) / 2;
      // desloca os control points ~20% do caminho em direção ao eixo x=50 (tronco)
      const c1x = ax + (50 - ax) * 0.20;
      const c2x = bx + (50 - bx) * 0.20;
      return { c1x, c1y: midY, c2x, c2y: midY };
    };

    // De Casteljau: divide a cúbica M a C c1 c2 b em t=0.5, devolve os dois sub-troços
    // como arrays de pontos [ax,ay, c1x,c1y, c2x,c2y, bx,by] cada.
    const splitCubic = (ax, ay, c1x, c1y, c2x, c2y, bx, by) => {
      const lerp = (p, q, t) => p + (q - p) * t;
      const t = 0.5;
      const p01x = lerp(ax, c1x, t), p01y = lerp(ay, c1y, t);
      const p12x = lerp(c1x, c2x, t), p12y = lerp(c1y, c2y, t);
      const p23x = lerp(c2x, bx, t), p23y = lerp(c2y, by, t);
      const p012x = lerp(p01x, p12x, t), p012y = lerp(p01y, p12y, t);
      const p123x = lerp(p12x, p23x, t), p123y = lerp(p12y, p23y, t);
      const p0123x = lerp(p012x, p123x, t), p0123y = lerp(p012y, p123y, t);
      return {
        a: [ax, ay, p01x, p01y, p012x, p012y, p0123x, p0123y],
        b: [p0123x, p0123y, p123x, p123y, p23x, p23y, bx, by],
      };
    };

    const cubicPath = (pts) =>
      `M${pts[0].toFixed(2)},${pts[1].toFixed(2)} C${pts[2].toFixed(2)},${pts[3].toFixed(2)} ${pts[4].toFixed(2)},${pts[5].toFixed(2)} ${pts[6].toFixed(2)},${pts[7].toFixed(2)}`;

    // desenha uma ligação completa (halo difuso + núcleo afinado em 2 troços)
    const seg = (ax, ay, bx, by, st) => {
      const { c1x, c1y, c2x, c2y } = bulgeCtrl(ax, ay, bx, by);
      const full = [ax, ay, c1x, c1y, c2x, c2y, bx, by];
      const dFull = cubicPath(full);
      const { a, b } = splitCubic(ax, ay, c1x, c1y, c2x, c2y, bx, by);
      const dA = cubicPath(a); // metade junto ao pai — traço mais grosso
      const dB = cubicPath(b); // metade junto ao filho — traço mais fino (taper)
      const cls = `pv-branch-${st}`;
      return `<g class="pv-branch ${cls}">`
        + `<path class="pv-branch-halo" d="${dFull}" vector-effect="non-scaling-stroke"/>`
        + `<path class="pv-branch-core pv-branch-core--wide" d="${dA}" vector-effect="non-scaling-stroke"/>`
        + `<path class="pv-branch-core pv-branch-core--thin" d="${dB}" vector-effect="non-scaling-stroke"/>`
        + `</g>`;
    };

    let out = "";
    // tronco: raiz(0) → split; depois split → nós 1 e 2 — só desenhado se a raiz E ao
    // menos um dos dois filhos forem visíveis (o split é um waypoint decorativo, não um
    // nó real; sem nenhum filho visível não há segmento para puxar dele)
    if (visible(0) && (visible(1) || visible(2))) {
      const trunkState = bought(0) ? "bought" : "locked";
      out += seg(pos[0].x, pos[0].y, sp.x, sp.y, trunkState);
      if (visible(1)) out += seg(sp.x, sp.y, pos[1].x, pos[1].y, state(0, 1));
      if (visible(2)) out += seg(sp.x, sp.y, pos[2].x, pos[2].y, state(0, 2));
    }
    // demais nós (>=3): curva pai→filho, só se AMBOS (pai e filho) forem visíveis
    for (let i = 3; i < P.nodes.length; i++) {
      const p = P.parentOf(i);
      if (!visible(i) || !visible(p)) continue;
      out += seg(pos[p].x, pos[p].y, pos[i].x, pos[i].y, state(p, i));
    }
    return out;
  },

  _pvNode(i) {
    const P = G.passives;
    const node = P.nodes[i], pos = P.POSITIONS[i];
    const level = P.level(i), maxed = P.isMax(i), nmax = P.nodeMax();
    const locked = !P.parentBought(i) && level === 0;
    const canBuy = P.canBuy(i);
    const wantBuy = !maxed && !locked && P.parentBought(i);          // comprável de topologia (pode faltar pontos)
    const affordable = wantBuy && (G.state.data.convergencePoints || 0) >= P.nextCost(i);
    const cls = ["pv-node", node.depth === 4 ? "tip-below" : "", pos.x < 30 ? "tip-right" : pos.x > 70 ? "tip-left" : "",
      maxed ? "is-maxed" : "", wantBuy ? "is-buyable" : "", affordable ? "can-afford" : "",
      level > 0 && !maxed ? "is-owned" : "", locked ? "is-locked" : ""]
      .filter(Boolean).join(" ");
    const ic = P.iconOf(i);
    const shape = ic
      ? `<img class="pv-sprite" src="${ic}" alt="" draggable="false" />`
      : `<span class="pv-ring-placeholder"></span>`;
    const pillText = maxed ? `MAX ${nmax}/${nmax}` : `${level}/${nmax}`;
    return `<button class="${cls}" data-i="${i}"
        style="left:${pos.x}%;top:${pos.y}%">
      <span class="pv-shape${ic ? " has-sprite" : ""}">
        ${shape}
      </span>
      <span class="pv-level-pill">${pillText}</span>
      ${this._pvCard(i)}
    </button>`;
  },

  _pvCard(i) {
    const P = G.passives;
    const name = P.nodes[i].name, level = P.level(i), nmax = P.nodeMax();
    const maxed = P.isMax(i), locked = !P.parentBought(i) && level === 0;
    const ic = P.iconOf(i);
    const m = P.magnitude(i);
    let effRow = "";
    if (m) {
      if (level > 0) effRow = `<div class="pv-card-eff">Level ${level}: <b>${m.current}</b></div>`;
      if (!maxed) effRow += `<div class="pv-card-next">Next: <b>${m.next}</b></div>`;
    }
    const parentName = P.parentOf(i) >= 0 ? P.nodes[P.parentOf(i)].name : "";
    const foot = maxed ? `<div class="pv-card-foot is-max">Maxed</div>`
      : locked ? `<div class="pv-card-foot is-locked">Locked: requires ${parentName}</div>`
      : `<div class="pv-card-foot is-cost">Cost ◈ ${G.util.fmt(P.nextCost(i))}</div>`;
    return `<div class="pv-card${ic ? "" : " no-art"}">
      <div class="pv-card-head">
        ${ic ? `<div class="pv-card-thumb"><img src="${ic}" alt="" loading="lazy" /></div>` : ""}
        <div class="pv-card-headtext">
          <div class="pv-card-name">${name}</div>
          <div class="pv-card-sub">Level ${level}/${nmax}</div>
        </div>
      </div>
      <div class="pv-card-body">
        ${effRow}
        <div class="pv-card-lore">${P.loreOf(i)}</div>
        ${foot}
      </div>
    </div>`;
  },

  // título "Passives" flutuando sobre o céu da arte, ancorado acima da coroa —
  // só aparece quando a coroa existe (mesma regra de CROWN_ICON dos demais elementos).
  _pvTitle() {
    return `<div class="pv-title-wrap">
      <div class="pv-title-eyebrow">&#10022; World Tree &#10022;</div>
      <div class="pv-title-row">
        <span class="pv-title-rule"></span>
        <div class="pv-title">Passives</div>
        <span class="pv-title-rule"></span>
      </div>
      <div class="pv-title-tier">Tier I</div>
    </div>`;
  },

  _pvCrown() {
    const P = G.passives;
    const pos = P.CROWN_POS, on = P.crownActive();
    const lit = P.leaves().filter((i) => P.level(i) >= 1).length;
    const cls = ["pv-node", "pv-crown", "tip-below", on ? "crown-on" : "is-locked"].join(" ");
    const ic = P.CROWN_ICON;
    const shape = ic
      ? `<img class="pv-sprite" src="${ic}" alt="" draggable="false" />`
      : `<span class="pv-ring-placeholder"></span>`;
    const foot = on ? `<div class="pv-card-foot is-max">The Ring Closes · complete</div>`
      : `<div class="pv-card-foot is-locked">Locked: requires all 8 leaves (${lit}/8)</div>`;
    const card = `<div class="pv-card pv-card--crown${ic ? "" : " no-art"}">
      <div class="pv-card-head">
        ${ic ? `<div class="pv-card-thumb"><img src="${ic}" alt="" loading="lazy" /></div>` : ""}
        <div class="pv-card-headtext">
          <div class="pv-card-name">${P.CROWN.name}</div>
          <div class="pv-card-sub">${on ? "Granted" : "Sealed"}</div>
        </div>
      </div>
      <div class="pv-card-body">
        <div class="pv-card-eff"><b>+${P.unit("ringCloses")}% ATK · HP · Lumens · XP</b></div>
        <div class="pv-card-lore">${P.CROWN_LORE}</div>
        ${foot}
      </div>
    </div>`;
    return `<div class="${cls}" data-crown style="left:${pos.x}%;top:${pos.y}%">
      <span class="pv-shape${ic ? " has-sprite" : ""}">${shape}</span>
      ${card}
    </div>`;
  },

  // floater "+X%" subindo do nó comprado (padrão dos floaters de combate: span animado)
  _pvFloater(btn, i) {
    const P = G.passives, m = P.magnitude(i);
    const txt = m ? m.perLevel : "+1";
    const rect = btn.getBoundingClientRect();
    const f = document.createElement("span");
    f.className = "pv-floater";
    f.textContent = txt;
    f.style.left = (rect.left + rect.width / 2) + "px";
    f.style.top = (rect.top + rect.height * 0.32) + "px";
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 900);
  },
});
