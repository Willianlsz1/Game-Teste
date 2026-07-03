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
- [ ] P9.1 Família de inimigos (script gerador + candidato v1 no sim)
- [ ] P9.2 Player scale + TTK wave (atkSpeed, HTK, curva de dano)
- [ ] P9.3 Gear (promoção ×6–10 + per-level)
- [ ] P9.4 Passivas (valores reais nas 3 árvores)
- [ ] P9.5 XP/Convergence ladder re-derivada pro relógio de 36h
- [ ] Pacote final validado nas 3 seeds → batch data.js (Sonnet) → travar

## Superseded

- Anchors P8.5b (First Light 18h22–18h26) ficam válidos APENAS como registro
  histórico do estado pré-P9; deixam de ser gate quando o P9 travar.
