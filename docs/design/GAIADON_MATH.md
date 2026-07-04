# Gaiadon Math Bible — a matemática consolidada de Gaiadon: Eternal Quest

> **Fonte:** engenharia reversa de 3 builds — HTML/itch.io demo (Godot 4.2, 136
> fontes GDScript legíveis + 7 JSONs), Steam definitiva (Godot 4.4, .gdc
> criptografado + 12 JSONs legíveis), e **2 CSVs de stat export reais do save
> do dono** (minuto-zero nível 12 e endgame Asc 28.530/Trans 950). Este doc
> CONSOLIDA o que já estava minerado em `GAIADON_NUMBERS.md` (que permanece
> como histórico de mineração, cronológico e não-reorganizado) — aqui a
> organização é POR SISTEMA, com fórmula + parâmetros + exemplo + intenção de
> design. Toda citação arquivo:linha aponta pra árvore extraída (HTML),
> re-extraível do .pck público a qualquer momento.
>
> **Uso: REFERÊNCIA de gênero, nunca cópia.** Números do Éclats continuam
> saindo só de `tools/sim.js`.

---

## 1. Stats e baldes

### 1.1 A arquitetura (build HTML, código vivo)

Cada `Attribute` (`Classes/attribute.gd:1-68`) mantém dois dicionários por
feature-produtora: `values` (BASE, somados) e `modifiers` (MODIFIER, %,
somados). O total é:

```
total = ΣBASE × (1 + ΣMODIFIER/100)
```

Depois disso, SE `transcendence_lvl > 0` E o stat está na lista
`transcendence_settings.stats` (ATTACK, HP, GOLD_BONUS, XP_BONUS), aplica-se
um multiplicador global **por fora**: `total × (1 + 1.5 × transcendence_lvl)`
(`attribute.gd:39-43`, `ascension.gd:22-27`). Por fim, um cap duro por stat
(`Constants.Caps`) trava o valor se ele exceder o teto (ex.: Elite ≤20%,
Champion ≤10%, Slay ≤10%, Enemy HP Reduction ≤5%).

**Por que funciona:** três camadas com propósitos diferentes — BASE é
progressão linear (nível, ascension), MODIFIER é multiplicativo barato de
conceder (skills, gear %), e o multiplicador de Transcendence é o "reset the
board" que faz um prestige de segunda camada valer a pena sem precisar
inflar infinitamente os baldes de baixo. É **exatamente** a pilha
`flat × (1+pct) × mult` do Éclats.

### 1.2 O esquema de 6 tiers do stat export (Steam, inferido dos CSVs)

O código-fonte legível (`enums.gd:17-50`) só define `AttributeValueType {BASE,
MODIFIER}` — 2 baldes. Mas o CSV de export da build Steam usa **6 tiers por
stat** (`Stat, Stat Tier 0-5, Value`), e os scripts que os alimentam são
`.gdc` criptografados (Steam) — os NOMES e os PADRÕES são recuperáveis dos
CSVs, a fórmula exata de cada tier não.

Padrão observado cruzando os dois saves (minuto-zero vs endgame):

| Tier | Comportamento observado | Hipótese (não confirmável no código) |
|---|---|---|
| **0** | Sempre o maior valor; cresce ~10⁶–10³¹× do minuto-zero ao endgame | **Total final** do stat (o que o attribute.gd chamaria `total`) |
| **1** | 0 no minuto-zero; cresce a 10¹¹–10²⁵ no endgame | **BASE agregado** (ΣBASE de todas as fontes — nível, gear, ascension, fame, crafting) |
| **2** | Sempre `1.0` no minuto-zero; no endgame varia (2.45e6 no HP, 1 no ATTACK_SPEED) | **Multiplicador agregado** (fonte de MULT — crafting/Apotheosis, dá 1.0 = neutro quando não há bônus) |
| **3** | 0 no minuto-zero; valores grandes no endgame (1.33e8 HP, 7.25e9 ATTACK) | **MODIFIER agregado** (Σ% — seria o `modifier_total` do attribute.gd) |
| **4** | 0 no minuto-zero; presente só em alguns stats no endgame | **Bônus condicional/evento** (Apotheosis discipline ou crafting crit, aparece só quando o sistema está ativo) |
| **5** | 0 no minuto-zero; só ATTACK e CRIT_RATE têm valor no endgame (750, 1850) | **Cap ou floor duro** (o valor fixo de um teto — bate com o padrão `Constants.Caps` da build HTML, que também é por-stat) |

O tier 2 = 1.0 universal no minuto-zero é a assinatura mais forte: é
consistente com "multiplicador neutro" (`×1` quando nenhuma fonte de MULT
existe ainda) — a build Steam **adicionou um terceiro balde MULT** em cima do
BASE/MODIFIER da HTML, exatamente como o §5c do `GAIADON_NUMBERS.md` já
registrou pelo print do Godslayer's Blade ("Primary → Mastery/Bonus →
Multiplier"). Os tiers 3-5 são as extensões de endgame (%/cap/evento) que só a
build Steam introduziu.

**Por que funciona (mesmo sem certeza total da fórmula):** a progressão de
baldes por sistema novo (BASE → MODIFIER → MULT → cap) é o padrão de "gear
sobe de balde" que o P8.6 do Éclats já cogita — aqui está confirmado
empiricamente por dois saves reais 6 ordens de grandeza distantes.

### 1.3 Os 108 stats do jogo Steam (nomes completos, dos CSVs)

O enum `Attribute` da build HTML tem 31 entradas (`enums.gd:17-50`); o CSV do
dono tem **108** (índices 0–107, alguns pulados: 65/66/68/69/70/97/101 fora de
ordem crescente — sinal de que foram adicionados incrementalmente e reordenados
na UI, não no enum). As primeiras 31 batem 1:1 com o enum antigo. As novas 77
são só da build Steam:

- **Crafting** (32-33): CRAFTING_XP_BONUS, CRAFTING_CRIT_CHANCE
- **Caps/progressão** (34-47): CHARACTER_MAX_LEVEL_BONUS, DAMAGE_REDUCTION,
  KEEP_LEVELS_ON_ASCENSION, KEEP_ASCENSION_ON_TRANSCEND, DEMON/TITAN_TIME_BONUS,
  MEDALLION_XP_BONUS, QUEST/BOSS_TOKEN_BONUS, CORRUPTED_DOMAIN_COST_REDUCTION,
  CORRUPTION_XP_BONUS, ENEMY_DENSITY_BONUS, MAX_EQUIPMENT_LEVEL,
  LOOM_OUTPUT_BONUS
- **Dano elemental** (48-63): ELEMENT_{FIRE,WATER,NATURE,SHADOW}_{DAMAGE,
  RESISTANCE,PENETRATION} + ALL_ELEMENT_{DAMAGE,RESISTANCE,PENETRATION} +
  VALOR (stat vazio/não usado em nenhum save)
- **Incursion/Expedition** (64, 68-70, 94): INCURSION_POINT_BONUS,
  EXPEDITION_KPM_BONUS, EXPEDITION_XP, FESTIVAL_TOKEN, EXPEDITION_BONUS_SLOTS
- **ATTACK_PER_LEVEL / HP_PER_LEVEL** (66-67): ver §1.4 — stats upgradáveis
  que substituem constantes fixas da HTML
- **Rage/Essência/Penalidade de XP** (65, 71-75): RAGE_XP_BONUS,
  ESSENCE_DROP_RATE, REDUCE_XP_PENALTY, EMPOWERED_ESSENCE_BONUS,
  BOSS_SOUL_BONUS, INCURSION_TITAN_STREAK_REDUCE
- **Piada/meta** (76, 86, 93): NERF, TOO_OP, REDUCE_SKILL_ISSUE — sempre 0 em
  ambos os saves; ver §7 sistemas Steam-only
- **Apotheosis/Divinity** (77-81, 96-107): QUEST_XP + 4 XPs de discipline
  (BERSERKER/ELEMENTALIST/PIONEER/DRUID), ALL_DISCIPLINE_XP,
  DIVINITY_{ATTACK,HP,CRIT,CRIT_DMG,ATK_SPD,LIFESTEAL,DMG_REDUCTION},
  FAVOUR_XP_BONUS, TRIAL_MARKS_BONUS, MAX_PARAGON
- **Chances duplicadas** (82-85, 89-92): DOUBLE_{EVENT_TOKEN,PET_LEVELUP,XP,
  GOLD}_CHANCE, WAVE_INSTANT_KILL_{CHANCE,COUNT}, ENEMY_LEVEL_GOLD_BONUS,
  GEM_DUST_BONUS_{CHANCE,AMOUNT}
- **Custo** (87-88): FLAT_GOLD_BONUS, EQUIPMENT_COST_REDUCTION

### 1.4 ATTACK_PER_LEVEL / HP_PER_LEVEL como stat upgradável

Na build HTML os ganhos por nível são **constantes fixas** no código:
ATK +5, HP +10 por nível (`level_data.gd:6-12`, ver §3). Na build Steam esses
mesmos ganhos viraram **stats do índice 66/67** — ou seja, "quanto ganho por
nível" deixou de ser constante de engine e virou algo que crafting/Apotheosis
podem inflar. No CSV do dono (endgame) ATTACK_PER_LEVEL = 6.46e6 e HP_PER_LEVEL
= 1.54e6 — múltiplos de milhões acima da constante original de 5/10.

**Por que funciona:** transforma uma curva estrutural (ganho por nível) em
mais um eixo de progressão comprável, sem mexer na fórmula — o mesmo truque
que caps virarem stats (MAX_WORLD_TIER, CHARACTER_MAX_LEVEL_BONUS,
MAX_EQUIPMENT_LEVEL na lista acima): "os limites do jogo são conteúdo".

---

## 2. Inimigos — curvas e ranks

### 2.1 A família de fórmula única

```
stat(level) = (level / x)^y
```
`x` e `y` vêm de **8 buckets de dificuldade** indexados por faixa de nível do
mob (`enemy.gd:364-374`, `Data/constants.gd:436-489`, `Utils.get_difficulty`
`utils.gd:141-146`):

| Bucket (nível <) | HP (x, y) | ATK (x, y) | Gold (x, y) | XP (x, y) |
|---|---|---|---|---|
| 11 | 0.30, 1.50 | 0.80, 0.90 | 0.198, 1.60 | 0.20, 1.70 |
| 301 | 0.25, 1.55 | 0.70, 1.00 | 0.195, 1.60 | 0.21, 1.68 |
| 601 | 0.19, 1.75 | 0.60, 1.20 | 0.193, 1.70 | 0.25, 1.50 |
| 3501 | 0.15, 2.00 | 0.50, 1.50 | 0.189, 1.80 | 0.28, 1.40 |
| 5501 | 0.13, 2.05 | 0.45, 1.55 | 0.186, 1.90 | — |
| 15701 | 0.09, 2.22 | 0.33, 1.67 | 0.181, 2.00 | — |
| 90000 | 0.07, 2.27 | 0.33, 1.67 | 0.176, 2.20 | — |
| MAX (∞) | 0.07, 2.33 | 0.33, 1.82 | 0.166, 2.82 | 0.31, 1.35 |

**Exemplo numérico** (mob nível 5000, bucket 4): HP = (5000/0.15)^2.00 =
33333.3² ≈ **1.11×10⁹**. ATK = (5000/0.50)^1.50 = 10000^1.5 = **1.0×10⁶**.
Gold = (5000/0.189)^1.80 ≈ **6.9×10⁶** (antes de rank/world tier).

**Por que funciona:** um único formato paramétrico cobre HP/ATK/Gold/XP em
qualquer nível — trocar só `(x,y)` por faixa dá controle fino de "quão rápido
a dificuldade acelera aqui" sem reescrever a fórmula, e o mesmo motor gera as
4 curvas simultaneamente (consistência automática entre HP e recompensa).

### 2.2 Gold — fórmula exata com ajuste de Ascension e World Tier

```gdscript
# enemy.gd:376-382
func get_enemy_gold() -> Big:
    var p_mod = get_difficulty_modifiers(ENEMY_GOLD, level)
    var asc_bonus = level × 0.0000012          # cresce com o NÍVEL do mob, não da ascension em si
    p_mod.y += asc_bonus
    var p_gold = (level / p_mod.x) ^ p_mod.y
    return p_gold × rank_gold_mod × (world_tier + 1)
```

O comentário no código (`# max(0.02 * GameData.ascension_lvl, 1)`) mostra uma
versão anterior descartada — a fórmula final usa o NÍVEL do mob como proxy
pra empurrar o expoente pra cima suavemente, evitando que gold escale linear
demais em ascensions altas.

**Exemplo:** mob nível 100.000 no bucket MAX (x=0.166, y=2.82), sem world
tier: `y_ajustado = 2.82 + 100000×0.0000012 = 2.94`. Gold = (100000/0.166)^2.94
≈ **4.2×10¹⁵** por mob NORMAL — e ×40 se for FIEND, ×(tier+1) se World Tier
> 0.

### 2.3 XP de mob — com PENALIDADE por farmar abaixo do próprio nível

```gdscript
# enemy.gd:387-407
func get_enemy_xp() -> Big:
    if rank == DEMON or rank == TITAN:
        # XP de boss timed = função de níveis-equivalentes, não da curva
        return HeroLevel.xp_needed_for_levels(base_levels[rank] × ascension_lvl × world_id × (world_tier+1))
    else:
        var xp = (level / x)^y × rank_xp_mod
        xp = xp × (1 + XP_BONUS%/100)
        if level < hero_level:                       # o mob é mais fraco que o herói
            var diff = (hero_level - level) × 0.01
            var multi = 1
            if diff >= 0.85: multi = 0.02             # floor: nunca menos que 2% do XP nominal
            else: multi = 1 - diff
            xp = xp × multi
        return xp
```

**Exemplo:** herói nível 500 farmando mob nível 300 (diff em níveis = 200,
`diff = 200×0.01 = 2.0` → acima do teto 0.85 → `multi = 0.02`). O mob dá só
**2% do XP nominal da curva** — um forte incentivo a nunca ficar pra trás do
que o mapa permite, mas sem zerar XP completamente (mantém idle-farm viável
em áreas antigas).

**Por que funciona:** sem essa penalidade, farmar a área mais fácil disponível
seria sempre ótimo (menos risco, XP igual); a penalidade linear com floor de
2% empurra o jogador a avançar sem trivializar totalmente o backtrack (loot
de material ainda vale, XP não).

### 2.4 Ranks — multiplicadores flat

| Rank | HP× | ATK× | AtkSpd mod | Gold× | XP× |
|---|---|---|---|---|---|
| NORMAL | 1.0 | 1.0 | 0 | 1.1 | 1.0 |
| ELITE | 1.25 | 1.25 | +0.25 | 2.0 | 1.25 |
| CHAMPION | 1.75 | 1.75 | +0.30 | 4.0 | 1.75 |
| FIEND | 3.0 | 2.0 | +0.38 | 40.0 | 15.0 |
| DEMON | 10.0 | 6.0 | +0.50 | 50.0 | 25.0 |
| TITAN | 20.0 | 10.0 | +0.50 | 60.0 | 40.0 |

Affix CORRUPTED (40% de chance de roll por kill se o Corrupted Domain está
ativo, `enemy.gd:76-82`): multiplica TUDO ×2 (atkSpd ×1.5) por cima do rank.

**Por que funciona:** gold e XP escalam MUITO mais rápido que HP/ATK por
rank (FIEND: HP×3 mas gold×40) — ranks raros são a fonte real de riqueza
("caçar raro" > "grindar normal"), o hp/atk sobe só o suficiente pra ser um
desafio tangível, não um muro.

### 2.5 A parede — gap de expoente fixo

Em todo bucket, `y_HP ≈ y_ATK + 0.5` (1.50 vs 0.90 no bucket 1 → 2.33 vs
1.82 no MAX). Esse gap de ~0.5 no expoente É a parede estrutural do jogo:
dano linear-em-nível nunca alcança HP porque a razão HP/dano cresce como
`level^0.5` indefinidamente. Hits-to-kill sem fontes externas de poder cresce
~`level^1.33` — trava o jogo cedo por construção, forçando Gear/Ascension/
Transcendence a existirem.

---

## 3. Herói — nível, XP, ganhos

### 3.1 Curva de XP (invertível)

```
XP_para(nível) = ((nível - 1) / 0.2) ^ 2.6
nível_de(xp)    = (xp ^ (1/2.6)) × 0.2 + 1
```
(`hero_level.gd:36-51`, cap em `max_hero_level = 1.000.000`).

**Exemplo:** XP para nível 1000 = ((999)/0.2)^2.6 = 4995^2.6 ≈ **2.06×10⁹**.

### 3.2 Ganhos lineares por nível (build HTML — depois virou stat, ver §1.4)

`level_data.gd:6-12`: **ATK +5 · HP +10 · CritRate +0.01% · CritDmg +0.05% ·
Gold +0.25%** por nível, todos escritos como `nível × valor_base` (não
incremental — recalcula do zero a cada nível, `hero_level.gd:107-121`).

Crit acima de 100% vira múltiplos ataques garantidos: `attacks = floor(crit/100)`,
mais 1 ataque extra com chance = resto fracionário (`utils.gd:84-102`).

**Por que funciona:** ganho linear simples por nível é barato de calcular e
fácil de comunicar ("cada nível = +5 ATK flat"); o overflow de crit em
ataques múltiplos é o padrão do gênero pra "crit infinito não é desperdiçado"
depois de bater o teto de 100%.

---

## 4. Gear — stats, custos, promoção

### 4.1 Estrutura

12 slots fixos sempre equipados (`enums.gd:245-258`). Enum tem 9 raridades;
a build HTML só implementa 4 (Common→Epic), a Steam completa 6
(+Legendary/Mythic via crafting). Stat por item:
```
stat(level) = base + incre × floor(level / gap)
```
(`gear.gd:276-293`). Nº de afixos cresce com raridade: **T1=2 · T2=3 · T3=4 ·
T4(Epic)=5**.

### 4.2 O salto front-loaded de raridade

Incremento de ATTACK BASE por raridade (`equipment_data.gd:56-228`):
Common 1.5 → **Uncommon 17.25 (×11.5!)** → Rare 19.83 (×1.15) → Epic 22.81
(×1.15). **O poder do gear mora na PROMOÇÃO, não no level-up dentro do tier.**

Degraus (gap, níveis por incremento) por atributo: atkSpeed /5 · crit /25 ·
critDmg /3 · goldCrit /100 · gold /5 · xp /2 · enemyHpRed /100 · eliteSpawn
/60 · championSpawn /90 · killCount /40.

### 4.3 Custo de level-up — quadrático (padrão B: cap+rampa)

```
custo(nível) = base[raridade] × multi[raridade] × Σ(1..N)   # soma aritmética, não geométrica
```
Common 600 base / 1.21 multi / cap 700 · Uncommon 2200/3.0/1500 · Rare
5e4/5/4000 · Epic 5e7/6/8000 (`gear.gd:122-137`). É **quadrático no nível**,
atípico no gênero (a maioria usa geométrico puro) — o efeito prático é que o
custo cresce mais devagar no início do tier e acelera perto do cap, suavizando
a "parede de custo" logo após promover.

### 4.4 Promoção — degraus fixos + materiais

Custo em gold sobe em degraus grandes e fixos por tier (arma: 2e9 → 2e11 →
2e13), somado a materiais dropados (§4.6). Exige atingir o `max_level` da
raridade atual primeiro.

### 4.5 Set synergy e Weapon Rage

**Set synergy** (`gear.gd:13-19`): `nível_synergy = floor(menor_nível_das_12_peças / 10)`
— gateado pela PIOR peça equipada, não pela média. Por nível: +1.5% ATK,
+1.5% HP, +0.5 CritDmg, +5 Gold, +5 XP (cumulativo, agnóstico de raridade).

**Weapon Rage** (`gear.gd:20-22`): XP próprio ganho por kill (1 +
KILL_COUNT_BONUS), custo `0.5×1.5^(N-1)`, bônus `+10%×1.25^(N-1)` ATK
(modifier), cap nível 75. Validado por print real do dono em endgame extremo
(nível de Rage 210 — cap da demo estourado pela build Steam): bônus =
`10%×1.25^209 ≈ +1.80×10²¹%` — a fórmula segue exponencial pura sem outro
cap, e é isso que produz os números-espetáculo do late-game.

**Por que funciona:** set synergy gateado pela pior peça empurra o jogador a
NÃO deixar um slot pra trás (evita "6 peças BiS + 6 lixo"); Rage sem segundo
cap é o "eixo que nunca satura" clássico do incremental — sempre há mais uma
ordem de grandeza pra buscar.

### 4.6 Drop de materiais — o lugar dropa, não o mob

Loot tables por mob no JSON são templates vazios; em runtime, cada kill rola
**3 tabelas independentes** (`utils.gd:48-74`, `enemy_data.gd:265-302`): (1)
pet card do mob, (2) drop do WORLD (materiais base), (3) drop do MAP (receita
de promoção do bloco atual de mapas).

World drops (Armor part/Anvil 5%, Sword part 2% no NORMAL) escalam por rank:
Elite 10/10/5% (qtd 2) · Champion 15/15/9% (qtd 3) · Fiend 25/25/12% (qtd 4).
Map drops (a receita-chave): 2% NORMAL, 4% Elite, 8% Champion (qtd 2), 16%
Fiend (qtd 2) — a receita do BLOCO de mapas onde o jogador está (Uncommon nos
maps 3–8, Rare 9–16, Epic 17–23, Legendary 24–31).

Regras: chance+qtd recebem bônus FLAT de RESOURCE_CHANCE_BONUS/
RESOURCE_DROP_BONUS · `total_weight` forçado a ≥100 (resto = chance de nada)
· boss (Demon/Titan) tem drop GARANTIDO de token (peso 100), qtd linear
30→300 · Mythic+ nunca dropa, só crafting.

---

## 5. Skills

**Arquitetura:** Skill Trainer (gerador idle: 2200 SP a cada 25s, ×1.1/nível,
custo `1e7×1.3^nível`) alimenta livros. Livro 01 = 3 ativas no jogo inteiro
(Venomous Slash, Heal, Infernal Blast — ~95% do conteúdo é passivo). Livro 02
= 37 passivas em 5 tiers. Livro 03 (Steam) = 36 passivas de endgame (custos
1e13–1e20).

Custo por `max_level`: 500 níveis → multi 1.04 · 100 → 1.10 · 50 → 1.18
(quanto menor o cap, maior o multi por nível — mesmo "gasto total" em
ordens de grandeza diferentes de granularidade).

**Padrão de gerações:** o mesmo eixo reaparece como Vitality I/II/III/IV por
tier — a "árvore nova por mapa" deles é gerações do mesmo stat com números
maiores (rima direta com Árvore I/II/III do Éclats).

**Passivas mecânicas notáveis:** Slay (0.25%/nv chance de kill instantâneo,
não funciona em boss), Splash (ataque básico causa % em TODOS os inimigos),
Blood Drain (3%/nv chance de leech 4% HP máx), Elite/Champion Tracker (+chance
de rank raro), Onslaught (Steam: +contagem de inimigos na tela como compra),
Retained Knowledge (começa com N níveis pós-reset — QoL comprável).

---

## 6. Economia

### 6.1 Gold por kill

Ver §2.2 — mesma família `(level/x)^y`, multiplicado por rank e `(world_tier+1)`.

### 6.2 Gold crítico

`GOLD_CRIT_RATE` roda um roll independente (`utils.gd:104-109`); se crítico,
gold final × `gold_crit_mult` (constante global, valor não capturado no
código legível — mencionado como "10x" na descrição em `Data/constants.gd:267`).

### 6.3 Materiais

Ver §4.6.

---

## 7. Prestige — Ascension, Transcendence, Apotheosis, Divinity

### 7.1 Ascension (camada 1)

**Reset:** nível/XP/gold → 0. **Mantém:** gear, skills.
**Custo:** gold geométrico (`ascension.gd:61-95`, três regimes por faixa de
ascension: `multi_power` 30/35/40/45 até a 42ª, depois fórmula em blocos de
50) **+** requisito de nível em blocos completos:
```
# ascension.gd:46-59
bloco_atual = ascension / 100
sobra = ascension % 100
nível_requerido = (bloco×(bloco+1)/2) × 5000 × 100 + sobra × 5000 × (bloco+1)
```
**Exemplo:** ascension 250 → bloco=2, sobra=50 → nível = (2×3/2)×5000×100 +
50×5000×3 = 1.500.000 + 750.000 = **2.250.000**.

**Ganho por ascensão** (linear cumulativo, `ascension.gd:6-12`): **+8 ATK,
+17 HP, +0.1% Gold** por nível de ascensão (BASE, escrito direto no balde do
attribute).

Máx demo = 5 (`is_demo=true` força `max_ascension=5`, `constants.gd:504-508`);
máx código = 180; **o dono real chegou a 28.530** — os caps de constante
foram todos superados pela build Steam viva (os caps viraram guia de fase
inicial, não teto real).

### 7.2 Transcendence (camada 2)

Gate a cada **30 ascensions** (`interval=30`, `ascension.gd:22-27`). Reset:
ascension → 0 (nível/gold também, via `reset_level()`/`reset_gold()`).
Multiplicador global `×(1 + 1.5×nível)` em ATK/HP/Gold/XP (aplicado por fora
do BASE/MODIFIER, ver §1.1) + `+2 MAX_WORLD_TIER` por nível + liga
`auto_ascend` na primeira Transcendence.

**Razão empírica Asc:Trans confirmada por 2 pontos de dado independentes:**
save do dono jul/2026: Asc 28.530 / Trans 950 = **30,03** — quase idêntico à
constante `interval=30` do código, validando que a razão estrutural (30:1)
sobrevive INTACTA do design original até o extremo real do jogo, sem
"correção" de balance no meio do caminho.

**A Sac/T Sac** (do CSV, 375/75): "Ascension/Transcendence Sacrifice" —
provavelmente contadores de um sistema de reset voluntário adicional (não
capturado no código HTML legível; nome consistente com um botão de
"sacrifice" que dá algum bônus por resetar antes do gate natural — comum no
gênero, não confirmável sem o `.gdc`).

### 7.3 World Tier

`world_tier_mod_per_level = 200` (`location_data.gd:13`): cada tier infla as
bandas de nível de TODAS as locations em **+200%** (`get_location_lvls`,
`location_data.gd:65-74`) e multiplica gold por `(tier+1)` (ver §2.2). Um
dial manual de New Game+ acessível só depois da 1ª Transcendence.

### 7.4 Fame

9 heróis colecionáveis + 50 títulos (`fame.gd`); +5% ATK / +1% HP por nível
de fama (aplicado por `stat_bonus_per_level` × nível atual). Objetivos por
nível de fama variam (kills, gold, ascensions) — sistema de quests
progressivo que gate a subida de fama.

### 7.5 Apotheosis e Divinity (Steam-only, §7 abaixo)

Ver §8 — 4ª camada de prestige (paragon), confirmada só pelos CSVs + JSON
`apotheosis_data.json`; sem código legível.

---

## 8. Sistemas Steam-only revelados pelos CSVs (ausentes do NUMBERS antigo)

### 8.1 Apotheosis / Divinity

MAX_PARAGON = 5 (minuto-zero) → 6 (endgame, save do dono com 3 meses extra de
jogo — sobe devagar). Stats DIVINITY_{ATTACK,HP,CRIT,CRIT_DMG,ATK_SPD,
LIFESTEAL,DMG_REDUCTION} todos zerados no minuto-zero, todos com valor no
endgame (ex.: DIVINITY_ATTACK = 8157, DIVINITY_LIFESTEAL = 5, DIVINITY_DMG_
REDUCTION = 8) — é a 4ª camada de prestige (paragon), com 4 "disciplines"
(Berserker/Elementalist/Pioneer/Druid — os stats XP `#78-81` do CSV) cada uma
com XP próprio que sobe devagar (valor 1-3 em ambos os saves, sugerindo picos
raros de ganho, não fluxo contínuo).

### 8.2 Gemcraft / Gem Dust

`GEM_DUST_BONUS_CHANCE` e `GEM_DUST_BONUS_AMOUNT` — zerados no minuto-zero,
com valor no endgame (60.56 e 16.53 respectivamente). Nome sugere um sistema
de gemas/crafting de segunda camada distinto do `crafting_data.json` (que já
cobre equipment). Sem `.gdc` legível — não dá pra confirmar a fórmula de
consumo, só a existência do eixo (chance + quantidade, o par clássico de
drop bônus).

### 8.3 Expedition / Trials / Favour

EXPEDITION_KPM_BONUS (kills-por-minuto?), EXPEDITION_XP, EXPEDITION_BONUS_
SLOTS, TRIAL_MARKS_BONUS, FAVOUR_XP_BONUS — todos zerados no minuto-zero,
todos com valor no endgame. Nomeação sugere: Expedition = modo idle-offline
avançado (KPM = taxa de kill projetada), Trials = desafios com "marks" como
moeda de recompensa, Favour = reputação/loja com XP próprio. Nenhum JSON
correspondente nos 12 extraídos — sistemas inteiramente novos da build
Steam sem rastro de dados, só o rastro de stats.

### 8.4 Sacrifices (A Sac / T Sac)

Ver §7.2 — contadores presentes só no export de stats "de rodapé" (não são
`Attribute` numerado, aparecem como linha solta tipo `Asc`, `Trans`, `Apo`).

### 8.5 Moons (8 moedas)

Veil/Whisper/Blade/Watcher's/Blood/Ashen/Reaper's/Ghost Moon — todas = 1 no
minuto-zero, todas = 240 no endgame (valor IDÊNTICO entre si em cada save —
sobem em lockstep, sugerindo uma fonte única de progressão que dá +1 a todas
simultaneamente, tipo um "moon rank" global em vez de 8 moedas
independentes). 8 moedas paralelas é o padrão "cada endgame layer tem sua
própria moeda" já registrado no NUMBERS §11.

### 8.6 Os stats-piada

`NERF`, `TOO_OP`, `REDUCE_SKILL_ISSUE` — sempre 0.0 em AMBOS os saves
(minuto-zero e endgame com 950 transcendences). Não são bugs de export: são
Easter eggs de developer deixados no enum de produção (nomes de debug/humor
que nunca foram wireados a nenhuma fonte real) — style de comunidade do
gênero incremental, registrado aqui só como curiosidade, zero peso de design.

---

## 9. Walls — o gap de expoente ilustrado

Retomando §2.5 com números: bucket MAX tem HP y=2.33, ATK y=1.82 — gap
**+0.51**. Num nível `L` genérico grande, `HP/dano_base ∝ L^0.51`. Em L =
1.000.000: `10^0.51×6 ≈ 10^3.06` — o HP relativo ao dano de nível cresce
**~1150×** entre nível 1 e nível 1.000.000 SÓ pelo gap de expoente, antes de
qualquer bônus externo. É por isso que Gear (salto de raridade ~11×),
Ascension (flats permanentes) e Transcendence (multiplicador `×(1+1.5N)`) são
**obrigatórios por construção**, não "boosts opcionais" — sem eles, o
hits-to-kill cresce como `L^1.33` e o jogo trava estruturalmente.

---

## 10. Como usar esta bíblia no Éclats

Mapeamento direto pro `P9_REBALANCE.md §2.6b` (padrões A/B/C de como nasce
um número):

| Sistema Gaiadon | Análogo Éclats | Padrão de origem do número (Gaiadon) | Leitura pro Éclats |
|---|---|---|---|
| Bucket de dificuldade (§2.1) | Grupos G1–G6 com xpMultByGroup | **B** (cap de design: expoente-alvo por faixa) + rampa aritmética dentro | Nosso "calibração por grupo" (P2) é o equivalente funcional ao "buckets"; considerar formalizar como `(x,y)` por grupo em vez de multiplicadores soltos, se simplificar o raciocínio no Mapa 2 |
| Gap de expoente HP vs ATK (§9) | Parede pós-min15 (F3) | **B**: o gap É o cap de design, escolhido a priori | Alternativa ao nosso fix "calibração por grupo": um gap de expoente fixo é mais fácil de comunicar e ajustar num único dial — vale protótipo no P8.6/Mapa 2 |
| Salto de raridade no gear (§4.2) | Gate de gear por raridade+materiais | **A** (fit: o salto ×11.5 foi escolhido pra bater um "poder-alvo" na 1ª promoção) | Validado; considerar salto de promoção mais dramático (Common→Uncommon) no P8.6 — hoje nosso salto é mais suave |
| Cap de sorte (Elite ≤20%, Champion ≤10%, §2.4/Caps) | eliteChance da Fracture | **C** (orçamento de teto sentido: chance começa ~0, sobe via gear/skill/fame até o teto perceptivo) | Bom modelo pro nosso Rarity Find — dimensionar de trás pra frente a partir do teto, não da fonte |
| Set synergy gateado pela pior peça (§4.5) | (não temos ainda) | **B**: cap"+rampa por nível de synergy | Candidato de mecânica nova pro Mapa 2 — força não deixar slot pra trás |
| Razão Ascension:Transcendence 30:1 (§7.2) | Convergence / futuro "Mémoires" pós-Convergence | **A** (fit, mas validado empiricamente até o extremo real — não só teórico) | Régua útil quando o pós-Convergence for desenhado; a razão sobreviveu de nível 12 a nível 3×10⁹, forte sinal de que é estrutural, não um número frágil |
| ATTACK_PER_LEVEL/HP_PER_LEVEL como stat (§1.4) | Ganhos por nível fixos em código | **B**: teto vira comprável | Se algum dia quisermos um sistema de "melhorar o ganho por nível" como conteúdo, este é o precedente direto |
| Penalidade de XP por farmar abaixo do nível (§2.3) | (não temos) | **C**: orçamento com floor (nunca <2%) | Candidato pequeno: desincentivar backtrack sem zerar XP — útil se o Éclats tiver múltiplas áreas simultaneamente acessíveis no Mapa 2 |
| World Tier +200%/tier (§7.3) | (não temos, seria pós-endgame) | **B**: dial manual, cap+rampa simples | Registrado como referência de "New Game+" caso o Éclats precise de um após o Mapa 2/3 |
| Camadas de prestige com moeda própria (§8, Apotheosis/Divinity/moons) | Convergence → Awaken (única camada hoje) | **B**: cada camada nova = sistema novo, não extensão da mesma curva | Reforça a decisão já tomada: Mapa 2 = sistema novo (Forge), não "mais Uncommon" |

**Nota metodológica final:** os CSVs do dono são a fonte mais forte deste
documento porque são **medição real**, não teoria — qualquer fórmula
recuperada do código é hipótese até confirmada por um valor de save real; os
casos em que o CSV bate exato com o código (razão 30:1, world_tier_mod_per_
level=200, get_base_enemy_gold) são os que devem ser tratados como verdade
sólida. Os stats Steam-only sem código correspondente (§8) são inferência de
nome — trate como "existe o eixo", não "esta é a fórmula".

---

## 11. Irrecuperável — e por quê

- **`.gdc` da build Steam** (todos os scripts de lógica: `enemy_data.gdc`,
  `equipment_data.gdc`, `skills_data.gdc` etc.): Godot 4.4 com **script
  encryption** habilitada — a chave AES fica embutida no binário do
  executável exportado, não no `.pck`. Sem a chave (que exigiria engenharia
  reversa do binário nativo, fora de escopo e provavelmente contra os termos
  de uso), o bytecode `.gdc` não é decompilável para GDScript legível.
- **`Gaiadon_20Jun2026_1710.bin`** (save binário): header confirmado
  `47 44 45 43` = ASCII `"GDEC"` — magic bytes do formato
  `FileAccessEncrypted` do Godot (AES via `Crypto`/`CryptoKey` da engine). A
  chave de criptografia de save é tipicamente hardcoded no binário do jogo
  (não no arquivo de save) — mesma barreira do item anterior. Não tentamos
  quebrar a criptografia, só confirmar o formato.
- **Fórmulas dos 77 stats Steam-only sem JSON correspondente** (§8): os
  CSVs dão nome + valor observado em 2 pontos no tempo, mas sem o `.gdc` não
  há como recuperar a fórmula de acumulação — só a existência do eixo e a
  ordem de grandeza.
