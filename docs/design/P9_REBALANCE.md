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

### 2.6b Como nasce um número (método consolidado — grill jul/04)

Todo bônus é definido em dois tempos: primeiro a FORMA (eixo → balde
flat/increased/more → fonte gear/árvore/awaken/mecânica → cap Mapa 1 §2.8),
depois o NÚMERO — que nunca é escolhido direto; ele nasce por um de três
padrões:

- **A. FIT (números de relógio):** escolhe-se a experiência-alvo (HTK,
  composição de ATK, duração do sink, golpes no chefe) e `tools/p9/p9_fit`
  deriva o número. Ex.: weapon perLevel 300, UNIT atkPct 45, custos da
  árvore, e o PAR Awaken ×2.5 ↔ Okhra hpMult 690 (um fit só — mexeu num,
  re-fita o outro).
- **B. CAP de design + rampa (mecânicas):** o teto é decisão de design na mão
  (§2.8); o perLevel/UNIT é aritmética pra rampa terminar no cap (ex.:
  goldenWake 1.0×10 níveis = cap 10%; executioner 0.8×10 = 8%).
- **C. ORÇAMENTO de teto sentido (eixos saturáveis):** quando várias fontes
  alimentam um eixo com teto perceptivo (crit ≤45–50, DR ≤75), dimensiona-se
  cada fonte de trás pra frente a partir do teto (crit final 44.5% =
  luvas + árvore + base).

Regra de ouro: relógio → fit · mecânica → cap+rampa · eixo saturável →
orçamento. Em todos: validação nas seeds 1/3/7 antes de travar.

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
- [x] P9.5 TUNING (v7, Opus) + BAKE em src/ (Sonnet) + review adversarial
      (Opus, jul/04): sim DIRETO reproduz v7 byte a byte (FL 36h13, Okhra 90);
      saves antigos migram limpos; testes 40/40; ressalvas cosméticas
      corrigidas (comentário baseXp; p9_run explode sobre o bake = quebra
      histórica esperada, prova válida é via sim.js). Re-subida: melhor
      alcançável nas alavancas permitidas (§7; áreas 15-18 = fronteira viva,
      não re-subida). COMMITADO.
- [x] P9.6 RODADA 2 FECHADA (jul/04): formatação % commitada · v8 tunado
      (Opus) e BAKEADO (Sonnet, reprodução linha a linha): crit final 44.5% ·
      composição gear+passivas 83–91% (level caiu pra 8–17%) · Overcrit fora
      do Mapa 1 (decisão do dono: passiva tier 2 no Mapa 2; luvas = Fracture
      Sense critDmg%) · FL 37h29–37h58 (3 seeds) · Okhra 71–95 · re-subida
      HTK ≤2.9 (era 7–10; a composição resolveu o que a árvore não conseguia) ·
      hygiene.test re-sincronizado (quebrado desde P9.3) + teste órfão do nó 13
      corrigido. Achado de método: o relógio do FL é MATERIAL-GATED (dial limpo).
- [ ] P9.7 PLAYTEST RODADA 3 (dono, com v8 no jogo) → travar P9 ou abrir
      rodada 4. Pendência aspiracional herdada: re-subida ≤2 absoluto
      (v8 entrega 2.2–2.9 na métrica crua, cega às mecânicas).
- [ ] RODADA 4 (direção aprovada pelo dono, grill jul/04 — número só com sim):
      **onda cresce pra 4–5 mobs no fim do mapa** (packByGroup → algo como
      [1,2,2,3,4,5]). Custos mapeados: UI de batalha precisa suportar 5
      sprites (o teto 3 era restrição de UI) + re-fit do TTD de entrada
      (5 atacantes simultâneos ≠ 3) + revisar cap do Escorted. Sinergia
      declarada: Cleave ganha palco no G5–G6.
- [ ] RODADA 4 (decisão do dono, grill jul/04 — número só com sim): **árvore
      fecha 100% até a área 18** ("o player precisa de todo o poder pra
      derrotar o Okhra"; fechar um pouco antes tudo bem). Pontos excedentes
      pós-100% APENAS ACUMULAM — viram banco pro Tier II no Mapa 2 (sem
      mecânica nova, sem conversão). Re-fit de custos da árvore + re-validar:
      relógio 36±2 · Okhra 71–95 golpes (mais árvore = Okhra pode precisar de
      re-fit de hpMult) · coroa ~conv 11 · re-subida (esperado MELHORAR —
      candidata a entregar o ≤2 aspiracional). Substitui o alvo "66% no fim"
      do v8. ESTRUTURA travada no grill (auditoria nó a nó, 16/16 mantidos):
      maxLevel 10 UNIFORME em todos os nós · forma de custo MANTIDA (unlock
      por profundidade + upgrades ×0.5 do unlock com rampa ×1.7 → nó completo
      ≈ 85× o unlock) · o fit mexe só na ESCALA global dos custos · Golden
      Wake re-orçamentado UNIT 1.0→0.6 (soma com Twice-Gilded no cap 10%) ·
      nenhuma folha trocada (Shatterlight e demais chaves = Árvore II;
      Lightshell fica sem chave no Mapa 1 de propósito — ver
      MOB_MECHANICS_CATALOG.md §3).
- [ ] RODADA 4 (decisão do dono, grill jul/04 — números via sim): **matriz de
      gear ganha 2 afixos novos** — Twice-Gilded (Cloak: chance de Lumens 2×,
      2ª fonte do Golden Wake, orçamento conjunto no cap 10%) e Hollowing
      Light (Helmet: enemy −HP%, cap pequeno ~5%, substitui Steadfast
      Guard/DR). Regra do dono: ATK não se espalha por peças (identidade
      única por peça). Spec completa: `GEAR_BONUS_CATALOG.md §2b–2c`.
      Hollowing Light toca HP efetivo dos mobs → re-validar relógio 36±2.
- [ ] RODADA 4 (decisão do dono, grill jul/04 — números via sim): **promoção
      em DOIS materiais no Mapa 1** — Common→Uncommon consome material comum
      (massa) + material incomum (chave, drop raro novo ~2–5% em
      elites/Corona/boss); regra geral `promover p/ N+1 = mat(N)+mat(N+1)`
      (Mapa 2: incomum+raro). Spec: GEAR_BONUS_CATALOG.md §2d. Gates: momento
      da promoção não atrasa vs v8 · relógio 36±2 · Forge mostra os dois
      contadores. Lembrete registrado: mais TIPOS de material (partes por
      slot) ficam pra depois.
- [ ] RODADA 4 (decisão do dono, grill jul/04 — números via sim): **redesign
      dos bônus do First Light** — o rito mais caro do jogo precisa ler à
      altura do preço. Pacote (REVISADO pelo dono na mesma sessão): (1) piso
      de ATK/HP **MAIOR DE PROPÓSITO** — "quem gastou o tempo não pode ver
      só ×2.5"; número final fitado EM PAR com o Okhra (hpMult sobe junto);
      (2) **The World Kindles** — **o tier CORONA É ELIMINADO do pré-awaken:
      o First Light LIBERA o Corona no mundo** + sobe os caps de Ember/Lumen.
      Uma cor inteira de criatura nasce com o rito. ⚠️ Cascatas mapeadas (o
      fit resolve, mas são decisões visíveis): (a) modificadores de mob comum
      moram no roll do Corona → pré-awaken os modificadores ficam SÓ nos
      Harbingers (textura mais lisa, introdução mais gradual — validar em
      playtest); (b) RESOLVIDO pelo dono: Corona Call SAI do Cloak —
      substituto = **Fortune's Torrent** (chance de Lumens 4×, cap ≤5%;
      escada com o Twice-Gilded 2×; spec no GEAR_BONUS_CATALOG §2c) — e
      **Corona é REVELAÇÃO: zero menção em QUALQUER UI pré-awaken** (matriz
      de stats, Rarity Find, tooltips — item da fase de UI); (c) economia de
      materiais re-fitada sobre Ember/Lumen (Corona era fonte de 45%); (3) **Light Remembers** — re-subida pós-Convergence começa no
      nível N em vez de 1 (à la Retained do Gaiadon; ataca re-subida ≤2 por
      design); (4) **Vessel of Dawn** — Lightshell próprio PEQUENO (absorve N
      golpes por onda), pequeno de propósito pra awakens futuros engordarem;
      (5) +25 Lumens flat REMOVIDO. PRINCÍPIO TRAVADO: a escada de Awakens
      (First Light→…→Lumière) fortalece as MESMAS assinaturas a cada mapa,
      não inventa bônus novos. ⚠️ Gate cruzado: caps de rarity menores mexem
      na economia de materiais (elites/Corona = fonte do material-chave §2d)
      — fitar os dois patches JUNTOS. UI da tela de Awaken mostra ×N e as
      assinaturas (casa com o onboarding do Awaken já pautado).
- [ ] NOTA PRO RETUNE (dono, grill jul/04): ~~comentários de relógio
      guardados~~ **COLETADO (jul/04, fim da sessão): a rodada 4 RODA SEM CAP
      DE RELÓGIO** — nenhum gate de 36±2 no fit; timeout do sim estendido
      (rodar até 60h+); medir quanto tempo leva pra LIMPAR o Mapa 1 inteiro
      (First Light + Okhra) com o design novo, nas 3 seeds. O dono decide a
      âncora nova OLHANDO o número medido (descoberta primeiro, âncora
      depois). O alvo 36h±2 do v8 vira registro histórico até essa decisão.
- [ ] FASE DE UI (decisão do dono, grill jul/04 — zero balance): **tooltip de
      gear v2** (mockup aprovado em sessão; referência: print endgame do
      Gaiadon): (1) nome-lore do afixo em destaque acima do stat (dados já
      existem em gearBase, UI esconde); (2) preview de degrau honesto em TODO
      afixo com `step` ("next step: +X at Lv N" — hoje o atkSpeed exibe um
      "per level" falso); (3) botão Level up mostra o ganho ("→ +1% Crit
      Dmg" junto do custo). CORREÇÃO do dono: vender a promoção (assinatura
      trancada 🔒 + "×8 all stats" + progresso N/50 materiais) é PAPEL DA
      FORJA, não do tooltip — esse bloco vai pra tela da Forge (que já
      existe; falta arte forge_bg/icon_forge). NÃO copiar do Gaiadon: parede
      de 11 stats nem sufixos Primary/Bonus/Multiplier.
- [ ] FASE DE UI (decisão do dono, grill jul/04 — zero balance): **onboarding
      do Awaken** — explicar o que o Awaken é, o que ele dá (×2.5 ATK etc.) e
      os requisitos (área 18 + coroa + 100k materiais); é o que justifica os
      materiais aos olhos do jogador. Junto: progresso do material visível
      (contador N/100.000) a partir do 1º drop. Item da agenda "jogável por
      terceiros".
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

## 8. Playtest do dono — rodada 1 (jul/04, sobre o bake v7)

Achados do dono (screenshots) e destino:

1. **Formatação de %**: notas "per level" de afixos percentuais sem o símbolo
   ("+0.012 per level" → "+0.012% per level"); tooltip "+25 Cleave" → "+25%";
   breakdown do Lumens Bonus mistura "+10/+100" flat com % (a stat É
   percentual — TODAS as camadas dela exibem %; idem XP Bonus).
   → lote de UI (Sonnet).
2. **Crit 100% no Mapa 1 não pode — teto sentido ~40–50%**: fontes de crit
   (afixo das luvas + critRate da árvore ×6) saturam o clamp. Retune v8:
   fontes de crit dimensionadas pra pico real ~45% no fim do Mapa 1.
   **DECISÃO DO DONO (jul/04): Overcrit SAI do Mapa 1 — vira passiva de
   TIER 2, desbloqueada no Mapa 2** (Árvore II; registrado, fora de escopo
   implementar agora). No Mapa 1: as luvas perdem o afixo overcrit e ganham
   substituto (Fable: "Fracture Sense" vira Crit Damage % — identidade de
   golpe pesado sem tensionar o teto de crit). O engine do golpe duplo fica
   INERTE (sem fonte, como o specialDmg) esperando o Mapa 2.
3. **Composição do ATK**: hoje Character Level (1.25M flat) > Equipment
   (878K flat) — o dono quer **gear + passivas dominantes** ("a maior parte
   não deve vir de level up"). Gate novo do v8: gear+passivas ≥ ~75% do ATK
   total nos checkpoints (fim de G2/G4/G6). Rebaixar playerAtkCoef/Exp e
   compensar em gear/árvore, com RE-FIT das áreas e re-validação de TODOS os
   gates do §7 (relógio 36±2, Okhra, coroa, re-subida ≥ estado atual).

## 9. RODADA 4 — variáveis do candidato v9-r4 (coletadas com o dono, grill jul/04)

**Protocolo: DESCOBERTA, não fit de relógio** — rodar SEM gate de tempo
(timeout 60h+), medir quanto o Mapa 1 inteiro leva nas seeds 1/3/7; o dono
decide a âncora nova olhando o medido.

| # | Variável | Valor decidido |
|---|---|---|
| 1 | First Light — piso | **×5 ATK · ×3 HP** (Okhra re-fita pra manter 71–95 golpes) |
| 2 | Onda por grupo | **[1, 2, 2, 3, 4, 5]** (G5=4, G6=5; TTD re-fita) |
| 3 | Rarity Find pré-awaken | **Ember 8% · Lumen 3% · Corona 0 (não existe)**; pós-awaken (World Kindles): 30/15 + Corona 5 revelado |
| 4 | Material incomum (chave) | portadores = **só acesos (Ember/Lumen) + Harbingers**; chances/qtd via fit |
| 5 | Light Remembers | **~10% do maior nível alcançado** (banda 8–12 pro fit; awakens futuros sobem o %) |
| 6 | Vessel of Dawn | absorve **2 golpes por onda** (fixo; awakens futuros engordam) |
| 7 | Caps dos afixos novos | Twice-Gilded 4% · Hollowing Light 5% · Fortune's Torrent 5% |
| 8 | Árvore 100% | fecha na banda **conv 14–16 (≈ área 17–18)**; excedente acumula (banco Tier II) |
| 9 | TTK/TTD | alvos do v8 mantidos (entrada 8–12 · farm 2–4 · pós-conv 1 · TTD 25s · Harbinger 20–40 HTK) |
| 10 | Mortes | só entrada prematura (gate §2.7 mantido) |
| 11 | **Threshold do Harbinger** | **≥200 kills mínimo** (era 30–55; escada por grupo re-derivada acima de 200; regrind 1.0 mantido — medir impacto em Marcos e fluxo de material de boss no run de descoberta) |
| 12 | Golden Wake (árvore) | UNIT 1.0 → 0.6 (orçamento com Twice-Gilded no cap 10%) |
| 13 | Relógio | **SEM GATE** — medir; 36h±2 vira histórico até o dono ancorar de novo |
| 14 | Âncora inicial do player | **ATK ~15 · HP ~50** (era base 1000/1000) — começo em DEZENAS; topo do mapa mantido (mob área 18 ~10¹¹) → crescimento total sentido SOBE (~×10⁷–⁸). Re-deriva: arrays da família (re-ancorar no gerador), gear early (perLevel re-escala pra unidades/dezenas no início), Lumens via goldRatio |
| 16 | Sustain re-orçamentado (dono, playtest v9-r4 jul/04: "muito fortes") | Regeneration 15%/s e Heal on Kill 75%/kill outhealam a banda (TTD 25s = ~4%/s recebido → regen ×4 acima = imortal). Causa: o "×3 em bloco" do P9 tratou eixo SATURÁVEL como throughput. Re-orçamentar (padrão C): **gate = sustain maxado compensa ~50–70% do DPS da banda, nunca ≥100%** — Regeneration ≈2–3%/s maxada · Heal on Kill ≈10–20%/kill (burst condicional, identidade Caça mantida). Mortes em entrada prematura preservadas; Harbinger continua ameaça |
| 15 | First Spark = FLAT forte (dono, playtest v9-r4 jul/04) | A raiz da árvore volta a ser **ATK & HP FLAT por nível** (não %). Papel declarado: o SOCO de entrada — alvo de fit: nas convs 1–5, First Spark maxado ≈ +30–50% do ATK total; dilui no late DE PROPÓSITO (galhos %, crit e folhas assumem — não é regressão do F4: era "todos os nós flats fracos", isto é UM nó flat forte com papel). Bônus de UI: Passives aparece na coluna PRIMARY do breakdown. Demais nós seguem % (glossário "Additive fades" intacto) |

Pré-requisito de código (antes do fit): batch de MECÂNICAS em src/ —
dois materiais na promoção · Corona gateado pelo awaken (spawn + UI zero
menção) · bônus novos do awaken (Kindles/Remembers/Vessel) · afixos novos
(Twice-Gilded/Hollowing/Torrent no lugar de Fortune's Weave/Steadfast
Guard/Corona Call) · packByGroup 4–5 (+ UI de batalha p/ 5 sprites) ·
threshold ≥200. Implementação via Opus (10-80-10), review adversarial,
depois p9_generate/p9_fit no harness.

## Superseded

- Anchors P8.5b (First Light 18h22–18h26) ficam válidos APENAS como registro
  histórico do estado pré-P9; deixam de ser gate quando o P9 travar.
