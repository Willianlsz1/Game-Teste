# Balance Framework — Mapa 1 (18 áreas) · Escada de Decisões

> **Doc de trabalho vivo.** Reconstrução do balance do Mapa 1 em cima da estrutura nova
> (18 áreas · 2 temas · 6 grupos de 3 áreas · Harbinger por grupo · Okhra no topo).
> Método: cada passo tem UMA pergunta central → decide → **valida no sim** (`tools/sim.js`) → ✅ trava → próximo.
> Um passo só abre quando o anterior travou. Decisão travada não reabre sem número novo.
> Status: ⬜ aberto · 🔶 decidido (aguarda sim) · ✅ travado (com sim)

## A estrutura que tudo referencia

```
MAPA 1 = 18 áreas = 6 grupos de 3 = 2 temas
┌─ TEMA A · Floresta ──────────────┐ ┌─ TEMA B · Porto Afundado ────────┐
│ G1 (1-3)   G2 (4-6)   G3 (7-9)   │ │ G4 (10-12)  G5 (13-15)  G6 (16-18)│
│    ▲H1        ▲H2        ▲H3     │ │    ▲H4         ▲H5         ▲H6    │
└──────────────────────────────────┘ └──────────────────────── ▲OKHRA ──┘
H = Harbinger (chefe de grupo, fim da 3ª área). Okhra = Chefe de Mapa (após H6).
G1 < G2 < … < G6 (progressão reta). Tema A inteiro < Tema B.
```

A cadência natural de beats: **fim de grupo = parede + Harbinger** (6×), **troca de tema = a parede do meio do mapa** (1×), **Okhra = o exame final** (1×).

---

## PASSO 0 — O Relógio ✅ TRAVADO (jul/2026)

**Pergunta central:** quanto TEMPO o Mapa 1 deve custar, e em que ritmo?

| # | Decisão | Valor travado |
|---|---------|---------------|
| 1 | Duração total do Mapa 1 (ativo, até o First Light) | **18 horas** |
| 2 | Sessão típica | **30–50 min**, com a regra do beat: toda sessão fecha ≥1 beat (área, Harbinger ou convergence) — especialmente no início, sempre há algo a fazer |
| 3 | Split ativo/idle | **~50/50** (cap offline de 8h existente sustenta) |
| 4 | Timing do 1º prestige | **25–40 min** de jogo ativo |

Validação: decisão de produto do dono (sessão jul/2026). Consequência aritmética: ~25–35 sessões pra fechar o mapa; calendário casual ≈ 2–3 semanas com idle.

## PASSO 1 — O Esqueleto (áreas × níveis × tempo) ✅ TRAVADO (jul/2026)

**Pergunta central:** que faixa de nível cobre cada uma das 18 áreas, e quanto tempo cada grupo custa?

| Decisão | Valor travado |
|---|---|
| Cap do mapa | **nível 6000** |
| Faixas (largura ×1.15/área) | fins de grupo: G1=276 · G2=693 · G3=1328 · G4=2294 · G5=3762 · G6=6000 (tabela completa em `src/data.js`) |
| Orçamento de tempo | G1 1.0h · G2 1.6h · G3 2.4h (Tema A=5h/28%) · G4 3.2h · G5 4.2h · G6 5.6h (Tema B=13h/72%) — **contrato que o P2 tuna até cumprir** |
| Regra estrutural | dentro do grupo, área destrava por NÍVEL; **Harbinger trava a fronteira de grupo** (só idx 2,5,8,11,14,17 têm boss) |
| Curva de XP | mantém `14 × L^1.62` como default de trabalho (revisável no P2/P3) |

**Implementado** (ciclo 10-80-10): `data.js` (18 áreas; 10–18 placeholders de lore/HP marcados P2; `reservedHarbingers` guarda os 6 da floresta) · `combat.js` (`checkGroupUnlock` por nível; fronteira via Harbinger; Okhra fecha o mapa) · `state.js` (fix de migração: `mapOneCleared` obsoleto de saves de 9 áreas é rebaixado) · `sim.js` (relatório por grupo vs orçamento).
**Validação:** sim baseline/campaign rodam limpos nas 18 áreas; cadência de grupos correta (review adversarial confirmou off-by-one, converge, saves antigos, `_bossKills`). Tempos por grupo AINDA fora do alvo — esperado: HP é placeholder, é o trabalho do P2.

## PASSO 2 — A Fricção ✅ TRAVADO (jul/2026) — escopo: fricção validada; RELÓGIO delegado ao P5

**Pergunta central:** onde o jogador DEVE parar de avançar de graça — e o que o segura?

### P2.1 — TTK-alvo ✅ TRAVADO (jul/2026): **Opção A**, medida em GOLPES (HTK)
| Posição | Alvo |
|---|---|
| Entrada de área | 4–7 golpes (~3–6s) |
| Fim de área | 1–2 golpes (~1s) |
| Harbinger (fim de grupo) | 20–40 golpes (~15–30s) |
| Okhra (fim do mapa) | 60–120 golpes (~45–90s) |
| Nuance de tema | Tema B entra +1–2 golpes mais duro que Tema A |

Implementação em golpes: `HP da área = HTK-alvo × dano esperado do jogador naquele ponto` (estável sob mudanças de atkSpeed).

### P2.2 — Freio do runaway F3 ✅ TRAVADO (jul/2026): **A + C**
**A — domar os expoentes** (freio principal):
- `gearCostGrowth`: 1.013 → banda **1.020–1.035** (sim decide o valor);
- Cloak lumensBonus: degraus com TETO (ex. +10%/50 níveis, cap ~+150%) em vez de +1/nível ilimitado;
- Base por nível (`10 + 0.15×L` em state.js): ganha teto (~+100%) — nível alto não é impressora de dinheiro;
- Income continua ∝ HP do mob (termo auto-escalante mantido).
**C — materiais como segunda parede** (padrão Gaiadon, confirmado pelo dono): Gold generoso, mas o gear trava no cap de raridade e só passa **promovendo com materiais gated por grupo** (formalização no P4: raridade→grupo; cadência no P3). Rejeitado: goldRatio decrescente por área (feels-bad, pune avançar).

### P2.3 — Forma das curvas de HP ✅ TRAVADO (jul/2026): **C3 — Híbrido Gaiadon**
- **Entrada de GRUPO = parede Gaiadon: 8–12 golpes** no caminho esperado — o sinal físico de "farme/converja/promova antes de ficar". ⚠️ *Emenda consciente ao P2.1: a banda de entrada 4–7 vale só pras áreas INTERNAS do grupo; as 6 entradas de grupo usam 8–12.*
- **Dentro do grupo: crescendo** 5 → 6 → 7 golpes de entrada, desaguando no Harbinger (20–40). Sem respiro na fronteira (o "vale-e-rampa" da gen-3 morre nas fronteiras de grupo).
- Fim de qualquer área: 1–2 golpes (alívio vem do jogador crescer, não do HP cair).
- Fronteira de tema (9→10): +1–2 golpes em cima da parede de grupo (a parede do meio do mapa).
- Bounce-back natural: área anterior tem income capado (clamp de nível do mob) → voltar pra farmar é lento de propósito → converge fica atraente. Ciclo do grupo: **Harbinger morto → apanha na entrada → engrena → crescendo → Harbinger**.
- Números finais das 18 curvas: derivados no sim (`HP = HTK × dano esperado da curva de referência`), na implementação conjunta do P2.

### P2.4 — Dano, ondas e morte ✅ TRAVADO (jul/2026)
- **Custo de onda** (no poder esperado): área interna 10–20% do HP · entrada de grupo 35–50% · escolta de Harbinger = risco real. `mobAtkByArea` passa a ser DERIVADO desses alvos (dado o TTK novo), não setado à mão.
- **Ondas por grupo:** G1=1 · G2=2 · G3=2 · G4=3 · G5=3 · G6=3 (teto 3 = restrição de UI atual).
- **Morte:** cura total, sem punição de recursos; zera o contador do Harbinger (regra dos Marcos mantida).
- **SUSTAIN 100% CONSTRUÍDO PELO JOGADOR (decisão do dono):** `healOnKillFrac` base 0.10 → **0** (removido). SEM regen-piso gratuito. Curas restantes: level-up (cura total — chove no early, rareia rumo à 1ª parede) e morte. **Heal-on-kill e Regen %/s viram PASSIVAS de tier 1** (requisito registrado pro P6) e o afixo Heal on Kill do armor uncommon sai (troca no P4).
- **Beat de design resultante:** a atrição crescente + a parede do G1 forçam a 1ª Convergence (~25–40min ✓ P0) — o jogador morre, entende, converge, compra sustain, atravessa. A 1ª parede é o tutorial de prestige.
- ⚠️ Dependências registradas: P2.5 (threshold) co-tunado com "atingível COM passiva tier-1 de sustain, limítrofe sem" · P5 (gate ≤ fim do G1) · P6 (nós de sustain no tier 1, compráveis com a 1ª convergence).

### P2.5 — Threshold do Harbinger + mults de boss ✅ TRAVADO (jul/2026)
- **Threshold escalado por grupo: `25 + 5×grupo`** → 30/35/40/45/50/55 kills sem morrer, contados na 3ª área do grupo (campo de invocação; trocar de área zera — comportamento atual mantido).
- **Mults derivados, não setados:** Harbinger HP = HTK 20–40 (alvo 30) × dano esperado no fim do grupo · dano ×2 sobre o mob da área. **Okhra:** HTK 60–120 (alvo 90) · dano ×2.5. O `bossHpMult` global ×4 morre; vira valor por Marco derivado das bandas.
- Recompensa dos Marcos: mults atuais ficam; "bônus de formatura" (materiais garantidos) = P3.

**→ P2 FECHADO (jul/2026), recalibração final sob a Opção A:**
- **Validado com sim (seed 1):** HTK de entrada ✓ nas 18 áreas (10/5.5/6.5 +1.5 tema B) · Harbingers HTK 30 ✓ · parede-tutorial funciona (baseline sem prestige trava na entrada do G2, TTK 103s ⛔) · **derreter-via-prestige ✓** (A1/A2 derretem nas re-subidas; A3 ≤2 a partir da run 3) · threshold atingível com sustain comprado (125 mortes na campanha) · freio = `gearCostGrowth 1.022` (re-confirmado; 1.028/1.034 não completam saudável).
- **HTK-fim emergente da 1ª passada:** 1.7–7 no Tema A, 6.5–16 no Tema B — fronteira carnuda por design (Opção A); o melt é das re-subidas.
- **⚠️ RELÓGIO NÃO FECHA COM A POLÍTICA PROVISÓRIA (delegado ao P5, registrado como critério de aceite de lá):** total 43h13m vs 18h · 1ª convergence 1h49m vs 25–40min · desvio médio de grupo 206%. Causa estrutural: gate-fixo-276 concentra as 8 convergences no G1 e empurra G4–G6 com poder subdimensionado. O P5 (gate + fórmula que espalha convergences pelos grupos + meta de nº de convergences revista) é dono desses três números; se nem o P5 fechar, reabre-se a curva de XP (P1 previu revisão).
Ciclo 10-80-10 executado: Opus implementou (freio 1.022 cravado por dado; sustain via passivas funcionando — baseline trava na parede do G2 e força a 1ª Convergence como desenhado; bandas HTK de ENTRADA todas ✓). Sonnet corrigiu: cache stale de stats no reset (corrompia sims multi-run), invariante `hp[1] ≥ hp[0]` na calibração (14/18 áreas violavam o P2.3 "HP nunca cai"), tooltips das passivas novas, fallbacks 0-safe, números mágicos → balance.
**✅ IMPASSE RESOLVIDO (decisão do dono, jul/2026): OPÇÃO A.** O alvo "fim de área em 1–2 golpes" vale pras **re-subidas pós-Convergence**, não pra 1ª passada — a fronteira fica carnuda (HTK-fim flutua ~3–5 na 1ª passada) e o "derreter" vem do prestige. Formulação do dono: *o ritmo de avanço esperado = gear + Convergence/pontos de passiva JUNTOS* — convergir é o que acelera e é parte do requisito de avanço, não um extra. Calibração re-fixa: paredes de ENTRADA + bosses (bem-posto); hp[1] vira rampa interna suave em direção à parede seguinte; sim passa a reportar TTK de re-subida pra validar o "derreter". *(Registro histórico do impasse abaixo.)*

**⚠️ IMPASSE (histórico — resolvido acima):** com o invariante ligado, os alvos travados se sobre-restringem — {entrada 10 golpes + fim 1.5 golpes + HP nunca cai + freio 1.022} exige crescimento ~6.7× dentro da área, real é ~2× → recalibração de teste deu **55h de mapa vs 18h do contrato**. Opções: (A, recomendada) **fim-de-área 1–2 golpes vale pras RE-SUBIDAS pós-Convergence, não pra 1ª passada** — fronteira continua carnuda (HTK fim flutua ~3–5), o "derreter" vem do prestige (coerente com Gaiadon: você nunca derrete a fronteira, derrete o que já superou); (B) afrouxar o freio (reabre P2.2/risco F3); (C) aceitar mapa ~55h (viola P0); (D) baixar as paredes (viola C3).

Decide: TTK-alvo por posição (entrada de área 3–8s · fim de área 1–2s · Harbinger 15–30s · Okhra 45–90s) · TTD/papel da morte (hoje só existe nos min 0–15) · **o freio do runaway F3** (o loop income×lumensBonus composto — decisão estrutural: goldRatio decrescente por área, ou lumensBonus fora do gear, ou custo de gear mais íngreme) · curvas de HP das 18 áreas (vale-e-rampa por área, degrau por grupo).
Insumos: PASSO 1 · achado F3 do sim (TTK colapsa pra 0.1s sem freio).
Valida: `sim baseline` — TTK na entrada/fim de cada área dentro da banda; zero paredes não-planejadas; paredes planejadas nos fins de grupo.

## PASSO 3 — A Economia (income vs sinks) ✅ TRAVADO (jul/2026, "prosseguir; ajustes depois")

| Sub | Decisão travada |
|---|---|
| P3.1 Income | `goldRatio 0.35` âncora (acoplado ao freio 1.022) · `gearCostBase 2500` mantido |
| P3.2 Cadência | Common mat: G1 (3ª área)+ · Awaken mat: **G5+** · uncommon mat/Forge **fora do Mapa 1** |
| P3.3 Promoção | 6 promoções Common→Uncommon caindo ~G2–G4; custo/peça e drops dimensionados no sim |
| P3.4 Harbinger | drop por chance elevada (~35–50%), **nunca 100%** |

⚠️ Interação registrada: remover o Rare do alcance do Mapa 1 muda a curva de poder que o P2 calibrou (a política do sim promovia a Rare) → a implementação do P3 INCLUI recalibração (`calibrate --write`) e cap provisório do Uncommon até o P4 dimensionar raridade→grupo.

**→ P3 FECHADO (jul/2026), ciclo 10-80-10 completo:**
- Vencedor da grade: **promoteCommonCost 50 × chance common 0.05** (rare 0.15; boss 0.45 nunca-garantido ✓). Custo 80 rejeitado (parede de material 48–60min); 30 rejeitado (material irrelevante). Cap uncommon **3000 provisório** (restaura o teto de poder do ex-Rare que a calibração do P2 assumia; P4 redimensiona).
- Cadência ✓: common mat G1-3ª+ · awaken mat G5+ via Harbinger (chance 0.5) — disponível 10h44m ANTES do First Light.
- Recalibração pós-Rare ✓: HTK de entrada nas bandas em todas as 18 áreas; parede-tutorial intacta; campanha completa.
- Review adversarial: **zero bugs de correção**; teste novo pro caso "save com Rare" (rebaixa pra Common+clamp, sem crash — migração silenciosa REGISTRADA como aceitável: não há saves reais); teste stale de atkSpeed corrigido (softCap/chaves novas).
- **Achado estrutural delegado ao P5:** as 6 promoções caem juntas no G2 — a promoção é gated pelo gear bater o cap 500 em lockstep sob gate-fixo, não por material. O espalhamento G2→G4 real depende do P5 distribuir as convergences (e a política greedy nivela as peças; jogador real prioriza arma).


**Pergunta central:** quanto o jogador ganha, e em que ele é OBRIGADO a gastar, área por área?

Decide: goldRatio/bonus por área (consequência do freio do P2) · curva de custo do gear (`gearCostBase/Growth`) · **cadência de materiais re-mapeada pros 6 grupos** · custos de promoção.

**Diretrizes do dono (jul/2026 — pré-travadas, valem como input do P3/P4):**
- **Harbinger SEM loot garantido** — chance elevada, nunca 100% (garantia + respawn por threshold = impressora de material, mataria a parede Gaiadon). Regra: garantia e custo de promoção são vasos comunicantes.
- Fonte primária de materiais = farm de fluxo (mobs comuns/raros); a parede exige tempo real.
- Cadência-alvo: material aparece ~1 grupo antes da parede que destrava (common mat G1-3ª área+ → promoção ~G2-G4 · awaken mat G5+ → First Light).
- **Material uncommon e Forge saem do Mapa 1** (pertenciam à promoção pra Rare — ver P4).
Insumos: PASSO 2 travado.
Valida: `sim baseline` — surplus de Lumens por grupo (o jogador deve ficar "quase rico" antes de cada parede, nunca rico demais).

## PASSO 4 — O Gear (a fonte de poder da run) ⬜

**Pergunta central:** que fatia do poder vem do gear em cada grupo, e quando acontecem as promoções?

Decide: caps por raridade re-derivados · distribuição dos beats de promoção · papéis de afixo por slot (manter) + 2ºs afixos (incl. substituto do Heal on Kill removido no P2.4).

**Diretriz do dono (jul/2026 — pré-travada): MAPA 1 SÓ TEM COMMON + UNCOMMON.** (Confirma a spec original; o Rare no código era drift.) Consequências: **6 beats de promoção** (1/peça, Common→Uncommon, ~G2–G4) · Common carrega G1–G2, **Uncommon carrega G3–G6** (cap dimensionado pra maxar ≈ fim do mapa) · **Rare = conteúdo de Mapa 2** (fica no código, fora do alcance do Mapa 1).
Insumos: PASSO 3 (custos/materiais definem o ritmo de promoção).

**✅ P4 TRAVADO (jul/2026):**
- **P4.1 Caps:** Common 500 = G1–G2 (validado: promoções no G2 ✓) · Uncommon 3000 provisório = G3–G6, número final co-validado com o P5 (gear é pacing-limited, não cap-limited).
- **P4.2a A MATRIZ do Mapa 1** (2 primários + 1 despertar; cada peça é uma CASA única):
| Peça | Casa | P1 | P2 | Despertar (Uncommon) |
|---|---|---|---|---|
| Weapon · a Lâmina | força | ATK "Gilded Edge" | ATK% "Searing Light" | **Marked Blade** — specialDmg vs acesos+Marcos |
| Gloves · a Mão Nua | a rachadura | Crit Rate "Bare Hand's Instinct" | Crit Dmg "Crackfinder" | **Fracture Sense** — Crit Rate% |
| Armor · o Vaso Selado | não rachar | HP "Sealed Vessel" | HP% "Golden Seam" | **Siege Ward** — DmgRed extra vs onda 2+ |
| Helmet · a Vigília | ver+aprender | XP% "Watcher's Lens" | DmgRed "Steadfast Guard" | **Second Sight** — Find: Lumen (inerte até P8) |
| Boots · o Caminho | ritmo | AtkSpeed "Pathfinder's Pace" | **Find: Ember** "Ember Trail" (inerte até P8) | **Long Road** — XP% menor |
| Cloak · a Fortuna | o pagamento | Lumens "Gilded Fringe" | Lumens% "Fortune's Weave" | **Corona Call** — Find: Corona (inerte até P8) |
Única sobreposição deliberada: XP (helmet grande + boots menor). O ATK% do cloak MORRE (conserta o glass-cannon acidental). Nomes em inglês = mecânica travada; refino de nome = lore 🔍.
- **P4.2b ARQUITETURA (à prova de futuro, revisável por mapa):** primários ETERNOS (escalam por statMult/cap) · **despertar ÚNICO que evolui em estágios** (I→II→III…, uma linha qualitativa nova por estágio, decidida quando o mapa chegar — NUNCA afixo irmão novo) · **escada de cor do gear = escada de luz dos mobs** (Common cinza → Uncommon teal → Rare azul → Épico violeta → **Converged prismático**, usando o canon parqueado "Converged reservado pra gear") · máximo **1 mecanismo de gear novo por MAPA**. Nota do dono: revisamos conforme mecânicas novas chegarem.
- **P4.3 Escalas:** perLevel/statMult atuais ficam — a calibração deriva o mundo do dano do jogador e absorve.
- **Ciclo 10-80-10 do P4 (jul/2026):** matriz implementada exata (labels lore ✓ layout ✓) · specialDmg unificado sem dobra ✓ · Siege Ward condicional correto (boss+escolta conta; clamp no total) ✓ · finds inertes ✓ · saves antigos reconstroem ✓ · fix do review: `dmgReductionCap` vira constante de balance. ⚠️ **Achado do review:** a recalibração pós-matriz NÃO convergiu (G1 com números pré-nerf do cloak) — **absorvida pelo P5** (a grade de compressão recalibra tudo por célula). Nota browser: siegeWard avaliado no POUSO do hit (pendingHits) — mudança de onda em voo pode alternar a aplicação; aceito, registrado.
Valida: `sim baseline` — nível médio do gear por grupo segue o plano; promoções acontecem nos grupos planejados.

## PASSO 5 — Convergence (o loop de prestige) — P5.1/P5.3 ✅ TRAVADOS (jul/2026)

**P5.1+P5.3 (decisão do dono — "converge em X nível; cada convergence sobe o requisito e rende mais pontos; nem poucas nem muitas"):**
- **Gate escalonado:** `gateₙ = round(276 × 1.30ⁿ)`, n = convergences já feitas (fórmula direta, não composta) → **~12 convergences** até o cap 6000, espalhadas pelos grupos POR CONSTRUÇÃO (escada: 276·359·466·606·788·1025·1332·1732·2251·2927·3805·4946 — validada em `tests/convergence.test.js`).
- **Pontos:** cada convergence rende **~×1.5 a anterior** → expoente derivado α = ln1.5/ln1.3 ≈ **1.55**; fórmula candidata `pontos = 400 × (nível/276)^1.55` (P5.2 valida no sim). Empurrar 1 grupo além do gate ≈ ×2.1 pontos (mata o F2).
- Legibilidade (a queixa do dono com o sistema antigo): UI mostra UM número — "Próxima Convergence: nível Y".
- **P5 FECHADO ✅ (jul/2026), ciclo 10-80-10 completo:**
  - Implementação: gate escalonado + fórmula nova em `convergence.js` (weights/legacy{C,k}/gateLevel/levelTerm REMOVIDOS; multiplicadores de passiva e Legacy +8%/+8% intactos [P5.4 default]); UI "Next Convergence at Lv X"; política do sim = gate dinâmico (P5.5).
  - **O RELÓGIO FECHOU** — grade venceu com `baseXp 200` (28→200; xpCurveExp 1.62 INTACTO — não precisou reabrir): 1ª conv **38.7min** ✓ · First Light **17h43** (contrato 18h, −1.4%) ✓ · Okhra 19h37 · convergences G1:1/G2:3/G3:2/G4:3/G5:1/G6:2 ✓ · razão de pontos média 1.64 (picos ×2.1 empurrando) ✓ · desvio de grupo médio ~22% (era 206–570%).
  - Growth ×1.30 confirmado ótimo por medição (1.25→razão 1.51 grindy; 1.35→1.74 estoura banda).
  - Review adversarial: **zero bugs**; robustez cross-seed (seed 2: 38.9min/17h27, variância <1%); +`tests/convergence.test.js` (27 asserts).
  - **Decisão registrada (ratificar):** pós-cap — após a 12ª convergence o gate (6430) passa do teto de nível do mapa (6000); sem trava dura no código, inalcançável na prática. Recomendação: DEIXAR ABERTO — o Mapa 2 sobe o teto de nível e a 13ª convergence vira alcançável naturalmente (a escada atravessa mapas sem costura).
  - Sobras corretamente endereçadas: promoções lockstep no G3 → cadência de gear (P3-achado, política realista futura) · custos de passiva invalidados pela renda nova → **P6** · miolo carnudo nas re-subidas → Opção A por design.

**Pergunta central:** quando convergir vale a pena, e quanto pagar por empurrar mais fundo?

Decide: `gateLevel` (âncora natural: fim do G1 / entrada do G2) · fórmula com termo de ÁREA ativo (proposta: `pontos = levelTerm × (1 + areaBonus×(grupoMax−grupoDoGate))` — empurrar 1 grupo além ≈ +35–50%) · meta de convergences no mapa (era 8–12 com 9 áreas; com 18 revisar: 10–16?) · Legacy (+8%/+8% — manter? curva?) · o que acontece com `runMaxAreaIndex` na fórmula com grupos.
Insumos: PASSOS 1–2 (o gate é um beat do esqueleto) · achado F2 do sim (fórmula flat mata a decisão).
Valida: `sim gates` + `sim campaign` — 1º prestige no alvo do P0; empurrar +1 grupo rende visivelmente mais; meta de convergences bate.

## PASSO 6 — Passivas (o motor permanente) ✅ TRAVADO E IMPLEMENTADO (jul/2026)

**Direção travada pelo dono: MODELO SEQUENCIAL.** Em vez de 3 árvores paralelas: **Árvore I** (Mapa 1, 15 nós) → **Árvore II** (Mapa 2, versões amplificadas + poucas novas, custo ~×10, mais forte POR PONTO) → etc. Regra: cada árvore ≥ mais forte que a anterior. Racional medido: renda escalonada (×1.5/conv, até ~84K pts) exige sumidouro que escala; mesma arquitetura "evoluir, não adicionar" do gear (P4.2b). Identidade (combate/economia) vira RAMOS dentro da árvore. As 3 árvores paralelas atuais morrem.

### P6.1 — Topologia ✅ TRAVADO (jul/2026): **binária, abre-ao-comprar + coroa conquistável**
- Estrutura: 1 raiz → 2 → 4 → 8 folhas (=15). Comprar o pai (nível 1) ABRE os 2 filhos; maximizar é decisão de potência, não pedágio.
- Racional: a 1ª Convergence (~400 pts) compra raiz + entra no sustain NA MESMA VISITA — fecha o tutorial de prestige do P2.4.
- **"The Ring Closes"** (nó-coroa): ao acender as 8 folhas, completa GRÁTIS — bônus multiplicativo pequeno em tudo; conquista, não compra. Marco de "Árvore I completa" e gancho da Árvore II.
- Rejeitado: abre-ao-maxar (quebraria o beat da 1ª convergence).

### P6.2 — Roster da Árvore I ✅ TRAVADO (jul/2026): os 15 nós
- **Raiz:** First Spark (+ATK% e +HP% pequenos; barata — a 1ª convergence sempre compra).
- **D2 (a escolha de sustain):** Regeneration (%HP/s) ⟷ Heal on Kill (%HP/kill) — os exigidos pelo P2.4; a ordem é o build.
- **D3 Galho da PROVISÃO** (sob Regen): Vessel's Growth (HP%) · Hardened Light (DmgRed). **D3 Galho da CAÇA** (sob HoK): Whetted Light (ATK%) · Bare Instinct (Crit Rate).
- **D4 Provisão:** Prospector's Eye (Lumens%) · Pilgrim's Wisdom (XP%) · Deep Memory (+% Pontos de Convergence) · **Overkill Echo** (dano excedente do golpe fatal → Lumens extra; mecânica nova pequena).
- **D4 Caça:** Deepcrack (CritDmg) · **Lightbane** (dano vs acesos — o eliteDmg realocado, sinergia com Finds) · Quickened Pulse (AtkSpeed) · Harbinger's Bane (dano vs Marcos).
- **Copa:** The Ring Closes (grátis ao completar — P6.1).
- Magnitudes e custos: derivados no ciclo de implementação contra a renda real do P5 (400→84K pts; alvo "Árvore I completa ≈ fim do mapa").

### P6.3 — Banco, Second Wind e pós-cap ✅ TRAVADO (jul/2026)
- **Second Wind → ÁRVORE II (Mapa 2).** A regra "morte zera o contador" fica ABSOLUTA no Mapa 1 (onde ela educa); nós que dobram regras do mundo = a novidade característica das árvores futuras.
- **Banco (Golden Wake etc.) → candidatos registrados da Árvore II** — o banco é o embrião do design do Mapa 2.
- **Pós-cap da Convergence: ABERTO** (sem trava) — o Mapa 2 sobe o teto de nível e a 13ª convergence vira alcançável naturalmente; a escada atravessa mapas sem costura.

### P6 — implementação ✅ (ciclo 10-80-10 completo, jul/2026)
- **Custos:** `unlockByDepth [80, 120, 200, 350]` (nível 1 = abrir) · evolução `custo₁ × 0.4 × 1.5^(nível−1)` (evoFactor 0.4, evoRamp 1.5) · maxLevel 10. Árvore inteira maxada ≈ orçamento total do P5 (~84K pts).
- **Magnitudes (por nível):** First Spark ATK+HP 2%/2% · Regen 0.5%HP/s · HoK 2.5%/kill · Vessel 5% HP · Hardened 1.25% DmgRed · Whetted 5% ATK · Instinct 2.5% crit · Prospector 10% Lumens · Pilgrim 7.5% XP · Deep Memory 6% pts · Overkill Echo 12% (Lumens extra, cap = lumens base do mob) · Deepcrack 18% CritDmg · Lightbane 10% vs acesos/elite (não-boss) · Quickened 0.037 AtkSpeed · Harbinger's Bane 12% vs Marcos. Coroa: +18% mult ATK/HP/Lumens/XP (F4 resolvido: tudo em %, zero flats).
- **Código:** `passives.js` reescrito (árvore única, `nodes[15]` com parent explícito, `canBuy` = pai ≥1, `crownActive()` = 8 folhas) · save key **`eclats_v5`** (v4 ignorado, sem migração) · `awakenEfficiency`/`awakenReqReduction` removidos (voltam na Árvore II).
- **Validação (sim campaign, seeds 1 e 3):** 1ª conv 38.7m/39.4m ✓ · coroa na conv 8 (~10h22) ✓ · árvore 100% na conv 12 ✓ · First Light 18h10/18h27 (banda 15.3–20.7h) ✓ · Okhra ~21h.
- **Review adversarial (Sonnet):** 1 bug crítico corrigido (save com valor não-numérico em `tree1` virava NaN permanente e drenava pontos sem subir nível — sanitizado no load) + higiene (CSS órfão das 3 árvores, CLAUDE.md v5, regra v4→v5 no canon-check, +24 asserts de teste). Suíte 197/197 verde.

## PASSO 7 — Awaken / First Light (o exame final) ✅ TRAVADO E IMPLEMENTADO (jul/2026)

### P7.1 — Função ✅ TRAVADO (jul/2026): **RITO DE PASSAGEM (Modelo 1) + resquícios de despertar-de-sistema (Modelo 3)**
- **Um Awaken por mapa.** É a resposta de lore a "por que um Vessel fere um Nihelim?": não fere — até a luz que carrega despertar. O First Light é (a) a **CHAVE** que torna o Okhra ferível de verdade, (b) a **PONTE** estatística pro Mapa 2, (c) opcionalmente o evento que **acende o afixo de despertar do gear** (amarra a arquitetura despertar-em-estágios do P4 — "resquício do Modelo 3", forma exata decidida no P7.4).
- Arco travado (Opção A da abertura do P7): coroa acesa → desperta ~18h → com luz desperta, mata o Okhra ~21h.
- Referências: Apotheosis do Gaiadon (evento raro no topo da pilha de prestiges) · Bankai (Bleach) · re-despertar (Solo Leveling).
- Rejeitado: cadeia de 3–4 awakens por mapa (dilui — marcos intermediários já são Harbingers + coroa).
- **Nota do dono (fora de escopo por ora):** repensar depois um sistema tipo o antigo Ascension com **Mémoires** — 1 por mapa, conta a história do mundo e dá bônus poderosos. Não desenhar agora.

### P7.2 — Nome ✅ TRAVADO (jul/2026): **sistema "Awaken" + escada do amanhecer**
- Sistema mantém **Awaken** (autoexplicativo; rejeitado rebrand "Éveil" e nomes por-Nihelim).
- Escada (1 despertar por mapa — o jogador É o amanhecer em câmera lenta): **First Light** (M1, Okhra) → **Daybreak** (M2, Naameth) → *rascunhos ajustáveis quando cada mapa for desenhado:* Sunrise (M3) · Noontide (M4) · Zenith (M5) · Unsetting Sun (M6) → **Lumière** = o despertar FINAL (o título do jogo se revela como último degrau; alinhamento exato M7-Vhorel vs dimensão de Nihel decide-se com o design desses mapas).
- Colisões proibidas em nomes de despertar: Ember/Lumen/Corona (tags de raridade).
- Travado firme: esquema + First Light + Daybreak + Lumière-final. O miolo é rascunho.

### P7.3 — Requisitos ✅ TRAVADO (jul/2026): **as três provas**
- **O caminho:** alcançar a **área 18** (limiar do Okhra — embute 5 Harbingers mortos + nível 5145; requisito de nível cru REMOVIDO por redundância).
- **O anel:** **coroa acesa** (`crownActive()`) — substitui "12 convergences" cru (a coroa já prova ≥8 conv e é temática: o anel se fecha → a luz desperta → o Okhra cai).
- **A colheita:** **N × material First Light** (bosses G5+, drop 50%, sem garantia). N co-calibrado no P7.4 (chute inicial 3; hoje 1 = quase de graça).
- Rejeitado: formato numérico re-mapeado (não conta história) · parede de material pesada (viraria o grind que o dono vetou nos Harbingers).
- Timing transparente: a coroa acende ~10h22 — quem cronometra o despertar é a área 18 (~18–20h, banda do P0); se estourar, barateia-se a subida final, não as provas.

### P7.4 — Chave, gear e magnitude ✅ TRAVADO (jul/2026)
- **CHAVE = portão limpo:** sem First Light, o Okhra **não se manifesta** — o contador da área 18 mostra "*The tide stirs... but your light sleeps. Awaken the First Light.*" em vez de invocar o boss. A área 18 farma normal. Rejeitado: véu de dano ×0.05 (jogador AFK batendo em boss imortal sem entender = anti-legibilidade).
- **Resquício do Modelo 3:** os afixos de despertar do gear uncommon JÁ acendem na promoção (G2–G3, calibração do P5 rodou com eles — retro-amarrar quebraria o relógio). O resquício correto: **First Light é pré-requisito da promoção Uncommon→Rare do Mapa 2** (intenção registrada; implementa no Mapa 2). Cada mapa: o Awaken abre o próximo estágio do gear.
- **Magnitude:** ponto de partida ×2.5 ATK · ×1.5 HP · +25 Lumens (a banda do Okhra do P2.5 já foi travada COM esse bônus). Sim valida: First Light na banda 15.3–20.7h com as três provas · N de materiais (chute 3) não atrasa o rito · Okhra ~90 golpes. Estourou → ajusta N ou magnitude e re-valida.

### P7 — implementação ✅ (ciclo 10-80-10 completo, jul/2026)
- **Código:** `awaken.js` com prova de coroa data-driven (awakens futuros usam qualquer subconjunto de area/level/kills/convergences/crown/materials) · portão do Okhra em `combat.spawn` (só a última área; threshold continua contando, boss vem no ciclo seguinte ao despertar; `mapOneCleared` intacto) · aviso do portão + prova da coroa na UI · instrumentação de HTK/duração do Okhra no sim.
- **Calibração:** `xpMultByGroup [1,1,1,1,2.5,3.0]` (novo botão em balance, lido no único ponto de concessão de XP — repõe nos G5–G6 o boost que o awaken antigo dava à subida final) · Okhra `hpMult 10.74 → 48`.
- **Validação (seeds 1/3/5, o 5 virgem):** First Light **17h40 / 17h57 / 17h49** (banda 15.3–20.7h) · Okhra **98 / 82 / 84 golpes** (banda 80–100) em 47–56s, sem loop de morte · 1ª conv 38.7–39.9min · coroa conv 8 · convergences por grupo NÃO deslocadas · material 3× com ~4h de folga (nunca gargalo) · mapa completo 17h44–18h02.
- **Review adversarial (Sonnet): APROVADO, zero bugs críticos/altos.** Verificou off-by-one da prova de área (correto: `maxAreaUnlocked` sobrevive à Convergence — a prova não des-cumpre), caminho único de XP online/offline (sem divergência), portão só na última área, log "Map 1 complete" único. Provou experimentalmente que o `xpMultByGroup` é a lever real (removê-lo devolve First Light a 23h26). Menores corrigidos no fechamento: `try/finally` no monkeypatch do sim; ENGINE.md (seção Awaken atualizada + banner HISTÓRICO no resto).
- Suíte 208/208 verde · canon-check exit 0.
Insumos: PASSOS 1–6.
Valida: `sim campaign` — First Light dentro do orçamento total do P0; Okhra viável só pós-Awaken; poder pós-Awaken vs HP hipotético do início do Mapa 2.

## PASSO 8 — Encontros especiais (a textura) ✅ TRAVADO E IMPLEMENTADO (jul/2026)

**Pergunta central:** o que quebra a monotonia do grind, e com que frequência?

### P8.1 — Rarity Find ✅ TRAVADO (jul/2026): **Marco abre o teto, gear enche em degraus, a UI conta a história**
- **Teto por Marco (permanente, 1ª morte de cada Harbinger, sobrevive à Convergence):** cada um levanta os caps em 1/6 — Ember +5% · Lumen +2.5% · Corona +0.83%. Após os 6: **30/15/5** (caps máximos da spec mantidos). Temático: cada ladrão de luz que cai devolve luz ao mundo. Dá alvo cedo pro Lightbane (G2+).
- **ATUALIZA a spec `RARITY_FIND.md`:** "passiva levanta o teto" morreu com o roster travado do P6 (sem nós de rarity na Árvore I) — o teto agora é dos Marcos. Nós de rarity cap = candidatos à Árvore II.
- **Gear enche em DEGRAUS (decisão do dono, precedente da capa/P2.2):** afixos sobem a cada **50 níveis** de gear, teto = cap global. Ordem de grandeza (sim calibra): Ember Trail +0.5%/degrau · Second Sight +0.25% · Corona Call ~+0.085% — gear realista no fim do mapa enche os tetos; meio do mapa ≈ metade. Legibilidade: o degrau é visível na ficha.
- **Onboarding = 4 toques nos momentos (sem tutorial):** log destacado na 1ª morte de cada Marco ("The stolen light disperses... Ember cap +5%") · painel Lights com **chance / teto** por tier (ensina as duas alavancas) · log no 1º spawn de cada tier · tooltip do afixo com "next step: +X% at Lv N".
- Recompensas dos acesos ~×3/×6/×10 (espelham o poder) — sim valida contra a economia do P3 na implementação.
- Rejeitado: unlock único via coroa/First Light (tarde demais) · tetos fixos desde o início (teto invisível, perde a dupla alavanca) · perLevel liso 0.001 (invisível, nunca produz momento perceptível).

### P8.2 — Modificadores do Corona+ ✅ TRAVADO (jul/2026): **pool de 4, cada Corona rola exatamente 1**
- Regra: SÓ Corona tem modificador (Ember/Lumen = stats puros — cor = força, só o topo muda regras). Nome vira prefixo ("Lightshell Duskwolf") + linha de log no spawn.
- **Pool:** **Lightshell** (absorve N golpes do jogador — testa dano bruto) · **Quickened** (mob +40% atk speed — testa sustain) · **Siphoning** (cura-se de X% do dano causado — testa DPS/crit) · **Escorted** (chega com onda cheia de comuns — testa Siege Ward). Cada um pressiona um galho diferente da Árvore I — Corona = teste-relâmpago do build.
- Rejeitado: Enrage (redundante c/ Siphoning) · Splitting (caro + conflita com threshold) · Thorns (morte invisível offline, feels-bad).
- Magnitudes (N, %, +40%) = sim na implementação.
- **Gancho do dono (Árvore II):** os 4 modificadores viram alvos de COUNTER-PASSIVAS no Mapa 2 (ex.: quebra-escudo, anti-siphon) — registrado nos candidatos da Árvore II.

### P8.3 — Luta de Harbinger ✅ TRAVADO (jul/2026): **assinatura fixa por Marco**
- Cada Harbinger carrega UM modificador fixo do pool do P8.2 — o jogador enfrenta a mecânica no Marco ANTES de vê-la nos Coronas (o cap abre na morte dele: a luz roubada se dispersa e reaparece nos Coronas). O Harbinger é o tutorial encarnado do modificador.
- Escada: H1 **Lightshell** · H2 **Escorted** · H3 **Siphoning** · H4 **Quickened** · H5 e H6 **pares** (quais exatamente = sim na implementação; ensaio geral pro Okhra).
- Threshold/HP/dano/loot: inalterados (P2.5/P3). Custo no motor ≈ zero além do P8.2 (mesma maquinaria, fixa em vez de rolada).
- Rejeitado: fases de HP (sistema novo, textura quase invisível em combate automático) · manter número puro (6 Marcos mecanicamente idênticos, e o pool do P8.2 sem palco de apresentação).

### P8.4 — Luta do Okhra ✅ TRAVADO (jul/2026): **a Maré + o finale encenado (emenda do dono)**
- **Descoberta no travamento:** o código tinha só 5 Harbingers (idx 2,5,8,11,14) — o slot da área 18 era o Okhra direto. O diagrama (H6+Okhra) e o 1/6 dos caps (P8.1) exigiam um 6º Marco. A emenda do dono resolve: **a área 18 ganha o H6**, e matá-lo **invoca o Okhra em cena** (o background do palco muda pra assinatura visual dele — classe CSS agora, arte na fase de design).
- **Sequência do finale:** threshold 55 → **H6** (par de assinaturas, ensaio geral; a morte fecha os caps 6/6) → **invocação**: com First Light → Okhra manifesta (cenário muda); sem → a invocação falha com a mensagem do portão do P7. Despertou depois: próximo threshold invoca Okhra direto (H6 não re-luta).
- **EMENDA AO P7.4 (dono, jul/2026):** o portão desliza de "boss da área 18" pro **estágio do Okhra** — H6 fica livre pré-despertar. Semântica "Okhra só com luz desperta" intacta.
- **A luta:** **The Tide Rises** — escolta re-invocada a cada ~10s (a maré sobe; única mecânica exclusiva do jogo) + assinatura **Siphoning** (o Starving devora). Pergunta final do mapa: seu dano supera a fome dele?
- Sim valida na implementação: banda 60–120 golpes com a maré ativa · sem loop de morte no poder esperado · intervalo da maré ajustado pra ~4–5 subidas por luta.
- Rejeitado: 3 modificadores do pool (boss final viraria "um Corona maior") · stats puros (anticlímax).

### P8 — implementação ✅ (ciclo 10-80-10 em 2 partes, jul/2026)
- **Parte 1 (Rarity Find):** rarityTiers ×3/×6/×10 (hp/atk/reward) · roll Corona→Lumen→Ember `min(find, cap)` · caps +1/6 por 1ª morte de Marco (`harbingersFelled`, permanente) · afixos em degraus (perStep 0.5/0.25/0.085, step 50, cap 30/15/5) · painel Lights + 4 toques de onboarding · **sistema antigo rareMobs/eliteMob morto** (mortes na campanha 64→12; relógio adiantou ~1h, na banda). Frequência medida: G1 Ember 2.25% → G6 Ember 6.3%/Lumen 4.6%/Corona 1.2%.
- **Parte 2 (modificadores + finale):** `G.data.modifiers` (Lightshell N3/8boss · Quickened ÷1.4 · Siphoning 50% · Escorted onda cheia+1 cap 4) · Corona rola exatamente 1 · assinaturas H1 Lightshell / H2 Escorted / H3 Siphoning / H4 Quickened / H5 Lightshell+Quickened / H6 Siphoning+Escorted (regra medida: Quickened nunca pareia com Escorted/Siphoning — evita loop de morte) · área 18 = 2 estágios (boss **H6 novo**, PLACEHOLDER lore + mapBoss Okhra) · finale nos 3 caminhos (sem awaken / com / despertar depois) · **The Tide Rises** (escolta a cada 10s, ~5 subidas/luta) · palco `.okhra-manifest`.
- **Validação (seeds 1/3/7, o 7 virgem):** 1ª conv 35.9–36.4min · coroa conv 8 · First Light 16h56–17h09 · **Okhra 83–90 golpes COM a maré** (48–52s) · mapa completo 17h01–17h13 · **0 mortes na área 18**.
- **Review adversarial (Sonnet): APROVADO.** 1 bug ALTO achado+corrigido: converge com o jogo pausado no meio da luta do Okhra deixava o palco/maré presos sobre a Área 1 (`converge()` agora limpa `_okhraManifest`/tide/classe). Baixos registrados sem correção: reload no meio do finale re-exige threshold (padrão pré-existente de todo Marco) · siphoning boss=mob 0.5 (placeholder de balance, inerte em boss por escala) · escoltas podem rolar raridade (filosofia "mesma maquinaria", aceito).
- Suíte **278/278** · canon 0 drift.

**→ P8 ✅ — A ESCADA P0–P8 INTEIRA ESTÁ TRAVADA E IMPLEMENTADA. O balance do Mapa 1 deixou de ser gargalo; próximo = playtest humano + fase de design (mapas, mobs, UI).**
Insumos: PASSOS 4–7.
Valida: `sim baseline/campaign` com rarity find — frequência de acesos por grupo; recompensa vs orçamento do P3; âncoras do relógio intactas.

---

## Regras do processo
1. **Um passo por vez.** Discutir o passo N+1 antes de travar o N = anotar e voltar.
2. **Travar = número + sim + registro aqui.** Cada passo travado ganha seção "✅ TRAVADO" com os valores e o comando de sim que os validou.
3. **`data.js` só muda depois do ✅.** O sim aceita override em memória pra testar candidatos.
4. **Decisão travada não reabre** sem número novo do sim (mesma disciplina da lore).

## Log de decisões travadas
- **jul/2026 — PASSO 8 (Encontros):** Rarity Find (Marco abre teto 1/6, gear enche em degraus 50, ×3/×6/×10) · pool de 4 modificadores (só Corona, 1 de 4) · assinatura fixa por Marco (pares no H5/H6) · finale encenado (H6 novo invoca Okhra + The Tide Rises 10s) · sistema antigo de raros/elites morto · mapa completo 17h01–17h13 (seeds 1/3/7).
- **jul/2026 — PASSO 7 (Awaken):** rito de passagem 1/mapa (chave anti-Nihelim + ponte) · escada do amanhecer (First Light → … → Lumière) · três provas (área 18 + coroa + 3 materiais) · portão limpo do Okhra · xpMultByGroup [1,1,1,1,2.5,3.0] · Okhra hpMult 48 · First Light ~17h49, Okhra 82–98 golpes (seeds 1/3/5).
- **jul/2026 — PASSO 6 (Passivas):** Árvore I sequencial, 15 nós binários abre-ao-comprar, coroa conquistável · custos [80/120/200/350] + evo 0.4×1.5^n · tudo em % (F4 fechado) · save v5 · implementado+revisado, âncoras batidas em 2 seeds.
- **jul/2026 — PASSO 0 (Relógio):** 18h ativas · sessão 30–50min c/ regra do beat · ~50/50 ativo/idle · 1º prestige 25–40min.
- **jul/2026 — P2.5 (threshold/boss):** threshold 25+5×grupo · mults derivados das bandas HTK (Harbinger ~30 golpes/dano ×2 · Okhra ~90/×2.5).
- **jul/2026 — P2.4 (dano/ondas/morte):** custo de onda 10–20%/35–50% · ondas 1/2/2/3/3/3 · morte só zera contador · **sustain 100% via passivas** (heal-on-kill e regen%/s tier 1; sem regen grátis) — a 1ª parede força a 1ª Convergence.
- **jul/2026 — P2.3 (curvas HP):** C3 híbrido Gaiadon — entrada de grupo 8–12 golpes (parede/sinal de converge; emenda ao P2.1), crescendo 5→7 dentro do grupo até o Harbinger.
- **jul/2026 — P2.2 (freio F3):** A+C — expoentes domados (custo de gear mais íngreme + tetos nos bônus de income) e materiais como segunda parede (padrão Gaiadon).
- **jul/2026 — P2.1 (TTK-alvo):** Opção A em golpes — entrada 4–7 · fim 1–2 · Harbinger 20–40 · Okhra 60–120 · Tema B +1–2.
- **jul/2026 — PASSO 1 (Esqueleto):** cap 6000 · 18 faixas (×1.15) · orçamento G1→G6 = 1.0/1.6/2.4/3.2/4.2/5.6h · unlock por nível dentro do grupo, Harbinger na fronteira · implementado e validado estruturalmente (tempos = contrato do P2).
