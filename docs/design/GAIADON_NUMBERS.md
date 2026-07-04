# Gaiadon: Eternal Quest — números e fórmulas (referência de gênero)

> **Engenharia reversa dos fontes (jul/03/2026)** — Godot 4.2, build 0.8.2 Alpha (demo, itch.io).
> Método: .pck baixado e extraído (136 fontes GDScript em texto + 7 JSONs de dados); dois agentes mineraram independentemente e os relatórios convergiram (verificação cruzada).
> **Uso: REFERÊNCIA, nunca cópia.** Qualquer número do Éclats continua saindo do nosso `tools/sim.js`.
> Citações arquivo:linha referem-se à árvore extraída (scratchpad da sessão; re-extraível a qualquer momento do .pck público).
>
> **ADENDO jul/03/2026 — build Steam (definitiva, Godot 4.4) minerada:** ver §11.
> As FÓRMULAS abaixo (§2–§4, §7–§9) são da build HTML antiga e seguem sendo a
> única fonte de fórmula exata — a build Steam criptografa os scripts (.gdc +
> script encryption). Os DADOS da Steam (JSONs legíveis + saves reais do dono)
> confirmam, corrigem ou expandem o que está marcado no §11.

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

## 5b. Equipment — a tabela COMPLETA de afixos (minerada jul/04/2026, do disco)

> Árvores extraídas ainda vivas em `%TEMP%\claude\...\204810fa...\scratchpad\gaiadon_data\`
> (HTML) e `...\gaiadon_steam\extracted_full\Data\` (Steam). Steam `equipment_data.json`
> = MESMA estrutura da HTML (12 slots, 4 raridades, itens 01–48); Legendary/Mythic
> existem só como receitas de crafting (stats nos .gdc criptografados — irrecuperáveis).

**12 atributos no jogo inteiro** (`enums.gd:17-50`): HP · ATTACK · ATTACK_SPEED ·
CRIT_RATE · CRIT_DAMAGE · GOLD_BONUS · KILL_COUNT_BONUS · XP_BONUS ·
GOLD_CRIT_RATE · ELITE_SPAWN_RATE · CHAMPION_SPAWN_RATE · ENEMY_HP_REDUCTION.
Cada um em BASE (flat) e/ou MODIFIER (%). Fórmula por item:
`stat(level) = base + incre × floor(level/gap)` (`gear.gd:276-293`).

**Nº de afixos por item CRESCE com a raridade: T1=2 · T2=3 · T3=4 · T4(Epic)=5**
— a promoção de raridade também ADICIONA afixos, não só multiplica (alavanca de
design; rima com o nosso "assinatura desbloqueia no Uncommon").

**Escala por raridade** (mesma tabela pra qualquer slot que carregue o atributo;
`equipment_data.gd:56-228`) — o incremento/nível de ATTACK BASE: Common 1.5 →
Uncommon **17.25 (o salto ×11.5)** → Rare 19.83 (×1.15) → Epic 22.81 (×1.15).
Degraus (gap) por atributo: atkSpeed /5nv · crit /25nv · critDmg /3nv ·
goldCrit /100nv · gold /5nv · xp /2nv · enemyHpRed /100nv · eliteSpawn /60nv ·
championSpawn /90nv · killCount /40nv (mesma técnica dos nossos `step`).

**Set synergy** (`gear.gd:13-19`): nível de sinergia = `floor(menorNível/10)` das
12 peças (o set é gateado pela PIOR peça) → +1.5% ATK, +1.5% HP, +0.5 critDmg,
+5 gold, +5 xp por nível, cumulativo, agnóstico a raridade.

**Weapon Rage** (`gear.gd:20-22`): a arma tem XP próprio (1 + KILL_COUNT_BONUS
por kill), custo `0.5×1.5^(N-1)`, bônus `+10%×1.25^(N-1)` de ATK (modifier), cap 75.

**Custos**: level-up quadrático (base×multi×Σníveis; Common 600/1.21/cap 700 ·
Uncommon 2200/3.0/1500 · Rare 5e4/5/4000 · Epic 5e7/6/8000). Promoção exige
max_level da raridade atual + materiais + gold (2e9 → 2e11 → 2e13 na arma).

**Afixos que o Éclats NÃO tem** (candidatos avaliados no
`GEAR_BONUS_CATALOG.md`): ENEMY_HP_REDUCTION (mob nasce com −X% HP) ·
KILL_COUNT_BONUS (cada kill conta ×N pra contadores) · GOLD_CRIT_RATE (drop
crítico de gold — valida nosso Golden Wake como padrão do gênero) · set
synergy · Rage. GOLD/XP/crit/atkSpeed/spawn-rates: já cobertos pelos nossos.

## 5c. Endgame de gear validado por print real (dono, jul/04/2026 — Godslayer's Blade, Mythic, nv 19.1M)

O print do save do dono CONFIRMA as fórmulas mineradas em endgame extremo:
- ×191k Attack Multiplier = 0.050 × (19.149.872/5) — bate exato.
- Rage nv 210 = +1.80e21% ATK = 10%×1.25^209 — a fórmula da HTML segue viva.
- Gaps do print (/3, /5, /25, /100 níveis) = os mesmos da tabela §5b.
- Mythic carrega ~11 afixos (a escada 2→3→4→5 afixos/raridade continua).
- 🆕 Cap de nível do gear escala com TRANSCENDENCE (demo: fixo 8000; print: 27.5M).
- 🆕 O MESMO stat aparece em até 3 baldes na MESMA peça, em variantes:
  "Primary" (flat) → "Mastery"/"Bonus" (%) → "Multiplier" (×, crescendo
  LINEAR com o nível). O espetáculo e21% vem daí: no endgame o gear escreve
  no balde MULT. Lição pro Éclats: expressão futura de afixo = subir de
  balde por mapa/raridade (Mapa 1 mantém mult escasso, §2.8 — coroa e First
  Light apenas).
- "Boss token" find em gear = afixo de moeda (valida o candidato Gleaner's
  Hook do GEAR_BONUS_CATALOG.md).

## 5d. Skills — o sistema completo (minerado jul/04/2026)

**Arquitetura:** Skill Trainer (gerador idle: 2200 SP a cada 25s, ×1.1/nível,
custo 1e7×1.3^nv) alimenta LIVROS de skills. Livro 01 = ativas (SÓ 3 no jogo
inteiro: Venomous Slash, Heal, Infernal Blast — o jogo é ~95% passivas).
Livro 02 = 37 passivas em 5 tiers. Livro 03 (Steam) = 36 passivas de endgame
(custos 1e13–1e20). Custos por max_level: 500→multi 1.04 · 100→1.10 · 50→1.18.

**Padrão de gerações:** o mesmo stat reaparece por tier como Vitality I/II/
III/IV etc. (I no tier 1, II no tier 3...) — a "árvore nova por mapa" deles é
gerações do mesmo eixo com números maiores. Rima com Árvore I/II/III do Éclats.

**Passivas MECÂNICAS (não-stat) — as que importam pro nosso tranca-e-chave:**
- **Slay I/II** — chance de kill instantâneo (0.25%/nv, não funciona em boss)
  = valida o nosso Executioner's Light (execute é padrão do gênero).
- **Splash I/II** — ataques básicos causam % do ATK em TODOS os inimigos
  = valida o Piercing Light do dono (dano vazando pra onda é padrão).
- **Blood Drain I/II** — chance de leech (3%/nv rouba 4% HP máx)
  (nós mantemos sustain na árvore por design; leech chance registrado).
- **Tactical** — -cooldown de skill (não temos ativas; n/a).
- **Elite/Champion Tracker** — +chance de spawn raro = nosso Rarity Find.
- **Onslaught I (Steam, tier 5)** — +contagem de inimigos NA TELA (até o cap
  da location) como COMPRA do jogador — onda maior como escolha, não imposição.
- **Retained Knowledge/Ascension (Steam)** — começa com N níveis após
  ascension / N ascensions após Transcendence = QoL de re-subida COMPRÁVEL.
- **Ascendant Potential / World Mastery (Steam)** — +cap de nível / +world
  tier máximo: caps como conteúdo comprável.

**Mecânicas de INIMIGO além de stats:** a build HTML só tem o affix CORRUPTED
(40% de roll, ×2 tudo, atkSpeed ×1.5) — **os mobs deles são mais POBRES que
os nossos** (nós: 4 modificadores + assinaturas de Harbinger). O lado rico é
o endgame Steam (Incursion): 4 facções, 25 tiers, inimigos com
resistance/penetration por tipo de dano e "dread" (enrage crescente 0→850) —
tranca-e-chave em nível elemental. Ranks têm atkSpeed mod crescente
(Elite +0.25 → Titan +0.5): o ATK de mob importa via VELOCIDADE, não flat.

## 5e. Drop de materiais de promoção (minerado jul/04/2026)

**Achado central: o drop NÃO é do inimigo — é do LUGAR.** As loot tables por
mob no JSON são templates vazios; em runtime cada kill rola 3 tabelas
INDEPENDENTES (`utils.gd:48-74`, `enemy_data.gd:265-302`): (1) pet card do
mob, (2) drops do WORLD (materiais base), (3) drops do MAP (receita de
raridade do bloco atual). Um kill pode soltar as três coisas.

**World drops (materiais base de upgrade — Armor part/Anvil 5%, Sword part
2% no NORMAL), escalando por rank:** Elite 10/10/5% (qtd 2) · Champion
15/15/9% (qtd 3) · Fiend 25/25/12% (qtd 4).

**Map drops (a RECEITA que promove a raridade — item-chave):** 2% no NORMAL,
4% Elite, 8% Champion (qtd 2), 16% Fiend (qtd 2) — a receita do bloco de
mapas atual (Uncommon Recipe nos maps 3–8, Rare nos 9–16, Epic 17–23,
Legendary 24–31). O jogador farma a receita do lugar onde está.

**Regras estruturais:** chance+qtd recebem bônus FLAT das stats
RESOURCE_CHANCE_BONUS/RESOURCE_DROP_BONUS (valida o Gleaner's Hook) · roll
por tabela com total_weight forçado a ≥100 (resto = chance de nada) · boss
(Demon/Titan) tem drop GARANTIDO de token (w=100), qtd linear 30→300 por
progressão de mapa · Mythic+ NUNCA dropa — só crafting (a raridade máxima é
sistema, não sorte) · Corrupted (×2 gold/xp) NÃO mexe na loot table.

**Leitura pro Éclats:** nosso commonMaterial (mob 5% / elite 15–45% / boss
100%) está na MESMA banda do padrão deles (5–25% + boss garantido) — economia
validada. A diferença de desenho: eles separam material-de-grind (partes,
5%) de item-chave (receita, 2%) — nós fundimos tudo em 1 material × 50. E o
rank multiplica chance E quantidade — caçar raros é a fonte de material, o
que casa com nosso Rarity Find como stat.

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

## 11. Build Steam definitiva (minerada jul/03/2026 — pck embutido no exe, Godot 4.4)

Método: pck carveado do exe (trailer GDPC, 130MB, formato v2, mesmo
`+file_base`), 842 arquivos extraídos. Scripts `.gdc` com script encryption
(chave no binário do motor — fórmulas inacessíveis); 12 JSONs de dados 100%
legíveis; saves `.bin` = FileAccessEncrypted/AES (indecifráveis sem a chave);
**2 CSVs de stat export com a progressão REAL do dono** (jul e out/2025).

**O que os dados confirmam/corrigem no doc antigo:**

| Tema | Doc antigo (HTML) | Steam (dados + save real) |
|---|---|---|
| Equipment | 12 slots, 4 raridades implementadas | 12 slots idem; **6 raridades** (+ Legendary, Mythic) via sistema NOVO de crafting (receitas + crafter_level + materiais) |
| Mundos | 3 × 15 = 45 locations, gates asc 0/10/15 | Os 3 confirmados IDÊNTICOS (nomes, bandas, gates); **+2 mundos** (Incursion; No Man's Domain com gate ascension 1100–1200) = 57 locations |
| Prestige caps | Ascension máx 180 · Transcendence máx 5 | Caps eram da demo: o dono chegou a **7800 ascensions / 260 transcendences**. **A razão 30:1 CONFIRMADA EMPIRICAMENTE: 7800/260 = 30.0 exato** |
| Escala de nível | — | Highest level real do dono: **3.08×10⁹** (número-espetáculo é o padrão do gênero em endgame) |

**Progressão real do dono (stat exports):** jul→out/2025: ascension 1860→7800,
transcendence 62→260, Apotheosis 3→36, level máximo 1.7×10⁸→3.1×10⁹. Três
meses de jogo ativo multiplicaram o prestige ~4×.

**Sistemas novos da definitiva (nenhum existia na HTML):** Apotheosis (4ª
camada, paragon com 4 disciplines × ~13 skills); Crafting (é o caminho real
de promoção Rare→Mythic); Incursion (endgame de 4 facções + World Tier ranks
0–24); dano elemental (Fire/Water/Nature/Shadow ×dmg/res/pen); 8 "moon
currencies"; quests; achievements-paragon; eventos sazonais.

## O que isso ensina pro Éclats (leitura minha, jul/03)

1. **Nossa pilha de stats está certa** — camadas BASE/(1+%)/mult idênticas às do gênero.
2. **Nosso gate de gear por raridade+materiais é o padrão do gênero** — e o Gaiadon vai além: front-loada ~11× o poder na 1ª promoção. Validado o `gear-rarity-materials-gate`; considerar salto de promoção mais dramático no P8.6.
3. **A parede deles é um GAP DE EXPOENTE FIXO** (HP^~2.3 vs dano^~1.8, diferença ~0.5 constante). O nosso F3 ("sem parede após min 15") era exatamente a ausência disso — o P2 consertou com calibração por grupo; a alternativa "gap de expoente" é mais simples de raciocinar e vale estudo no P8.6/Mapa 2.
4. **Buckets de dificuldade** (expoente que sobe por faixa de nível) = um dial de aceleração elegante; nosso análogo são os grupos G1–G6 com xpMultByGroup.
5. **Prestige count como métrica real de progresso** (locations gateadas por nº de ascensions, não por nível) — rima com a nossa decisão canônica "gate de Convergence = área, não nível".
6. **Sorte como stat progressível com CAP** (Elite ≤20%, Champion ≤10%) — bom modelo pro nosso eliteChance da Fracture.
7. **Duas camadas de prestige com razão ~30:1** (30 ascensions → 1 transcendence) — régua útil quando o Mémoires/pós-Convergence for desenhado (registrado, não desenhar agora).
8. **Offline deles é pior que o nosso** — manter nossa simulação real como diferencial.

**Lições novas da build Steam (jul/03):**

9. **A razão 30:1 do prestige de duas camadas sobrevive do tutorial ao endgame
   extremo** (260 transcendences reais) — quando o Mémoires/pós-Convergence
   for desenhado, essa régua tem validação empírica, não só teórica.
10. **A escada de raridade cresce por SISTEMA, não por número**: Legendary e
    Mythic chegaram via crafting (receitas+materiais), não via extensão da
    curva. Rima com o nosso plano: Uncommon terminal no Mapa 1, Rare volta no
    Mapa 2 COM a Forge — o sistema novo É o conteúdo novo.
11. **Endgame = camadas empilhadas, cada uma com moeda própria** (Apotheosis,
    Incursion, moon currencies) — referência direta pra quando Ascension/
    Divinity saírem do gelo (fora de escopo agora; registrado).
12. **Nosso espetáculo está calibrado certo**: highest level real de 3×10⁹ no
    Gaiadon endgame vs nosso topo de HP 6.5×10¹¹ no Mapa 1 — estamos na
    ordem de grandeza do gênero sem exagero.
