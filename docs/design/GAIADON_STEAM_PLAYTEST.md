# GAIADON STEAM — fórmulas e números MEDIDOS (âncora do COMO_BALANCEAR)

> Estudo de campo de 2026-07-05, versão Steam (v0.9.8910 EA, Godot).
> 3 fontes cruzadas: mineração dos stat-exports (4 CSVs, 2025→2026) ·
> observatório do endgame do dono (F1) · run cronometrada reset→1º prestige
> (F2, 64min, executada ao vivo). Dados brutos:
> `C:\Users\KABUM\Desktop\gaiadon_backup_20260705\` (REPORT.md da mineração,
> OBSERVATORY_F1.md, EARLYGAME_F2.md, CSVs). Complementa GAIADON_NUMBERS.md
> (versão itch) — onde divergirem, ESTE (medido no Steam) é o mais recente.
> **Uso: cada forma do COMO_BALANCEAR.md aponta pra uma seção daqui.**

---

## F1 — Agregação de stat (a fórmula-mãe)

```
total = t0 × (1 + t1/100) × t2 × (1 + t3/100) × (1 + t4/100) × (1 + t5/100)
```

- t0 = balde FLAT acumulado · t1 = % aditivo · t2 = multiplicador puro
  (default 1) · t3–t5 = camadas % plugadas por update (Corruption/Divinity/
  Paragon).
- **Verificação (endgame do dono):** ATTACK na tela 8.41e65 = 1.561e25 ×
  1.7955e19 × 5.145e7 × 7.3e7 × 9.398e4 × 8.5 — bate com 3 dígitos.
- Dentro de um sistema o ganho é aditivo; ENTRE sistemas multiplica.
  Fontes do multiplicador (F1 endgame): Fame ×49.5m · Equipment ×960k ·
  Achievements ×92.4k · Incursion ×33.8k · Synergy Surge ×2.87k.
- No save jovem (pós-Asc 1): t2 = 1 em tudo — o balde mult é recomposto
  pelas FONTES conforme reacumulam; gear % vive no t1.
- Quem explode com o tempo é o t0 (flat): HP t0 ×2.4e11 em 8 meses; o t2
  cresce só ×5–9 no mesmo período.

## F2 — Custo de gear

```
custo(N) = (base + slope·N) × r^N
  early (medido): base≈0.35K, slope≈0.73K  →  1.08K, 1.81K, 2.54K, 3.26K,
                  3.99K, 4.71K... (incremento CONSTANTE +0.73K/nível)
  late  (medido): r ≈ 1.0014/nível (dobra a cada ~495 níveis)
```

- Curva IDÊNTICA entre os 12 slots (custo é função só do nível).
- Preço xK = soma dos K próximos (verificado: x10 @Lv6 = 79.8K vs 79.95K
  previsto, erro 0.2% de arredondamento de display).
- slope/base ≈ 0.68 — o custo já quase dobra do nível 1 pro 2 (generoso mas
  nunca grátis).
- Endgame (F1): peça nível 19.155M de cap 27.5M, custo x1 = 4.6E11425;
  x10=10.1× · x100≈113× · x100k≈10^61× o x1.

## F3 — Poder de gear por nível (linear literal, sem retorno decrescente)

| Peça | Por nível |
|---|---|
| Arma | +15 ATK flat E +1% ATK |
| Peito | +0.5% HP (sem flat) |
| (F1 endgame, 12 slots) | 4 camadas por peça: Primary flat / Bonus % / Multiplier × / Mastery % |

- Idêntico à versão itch (+15/+1%) — o modelo é estável entre builds.
- Cap de nível POR RARIDADE (Common = 2.000). Promoção ergue o cap →
  MAX_EQUIPMENT_LEVEL progressivo (236K→411K→3.84M no save do dono).
- Promoção Common→Uncommon (arma): 200 partes-da-peça + 100 Anvils +
  60 Recipes da raridade + **2B gold** (~10.000× a carteira na hora) +
  peça no cap. Materiais dropam passivos no farm.
- Linha RAGE (arma): sobe por KILLS (75 kills → nível 2; +10%→+12.5% ATK)
  — segunda moeda de progressão dentro do item.
- Synergy: todas as peças ≥ N → bônus de conjunto (empurra nivelar parelho).

## F4 — Inimigo

```
mob_level = clamp(player_level, area.min, area.max)   [visto ao vivo: player
                                                        Lv52 vs mob Lv50 no
                                                        teto da Verdant Valley]
HP(level) exponencial com gap acima do dano-de-nível do player
```

Pontos medidos (área 1 = Verdant Valley Lv1–50; área 2 = Riverbend ~50–150):

| Level | Tipo | HP | ATK |
|---|---|---|---|
| 1 | normal | 17.4 | 1.42 |
| 11 | champion | 444 | 27.5 |
| 40 | normal | 1.55K | 57.1 |
| 48 | normal | 3.72K | 68.5 |
| 50 | champion | 10.5K | 125 |
| 52 (área 2) | normal | 12.1K | 74.2 |
| 52 (área 2) | elite | 10.4K | 92.8 |
| 118 | normal | 15.6K–47.3K | 168 |
| 126 | champion | 92.4K | 315 |
| 138 | elite ×2 | 62.8K/76.8K | 246 |
| 162 | normal | 80.1K | 231 |

- Área 1 early: r_HP ≈ 1.12/nível (Lv1→48: ×214 em 47 níveis).
- **Variância de spawn ~×3 no mesmo level/tipo** (15.6K vs 47.3K) — ruído
  intencional, não bug de leitura.
- Champion ≈ 3× HP do normal · Elite ≈ 4–5× · cards com cor própria
  (roxo/vermelho).
- Entrada de área = SPIKE: HTK 2 no fim da área 1 → HTK 5–6 na porta da
  área 2 (e mata: TTD real, "You have died").
- Endgame (F1): dificuldade indexada por World Tier; área = skin no late.

## F5 — Economia (income, morte, espetáculo)

- Income cresce ACIMA da dificuldade: gold/min ×138 em 48min de run
  (7.93K→906K); no endgame, gold/min sobe ordens de magnitude por World
  Tier enquanto HP sobe ~2 ordens.
- Gold/kill área 1 @Lv50 ≈ 13.3K (133K/min ÷ 10 kills/min).
- GOLD CRIT: chance base 5.01%, multiplicador 10× (visto: 74.5K num kill).
- **Imposto de morte ≈ 25% do gold líquido por morte** (3 observações:
  −235K, −1.16M em sequência de mortes, −348K). Gear comprado é imune →
  estratégia emergente: converter gold em gear ANTES do push.
- Push prematuro é auto-punitivo SEM bloqueio: área 2 under-geared rendeu
  gold/min 61K vs 133K na área 1 (kills lentas + mortes) — mas no timing
  certo rendeu 3× o XP. O jogo ensina o Loop sozinho.

## F6 — Prestige (Ascension)

```
gate(k):    Lv 150 → 300 → 590 → 1000 → 1500       (escada ~×2 → ×1.7)
oferenda:   10M → 30M gold                          (×3 por rito)
recompensa: stats-base/level DOBRAM por rito         (+4/+8.5 → +8/+17 → +16/+34)
```

- Zera: gold + character levels. MANTÉM: gear, materiais, achievements,
  pets — **~82% do Dmg efetivo atravessou o rito** (19.7K → 16.2K).
- Melt da re-subida: Lv3→26 em 2min (1º ciclo: ~6min); Dmg supera o
  pré-rito em ~3min.
- 1º rito REVELA sistema novo (Pets) — o prêmio é a revelação.
- Confirm dialog exemplar: "Reset: Gold and Levels. Keep: everything else."
- Camadas acima: Ascension → Sacrificial Altar → Apotheosis (mineração:
  razões estáveis Asc:Trans ≈ 30:1, Trans:Apo ≈ 6:1 ao longo de 1 ano).

## F7 — Relógio (âncoras de pacing do early, T0 = hard reset)

| T | Marco |
|---|---|
| ~1 min | Equipment libera (Lv3) |
| 1:30 | Gold 21.9K; Dmg 19.6→532 |
| ~9 min | Lv10: Daily Quests; anuncia Ascension@100/150 |
| ~24 min | Lv52 > teto da área 1: área 2 desbloqueia (viagem MANUAL) |
| ~27 min | 1ª morte (porta da área 2) |
| ~33 min | Lv100: Ascension revelada |
| **64 min** | **1º prestige executado** (Lv187, 13.1M gold) |

- XP/min ×138 em 48min; level-up dá flat ATK → flywheel (level → mata mais
  rápido → mais XP).
- Nosso G1 (~40min até a 1ª Convergence) está na banda do gênero.

## O que isso corrige/valida no Éclats (fila de fit)

1. **CORRIGIR — custo de gear**: nosso quadrático → `(base+slope·N)·r^N`
   (estrutura gearCostBase/Linear/Exp já existe; é fit, não refactor).
2. **DECIDIR (dono) — imposto de morte**: ~25% dos Lumens líquidos por
   morte; barato de implementar, pune overreach com elegância.
3. **VALIDADOS (não mexer)**: P1 clamp · P2b spike de entrada · P3 income
   acima da dificuldade · P5 escada + raros desproporcionais · P7 backtrack
   · P8 Oferenda · gate de materiais · "o prêmio é a revelação".
