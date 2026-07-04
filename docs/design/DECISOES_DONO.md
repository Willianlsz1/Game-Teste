# Decisões do dono — livro-razão de balance (Mapa 1)

> Página única com TODAS as decisões do dono, escaneável. Fonte de detalhe:
> `P9_REBALANCE.md` (§8c = paradigma novo · §9 = variáveis v9-r7) e
> `GAIADON_MATH.md` (a referência). Atualizada a cada decisão nova.
> Última: **2026-07-04**.

---

## PARTE I — A VIRADA DE PARADIGMA (pendente de re-fit único; NÃO fitar até o dono fechar o conjunto)

> Decisão de processo: acumular TODAS as decisões e rodar **UM** re-fit no fim.
> Estas substituem parte do v9-r7 (que fica de pé até o re-fit). Juntas, viram
> o Éclats do "HTK-legível bespoke" pro "padrão do gênero (Gaiadon)".

| # | Decisão | O que muda | Resolve/porquê |
|---|---|---|---|
| P1 | **Nível do mob = ÁREA, não Seeker** | mob deixa de escalar com você (`enemyFactory.js:57`); dificuldade fixa por zona; HTK dentro da área vira DECRESCENTE (entra difícil, derrete) | HP (cada área "o HP disparou") **e** XP (pós-Convergence a cascata de níveis morre sozinha) — uma mudança pros dois |
| P2 | **Âncora TTK, não HTK** | balance medido em SEGUNDOS; velocidade de ataque perde o teto (`map1AtkSpeedCap 2` sai/sobe) e vira DPS; combate vira "fluxo", não "golpes contados" | combate padrão do gênero idle; Boots/Momentum passam a importar. Régua já existe (Constituição: Mob 1–3s etc.) |
| P3 | **Lumens com curva própria** | soltar Lumens do HP (`goldRatio 0.35` rígido); curva independente que pode ACELERAR no fim | Lumens crescendo mais rápido que HP no endgame = espetáculo |
| P4 | **Custo de nível maior no início** | encarpar `xpCurveBase × nível^exp` nos primeiros níveis | com P1 o vazamento já morre; isto vira reforço de sensação (cada nível pesa) |
| P5 | **A — recompensa desproporcional dos raros** | rewardMult dos acesos (Lumens/XP/material) MUITO acima do hpMult (hoje são ~iguais) | caçar Ember/Lumen/Corona vira a economia central; casa com acesos = fonte de material |
| P6 | **B — custo de gear quadrático** | trocar `gearCostGrowth` geométrico (1.022) por soma aritmética | custo não dispara logo após promover; grind mais confortável |

**Sub-decisão pendente pro fit:** quão livre a velocidade de ataque fica (uncap
total vs teto alto). Resolver com número no re-fit.

**Não adotado do cardápio Gaiadon:** C (promover exige cap — JÁ é o atual,
`gear.js:86`) · D (salto de promoção maior — fica pro P8.6). Registrados pra
mapas futuros: Weapon Rage · painel de poder em colunas (UI) · Rare = 4º afixo ·
Skill Trainer · camadas de prestige (Apotheosis/Divinity) · World Tier · Fame.

---

## PARTE II — JÁ NO JOGO (v9-r7 bakeado e commitado; vale até o re-fit da Parte I)

Fit validado em 3 seeds, clear ~38h30. Detalhe e âncoras em `P9_REBALANCE.md §9`.

**Player e escala**
- Player nasce **ATK 15 · HP 50** (dezenas); topo do mapa ~10¹¹ de HP.
- First Spark (raiz da árvore) = **FLAT forte** (soco de entrada, 35–41% do ATK nas convs 1–5; dilui depois).

**Awaken (First Light)**
- Piso **×5 ATK · ×3 HP** (fitado em par com o Okhra).
- **The World Kindles**: o tier CORONA nasce no mundo só pós-awaken (revelação — zero menção em UI antes) + caps de Rarity Find sobem (pré 8/3/0 → pós 30/15/5).
- **Light Remembers**: re-subida começa em ~10% do maior nível alcançado.
- **Vessel of Dawn**: absorve 2 golpes por onda (awakens futuros engordam).
- +25 Lumens flat REMOVIDO.
- Princípio: a escada de Awakens fortalece as MESMAS assinaturas a cada mapa.

**Árvore de passivas**
- 16/16 nós, maxLevel 10 (exceto Pilgrim's Wisdom = 5 níveis gordos de +70% XP).
- Coroa **The Ring Closes ×4** (acende ~conv 10); árvore fecha 100% ~conv 14.
- Golden Wake = **jackpot Lumens ×15** (escada do eixo Lumens: Twice-Gilded 2× → Fortune's Torrent 4× → Golden Wake 15×).
- Sustain re-orçamentado (Regeneration/Heal on Kill não outhealam a banda; ~62% do DPS).

**Gear (afixos novos)**
- Cloak: **Twice-Gilded** (Lumens 2×, cap 4%) + **Fortune's Torrent** (Lumens 4×, cap 5%) — no lugar de Fortune's Weave e Corona Call.
- Helmet: **Hollowing Light** (inimigo nasce com −HP%, cap 5%) — no lugar de Steadfast Guard.
- Promoção Common→Uncommon consome **dois materiais**: comum (massa) + incomum (chave, dropa só de acesos + Harbingers).

**Mobs / mundo**
- Onda por grupo **[1, 2, 2, 3, 4, 5]** (cresce no fim do mapa).
- Threshold do Harbinger em **escada [200, 500, 1000, 2000, 4000, 8000]** por grupo.
- Contador de invocação: **"{Boss} manifests in N kills"** (era "stirs").
- G6 (áreas 16–18): parede parcial (entrada HTK ~3–5).

**Fase de UI (zero balance, pode rodar a qualquer momento)**
- Tooltip de gear v2 (nome-lore + degrau honesto + preview do level up).
- **Forja** vende a promoção (assinatura 🔒 + ×8 + progresso N/50) — não o tooltip.
- Onboarding do Awaken (o que é, o que dá, requisitos) + contador de material visível.
- Corona invisível em toda UI pré-awaken.

---

## PARTE III — DIAGNÓSTICOS E INSUMOS (medidos; não são decisões, guiam o re-fit)

- **HP — gap de expoente:** nosso fit manual NÃO é gap puro; os desvios (foguete inicial, salto ×300 do Porto, spike do Awaken) são DELIBERADOS. O gap do Gaiadon é bom modelo mental, mau gerador pros nossos números. (Superado por P1: mob=área.)
- **Lumens:** rígido ao HP (sem vazamento); nunca acelera além do HP. (Endereçado por P3.)
- **XP:** freio de backtrack do Gaiadon é no-op aqui (mob nasce no nível do herói, nunca abaixo). Vazamento "3 níveis por kill" já pequeno no v9-r7 (~80 casos, primeiros ~5 kills de cada vida); causa = curva de custo rasa no início. (Endereçado por P1 + P4.)
- **Regra 30:1** (Ascension:Transcendence) validada empiricamente até o extremo real — régua pro pós-Convergence/Mémoires futuro.

---

## Como fechar

Quando o dono declarar **"fechei o conjunto"**, roda-se UM re-fit (paradigma
novo → provavelmente Opus, várias rodadas) implementando a Parte I + Parte II
sobrevivente, medindo em TTK, sem gate de relógio (descoberta) → bake → travar.
