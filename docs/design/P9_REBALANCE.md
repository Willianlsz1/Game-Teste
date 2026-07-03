# P9 — Rebalance estrutural do Mapa 1 (SPEC vivo)

> Aberto em jul/03/2026 a partir das notas de playtest do dono + lições do
> `GAIADON_NUMBERS.md`. Regra da casa: **nenhum número trava sem sim**
> (`tools/sim.js`, seeds 1/3/7). Este doc é a fonte da trilha; HANDOFF aponta pra cá.

## 0. As queixas do dono (playtest, jul/03) — e a evidência do sim

| Queixa | Evidência (baseline seed 1, pré-P9) |
|---|---|
| Kill pacing ruim, demora mesmo evoluindo | TTK 7–13s do nível 1 ao 535; 1º mob do jogo = 11s; ~5–9 kills/min sempre |
| Dano do player pequeno | ATK nível 535 = 76.8K; fim do mapa em centenas de K |
| HP dos mobs pequeno (área 18) | Mapa percorre 10⁴→2×10⁸; sem espetáculo de escala |
| Gear fraco e ruim | Promoção Common→Uncommon tímida; Gaiadon front-loada ~11.5× |
| Passivas fracas e sem graça | Valores literalmente 0 no data.js (placeholder confesso) |

Extra: 46 mortes até o nv 1150 sem padrão intencional; G2 já estava +96% fora
do alvo do framework antigo.

## 1. Decisões de direção (dono, jul/03)

- **Mapa MAIS LONGO** que as ~18h atuais.
- **Curva de foguete**: aceleração forte no início, desaceleração progressiva
  no fim ("sensação de aceleração no início e depois diminuir novamente").

## 2. Alvos do P9 (proposta Fable — validar no sim antes de travar)

### 2.1 Relógio: ~36h até First Light + Okhra

Entradas de grupo (tempo acumulado alvo, tolerância ±20% nas 3 seeds):

| Grupo | Áreas | Entrada alvo | Duração alvo | Sensação |
|---|---|---|---|---|
| G1 | 1–3   | 0        | ~45min | foguete: HTK 2–3, level-ups em cascata |
| G2 | 4–6   | ~45min   | ~2h    | ainda rápido, 1ª parede visível no H2 |
| G3 | 7–9   | ~2h45    | ~4h    | fim do Tema A ~7h; H3 é evento |
| G4 | 10–12 | ~7h      | ~6h    | o Porto morde; Convergence vira rotina |
| G5 | 13–15 | ~13h     | ~9h    | a Barriga engole; Awaken carrega |
| G6 | 16–18 | ~22h     | ~14h   | a Garganta: guerra de atrito até o Okhra |

Razão de duração entre grupos ≈ ×1.5–1.6 (desaceleração geométrica) depois do
sprint inicial.

### 2.2 Inimigos: família de fórmula com gap de expoente (lição central do Gaiadon)

Substituir os 18 pares `hp:[ini,fim]` calibrados à mão por valores **gerados**
de uma família única:

```
mobHP(L)  = hpA  × (L / hpX)^hpY(g)      # hpY sobe por grupo g (G1→G6)
mobATK(L) = atkA × (L / atkX)^atkY(g)    # atkY ≈ hpY − gap
gap ≈ 0.45–0.55 (FIXO — a parede é estrutural, não calibração)
```

- Escala alvo: mob de entrada da área 1 ≈ 2–3 hits do ATK inicial; área 18
  termina em **~10¹¹ de HP**.
- Os arrays por área continuam existindo em `data.js` (o engine não muda) —
  são REGERADOS pelo script da família. Comentário nos arrays passa a apontar
  P9 + fórmula geradora.
- Dano "de nível" do player cresce com expoente ~gap abaixo do HP → gear,
  Convergence e Awaken fecham o resto por construção.

### 2.3 TTK em forma de onda (a "sensação boa")

| Estado | Alvo |
|---|---|
| Entrada em área nova | 8–12 hits (parede visível, convite pra farmar) |
| Farm na banda | 2–4 hits |
| Trash pós-Convergence (volta ao início) | 1 hit — o momento "eu sou um deus" que hoje não existe |
| Harbinger na banda | 45–90s de luta |

### 2.4 Gear: promoção dramática + afixos de assinatura

- Common→Uncommon: salto de **×6–10** no stat (front-load à la Gaiadon §5),
  per-level continua o grind entre saltos.
- Per-level re-escalado pra acompanhar a família de inimigos (gear ≈
  multiplicador dominante early-mid).

**Afixos por peça (design P9, dono pediu "quais bônus criar" jul/03):** os
afixos base ficam (números re-escalados); o afixo Uncommon vira a ASSINATURA
da peça — promoção entrega ×6–10 de stat E uma mecânica visível:

| Peça | Base (mantém, re-escala) | Assinatura Uncommon (P9) |
|---|---|---|
| Weapon | ATK flat, ATK% | **Riven Edge (Cleave)** — o dano excedente do golpe fatal atinge o próximo inimigo (X% do overkill). Ondas derretem em cadeia |
| Helmet | XP Bonus, Damage Reduction | **Second Sight** (mantém: Lumen Light Chance em degraus) |
| Armor | HP flat, HP% | **Last Vessel (Bulwark)** — abaixo de 35% do HP, a redução de dano dobra. Substitui o siegeWard (invisível na prática) |
| Gloves | Crit Chance, Crit Damage | **Overcrit** — crit acima de 100% vira chance de GOLPE DUPLO (lição Gaiadon §3, crit vira multiataque) |
| Boots | Attack Speed, Ember Light Chance | **Momentum** — cada kill dá +X% attack speed por 6s, acumulando até Y stacks. A "aceleração" sentida em combate |
| Cloak | Lumens flat, Lumens% | **Corona Call** (mantém: Corona Light Chance em degraus) |

Removido: `specialDmg` da arma (nicho já coberto por Lightbane + Harbinger's
Bane na árvore). Novas mecânicas (Cleave/Bulwark/Overcrit/Momentum) entram no
combat.js no batch do P9.3 — pequenas, todas no tick/onKill existentes.

### 2.5 Player: escala inflada dos dois lados

ATK/HP do player (base+nível) re-escalados pra ordem de grandeza que
acompanhe a família (fim do mapa: ATK efetivo ~10⁸–10⁹ com gear+conv+awaken).
Número grande em AMBOS os lados = espetáculo sem quebrar TTK.

### 2.6 Passivas: Árvore I com folhas mecânicas (P9.4)

CORREÇÃO de premissa: as 3 árvores (Éclat/Vestige/Fracture) morreram no P6 —
existe a Árvore I (binária 1/2/4/8 + coroa, passives.js). A TOPOLOGIA fica.
O problema diagnosticado: tronco e folhas são TODOS "+X% silencioso" com
magnitudes homeopáticas — nada se sente. Redesign P9:

**Tronco (D1–D3) = fundações, magnitudes socadas** (mantém as chaves):
First Spark (ATK+HP), Regeneration | Heal on Kill (identidade de sustain),
HP% / Damage Reduction | ATK% / Crit. Re-escala: um nível de nó precisa ser
percebido no TTK/TTD (alvo: nó maxado ≈ +50–80% no seu eixo, não +25%).

**Folhas (D4) = mecânicas com cara** (3 trocas, 5 ficam):

| Folha | Efeito P9 | Status |
|---|---|---|
| Golden Wake (era Prospector's Eye) | X% de chance de Lumens EM DOBRO por kill (o "cling" da moeda dupla) | TROCA — lumens% flat vira aposta visível |
| Pilgrim's Wisdom | +XP% (re-escalado, punchy) | fica |
| Deep Memory | +Convergence Points% | fica |
| Overkill Echo | overkill do golpe fatal vira Lumens extra | fica (já é mecânica boa), buff |
| Deepcrack | +Crit Damage (re-escalado) | fica |
| Lightbane | +dano vs acesos (Ember/Lumen/Corona) | fica — casa com Rarity Find |
| Executioner's Light (era Quickened Pulse) | inimigo abaixo de X% do HP máx MORRE na hora (X sobe por nível, cap ~20%) | TROCA — execute é o final feliz do TTK wave; atkSpeed flat já vive nas boots |
| Harbinger's Bane | +dano vs Harbingers/Bosses | fica |

**Coroa (The Ring Closes)**: fica, multiplicativa, re-escalada pra ser um
EVENTO (~×1.3 em ATK/HP/Lumens/XP).

Novas mecânicas de folha (Golden Wake, Execute) entram no combat.js junto com
as de gear (P9.3/P9.4 são um batch só de mecânica + um de números).
Magnitudes finais: TODAS saem do sim (protocolo §3), estas são formas, não números.

### 2.8 Princípio: Mapa 1 é INTRODUÇÃO — mecânicas com caps baixos (dono, jul/03)

Decisão do dono: mecânicas de aceleração (gold extra, chance de raros, golpe
duplo, cleave...) são conteúdo de fase avançada; no Mapa 1 elas aparecem como
DEGUSTAÇÃO, com caps explicitamente baixos. O jogador sente o mecanismo,
entende o que ele vai virar, mas a expressão plena fica pros mapas seguintes.
Precedentes já no código: `map1AtkSpeedCap 2` vs `atkSpeedCap 15` final;
Uncommon terminal no Mapa 1 (Rare volta no Mapa 2); caps de Rarity Find
abertos por Marcos.

Caps de DESIGN do Mapa 1 (teto duro; o sim calibra abaixo deles, nunca acima):

| Mecânica | Cap Mapa 1 | Expressão futura |
|---|---|---|
| Cleave (weapon) | ≤25% do overkill | Mapa 2+: % maior, salta mais alvos |
| Overcrit (gloves) | crit efetivo ≤130% (chance de duplo ≤30%) | multiataque triplo em mapas futuros |
| Momentum (boots) | ≤3 stacks | mais stacks/duração depois |
| Bulwark (armor) | dobra DR abaixo de 35% HP (cap DR global 75 mantém) | thresholds maiores depois |
| Golden Wake (folha) | ≤10% de chance de Lumens dobro | tiers de multiplicador depois |
| Executioner's Light (folha) | execute ≤8% do HP máx | thresholds maiores depois |
| Rarity Find | caps atuais via Marcos (já é assim) | — |

### 2.7 Mortes com intenção

Morrer = sinal claro de "volte mais forte" (entrada prematura de área), não
ruído constante no farm da banda. Gate no sim: 0 mortes farmando na banda,
mortes concentradas em tentativa prematura.

## 3. Protocolo de validação (gates do sim)

1. `baseline`: entradas de grupo dentro de ±20% dos alvos §2.1, seeds 1/3/7.
2. TTK por estado dentro das bandas §2.3 em pontos de amostra (início/meio/fim
   de cada grupo).
3. `campaign`: First Light + Okhra em 36h ±2h nas 3 seeds.
4. Padrão de mortes conforme §2.7.
5. Todo candidato reprovado fica registrado aqui com o número que o matou.

## 4. Estado da trilha

- [x] Diagnóstico baseline (jul/03, seed 1) — números no §0
- [x] P9.1 Harness + candidato v1 FITADO (jul/03) — ver §5
- [x] P9.1b–d Candidatos v2→v4 (jul/03) — RELÓGIO NA BANDA: First Light 30h13,
      Okhra 31h31 (seed 1), curva acelera→desacelera ✓, árvore dura o mapa ✓
- [x] P9.1e Boss-fit + relógio fino (jul/03, Opus via 10-80-10) — v5 FECHADO,
      ver §7: First Light 35h50/36h48/37h10 (seeds 1/3/7, banda 36±2 ✓),
      Harbingers 20–40 HTK ✓, Okhra 62–75 golpes ✓, coroa conv 11 ✓,
      mortes com padrão intencional ✓
- [x] P9.3+P9.4 MECÂNICAS implementadas em src/ (jul/03, Opus + review Sonnet
      + fix batch): Cleave/Bulwark/Overcrit/Momentum no gear, Golden Wake/
      Executioner's Light na árvore, caps Mapa 1 em data.balance. 24/24 probes,
      regressão nv200 byte-idêntica, saves antigos migram grátis (reconcile
      reconstrói afixos). Fix pós-review: spill do cleave roteado por
      _dealDamage (consome Lightshell, ativa Executioner, guard intacto).
- [ ] P9.5 BATCH FINAL DE NÚMEROS — recalibrar com as mecânicas dentro:
      relógio 30h12 → 36h±2 (material/xp) · Okhra 126 golpes → banda 60–120 ·
      RE-SUBIDA (10 áreas > HTK 2; execute cap 8% não morde com HTK ≤ 11 —
      fecha via números da árvore, ou dono decide abrir o cap) · projeção de
      income é PISO (sem Cleave/GoldenWake/Momentum, comentado no código) ·
      baked: v6 dials + statePatch do player pra data.js/state.js · seeds 1/3/7
      → playtest do dono → travar.
- [ ] P9.2 Player scale + TTK wave (atkSpeed, HTK, curva de dano)
- [ ] P9.3 Gear (promoção ×6–10 + per-level)
- [ ] P9.4 Passivas (valores reais nas 3 árvores)
- [ ] P9.5 XP/Convergence ladder re-derivada pro relógio de 36h
- [ ] Pacote final validado nas 3 seeds → batch data.js (Sonnet) → travar

## 5. P9.1 — harness e resultados do candidato v1 (jul/03, seed 1)

**Harness (scratchpad da sessão; recriável):** `p9_generate.js` (família por
álgebra, lê levelRanges reais) → `candidate_vN.json` (dataPatch + statePatch)
→ `p9_run.js` / `p9_run_fit.js` (intercepta o load do sim via fs.readFileSync
e injeta o patch — sim INTACTO, zero fork) → `p9_fit.js` (loop: roda, mede
HTK/TTD nas entradas, re-ajusta hp[]/mobAtk por razão; convergiu em 8 passes).

**Dials v1 travados no fit:** player atk = 1000 + 8·L^1.5 · hp = 1000 + 4·L^1.45
(statePatch; a implementação final move isso pro data.balance) · uncommon
statMult 8 · weapon perLevel 220 · armor perLevel 60 · HTK alvo: entrada 10
(área 1: 2.5), saída de banda 3 (= entrada[i+1]×3/10, bandas contíguas) ·
TTD entrada 25s.

**O que o v1 ACERTOU (baseline):** área 1 TTK 2.8s (foguete ✓) · HTK 10 e TTD
25s em TODAS as entradas (fit ±11%) · espetáculo: mob área 18 ~5–7×10⁹, player
ATK 243M no fim do baseline · coroa na conv 8 (banda alvo) · razão de pontos
1.53 ✓ · rarity find saudável (G6: 9.4/5.0/1.7%).

**Os 3 gaps (campanha, 100h timeout) + decisões do dono (jul/03) sobre eles:**
1. **First Light INALCANÇÁVEL** — material firstLight 1/3 em 100h.
   **DECISÃO DO DONO: o requisito vira MASSA — ~30k–100k de materiais**, não
   3 unidades raras. Material de Awaken passa a ser moeda farmada em volume
   (drop por kill nos grupos avançados + bônus de boss); o requisito grande é
   espetáculo E relógio ao mesmo tempo. v2: dimensionar fluxo pra fechar
   30k–100k em ~30–34h de jogo.
2. **HTK do 1º contato com Harbinger = 247 (H1)** — hpMult herdado (17.42)
   sobre entrada HTK 10 explode. v2: derivar hpMult por fórmula do alvo
   HTK_boss 25–35 no dano de meio-de-banda.
3. **Re-subida não derrete** (HTK até 6.6, alvo ≤2).
   **DECISÃO DO DONO: Convergence NÃO é fonte de poder direta nesta fase —
   o poder transfere pra ÁRVORE DE PASSIVAS: nós mais fortes E mais custosos.**
   v2: convLegacy reduzido a resíduo (~0–2%/conv); UNIT da árvore socado
   (nó relevante no TTK) e custos re-escalados pra árvore durar o mapa inteiro
   (hoje ela fecha 100% na conv 13 e vira tédio — custo maior = sink de pontos
   até o fim). A re-subida derrete VIA árvore comprada com os pontos.
4. (Cauda) sem First Light o gate ×1.3 corre solto → 24 convergences, runs de
   35h. Resolve-se com (1); validar conv count ~12–16.

## 6. P9.1b–d — trajetória v2→v4 (campanha, seed 1, jul/03)

| Candidato | Mudança | First Light | Achado |
|---|---|---|---|
| v2 | material vira massa (drop comum G5+, req 50k) · boss hpMult 5.5 · árvore UNIT×3 custos [150,300,700,1600] evoRamp 1.9 · convLegacy 2% | 8h44 | destravou; meio colapsa (convs de 2–7min); Okhra 1 hit |
| v3 | xpMultByGroup→1s (mata acelerador P7) · xpCurveExp 1.78 · req 75k · boss ratio-fit · okhra 810 | 11h11 | curva inicial linda (33m→1h52); G4–G5 ainda colapsa; bosses oscilam entre runs |
| v4 | xpCurveExp 1.9 · gateGrowth 1.35 · okhra 15000 · RE-FIT das áreas (10 passes, topo 6.5e11) | **30h13 (Okhra 31h31)** | BANDA ✓ · curva 67m→2h54 acel + 3h28→8h22 desacel ✓ · coroa conv 11 ✓ · árvore 66% no fim ✓ · Okhra 6477 golpes/54min (overshoot) · bosses precisam de fit próprio pós-arrays |

Lições de método: (a) hpMult de boss SÓ se fita depois dos arrays de área
estabilizarem (ele cavalga o mob HP); (b) BOM do PowerShell corrompe JSON de
candidato — makers sempre em Node; (c) o fitter oscila com xpCurveExp alto
mas converge (maxDev 0.055 no pass 10).

## 7. P9.1e — candidato v5 FINAL (jul/03, executado por Opus, revisado por Fable)

**Dials que diferem do v4:** Harbinger hpMult = {área3: 0.483, área6: 3.0,
área9: 90, área12: 5.49, área15: 1.33, área18: 13.87} · Okhra mapBoss hpMult
208 · firstLight 100000 (teto do dono). xpCurveExp 1.9 e arrays de área
intocados (relógio fechou só com material).

**Validação (campanha, 3 seeds):**

| Seed | First Light | Okhra | Coroa | Razão | Árvore fim |
|---|---|---|---|---|---|
| 1 | 35h50m | 69 golpes/34s | conv 11 | 1.71 | 66% |
| 3 | 36h48m | 64/32s | conv 11 | 1.71 | 66% |
| 7 | 37h10m | 62/31s | conv 11 | 1.71 | 66% |

Mortes: 8–17/campanha, ZERO na área 18/Okhra, concentradas em entrada
prematura (padrão §2.7 ✓). TTK/TTD de entrada intocados (HTK ~10 / 25s ✓,
área 1 = 2.8s ✓). Baseline sem prestige trava em G4 por design (o meio-mapa
EXIGE Convergence).

**Tolerâncias aceitas:** razão 1.71 (0.01 acima da banda, consistente — resíduo
do gate ×1.35) · H1 seed3 = 44 HTK (erra pro lado alto, regra do dono) · H2
instável por natureza (1º contato salta de estado; mult 3.0 = meio da banda
nas 3 seeds, nunca 1-hit).

**Pendência herdada:** re-subida (P9.1f → resolve com P9.4).

## Superseded

- Anchors P8.5b (First Light 18h22–18h26) ficam válidos APENAS como registro
  histórico do estado pré-P9; deixam de ser gate quando o P9 travar.
