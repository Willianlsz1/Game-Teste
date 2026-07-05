// ui-battle.js — arena de combate: contador do Harbinger, cards de inimigo, floaters,
// projéteis, drops de material e o palco cosmético do Okhra. Sem bind próprio (a arena
// não tem controles clicáveis; combat/convergence chamam estes métodos por nome).

Object.assign(G.ui, {

  // Combat
  _lastArt: null,

  // contador de invocação do Harbinger — topo-direito, logo abaixo do medidor de Lumens.
  // Roda no clock de 100ms (via renderEnemy) porque a contagem muda a cada kill.
  renderHarbingerCounter() {
    const el = this.el["harbinger-counter"];
    if (!el) return;
    const area = G.data.currentArea();
    const d = G.state.data;
    const lastIdx = G.data.areas.length - 1;
    // L3: hint one-shot na 1ª vez que o contador fica visível nesta função (qualquer branch
    // que o mostre) — dispara DEPOIS de setar display, uma vez só por save (ver reveals.js).
    const showAndHint = () => { el.style.display = ""; if (G.reveals) G.reveals.checkHarbingerHint(); };

    const liveBoss = G.combat.enemies.find(e => e.isBoss && !e.dead);
    if (liveBoss) {
      el.classList.add("is-here");
      el.innerHTML = liveBoss.isMapBoss ? `◆ ${(liveBoss.baseName || liveBoss.name || "OKHRA").toUpperCase()} IS HERE` : "⟡ THE HARBINGER IS HERE";
      showAndHint();
      return;
    }
    el.classList.remove("is-here");

    const stirs = (name) => {
      const n = Math.max(0, G.enemyFactory._bossThreshold() - G.combat._bossKills);
      el.innerHTML = `⟡ ${name} manifests in <b>${n}</b> kills`;
      showAndHint();
    };

    if (area.boss && d.areaIndex === lastIdx) {
      const h6Felled = Array.isArray(d.harbingersFelled) && d.harbingersFelled.indexOf(lastIdx) !== -1;
      const awake = !!(G.awaken && G.awaken.isDone("first_light"));
      if (!h6Felled) { stirs(area.boss.name); return; }
      if (awake && area.mapBoss) { stirs(area.mapBoss.name); return; }
      el.innerHTML = "The tide stirs... awaken the First Light.";
      showAndHint();
      return;
    }

    if (area.boss) { stirs(area.boss.name); return; }
    el.style.display = "none";
  },

  renderEnemy() {
    this.renderHarbingerCounter();
    const container = this.el["enemies-container"];
    if (!container) return;

    const alive = G.combat.enemies.filter(e => !e.dead);

    if (!alive.length) {
      if (container.innerHTML) container.innerHTML = "";
      container.className = "enemies-container";
      this._enemySig = "";
      this._enemyFills = []; this._enemyLabels = []; this._enemyHpShown = []; this._shellBadges = [];
      return;
    }

    // renderiza a onda INTEIRA (mortos inclusos, greyed) → posições não mudam quando 1 morre,
    // e os índices enemy-art-{i} batem com os índices do combat (projéteis/floaters certos).
    // ORDEM DE EXIBIÇÃO (visual apenas): boss(es) por último, mobs comuns antes (ordem relativa
    // preservada). O array G.combat.enemies e o alvo de ataque (enemies[0]/find) NÃO mudam —
    // cada card carrega data-idx/ids do índice ORIGINAL no array, então floaters/projéteis
    // (que usam enemies.indexOf(target) ou o idx passado por combat.js) continuam corretos.
    const list = G.combat.enemies;
    const sig  = list.map(e => e.name + (e.rarity ? e.rarity.tag : "") + (e.isBoss ? "B" : "") + (e.lightshell > 0 ? "S" : "")).join("|");

    if (this._enemySig !== sig) {
      this._enemySig = sig;
      container.className = `enemies-container pack-${Math.min(list.length, 5)}`;   // P9 r4: ondas até 5 (+boss)
      // cópia com índice original preservada; sort estável (Array#sort é estável no V8/Chrome
      // moderno) — mobs comuns mantêm a ordem relativa entre si, boss(es) vão pro fim.
      const order = list.map((e, i) => ({ e, i })).sort((a, b) => (a.e.isBoss ? 1 : 0) - (b.e.isBoss ? 1 : 0));
      container.innerHTML = order.map(({ e, i }) => {
        const shelled = e.lightshell > 0;
        let header;
        if (e.isBoss) {
          const sig = (e.modifiers || [])
            .map((k) => G.data.modifiers[k] && G.data.modifiers[k].label)
            .filter(Boolean).join(" · ").toUpperCase();
          header = `<span class="harbinger-tag">${e.isMapBoss ? `◆ ${(e.baseName || e.name || "OKHRA").split(",")[0].toUpperCase()} ◆` : "⟡ HARBINGER ⟡"}</span>
          <span class="boss-nameplate${e.isMapBoss ? " nihelim" : ""}">${(e.baseName || e.name).toUpperCase()}</span>
          ${sig ? `<span class="boss-signature">${sig}</span>` : ""}`;
        } else {
          const nameColor = e.rarity ? ` style="color:${e.rarity.color}"` : "";
          header = `<span class="enemy-name"${nameColor}>${e.rarity ? `${e.name} · ${e.rarity.tag}` : e.name}</span>`;
        }
        return `<div class="enemy-card${e.isBoss ? " boss" : ""}" data-idx="${i}">
          ${header}
          <span class="shell-badge" id="shell-badge-${i}"${shelled ? "" : ` style="display:none"`}></span>
          <div class="enemy-figure${e.isBoss ? " boss" : ""}${shelled ? " shelled" : ""}" id="enemy-art-${i}">
            <span class="art-ph">${e.sprite}</span>
            ${e.img ? `<img class="art-img" src="${e.img}" alt="" onerror="this.remove()" />` : ""}
            <div class="floaters" id="floaters-enemy-${i}"></div>
          </div>
          <div class="enemy-info">
            <span class="card-sub">Lv. <b>${e.level}</b> · ATK <b>${G.util.fmt(e.dmg)}</b></span>
            <div class="bar enemy-bar${e.isBoss ? " boss-bar" : ""}">
              <div class="bar-fill enemy-fill" id="enemy-hp-fill-${i}"></div>
              <span class="bar-label" id="enemy-hp-label-${i}"></span>
            </div>
          </div>
        </div>`;
      }).join("");
      // cacheia os elementos por índice ORIGINAL do array (não por posição no DOM, que agora
      // pode diferir) — evita 2×N getElementById por tick de 100ms.
      this._enemyFills   = list.map((e, i) => document.getElementById(`enemy-hp-fill-${i}`));
      this._enemyLabels  = list.map((e, i) => document.getElementById(`enemy-hp-label-${i}`));
      this._shellBadges  = list.map((e, i) => document.getElementById(`shell-badge-${i}`));
      this._enemyCards   = list.map((e, i) => container.querySelector(`.enemy-card[data-idx="${i}"]`));
      this._enemyHpShown = [];
    }

    // por tick: classes morto/ativo (baratas) + HP só quando muda (pula a escrita se e.hp igual)
    const firstAlive = list.findIndex(e => !e.dead);
    list.forEach((e, i) => {
      const card = this._enemyCards && this._enemyCards[i];
      if (card) {
        card.classList.toggle("enemy-dead", !!e.dead);
        card.classList.toggle("enemy-active", i === firstAlive);
      }
      const badge = this._shellBadges && this._shellBadges[i];
      if (badge && e.lightshell > 0) badge.textContent = `🛡 Lightshell ×${e.lightshell}`;
      if (this._enemyHpShown[i] === e.hp) return;
      this._enemyHpShown[i] = e.hp;
      const fill  = this._enemyFills[i];
      const label = this._enemyLabels[i];
      if (fill)  fill.style.width = G.util.clamp((e.hp / e.maxHp) * 100, 0, 100) + "%";
      if (label) label.textContent = `HP ${G.util.fmt(Math.max(0, e.hp))} / ${G.util.fmt(e.maxHp)}`;
    });
  },

  floater(amount, type, idx) {
    const target = type === "enemy"
      ? document.getElementById("floaters-hero")
      : document.getElementById("floaters-enemy-" + (idx || 0));
    if (!target) return;
    const f = document.createElement("span");
    f.className = "floater " + type;
    f.textContent = type === "shell" ? "ABSORBED" : (type === "enemy" ? "-" : "") + G.util.fmt(amount) + (type === "crit" ? "!" : "");
    f.style.left = G.util.randInt(20, 80) + "%";
    target.appendChild(f);
    setTimeout(() => f.remove(), 800);
  },

  projectile(type, idx) {
    const enemyEl = "enemy-art-" + (idx || 0);
    const fromEl = document.getElementById(type === "mob" ? enemyEl : "hero-art");
    const toEl   = document.getElementById(type === "mob" ? "hero-art" : enemyEl);
    if (!fromEl || !toEl) return;
    const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    const x1 = a.left + a.width / 2, y1 = a.top + a.height * 0.42;
    const x2 = b.left + b.width / 2, y2 = b.top + b.height * 0.42;
    const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 32;
    const img = document.createElement("img");
    img.className = "projectile" + (type === "mob" ? " projectile--mob" : "");
    img.src       = type === "mob" ? "assets/fx/bolt_mob.png" : "assets/fx/bolt_seeker.png";
    const dur = type === "mob" ? G.combat.mobProjectileTravel : G.combat.projectileTravel;  // fonte única (combat.js)
    img.style.cssText = `left:${x1}px;top:${y1}px;transform:translate(-50%,-50%) rotate(${ang}deg)`;
    img.style.transitionDuration = dur + "s";
    document.body.appendChild(img);
    void img.offsetWidth;
    img.style.left = x2 + "px"; img.style.top = y2 + "px"; img.style.opacity = "0.7";
    setTimeout(() => img.remove(), dur * 1000 + 80);
  },

  // P8.4: palco do Okhra — combat avisa (ui só LÊ estado e aplica a classe cosmética).
  setOkhraStage(on) {
    if (document.body) document.body.classList.toggle("okhra-manifest", !!on);
    const area = G.data.currentArea();
    const wimg = document.querySelector(".world-img");
    const wsrc = area.imgFinale && on ? area.imgFinale : area.img;
    if (wimg && wsrc && wimg.getAttribute("src") !== wsrc) wimg.src = wsrc;
  },

  materialDrop(drops) {
    const container = document.getElementById("mat-drops");
    if (!container) return;
    const SINK   = G.economy ? G.economy.MATERIAL_SINK : {};
    const LABELS = { common: "Common", uncommon: "Uncommon", firstLight: "First Light" };
    for (const [matKey, qty] of Object.entries(drops)) {
      if (!qty) continue;
      const sink = SINK[matKey];
      if (!sink) continue;
      const kind = sink.kind;
      const el = document.createElement("div");
      el.className = `mat-drop mat-drop--${kind}`;
      el.innerHTML = `<img src="assets/materials/${kind}.png" class="mat-drop__icon" alt="" onerror="this.remove()"><span>+${qty} ${LABELS[kind] || kind}</span>`;
      container.appendChild(el);
      setTimeout(() => el.remove(), 2600);
    }
  },
});
