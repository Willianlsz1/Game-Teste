// ui-worldmap.js — modal do World Map: nós, trilha dourada de progresso, navegação entre
// atos e o painel de info por área. Viagem em si vive em ui-hud (travelTo).

Object.assign(G.ui, {

  bindWorldMap() {
    // World Map: painel de info (fechar / viajar) e botão "◀ World"
    if (this.el["wmap-info-close"])
      this.el["wmap-info-close"].addEventListener("click", () => { this.el["wmap-info"].hidden = true; });
    // clique no overlay (fora do card) fecha o info; clique DENTRO do card não fecha
    if (this.el["wmap-info"])
      this.el["wmap-info"].addEventListener("click", (e) => {
        if (e.target === this.el["wmap-info"]) this.el["wmap-info"].hidden = true;
      });
    if (this.el["wmap-info-travel"])
      this.el["wmap-info-travel"].addEventListener("click", () => {
        if (this._infoArea != null) this.travelTo(this._infoArea);
      });
    const wback = document.getElementById("wmap-back");
    if (wback) wback.addEventListener("click", () => { if (G.ui.closeScreens) G.ui.closeScreens(); });

    // World Map: navegação entre atos (A = Floresta / B = Porto Afundado). Não muda a área do jogador.
    if (this.el["wmap-act-down"])
      this.el["wmap-act-down"].addEventListener("click", () => {
        if (this.el["wmap-act-down"].classList.contains("is-locked")) return;
        this._wmapAct = "B"; this.renderWorldMap();
        if (this.el["wmap-info"]) this.el["wmap-info"].hidden = true;
      });
    if (this.el["wmap-act-up"])
      this.el["wmap-act-up"].addEventListener("click", () => {
        this._wmapAct = "A"; this.renderWorldMap();
        if (this.el["wmap-info"]) this.el["wmap-info"].hidden = true;
      });
  },

  // ---------- WORLD MAP ----------
  // posições dos 18 nós no mapa (% x,y) — fonte única p/ nós E trilha.
  // Ato A (0-8, Floresta): alinhadas à geografia pintada de map1.png.
  // Ato B (9-17, Porto Afundado): alinhado à geografia do map2.png.
  mapNodePos: [
    [10, 78], [22, 47], [38, 22], [55, 12], [52, 40],
    [72, 38], [36, 65], [60, 72], [88, 62],
    [17, 15], [35, 28], [61, 19], [20, 47], [33, 60],
    [71, 46], [41, 84], [56, 75], [85, 82],
  ],

  renderWorldMap() {
    const wrap = this.el["wmap-nodes"];
    if (!wrap) return;
    const d = G.state.data;
    const pos = this.mapNodePos;
    const total = G.data.areas.length;
    const maxU = Math.min(d.maxAreaUnlocked || 0, total - 1);
    const act = this._wmapAct === "B" ? "B" : "A";
    const first = act === "B" ? 9 : 0;
    const last = act === "B" ? total - 1 : 8;

    // fundo + rótulo do ato (Ato B = placeholder do Porto Afundado sobre map1.png)
    const wmap = document.getElementById("wmap");
    if (wmap) wmap.classList.toggle("is-actB", act === "B");
    if (this.el["wmap-bg"]) {
      const bgSrc = act === "B" ? "assets/ui/map2.png" : "assets/ui/map1.png";
      if (this.el["wmap-bg"].getAttribute("src") !== bgSrc) this.el["wmap-bg"].src = bgSrc;
    }
    const label = this.el["wmap-act-label"];
    if (label) {
      label.textContent = "The Sunken Port";
      label.hidden = act !== "B";
    }

    // botões de navegação entre atos
    const downBtn = this.el["wmap-act-down"];
    if (downBtn) {
      if (act === "A") {
        downBtn.hidden = false;
        const portStart = G.data.areas.findIndex(a => a.theme === "port");
        const portUnlocked = portStart >= 0 && maxU >= portStart;
        downBtn.classList.toggle("is-locked", !portUnlocked);
        downBtn.textContent = portUnlocked ? "▼ The Sunken Port" : "🔒 The Sunken Port";
        downBtn.title = portUnlocked ? "" : "Defeat the Gilded Hollow";
      } else {
        downBtn.hidden = true;
      }
    }
    const upBtn = this.el["wmap-act-up"];
    if (upBtn) upBtn.hidden = act !== "B";

    // trilha: só o rastro dourado de progresso, restrito aos nós do ato visível.
    // (a trilha base é PINTADA na arte — não desenhamos mais os paths azul-cinza.)
    const trail = this.el["wmap-trail"];
    if (trail) {
      const crPath = (pts, tension = 0.5) => {
        if (pts.length < 2) return "";
        const p = [pts[0], ...pts, pts[pts.length - 1]];
        let s = `M${p[1][0]},${p[1][1]}`;
        for (let i = 1; i < p.length - 2; i++) {
          const c1x = +(p[i][0] + (p[i+1][0] - p[i-1][0]) * tension / 3).toFixed(2);
          const c1y = +(p[i][1] + (p[i+1][1] - p[i-1][1]) * tension / 3).toFixed(2);
          const c2x = +(p[i+1][0] - (p[i+2][0] - p[i][0]) * tension / 3).toFixed(2);
          const c2y = +(p[i+1][1] - (p[i+2][1] - p[i][1]) * tension / 3).toFixed(2);
          s += ` C${c1x},${c1y} ${c2x},${c2y} ${p[i+1][0]},${p[i+1][1]}`;
        }
        return s;
      };
      const doneEnd = Math.min(maxU, last);
      const donePts = doneEnd >= first ? pos.slice(first, doneEnd + 1) : [];
      const donePath = crPath(donePts);
      const vne = 'fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"';
      trail.innerHTML = donePath
        ? `<path d="${donePath}" ${vne} stroke="rgba(0,0,0,0.45)" stroke-width="9"/>` +
          `<path d="${donePath}" ${vne} stroke="rgba(210,155,20,0.7)" stroke-width="5.5"/>` +
          `<path d="${donePath}" ${vne} stroke="rgba(255,242,170,0.52)" stroke-width="1.8"/>`
        : "";
    }

    wrap.innerHTML = G.data.areas.map((a, i) => {
      if (i < first || i > last) return "";
      const locked = i > maxU;
      const cur = i === d.areaIndex;
      const [x, y] = pos[i] || [50, 50];
      const cls = `wmap-node${locked ? " is-locked" : ""}${cur ? " is-current" : ""}`;
      const ph = `<span class="wmap-node__ph">${locked ? "🔒" : i + 1}</span>`;
      return `<button class="${cls}" style="left:${x}%;top:${y}%" data-area="${i}" title="${a.name}">
        ${ph}
        <img src="assets/ui/node_${i + 1}.png" alt="" onerror="this.remove()" />
        <span class="wmap-node__name">${a.name}</span>
      </button>`;
    }).join("");
    wrap.querySelectorAll("[data-area]").forEach((b) => {
      b.addEventListener("click", () => this.openAreaInfo(+b.dataset.area));
    });
  },

  openAreaInfo(i) {
    const a = G.data.areas[i];
    if (!a || !this.el["wmap-info"]) return;
    this._infoArea = i;
    const d = G.state.data;
    const total = G.data.areas.length;
    const maxU = Math.min(d.maxAreaUnlocked || 0, total - 1);
    const locked = i > maxU;
    const isCurrent = i === d.areaIndex;
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // tint por bioma: teal para o Porto, dourado para o resto
    this.el["wmap-info"].style.setProperty("--area-tint", a.theme === "port" ? "#5ee0d2" : "#e8b54a");

    // emblema do medalhão da área
    const emb = this.el["wmap-info-emblem"];
    if (emb) { emb.style.visibility = ""; emb.src = `assets/ui/node_${i + 1}.png`; }

    const art = this.el["wmap-info-art"];
    if (art)
      art.style.backgroundImage = a.img
        ? `linear-gradient(180deg, rgba(7,10,22,0.05), rgba(7,10,22,0.55)), url('${a.img}')`
        : "none";

    // Ato A não tem rótulo canônico "Act I" na UI; o botão de subida chama "The Dreaming Wood".
    // Ato B é canonicamente "The Sunken Port" (rótulo/nav do mapa).
    const actName = i <= 8 ? "Act I · The Dreaming Wood" : "Act II · The Sunken Port";
    this.el["wmap-info-name"].textContent = a.name;
    this.el["wmap-info-sub"].textContent = `${actName} · Area ${i + 1} of ${total}`;

    // chip de estado
    const felled = Array.isArray(d.harbingersFelled) && d.harbingersFelled.indexOf(i) !== -1;
    const chip = this.el["wmap-info-chip"];
    chip.textContent = locked ? "Locked" : isCurrent ? "You are here" : felled ? "Harbinger felled" : "Unlocked";

    // lore
    this.el["wmap-info-lore"].textContent = a.blurb || "";
    const deep = this.el["wmap-info-deep"];
    deep.textContent = a.lore || "";
    deep.hidden = !a.lore;

    // ameaça
    this.el["wmap-info-level"].textContent = `${a.levelRange[0]}–${a.levelRange[1]}`;
    const pack = G.enemyFactory.packSizeFor(i);
    this.el["wmap-info-enemies"].textContent = pack + " per wave";

    const mobs = this.el["wmap-info-mobs"];
    mobs.classList.toggle("is-locked", locked);
    mobs.innerHTML = a.enemies.map((e) =>
      `<div class="wmap-info__mob"><img src="${e.img}" alt="" onerror="this.style.visibility='hidden'"><span>${esc(e.name)}</span></div>`
    ).join("");

    // Harbinger
    const bossRow = this.el["wmap-info-boss-row"];
    if (a.boss) {
      bossRow.hidden = false;
      const boss = a.boss;
      const shrouded = locked;
      const name = shrouded ? "???" : esc(boss.name);
      let tag = "";
      if (!shrouded && Array.isArray(boss.signature) && boss.signature.length) {
        const mod = G.data.modifiers[boss.signature[0]];
        if (mod && mod.label) tag = `<span class="wmap-info__boss-tag">${esc(mod.label)}</span>`;
      }
      let cadence = "";
      if (!shrouded) {
        if (isCurrent) {
          const n = Math.max(0, G.enemyFactory.bossThresholdFor(i) - G.combat._bossKills);
          cadence = `manifests in ${n} kills`;
        } else {
          cadence = `manifests every ${G.enemyFactory.bossThresholdFor(i)} kills`;
        }
      }
      // Área 18: linha extra do Okhra (2º estágio pós-H6), preservando a lógica de portão/First Light.
      let extra = "";
      if (i === total - 1 && boss && a.mapBoss && !shrouded) {
        const awake = !!(G.awaken && G.awaken.isDone("first_light"));
        if (!felled)     extra = `Then: ${esc(a.mapBoss.name)} stirs beyond the Choir.`;
        else if (awake)  extra = `${esc(a.mapBoss.name)}, the Starving Tide, risen.`;
        else             extra = "The tide stirs... but your light sleeps. Awaken the First Light.";
      }
      this.el["wmap-info-boss"].className = `wmap-info__boss${shrouded ? " is-shrouded" : ""}`;
      this.el["wmap-info-boss"].innerHTML =
        `<img src="${boss.img || ""}" alt="" onerror="this.style.visibility='hidden'">` +
        `<div class="wmap-info__boss-txt"><span class="wmap-info__boss-name">${name}</span>${tag}` +
        (extra ? `<span class="wmap-info__boss-extra">${extra}</span>` : "") + `</div>` +
        (cadence ? `<span class="wmap-info__boss-cadence">${cadence}</span>` : "");
    } else {
      bossRow.hidden = true;
    }

    // spoils — projeção real do income do jogador atual
    const est = G.income.estimateAreaIncome(i);
    let res;
    if (est.deadly) {
      res = `<li class="is-warning">Beyond your strength. The tide would take you.</li>`;
    } else {
      const rows = [
        `<li><span>Lumens / min</span><b>+${G.util.fmt(est.lumensPerMin)}</b></li>`,
        `<li><span>XP / min</span><b>+${G.util.fmt(est.xpPerMin)}</b></li>`,
      ];
      if (i >= 5) rows.push(`<li><span>Awaken Material</span><b>Boss drop</b></li>`);
      res = rows.join("");
    }
    this.el["wmap-info-res"].innerHTML = res;

    // unlock (área travada): condição + barra de progresso por nível.
    // P9 (porta dupla): a porta lê o DIAL levelGateByArea (progression.levelGateFor), não mais
    // o levelRange do mob — a porta libera a ENTRADA; a permanência quem regula é a parede (P2b).
    const gateLv = G.progression.levelGateFor(i);
    const unlockRow = this.el["wmap-info-unlock-row"];
    if (locked) {
      unlockRow.hidden = false;
      const pct = G.util.clamp((d.level / gateLv) * 100, 0, 100);
      this.el["wmap-info-unlock"].innerHTML =
        `Reach level ${gateLv}` +
        `<div class="wmap-info__unlock-bar"><div class="wmap-info__unlock-fill" style="width:${pct}%"></div></div>`;
    } else {
      unlockRow.hidden = true;
    }

    const tbtn = this.el["wmap-info-travel"];
    if (isCurrent) { tbtn.disabled = true; tbtn.textContent = "You are here"; }
    else if (locked) { tbtn.disabled = true; tbtn.textContent = `🔒 Reach Lv ${gateLv}`; }
    else { tbtn.disabled = false; tbtn.textContent = `Travel to ${a.name}`; }

    this.el["wmap-info"].hidden = false;
  },
});
