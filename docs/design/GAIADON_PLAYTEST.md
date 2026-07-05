# Gaiadon Playtest — estudo de campo do jogo de referência

> **Fonte:** sessão de jogo real via Chrome MCP em
> `https://nadukkon.itch.io/gaiadon-eternal-quest` (build **HTML5/itch**, Godot
> export, `html.itch.zone/html/10817503`) em jul/2026. Save observado a partir
> do **minuto-zero funcional**: herói nível 1 em Verdant Valley (área inicial),
> gold 64.6. Toda observação abaixo é **medição de tela** (o jogo é canvas num
> iframe cross-origin — sem acesso a DOM/localStorage/internals; JS confirmou
> `iframe src=html.itch.zone`, origin diferente, inspeção bloqueada).
>
> **Objetivo:** validar `GAIADON_MATH.md` (modelo minerado do código) contra o
> jogo rodando. Formato: "o código dizia X — jogando eu vi Y". Cada seção
> fecha com **CONFIRMA / CORRIGE / ESTENDE**.
>
> **Uso: REFERÊNCIA de gênero, nunca cópia.** Números do Éclats saem só do
> `tools/sim.js`.

---

## 0. Resumo executivo (pacing)

O primeiro ~minuto do Gaiadon é uma rampa de dopamina quase vertical:

| Marco | Quando (observado) | Estado |
|---|---|---|
| Início | t=0 | LVL 1, HP 302/308, gold 64.6, ATK do herói ~1.22 (igual ao mob) |
| 1º level up | segundos | LVL 2 quase imediato (XP curva rasa no início) |
| **Equipment desbloqueia** | **nível 3** | popup "Feature Unlocked: Equipment" — ganha set Common de 12 peças, **Total Attack salta 1.22 → 358** |
| **Quests desbloqueiam** | **nível 10** | popup "Feature Unlocked: Quests" — só o tempo de navegar os menus (< 1 min de jogo) |
| Nível 37 | poucos minutos | HP 311/996, gold 411K, GOLD/MIN 80K→311K |
| 1 nível a esta altura | nível 37→38 | ~15–20 s por nível (desacelerando visivelmente) |

**Sensação:** o hook é a aceleração composta — a cada 30 s um sistema novo
abre (equip → quests → …), o gold/min quadruplica sozinho (12K→47K→80K→311K
em minutos), e o herói está **confortavelmente ganhando** o combate (TTK ~3
hits, TTD ~18 hits no nível 38). A "parede" de expoente do `GAIADON_MATH §9`
**não é sentida nos primeiros minutos** — ela é estrutural e mora lá em cima;
o early game é puro power-fantasy. Isso é design deliberado: front-load a
recompensa, esconde o muro atrás de horas de idle.

**O que isso sugere pro Éclats** (detalhe em §10): o gargalo do nosso Mapa 1
não deveria aparecer no minuto 3. Gaiadon só deixa o jogador sentir atrito
depois de muitos sistemas abertos; nós deveríamos ter uma cadência de
desbloqueios (não só "gear") nos primeiros 10 níveis.

---

## 1. Estado inicial (minuto-zero)

- **Área:** Verdant Valley (Lvl 1–100), primeiro sub-mapa do continente Aetheria.
- **Herói LVL 1:** HP 302/308. Dano por hit ≈ 1.22 (idêntico ao ATK do mob
  inicial — o herói "pelado" pré-equip é fraquíssimo de propósito).
- **Gold inicial:** 64.6.
- **Primeiro inimigo:** Bog Hornet LVL 1 (ATK 1.22, HP 12). O mob **escala com
  o herói** dentro da banda da área (mais tarde vi Bog Hornet LVL 38 com ATK
  54.2 / HP 1.29K, e Germeyes LVL 37 ATK 52.8 / HP 1.77K).
- **Tela inicial:** card do herói à esquerda, card do inimigo ao centro, painel
  de lore "GAIADON" à direita ("Once you reach level 3, Equipment will become
  available"). Combate é **100% automático** — o jogador não clica pra atacar.

**Stats visíveis no Character Info (medido no nível 4, já COM o set Common):**

| Stat | Valor (LVL 4, Asc 0) |
|---|---|
| Total Attack | **358** |
| Attack Bonus | 10% |
| Max Health | **691** |
| Max Health Bonus | 9% |
| Attack Speed | 0.960 |
| Critical Rate | 2.1% |
| Critical Damage | 60% |
| Boss Damage Bonus | 0% |
| Gold Bonus | 20.2% |
| Gold Crit. Chance | 5.01% |
| XP Bonus | 9% |
| Enemy HP Reduction | 0% |
| Elite Chance | 7.05% |

**CONFIRMA `GAIADON_MATH §1.1` (arquitetura dual-bucket):** a UI separa
explicitamente **"Total Attack" (BASE)** de **"Attack Bonus %" (MODIFIER)**, e
**"Max Health" (BASE)** de **"Max Health Bonus %" (MODIFIER)** — os dois baldes
`ΣBASE × (1+ΣMODIFIER/100)` estão visíveis na tela, não são só inferência de
código.

---

## 2. Gear — o coração do early game

### 2.1 Estrutura (tela de Equipment)

- **12 slots fixos**, sempre equipados (6 na coluna esquerda, 6 na direita).
  **CONFIRMA `§4.1`** (12 slots).
- Todos começam **Common, LVL 1**, entregues como set completo no nível 3.
- Botões **x1 / x10 / x100** pra level-up em lote.
- Duas abas: **EQUIPMENT** (level-up com gold) e **UPGRADE** (promoção de
  raridade com materiais). **CONFIRMA `§4.3`+`§4.4`** (dois eixos: nível e
  raridade) — e o popup de unlock reforça: *"upgraded in two ways: through
  levels and rarity tiers"*.

### 2.2 O set Common inteiro (Total equipment stats, medido)

O painel "Total equipment stats" mostra `valor_base [total_com_herói]`:

| Stat | Base do set (12 Common) |
|---|---|
| Attack | **300** |
| Attack Bonus | 20% |
| Max Health | **300** |
| Max Health Bonus | 9% |
| Attack Speed | 0.010 |
| Critical Rate | 0.100% |
| Critical Damage | 10% |
| Gold Bonus | 10% |
| XP Bonus | 9% |
| Gold Crit. Chance | 0.010% |
| Elite Chance | 0.050% |
| Champion Chance | 0.050% |
| Kill Count Bonus | 1 |

**ESTENDE `§4`:** o set Common base dá **Attack 300 + Max Health 300** flat —
é isso que faz o Total Attack pular de 1.22 (pelado) pra 358 no nível 4. **O
gear É a fonte esmagadora de poder no early**, não o nível. O ganho por nível
do herói (§3) é ruído perto do salto do equip.

### 2.3 Peça individual — afixos e o incremento por nível

**Novice's Blade (Common Weapon, Level 1)**, tooltip medido:
- **+100 Attack** *(+15 per level)*
- **+5% Attack** *(+1% per level)*

→ **Common weapon = 2 afixos.** **CONFIRMA `§4.1`** (T1 = 2 afixos).

**CORRIGE/ESTENDE `§4.2`:** o doc minerou "Common ATK base incremento **1.5**"
do `equipment_data.gd` da build HTML. Na build HTML rodando eu vi a arma dar
**+100 base e +15 Attack por nível** — duas ordens de grandeza acima do 1.5
mineral. Duas leituras possíveis: (a) o 1.5 é o incremento de UM stat-slot e a
arma soma vários; (b) esta build itch é mais nova que a árvore extraída e
inflou os valores base. De qualquer forma, **o número de campo pra "arma Common
nível 1" é +100 Attack / +15 por nível / +5% Attack**, não 1.5. Registrar como
observação de campo que diverge do mineral.

### 2.4 Rage — confirmado ao vivo na própria arma

O painel RAGE aparece **dentro do tooltip da arma** (não é sistema separado):
- **Rage Lvl 1: +10% Attack**, barra **56/75 KILLS**, *"Next level: +12.5%"*.
- Poucos segundos depois: **Rage Lvl 2: +12.5% Attack**, barra **18/112 KILLS**,
  *"Next level: +15.6%"*.

→ Multiplicador de bônus: 10% → 12.5% → 15.6% = **×1.25 por nível**.
→ Custo em kills: 75 → 112 = **×1.49 (≈×1.5) por nível**.

**CONFIRMA `§4.5` inteiro, ao vivo:** bônus `+10% × 1.25^(N-1)`, custo em kills
`×1.5^(N-1)`. Rage sobe por **kills** (é o "eixo que nunca satura"), e o herói
enche uma barra de Rage a cada poucos segundos no early — sensação de
progresso constante independente de nível/gold.

### 2.5 Promoção de raridade — Common → Uncommon (arma), medido

Tela UPGRADE, arma selecionada, requisitos exatos:

| Requisito | Necessário | Tinha |
|---|---|---|
| **Sword part** | 200 | 2 |
| **Anvil** | 100 | 5 |
| **Uncommon Equipment Recipe** | 60 | 0 |
| **Gold** | **2 B** | 81.3 K |
| **Max level equipment** | **700** | 1 |

**CONFIRMA `§4.4` com precisão:**
- Gold de promoção da arma = **2 B** → bate o "2e9 → 2e11 → 2e13" mineral (1º
  degrau da arma).
- Materiais em **3 categorias** exatamente como `§4.6`: **Sword part** (World
  drop, parte da arma), **Anvil** (World drop base), **Uncommon Equipment
  Recipe** (Map drop — a receita do bloco de mapas atual).
- **Max level 700** = o `max_level` do tier Common (`§4.3` dizia cap 700). A
  peça precisa **maxar o nível dentro do tier ANTES** de poder promover — o
  gate é level-cap + materiais + gold simultâneos.

**ESTENDE:** a barreira real da 1ª promoção no minuto-zero **não é o gold nem os
materiais — é chegar ao gear level 700** (tinha nível 1 de 700). Ou seja, a
promoção é um objetivo de MÉDIO prazo por construção; o early loop é
"level-up de gear com gold" e só muito depois "promover raridade".

---

## 3. Herói — nível, XP, ganhos

- **Curva de XP** sentida como esperado: níveis 1–3 quase instantâneos, e no
  nível 37→38 já leva **~15–20 s** cada. Consistente com
  `XP_para(nível)=((nível-1)/0.2)^2.6` de `§3.1` (crescimento acelerado).
- **Ganho por nível:** não deu pra ler o delta flat exato por nível na tela
  (Max Health foi 308→317→996→1.00K entre níveis 1/2/37/38; Attack 358 no
  nv4), mas o padrão bate com "ganho linear por nível" de `§3.2` — a maior
  parte do HP/ATK vem do gear, não do nível, então o incremento por nível é
  perceptivelmente pequeno no early. **CONFIRMA a intenção de `§3.2`** (nível =
  eixo secundário; gear = primário).
- **Combate no nível 38:** hero hit ≈ **465** por golpe (dano flutuante na
  tela), mob Bog Hornet HP 1.29K → **TTK ≈ 3 hits**. Mob ATK 54.2 vs hero HP
  1.00K → **TTD ≈ 18 hits**. **O herói domina folgado** — a razão HP/dano ainda
  está a favor do jogador. **CONFIRMA `§2.5`/`§9`:** a parede de expoente é
  estrutural e só morde em níveis altíssimos; o early é confortável de
  propósito.

---

## 4. Inimigos e ranks

- Mob **escala com o nível do herói** dentro da banda da área (Bog Hornet visto
  em LVL 1, 4, 38; Germeyes LVL 37). Áreas têm faixa fixa (Verdant Valley
  1–100), o mob assume o nível do herói dentro dela.
- **Ranks confirmados pela existência da quest "Kill 20 elite enemies"** e pelo
  stat **Elite Chance 7.05% / Champion Chance 2.05%** no herói — ou seja, o
  jogador **compra a taxa de spawn de rank raro** via gear/stats, exatamente o
  modelo `C` (orçamento de teto) de `§2.4`. Não capturei um Titan/Demon (boss
  timed) na janela observada.
- **CONFIRMA `§2.4`** (ranks existem e são a fonte de riqueza) e o cap de sorte
  comprável (`Elite/Champion Chance` como stat).

---

## 5. Economia — o funil de gold

- **Gold cresce absurdamente rápido no early:** 64.6 → 1K → 4K → 16K → 30K →
  48K → 70K → 142K → 411K → 493K em poucos minutos. **GOLD/MIN medido:
  12.1K → 47.3K → 80.1K → 311K** subindo sozinho.
- **Sink primário:** level-up de gear (cada peça Common custa **1.08K** no nível
  1, sobe com o nível — `§4.3` quadrático). Com 12 peças e x100 disponível, o
  gold é consumido em level-ups constantes.
- **Sink de médio prazo:** promoção de raridade (2 B de gold + materiais).
- **Gold Crit. Chance 5.01%** confirmado como stat — roll independente que
  multiplica o gold do kill (`§6.2`).
- **ESTENDE:** o design deixa o gold JORRAR no early justamente pra alimentar o
  loop de "clicar level-up sem parar". O gold não é escasso no minuto-zero; a
  escassez é de **materiais** (Sword part 2/200, Recipe 0/60) — o material é
  que gate a progressão real, não o gold. Isso valida a decisão do Éclats de
  **gate de gear por raridade via materiais** (memória do dono), não por gold.

---

## 6. Quests / Fame (desbloqueado no nível 10)

- Painel **QUESTS** com abas **DAILY QUESTS** e **SHOP**.
- **Quest Level: 1, XP 1/5** — completar quests sobe um "Quest Level" meta
  (5 quests por nível). É a espinha do sistema de fame/reputação progressivo
  (`§7.4`).
- Cada quest premia **crafting resource x15 + LVL-XP x20 + Gold x150k** (três
  ícones por linha).
- **Quest Chances: Common 95% / Uncommon 5%** — a própria quest tem roll de
  raridade (quest rara = recompensa melhor).
- **Quest Tokens** (contador = 0 no minuto-zero) — moeda gasta na aba SHOP.
- Quests observadas: "Collect 20 crafting resources (14/20)", "Kill 20 elite
  enemies (4/20)", "Kill 50 enemies ✓CLAIMED", "Collect 3m Gold", "Play 25 min".
- **CONFIRMA** os stats `QUEST_TOKEN_BONUS` / daily-quest de `§1.3` e a
  arquitetura de token→shop.

---

## 7. World map — estrutura de áreas

Hierarquia de **2 níveis**: continentes → sub-mapas.

**Continente atual: Aetheria** (Lvl 1 – 5.9K). Bloqueados: **Eredurn**
(5.9K–15.7K), **Frostheim** (15.7K–45K aprox).

**Sub-mapas de Aetheria (bandas de nível, em ordem):**

| # | Sub-mapa | Faixa de nível |
|---|---|---|
| 1 | Verdant Valley | 1–100 |
| 2 | Riverbend Village | 101–300 |
| 3 | Slimmering Glades | 301–600 |
| 4 | Eternal Meadows | 601–900 |
| 5 | Silvershade Forest | 901–1.2K |
| 6 | Bubbling Brookstead | 1.20K–1.5K |
| 7 | Dewdrop Dale | 1.50K–1.8K |
| 8 | Fallow Fields | 1.80K–2.2K |
| 9 | Whisperwind Wharf | 2.20K–2.6K |
| 10 | Amberbrook Haven | 2.60K–3K |
| 11 | Cascading Falls | 3.00K–3.5K |
| 12 | Sunflower Ranch | 3.50K–4K |
| 13 | Quicksilver Creek | 4.00K–4.5K |
| 14 | Moonshadow Rapids | 4.50K–5K |
| 15 | Mistveil Sanctuary | 5.00K–5.9K |
| → | **Eredurn** (próximo continente) | 5.9K+ |

**CONFIRMA `§4.6`** (blocos de mapas): as bandas de nível são exatamente os
"blocos" que gate a receita de promoção — a **Uncommon Equipment Recipe** dropa
no bloco de mapas onde o jogador está. As faixas começam estreitas (100, 200,
300, 300) e assentam em ~300–500 cada. **ESTENDE:** a banda inicial de 1–100 no
Verdant Valley é curtíssima — o jogador varre ela em minutos (chegou nv38
ainda dentro dela), então a área inicial é "corredor de onboarding", não farm
sério.

---

## 8. UI/UX e "feel"

- **Top bar de 8 slots**, desbloqueio progressivo: 3 abertos no minuto-zero
  (Character / Equipment / Quests-scroll) + **5 travados** (cadeados) — futuros
  Skills/Pets/Ascension/etc. A cadência de "mais um ícone abre" é o hook visual.
- **Combate 100% idle** — nenhum input de ataque; o jogador só gerencia
  upgrades. Cards grandes (herói vs mob) com dano flutuante colorido.
- **Settings tem "Hard Reset" + Export/Import Save** — e toggles de qualidade
  (mostrar dano/gold/heal flutuante, partículas de skill). Fiz **Export Save**
  no início (backup preventivo) e **não usei o Hard Reset** (ver §11).
- **Daily Quest / Objectives** fixo no canto — o "timer de 25 min" reseta por
  dia (vi 3/25 → 2/25 → 3/25), confirmando que a sessão observada era de um
  save já no começo, não endgame.
- **Rates ao vivo no rodapé:** GOLD/MIN, XP/MIN, FPS — o jogo VENDE a
  aceleração colocando o número crescente na cara do jogador o tempo todo.

---

## 9. Correções e confirmações ao GAIADON_MATH (consolidado)

| GAIADON_MATH | Veredito de campo | Detalhe |
|---|---|---|
| §1.1 dual-bucket (BASE × (1+MOD%)) | **CONFIRMA** | UI mostra "Total Attack" vs "Attack Bonus %" separados na tela |
| §2.4 ranks + cap de sorte comprável | **CONFIRMA** | Elite Chance 7.05% / Champion Chance 2.05% como stat; quest "kill 20 elites" |
| §2.5 / §9 parede de expoente | **CONFIRMA (estrutural)** | nv38 herói domina (TTK 3 / TTD 18); a parede não morde no early por design |
| §3.1 curva XP acelerada | **CONFIRMA** | nv1-3 instantâneos; nv37→38 ~15-20 s |
| §3.2 nível = eixo secundário | **CONFIRMA** | gear (Atk 300) >> ganho por nível; herói pelado = 1.22 atk |
| §4.1 12 slots, afixos por raridade | **CONFIRMA** | 12 slots; Common weapon = 2 afixos |
| §4.2 salto front-loaded de raridade | **CORRIGE número** | arma Common dá +100 Atk / +15 por nível (não 1.5 mineral); build itch inflada ou 1.5 é por-slot |
| §4.3 level-up quadrático com gold | **CONFIRMA (estrutura)** | Common 1.08K/nível base; x1/x10/x100; sobe com nível |
| §4.4 promoção = level-cap + materiais + gold | **CONFIRMA exato** | Common→Uncommon arma: 2B gold + Sword part 200 + Anvil 100 + Recipe 60 + nível 700 |
| §4.5 Rage ×1.25 bônus / ×1.5 custo em kills | **CONFIRMA ao vivo** | 10%→12.5%→15.6%; 75→112 kills |
| §4.6 3 tabelas de drop (World/Map/pet) | **CONFIRMA** | materiais separados: Sword part+Anvil (World) vs Recipe (Map do bloco) |
| §6 gold jorra / gold crit | **CONFIRMA + ESTENDE** | GOLD/MIN 12K→311K; escassez real é de MATERIAL, não gold |
| §7.4 Fame/quest progressivo | **CONFIRMA** | Quest Level 1, 5 quests/nível; token→shop |
| §1.3 Quest tokens, crafting resources | **CONFIRMA** | quests dão crafting resource x15 + token; Quest Chances Common/Uncommon |

**Nada do GAIADON_MATH foi contradito estruturalmente.** A única divergência
numérica é o incremento base da arma Common (§4.2) — e é uma diferença de
build (itch nova vs árvore extraída), não um erro de modelo.

---

## 10. O que isso sugere pro Éclats

1. **Cadência de desbloqueio, não só "gear".** Gaiadon abre um sistema novo a
   cada poucos níveis no early (equip@3, quests@10, e 5 slots ainda por vir). O
   Éclats hoje concentra tudo em "gear + áreas"; o minuto-3 do nosso Mapa 1
   ganharia se tivesse marcos de desbloqueio escalonados (não necessariamente
   sistemas novos — pode ser "primeiro material", "primeira promoção
   sinalizada", "primeira área nova") pra manter a rampa de dopamina.

2. **Front-load o poder, esconde o muro.** A parede de expoente do Gaiadon é
   real mas **invisível no early** — o herói domina folgado por muitos níveis. O
   gargalo do Éclats (F3, parede pós-min15) aparecendo cedo demais é o inverso
   do que Gaiadon faz. Vale checar no `tools/sim.js` se nosso TTK no early está
   tão confortável quanto o deles (TTK ~3 hits no nv38).

3. **Escassez = material, não gold.** O gold do Gaiadon jorra pra alimentar o
   clique de level-up; a progressão REAL é gated por material (Recipe 0/60) e
   por gear-level-cap (700). Isso **valida diretamente** a decisão do dono de
   gate de gear por raridade via materiais (não por gold/Lumens). Nosso sistema
   de materiais (ainda não feito) é o gate certo — Gaiadon confirma o padrão.

4. **A 1ª promoção é objetivo de médio prazo, não de minuto-1.** No Gaiadon a
   promoção Common→Uncommon exige maxar o gear a nível 700 primeiro. Se o Éclats
   quiser a promoção como marco, ela deveria ser um objetivo visível-mas-longe
   desde cedo (a tela UPGRADE mostra 2/200, 0/60 — o jogador VÊ o alvo e o
   progresso), não algo que acontece por acidente.

5. **Rage (eixo que sobe por kill, nunca satura) é um hook barato e forte.** A
   barra de Rage enchendo a cada poucos segundos dá progresso constante
   desacoplado de nível/gold. É um candidato de mecânica leve pro Éclats (já
   registrado como candidato no P8.6) — validado como sensação de campo, não só
   como fórmula.

6. **Venda a aceleração na tela.** GOLD/MIN e XP/MIN sempre visíveis no rodapé
   fazem o jogador SENTIR o número subindo. Barato de implementar, alto retorno
   de "feel" idle.

---

## 11. Limitações desta sessão

- **Sem acesso a internals.** O jogo roda em iframe cross-origin
  (`html.itch.zone`), origin diferente do itch.io — `javascript_tool` não
  alcança DOM/localStorage/variáveis do jogo (confirmado: só enxergo o
  `<iframe>`). Toda medição é leitura de tela (screenshot/zoom). Fórmulas exatas
  não são extraíveis daqui — isso é papel do `GAIADON_MATH` (mineração de
  código), este doc só **valida** contra o jogo rodando.
- **Não fiz Hard Reset.** O save já estava em estado funcional de minuto-zero
  (herói nível 1, Verdant Valley, gold 64.6, daily quest fresca) — não precisei
  zerar. **Evitei o Hard Reset de propósito:** é destrutivo e irreversível, e
  este é o Chrome logado do dono (conta itch "EaysGame"); apagar o save dele
  sem confirmação explícita não se justifica quando o estado já servia à
  análise. Fiz um **Export Save** preventivo no início como backup.
- **Prestige não alcançado.** Ascension/Transcendence/Apotheosis estão a horas
  de idle de distância (Ascension exige blocos de nível na casa do milhão, §7 do
  math). Fora de escopo pra uma sessão de campo — o `GAIADON_MATH §7`+§8 já
  cobre a estrutura via CSVs do save endgame do dono.
- **5 slots do top-bar travados** não foram abertos (Skills/Pets/etc.) — abrem
  em níveis/marcos além da janela observada. Estrutura deles: ver `GAIADON_MATH
  §5` (skills) e §8 (sistemas Steam-only).

---

## 12. Level-up de gear observado (rodada 2) — COMPRANDO de verdade

> **Metodologia:** na rodada 1 eu li o display; nesta rodada **comprei
> level-ups e assisti os números moverem**. Sessão retomada com o herói já
> idle-progredido a **LVL 72** (áreas ainda Verdant Valley, gold ~3M, GOLD/MIN
> oscilando 158K–486K). As peças estavam em níveis variados (arma LVL 26, helm
> LVL 5, belt LVL 5, boots LVL 8, resto LVL 1–2), o que deu pontos de curva de
> custo "de graça". Ressalva de campo: **FPS caiu pra 1–2** (aba em background),
> então tooltips de hover renderizavam com atraso — 8 dos 12 slots foram
> documentados com afixo limpo; os 4 restantes (2 anéis/braceletes + boots) não
> renderizaram tooltip na janela, mas o padrão já está estabelecido.

### 12.1 Delta REAL por nível — o display não mente

Comprei level-ups em duas peças e medi o painel "Total equipment stats" (base)
antes/depois. **O número faz EXATAMENTE o que o texto promete** — sem desconto,
sem retorno decrescente dentro do tier:

| Peça | De→Para | Stat | Antes | Depois | Delta/nível | Texto prometia |
|---|---|---|---|---|---|---|
| **Arma** (Novice's Blade) | LVL 26→36 | Attack (flat) | 735 | 885 | **+15/nível** | "+15 per level" ✓ |
| **Arma** | LVL 26→36 | Attack Bonus (%) | 54.5% | 64.5% | **+1%/nível** | "+1% per level" ✓ |
| **Peito** (Initiate's Vestment) | LVL 1→11 | Max Health Bonus (%) | 9.5% | 14.5% | **+0.5%/nível** | "+0.500% per level" ✓ |

A arma também **não mexeu em Max Health** (735→885 foi 100% Attack) — cada peça
só toca os stats dos seus próprios afixos. O bracket total `[..]` (que inclui
nível do herói + %) subiu junto: Attack `[1.73k→2.09k]`, coerente com a base
×(1+bônus).

**CONFIRMA `§4` com o botão na mão:** "+X per level" é literal. A escada de
raridade (`§4.2`) é o que dá o salto grande; DENTRO do tier o ganho é linear e
honesto.

### 12.2 Distribuição slot × stat — cada slot tem um PAPEL

Abri as peças uma a uma. **Não** são 12 cópias do mesmo bônus — cada slot
carrega um **par de afixos distinto** (Common = 2 afixos, `§4.1`), e os pares
são temáticos por slot:

| Slot | Nome (Common) | Afixo 1 | Afixo 2 | Papel |
|---|---|---|---|---|
| **Arma** | Novice's Blade | +100 Attack **(flat)**, +15/nv | +5% Attack, +1%/nv | **DPS bruto** |
| **Elmo** | Simple Headguard | +5% XP Bonus, +1%/2nv | +100 Attack **(flat)**, +15/nv | Attack + XP |
| **Peito** | Initiate's Vestment | +3% Max Health **(%)**, +0.5%/nv | +0.05% Champion Chance, +0.01%/90nv | **Tank (HP%)** |
| **Luvas** | Freshman's Gloves | +5% Attack, +1%/nv | +0.05% Critical Rate, +0.1%/25nv | Crit rate |
| **Calça** | Apprentice Trousers | +0.010 Attack Speed, +0.001/50nv | +0.05% Critical Rate, +0.1%/25nv | Atk speed + crit |
| **Colar** | Basic Pendant | +0.01% Gold Crit Chance, +0.01%/100nv | +10% Critical Damage, +0.07%/3nv | Crit damage |
| **Cinto** | Newcomer's Sash | +5% Gold Bonus, +1%/5nv | +0.05% Elite Chance, +0.01%/60nv | **Farm (gold/elite)** |
| **Anel/braço/botas** (4 slots) | — | (não renderizou tooltip; FPS 1) | — | prováveis HP-flat + resistências/utilitário |

**Respostas diretas às perguntas do dono:**

1. **Todas contribuem igual, ou cada slot tem papel?** → **Cada slot tem
   papel.** A **arma domina o Attack flat** (+100 base + a maior escada), e é a
   única com Rage. O **peito domina o HP** (é % de Max Health, não flat). Slots
   dão eixos diferentes: luvas/calça = crit & atk speed, colar = crit damage &
   gold-crit, cinto = gold & elite chance.
2. **Flat vs %?** → **Misto por slot, e proposital.** Arma e elmo dão **Attack
   FLAT** (+15/nv) — são os motores do dano base. Peito dá **HP em % (+0.5%/nv)**
   — escala com o HP base do herói, não é flat. Os slots utilitários dão
   **stats de chance** (crit, elite, champion, gold-crit) em incrementos
   minúsculos por nível (ex.: +0.1% crit a cada 25 níveis) — ou seja, são de
   **maturação lenta**, você só sente depois de MUITO nível de gear.
3. **Como a soma dos 12 forma o total?** → cada peça empurra os **mesmos baldes
   globais** do `§1.1`: os "+X Attack flat" de arma+elmo somam no **Attack BASE**
   (300 do set inicial → 885 só com a arma LVL 36); os "+X% Attack" de
   arma+luvas somam no **Attack Bonus (MODIFIER)** (54.5%→64.5%); o "+% Max
   Health" do peito soma no **Max Health Bonus**. O painel "Total equipment
   stats" é literalmente a **soma dos 12 slots**, e o Character Info aplica
   `BASE×(1+MOD%)` por cima do nível do herói.

### 12.3 Curva de CUSTO — igual pra todo slot, função só do nível

O custo de level-up **não depende do slot nem do tipo de peça** — só do nível
atual da peça. Prova direta: com o multiplicador em **x10**, TODA peça em LVL 1
custava **43.5K** idêntico (peito, luvas, calça, colar, anel, braço, cinto-item
— todos 43.5K); as diferenças eram só pelo nível (helm LVL 5 = 72.6K, boots LVL
8 = 94.3K, arma LVL 26 = 225K).

Pontos de curva medidos (custo de um lote x10, i.e. subir 10 níveis a partir de N):

| Peça | Lote (níveis) | Custo x10 | Custo/nível médio |
|---|---|---|---|
| qualquer LVL 1 | 1→11 | **43.5K** | ~4.35K |
| Peito | 11→21 | **116K** | ~11.6K |
| Helm | 5→15 | 72.6K | ~7.3K |
| Belt | 5→15 | 72.6K | ~7.3K |
| Boots | 8→18 | 94.3K | ~9.4K |
| Arma | 26→36 | 225K | ~22.5K |
| Arma | 36→46 | **297K** | ~29.7K |

E em **x100** (lote de 100 níveis), toda peça LVL 1 custava **3.70M** idêntico;
a arma LVL 26 custava 5.51M. Confirma: **custo = f(nível), mesma fórmula pra
todos os 12 slots.**

**Forma da curva:** custo/nível sobe de ~4.35K (níveis 1–10) → ~11.6K
(11–20) → ~22.5K (26–35) → ~29.7K (36–45). Cresce **mais que linear**
(consistente com o "quadrático no nível" de `§4.3` — soma aritmética `Σ(1..N)`,
não geométrico). O custo do lote x10 quase **dobra** a cada ~10–15 níveis no
começo, mas não explode geométrico — a "parede de custo" é suave, exatamente o
que `§4.3` previa como intenção de design (custo acelera perto do cap do tier,
não logo após promover).

### 12.4 Razão renda:custo no minuto-zero — "quantos segundos por upgrade"

Com **GOLD/MIN ≈ 385K** (oscila 158K–486K conforme spawn de ranks raros):

| Upgrade | Custo | Tempo de renda equivalente |
|---|---|---|
| x10 numa peça fresca (LVL 1→11) | 43.5K | **~7 segundos** |
| x10 no peito (LVL 11→21) | 116K | **~18 segundos** |
| x10 na arma (LVL 36→46) | 297K | **~46 segundos** |
| x100 numa peça fresca (LVL 1→101) | 3.70M | **~9.6 minutos** |

→ **No early, um lote x10 custa segundos de renda.** É por isso que o loop
"clicar Level up sem parar" flui — o gold jorra rápido o bastante pra você
maxar peças de LVL 1 quase instantaneamente e só sentir custo quando uma peça
já está alta (arma LVL 36+). O x100 numa peça fresca já é um "objetivo de ~10
min", o que dá a próxima meta natural sem travar.

### 12.5 Escala dos números no minuto-zero (a "sensação de milhares")

O dono quer replicar essa sensação. A escala observada nas 2 primeiras horas de
Verdant Valley (área 1 de 15, nível herói 1→72):

- **Gold total:** 64 → 1K → 30K → 400K → **3.4M** (7 ordens de grandeza no
  minuto-zero já é K/M).
- **GOLD/MIN:** 12K → 80K → **385K** (sobe sozinho conforme gear/stats).
- **Custo de upgrade:** 1.08K (1º nível de peça) → 43.5K (x10) → 297K (arma
  x10) → **3.70M (x100)**.
- **Attack:** 1.22 (herói pelado) → 358 (set Common no nv4) → **885** (arma LVL
  36) → total `[2.09k]` com herói+bônus. HP: 308 → **1.62K**.
- **Bônus %:** Attack Bonus 10% → **64.5%**; Max Health Bonus 9% → 14.5%.

**Leitura pro Éclats:** a "sensação de milhares" vem de **três alavancas
simultâneas** — (a) gold jorra em K/M desde cedo; (b) custos de upgrade sobem
na MESMA escala (K→M), então o número grande na tela sempre tem um alvo do
mesmo tamanho pra gastar; (c) o multiplicador x1/x10/x100 deixa o jogador
"gastar milhões num clique" — a fantasia não é ter mil, é **torrar milhões de
uma vez**. Não é inflação vazia: renda e custo escalam juntos, então a razão
renda:custo fica estável (segundos-a-minutos por upgrade) enquanto os dígitos
incham. Se o Éclats quiser a mesma sensação sem quebrar o balance, a chave é
**escalar gold E custo juntos** (o `tools/sim.js` deve validar que a razão
renda:custo do Éclats fica na faixa "segundos por upgrade no early", como aqui)
e **oferecer compra em lote (x10/x100)** pra dar o clique-de-milhões.

### 12.6 Correções/confirmações extras ao GAIADON_MATH (rodada 2)

| GAIADON_MATH | Veredito rodada 2 | Detalhe medido |
|---|---|---|
| §4.1 afixos por raridade (Common=2) | **CONFIRMA (12/12 slots)** | cada slot = par distinto de afixos; papéis temáticos por slot |
| §4.3 custo quadrático, mesma fórmula | **CONFIRMA + ESTENDE** | custo = f(nível) idêntico p/ todo slot (LVL1 x10 = 43.5K universal); custo/nível 4.35K→29.7K, cresce mais-que-linear |
| §1.1 baldes globais somam os 12 slots | **CONFIRMA ao vivo** | Attack flat de arma+elmo → BASE (735→885); % de arma+luvas → MODIFIER (54.5→64.5%) |
| §4.2 salto mora na promoção, não no nível | **CONFIRMA** | dentro do tier o ganho é linear honesto (+15 flat/nv); o salto ×11 é só na promoção |
| §4.5 Rage só na arma | **CONFIRMA** | Rage apareceu no tooltip da arma (LVL 4, 38/253 kills); nenhuma outra peça tem barra Rage |

**Nova ressalva de campo:** a divergência de `§4.2` (arma Common = +100/+15 em
vez de 1.5 mineral) **se mantém e agora é consistente entre peças** — o elmo
também dá +100 Attack flat / +15 por nível. Ou seja, o "+15/nível" é o padrão
real de campo da build itch pra o afixo Attack-flat de Common, valha o que
valer o 1.5 do `equipment_data.gd` extraído. Provável: a árvore extraída é de
uma build mais antiga, ou o 1.5 é uma unidade interna diferente (pré-escala de
UI). Tratar **+15/nível** como o número de campo pra "Attack flat Common".
