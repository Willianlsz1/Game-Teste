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

### 2.4 Gear: promoção dramática

- Common→Uncommon: salto de **×6–10** no stat (front-load à la Gaiadon §5),
  per-level continua o grind entre saltos.
- Per-level re-escalado pra acompanhar a família de inimigos (gear ≈
  multiplicador dominante early-mid).

### 2.5 Player: escala inflada dos dois lados

ATK/HP do player (base+nível) re-escalados pra ordem de grandeza que
acompanhe a família (fim do mapa: ATK efetivo ~10⁸–10⁹ com gear+conv+awaken).
Número grande em AMBOS os lados = espetáculo sem quebrar TTK.

### 2.6 Passivas: desenhar de verdade (P9.4, sub-trilha)

- Éclat/Vestige/Fracture ganham valores reais, com nós que SE SENTEM
  (ex.: +20–30% num nó, breakpoints, não +1% homeopático).
- eliteChance da Fracture segue o modelo Gaiadon §8: sorte como stat
  progressível com CAP explícito.
- Ordem: depois de 2.2/2.3 travados (passivas dependem da escala nova).

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
