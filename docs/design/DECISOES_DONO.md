# Decisões do dono — livro-razão de balance (Mapa 1)

> Página única com TODAS as decisões do dono, escaneável. Fonte de detalhe:
> `P9_REBALANCE.md` (§8c = paradigma novo · §9 = variáveis v9-r7) e
> `GAIADON_MATH.md` (a referência). Atualizada a cada decisão nova.
> Última: **2026-07-04**.

---

## PARTE I — A VIRADA DE PARADIGMA (✅ CONJUNTO FECHADO no grill de 2026-07-04 — re-fit autorizado)

> Decisão de processo: acumular TODAS as decisões e rodar **UM** re-fit no fim.
> Estas substituem parte do v9-r7 (que fica de pé até o re-fit). Juntas, viram
> o Éclats do "HTK-legível bespoke" pro "padrão do gênero (Gaiadon)".
> **Status: o dono fechou o conjunto (P1–P8) no grill de jul/04 e autorizou o
> re-fit ("pode seguir com esse por enquanto"). Roteamento travado pelo dono:
> implementação = Opus; execução de testes/sims = Sonnet.**

| # | Decisão | O que muda | Resolve/porquê |
|---|---|---|---|
| P1 | **Nível do mob = ÁREA, não Seeker** | mob deixa de escalar com você (`enemyFactory.js:57`); dificuldade fixa por zona; HTK dentro da área vira DECRESCENTE (entra difícil, derrete) | HP (cada área "o HP disparou") **e** XP (pós-Convergence a cascata de níveis morre sozinha) — uma mudança pros dois |
| P2 | **Âncora TTK, não HTK** | balance medido em SEGUNDOS; velocidade de ataque perde o teto (`map1AtkSpeedCap 2` sai/sobe) e vira DPS; combate vira "fluxo", não "golpes contados" | combate padrão do gênero idle; Boots/Momentum passam a importar. Régua já existe (Constituição: Mob 1–3s etc.) |
| P2b | **Forma da curva TTK na área** (grill jul/04): entrada FURA a banda (~5–8s no mob comum), derrete até ~1s na saída | banda 1–3s = regime de cruzeiro; sair da área com ~1s é o sinal sentido de "pronto pra avançar"; generaliza o G6 (parede parcial de entrada) pra TODA área, com intensidade crescente por grupo; números por grupo saem do re-fit | o spike de entrada É a Wall local que vende o crescimento — sem ele a área nova nunca assusta |
| P3 | **Lumens com curva própria** | soltar Lumens do HP (`goldRatio 0.35` rígido); curva independente que pode ACELERAR no fim | Lumens crescendo mais rápido que HP no endgame = espetáculo |
| P4 | **Custo de nível maior no início** | encarpar `xpCurveBase × nível^exp` nos primeiros níveis. **Critério travado (grill jul/04): o alvo é a curva NUA** — sem nenhum bônus de XP (conta nova, zero passivas/gear de XP), nenhum kill concede 2+ níveis; **com bônus de XP, cascata de níveis é FEATURE** (poder conquistado do Loop), não vazamento — o fit não deve suprimi-la | com P1 o vazamento já morre; isto vira reforço de sensação (cada nível pesa) — mas só no baseline nu; pós-Convergence com bônus, derreter níveis é a recompensa |
| P5 | **A — recompensa desproporcional dos raros** | rewardMult dos acesos (Lumens/XP/material) MUITO acima do hpMult (hoje são ~iguais). **Forma travada (grill jul/04): o ratio recompensa/HP CRESCE com o tier** — Ember = bônus claro, Lumen = achado, Corona = evento-jackpot na banda Gaiadon (~10–15× o hpMult); números por tier no re-fit | caçar Ember/Lumen/Corona vira a economia central; casa com acesos = fonte de material; Corona jackpot dá ao pós-awaken uma economia nova, não só mobs mais grossos |
| P6 | **B — custo de gear quadrático** | trocar `gearCostGrowth` geométrico (1.022) por soma aritmética | custo não dispara logo após promover; grind mais confortável |
| P7 | **Freio de backtrack = penalidade de XP** (grill jul/04, decorrência do P1) | Seeker acima do nível da área ⇒ XP do mob reduzido (linear com floor, estilo Gaiadon §2.3 ~2%); Lumens e material INTACTOS; nunca bite na re-subida pós-Convergence (herói renasce abaixo da área); **invisível em UI** (sem tag/floater — como no Gaiadon) | com mob=área, farmar área velha viraria ótimo; a penalidade garante o freio por construção em vez de depender do fit |
| P9 | **Porta dupla: nível LIBERA a entrada da área; a dificuldade regula a permanência** (jul/04, decisão do dono corrigindo proposta do orquestrador no review adversarial) | o requisito de nível por área FICA (meta visível que destrava a porta); ao entrar, a parede de entrada (P2b) faz o trabalho — entrou fraco, apanha e volta naturalmente. O que muda: os NÍVEIS-alvo por área viram dial re-derivado no fit pra serem alcançáveis dentro do relógio de permanência da área (o v9-r7 exigia nv 81 pra sair da área 1 — inalcançável com XP/kill fixo do P1: 6h58 medido vs alvo ~1h no G1) | mantém uma meta legível pro jogador (nível) sem reintroduzir mob escalando; o bug do review não condenava o gate, condenava os números dele |
| P8 | **Sink de fim de mapa = Oferenda de Lumens no Awaken** (grill jul/04, decorrência de P3×P6) | First Light exige, além dos materiais, uma oferenda grande one-time de Lumens (número do re-fit, na casa do acumulado da fase final); sink repetível continua sendo promoção (degraus por tier) + level-up quadrático; pós-oferenda, excedente é espetáculo puro (P3) | P3 acelera renda enquanto P6 desacelera o custo repetível — sem um consumidor de fim de mapa os Lumens perderiam sentido; oferenda é temática (devolver a luz colhida) e entra no onboarding do Awaken já planejado |

**Sub-decisão RESOLVIDA (grill jul/04):** velocidade de ataque = **cap global
15 golpes/s pro jogo inteiro** (não por mapa). Atk speed é cadência (2.0 = 2
golpes/s de dano cheio; DPS = ATK × golpes/s). O Mapa 1 alcança ~2–3/s — o
teto só encosta em mapas futuros. Nota de implementação (não é design): perto
do teto a camada visual agrupa golpes (menos swings, floaters em lote), a
matemática não muda.

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

✅ **RE-FIT ÚNICO EXECUTADO E BAKEADO em 2026-07-04 (FITTER).** Dials em `src/data.js`
(hp[] das 18 áreas · mobAtkByArea · levelGateByArea[1]=40 · convGateBase 130 ·
convGateGrowth 1.32 · 6 boss hpMult · Okhra 320 · Oferenda 1e16). Validação em
10 seeds (todas completam): **First Light/Okhra 16h18–21h52** (relógio DESCOBERTO,
não gated) · Okhra 69–102 golpes (banda 60–120) · 1ª conv 43.9min · coroa conv 10 ·
árvore 100% conv 15 · razão de pontos 1.63 · TTK entrada 5–8s derretendo no
caminho COM prestige (no baseline nu só o G1 fica na banda; G2+ entra a 14–19s
— coerente com "mid-map exige prestige", medição do crítico) · G5–G6
pós-awaken 1.5s · 0 mortes na área 18 · P4 nua 1.37 lvls/kill (era 2.30).
Tests 6/6 · canon 0 drift. **NÃO commitado** (aguarda revisão do dono).

**✅ RATIFICAÇÕES DO DONO (jul/04, pós-fit):**
- **Relógio do First Light: banda descoberta 16–22h ACEITA** (a âncora antiga
  36h±2 era do paradigma velho; esticar futuro = conteúdo, não grind).
- **Teto sem prestige: G2 ACEITO como teto honesto** (supera o canon antigo
  "baseline trava em G4"; coerente com "gear sozinho NÃO vence" — todo jogador
  real converge aos ~44min, muito antes de sentir o teto).

**✅ RATIFICAÇÃO ADICIONAL (jul/05, pós-playtest do começo):**
- **Gate da área 2 = nível 80** (era 40 no fit). O dono alinha o gate ao TETO
  da faixa da área (`levelRange[1]`), fechando o padrão que todos os outros
  gates já seguiam (só o da área 2 estava solto em 40). Melhora a cascata de
  XP da fronteira 1→2 (entra mais forte). Valida no sim.
- **Hook de economia inicial:** os primeiros ~3-4 upgrades de gear devem vir
  em segundos (hoje: 1 upgrade em ~3.6min/64 kills — medido). Tune de curva de
  custo/renda inicial SEM mexer no relógio macro (First Light 16-22h). Via sim.

**Julgamento do orquestrador nos 4 pendentes:** (a) resolvido pela ratificação
acima; (b) serrote XP ×81 cru na fronteira 1→2 ACEITO como tolerância
estrutural do levelRange (o critério sentido — P4, ≤2 níveis/kill — está
cumprido: 1.37); (c) H2/H3 HTK bimodal ACEITO (tolerância pré-existente do
cliff de prestígio); (d) leak de backtrack G2→G3 ACEITO (janela de ~17 níveis
que a persona não explora; apertar o freio globalmente machucaria a progressão
normal — reavaliar só se playtest real mostrar exploit).

**[histórico] Plano original:** Roda-se UM re-fit implementando
a Parte I (P1–P8) + Parte II sobrevivente, medindo em TTK, sem gate de relógio
(descoberta) → bake → travar. **Roteamento do dono: Opus implementa a
estrutura e julga o fitting; Sonnet roda os testes e os batches de sim.**
Critérios de aceite vindos do grill: entrada de área fura a banda (~5–8s mob
comum) e derrete a ~1s · atk speed cap global 15/s (cadência, dano cheio por
golpe) · penalidade de XP invisível com floor (Lumens/material intactos) ·
oferenda de Lumens pagável no acumulado da fase final de UMA run · P4 só na
curva nua (cascata com bônus de XP é feature) · ratio recompensa/HP dos acesos
cresce por tier (Corona ~10–15× hpMult).
