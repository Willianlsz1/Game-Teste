# Gaiadon: Eternal Quest — números e fórmulas (referência de gênero)

> **Engenharia reversa dos fontes (jul/03/2026)** — Godot 4.2, build 0.8.2 Alpha (demo, itch.io).
> Método: .pck baixado e extraído (136 fontes GDScript em texto + 7 JSONs de dados); dois agentes mineraram independentemente e os relatórios convergiram (verificação cruzada).
> **Uso: REFERÊNCIA, nunca cópia.** Qualquer número do Éclats continua saindo do nosso `tools/sim.js`.
> Citações arquivo:linha referem-se à árvore extraída (scratchpad da sessão; re-extraível a qualquer momento do .pck público).

---

## 1. Arquitetura de stats — igual à nossa

Toda stat soma em dois baldes: `BASE` (fontes somadas) e `MODIFIER` (% somados), final = `ΣBASE × (1 + Σ%/100)`, com a Transcendence multiplicando por fora — ou seja, **exatamente a nossa pilha `flat × (1+pct) × mult`**. Fontes de ATK: nível + gear + ascension + fame + skills + transcendence, todas escrevendo nos dois baldes.

## 2. Inimigos — UMA família de fórmula pra tudo

```
stat = (level / x) ^ y        # HP, ATK, Gold e XP do inimigo usam a MESMA forma
```
`(x, y)` vêm de **8 buckets de dificuldade** indexados pelo nível do mob (`enemy.gd:364-374`, `constants.gd:437-489`, `utils.gd:141-153`). O expoente `y` SOBE por bucket — a curva acelera conforme o jogador avança:

| Bucket | nível < | HP (x, y) | ATK (x, y) | Gold y | XP y |
|---|---|---|---|---|---|
| 1 | 11 | 0.30, **1.50** | 0.80, **0.90** | 1.60 | 1.70 |
| 2 | 301 | 0.25, 1.55 | 0.70, 1.00 | 1.60 | 1.68 |
| 3 | 601 | 0.19, 1.75 | 0.60, 1.20 | 1.70 | 1.50 |
| 4 | 3501 | 0.15, 2.00 | 0.50, 1.50 | 1.80 | 1.40 |
| 5 | 5501 | 0.13, 2.05 | 0.45, 1.55 | 1.90 | — |
| 6 | 15701 | 0.09, 2.22 | 0.33, 1.67 | 2.00 | — |
| 7 | 90000 | 0.07, 2.27 | 0.33, 1.67 | 2.20 | — |
| MAX | ∞ | 0.07, **2.33** | 0.33, **1.82** | 2.82 | 1.35 |

**Ranks** (multiplicadores flat, `enemy.gd:421-465`): NORMAL ×1/×1 (gold ×1.1) · ELITE ×1.25/×1.25 (gold ×2, xp ×1.25) · CHAMPION ×1.75/×1.75 (gold ×4) · FIEND ×3/×2 (gold ×40, xp ×15) · DEMON ×10/×6 (×50/×25) · TITAN ×20/×10 (×60/×40). Affix CORRUPTED: tudo ×2. Gold ainda ×(world_tier+1).

## 3. Herói — XP e ganhos

```
XP_acumulado(nível) = ((nível − 1) / 0.2) ^ 2.6      # invertível; cap nível 1.000.000
```
(`hero_level.gd:7-8, 43-57`). Ganhos por nível (lineares, `level_data.gd:6-12`): **ATK +5 · HP +10 · CritRate +0.01% · CritDmg +0.05% · Gold +0.25%**. Crit acima de 100% vira múltiplos ataques garantidos (`utils.gd:84-102`).

## 4. Custos — três curvas diferentes

| Sistema | Fórmula | Nota |
|---|---|---|
| **Gear** (por nível) | `base[rar] × multi[rar] × soma_aritmética(início, N)` | **QUADRÁTICO** no nível, não geométrico — atípico no gênero (`gear.gd:122-137`) |
| **Skills** | soma de série geométrica, `multi` 1.04–1.18 por cap | geométrico clássico (`skills.gd:120-142`) |
| **Skill Trainer** | `base × multi^nível` | exponencial puro (`skills.gd:249-256`) |
| **Ascension (gold)** | `2e6 × 2.7^N` (N≥3; 3.0 depois da 5ª) | geométrico (`ascension.gd:191-215`) |
| **Corrupted Domain** | `base × cm(nível)^nível`, cm cresce com o nível | exponencial "deslizante" (`corrupted_domain.gd:192-199`) |

Gear por raridade: Common base 0.06/multi 1.21/cap 700 · Uncommon 0.22/3.0/1500 · Rare 5e4/5/4000 · Epic 5e6(–5e7)/6/8000.

## 5. Equipment — 12 slots, poder front-loaded

12 slots fixos sempre equipados (`enums.gd:245-258`). 9 raridades no enum, só 4 implementadas (Common→Epic). Stats por item no padrão `{value, level_incre, level_gap}` (incremento a cada gap níveis). **O salto Common→Uncommon dá ~11.5× no incremento de ATK; os tiers seguintes só ~1.15×** — o valor do gear está na PROMOÇÃO de raridade, não no nível dentro do tier (`equipment_data.gd:58-188`). Promoção custa materiais + gold em degraus fixos por tier (2e9 → 2e11 → 2e13 na arma). Bônus de sinergia por conjunto de mesma raridade (`gear.gd:13-19`). Arma tem "Rage" próprio: XP de rage `0.5×1.5^(nv−1)`, bônus `0.1×1.25^(nv−1)`, cap 75.

## 6. Mundos e locations

**3 mundos × 15 locations = 45** (`location_data.json`): Aetheria (asc 0, nv 1+) · Eredurn (asc 10, nv 5501+) · Frostheim (asc 15, nv 15701+). Cada location tem banda `min_lvl/max_lvl` de spawn, gate por ascension, e `enemy_spawn_count` crescendo de 1 até 10 mobs simultâneos. **World Tier** (via Transcendence) infla as bandas em +200%/tier e o gold em ×(tier+1) — um dial manual de New Game+.

## 7. Prestige em duas camadas

- **Ascension** (máx 180; demo capa em 5): reseta nível/XP/gold, mantém gear/skills; custo = gold geométrico + requisito de nível por blocos; ganho permanente **+8 ATK, +17 HP, +0.1% gold por ascensão** (linear cumulativo). ≈ a nossa **Convergence**.
- **Transcendence** (máx 5): gate a cada **30 ascensions**; reseta a ascension pra 0; dá multiplicador global **×(1 + 1.5×nível)** em ATK/HP/Gold/XP + acesso a World Tier (+2/nível); liga auto-ascend. ≈ um "meta-prestige" acima do nosso Awaken.
- **Fame**: 9 heróis colecionáveis + 50 títulos; +5% ATK / +1% HP por nível de fama. **Corrupted Domain** (asc ≥10): mini-idle de 5 geradores com custo exponencial deslizante, moeda vinda de mobs Corrupted (40% de roll).

## 8. Spawns raros e caps

Roll de rank por kill; **caps: Champion ≤10%, Elite ≤20%** (`constants.gd:365-366`) — as taxas COMEÇAM ~0 e crescem via gear/skills/fame (progressão de "sorte" como stat). FIEND via mimic 1% (2% nas 2 primeiras ascensions). DEMON/TITAN só por evento timed (3600s/10800s). Pet cards: 2%/1 no NORMAL até 80%/5 no TITAN.

## 9. Offline = acelerador, não simulação

`max_offline_time = 28800s` (8h) banca um buff **Rested Spirit**: ao voltar, `Engine.time_scale = 2` pelo dobro do tempo acumulado. **Zero ganho passivo ausente** — só catch-up ativo. (O nosso offline simula de verdade — somos mais generosos que a referência.)

## 10. A parede — o achado central

Em TODOS os buckets, o expoente do HP inimigo é **~+0.5 acima** do expoente do ATK (1.50/0.90 → 2.33/1.82). Esse gap fixo É a parede: dano "de nível" nunca alcança o HP estruturalmente, então gear (salto de raridade), Ascension (flats permanentes) e Transcendence (multiplicador) são **obrigatórios por construção** — o hits-to-kill sem gear cresce ~`nível^1.33` e trava o jogo em poucas centenas de níveis. O relógio do jogo é o ritmo com que o jogador fecha esse gap por fora do nível.

---

## O que isso ensina pro Éclats (leitura minha, jul/03)

1. **Nossa pilha de stats está certa** — camadas BASE/(1+%)/mult idênticas às do gênero.
2. **Nosso gate de gear por raridade+materiais é o padrão do gênero** — e o Gaiadon vai além: front-loada ~11× o poder na 1ª promoção. Validado o `gear-rarity-materials-gate`; considerar salto de promoção mais dramático no P8.6.
3. **A parede deles é um GAP DE EXPOENTE FIXO** (HP^~2.3 vs dano^~1.8, diferença ~0.5 constante). O nosso F3 ("sem parede após min 15") era exatamente a ausência disso — o P2 consertou com calibração por grupo; a alternativa "gap de expoente" é mais simples de raciocinar e vale estudo no P8.6/Mapa 2.
4. **Buckets de dificuldade** (expoente que sobe por faixa de nível) = um dial de aceleração elegante; nosso análogo são os grupos G1–G6 com xpMultByGroup.
5. **Prestige count como métrica real de progresso** (locations gateadas por nº de ascensions, não por nível) — rima com a nossa decisão canônica "gate de Convergence = área, não nível".
6. **Sorte como stat progressível com CAP** (Elite ≤20%, Champion ≤10%) — bom modelo pro nosso eliteChance da Fracture.
7. **Duas camadas de prestige com razão ~30:1** (30 ascensions → 1 transcendence) — régua útil quando o Mémoires/pós-Convergence for desenhado (registrado, não desenhar agora).
8. **Offline deles é pior que o nosso** — manter nossa simulação real como diferencial.
