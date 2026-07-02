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
Valida: `sim baseline` — nível médio do gear por grupo segue o plano; promoções acontecem nos grupos planejados.

## PASSO 5 — Convergence (o loop de prestige) — P5.1/P5.3 ✅ TRAVADOS (jul/2026)

**P5.1+P5.3 (decisão do dono — "converge em X nível; cada convergence sobe o requisito e rende mais pontos; nem poucas nem muitas"):**
- **Gate escalonado:** `gate₁ = 276 (fim do G1) · gateₙ₊₁ = gateₙ × 1.30` → **~12 convergences** até o cap 6000, espalhadas pelos grupos POR CONSTRUÇÃO (escada: 276·359·466·606·788·1024·1332·1731·2251·2926·3803·4944).
- **Pontos:** cada convergence rende **~×1.5 a anterior** → expoente derivado α = ln1.5/ln1.3 ≈ **1.55**; fórmula candidata `pontos = 400 × (nível/276)^1.55` (P5.2 valida no sim). Empurrar 1 grupo além do gate ≈ ×2.1 pontos (mata o F2).
- Legibilidade (a queixa do dono com o sistema antigo): UI mostra UM número — "Próxima Convergence: nível Y".
- P5.2 (fórmula no sim) e P5.4 (Legacy) e P5.5 (política realista do sim): em andamento.

**Pergunta central:** quando convergir vale a pena, e quanto pagar por empurrar mais fundo?

Decide: `gateLevel` (âncora natural: fim do G1 / entrada do G2) · fórmula com termo de ÁREA ativo (proposta: `pontos = levelTerm × (1 + areaBonus×(grupoMax−grupoDoGate))` — empurrar 1 grupo além ≈ +35–50%) · meta de convergences no mapa (era 8–12 com 9 áreas; com 18 revisar: 10–16?) · Legacy (+8%/+8% — manter? curva?) · o que acontece com `runMaxAreaIndex` na fórmula com grupos.
Insumos: PASSOS 1–2 (o gate é um beat do esqueleto) · achado F2 do sim (fórmula flat mata a decisão).
Valida: `sim gates` + `sim campaign` — 1º prestige no alvo do P0; empurrar +1 grupo rende visivelmente mais; meta de convergences bate.

## PASSO 6 — Passivas (o motor permanente) ⬜

**Pergunta central:** quanto poder permanente o Mapa 1 inteiro deve render, e em que ordem o jogador o compra?

Decide: orçamento total de pontos do mapa (= convergences × pontos médios, sai do P5) · custo dos tiers re-calibrado pra esse orçamento (intenção: tier 1 de UMA árvore ≈ o mapa inteiro? ou mais?) · **UNIT re-derivado da escala real** (achado F4: flats mortos — converter pra % ou escalar) · elenco final dos nós (crit stack ×3 → ×2? atkSpeed node? nós de custo de gear na Fracture? `miniBossThreshold` adiado?) · orçamento de poder por tier (T1 ≈ ×2–3 no eixo · T2 especializado · T3 = Mapa 2).
Insumos: PASSO 5 travado (renda define custo).
Valida: `sim campaign` — % da árvore comprada ao fim do mapa bate a intenção; nenhum nó morto; poder das passivas ≈ fatia planejada do total.

## PASSO 7 — Awaken / First Light (o exame final) ⬜

**Pergunta central:** o que o First Light exige (o "diploma" do Mapa 1) e quanto poder dá (a ponte pro Mapa 2)?

Decide: requisitos re-mapeados (área 18 · nível ~cap do mapa · convergences = meta do P5 · materiais = cadência do P3) · magnitude do bônus (hoje ×2.5/×1.5 placeholder) dimensionada pra "Área 1 do Mapa 2 farmável na chegada, sem trivializar".
Insumos: PASSOS 1–6.
Valida: `sim campaign` — First Light cai dentro do orçamento total do P0; poder pós-Awaken vs HP hipotético do início do Mapa 2.

## PASSO 8 — Encontros especiais (a textura) ⬜

**Pergunta central:** o que quebra a monotonia do grind, e com que frequência?

Decide: **Rarity Find entra** (spec pronta em `RARITY_FIND.md`: base 0%, gear acha, passiva sobe teto — precisa dos afixos/nós novos do P4/P6) · menu de modificadores do Corona+ e dos Marcos (pesquisar e listar) · design da luta de Harbinger (escolta, threshold, recompensa especial?) · luta do Okhra.
Insumos: PASSOS 4–6 (onde os afixos/nós de rarity moram).
Valida: `sim baseline` com rarity find — frequência de Ember/Lumen/Corona por grupo; recompensa de Harbinger vs orçamento do P3.

---

## Regras do processo
1. **Um passo por vez.** Discutir o passo N+1 antes de travar o N = anotar e voltar.
2. **Travar = número + sim + registro aqui.** Cada passo travado ganha seção "✅ TRAVADO" com os valores e o comando de sim que os validou.
3. **`data.js` só muda depois do ✅.** O sim aceita override em memória pra testar candidatos.
4. **Decisão travada não reabre** sem número novo do sim (mesma disciplina da lore).

## Log de decisões travadas
- **jul/2026 — PASSO 0 (Relógio):** 18h ativas · sessão 30–50min c/ regra do beat · ~50/50 ativo/idle · 1º prestige 25–40min.
- **jul/2026 — P2.5 (threshold/boss):** threshold 25+5×grupo · mults derivados das bandas HTK (Harbinger ~30 golpes/dano ×2 · Okhra ~90/×2.5).
- **jul/2026 — P2.4 (dano/ondas/morte):** custo de onda 10–20%/35–50% · ondas 1/2/2/3/3/3 · morte só zera contador · **sustain 100% via passivas** (heal-on-kill e regen%/s tier 1; sem regen grátis) — a 1ª parede força a 1ª Convergence.
- **jul/2026 — P2.3 (curvas HP):** C3 híbrido Gaiadon — entrada de grupo 8–12 golpes (parede/sinal de converge; emenda ao P2.1), crescendo 5→7 dentro do grupo até o Harbinger.
- **jul/2026 — P2.2 (freio F3):** A+C — expoentes domados (custo de gear mais íngreme + tetos nos bônus de income) e materiais como segunda parede (padrão Gaiadon).
- **jul/2026 — P2.1 (TTK-alvo):** Opção A em golpes — entrada 4–7 · fim 1–2 · Harbinger 20–40 · Okhra 60–120 · Tema B +1–2.
- **jul/2026 — PASSO 1 (Esqueleto):** cap 6000 · 18 faixas (×1.15) · orçamento G1→G6 = 1.0/1.6/2.4/3.2/4.2/5.6h · unlock por nível dentro do grupo, Harbinger na fronteira · implementado e validado estruturalmente (tempos = contrato do P2).
