# HANDOFF — estado vivo do projeto entre sessões

> **Leia isto ANTES de qualquer trabalho.** Atualizado ao fim de cada sessão (`/handoff`).
> Regra: este doc diz ONDE o trabalho parou e O QUE está travado — não re-derive nem re-litigue.
> Última atualização: **2026-07-04** (sessão 2 do dia: GRILL DO GAIADON completo — todos os sistemas de balance com decisão do dono; pauta da rodada 4 fechada; mineração completa do Gaiadon preservada nos docs).

---

## Onde o trabalho está AGORA

**✅ SESSÃO jul/04 (noite) — ESTRUTURA DO PARADIGMA P1–P9 COMMITADA.**
Ciclo completo: Opus implementou → Sonnet reprovou (bloqueante gate nv 81)
→ dono corrigiu P9 (porta dupla) → Opus consertou → Sonnet re-aprovou →
orquestrador revisou e commitou. Estado:

- **No código (com dials provisórios):** P1 mob=área (`mobLevelFor`) · P2 cap
  atk speed 15 global · P2b TTK entrada>saída confirmado · P3 Lumens curva
  própria (`lumensBaseFor`, accel G6) · P4 curva nua ok · P5 rewardMult por
  tier (Ember 3×/Lumen 6×/Corona 13× do hpMult) · P6 gear custo quadrático ·
  P7 backtrack (ref = TOPO da banda, floor 2%, invisível) · P8 Oferenda
  (`requirements.lumens`, UI "Offering") · P9 porta dupla (`levelGateByArea`,
  porta área 2 = 22; era 81). Tests 6/6 · campaign 3 seeds 17–25h ponta a
  ponta · baseline G1 0.67h.
- **PRÓXIMA FASE = O FIT ÚNICO** (tools/p9, medindo TTK, sem gate de relógio),
  matando os pendentes medidos: serrote XP ×81 na fronteira 1→2 (candidato:
  `mobLevelByArea` rampando) · baseline no-prestige trava no G2 (canon = G4)
  · Okhra 206–220 golpes (banda 60–120) · G2 ~5–6h · Oferenda 5e11 chutada ·
  tabelas mid-map provisórias (calibrate 1-run suavizado; salto do Porto ~×10
  vs canon ~×300). Roteamento do dono: Opus julga o fit, Sonnet roda batches.



**SESSÃO jul/04 (tarde) — `/grill-with-docs` do Gaiadon ✅ COMPLETO.** O dono
percorreu TODOS os sistemas (wall, mobs, gear, passivas, awaken, drops,
pacing) contra o `GAIADON_NUMBERS.md` e o v8. Resultado: **nada implementado,
nenhum número travado** (regra da casa), mas a **pauta da rodada 4 está
fechada e escrita** — ver `docs/design/P9_REBALANCE.md` §4 (itens "RODADA 4"
e "FASE DE UI") + os DOIS CATÁLOGOS NOVOS:

- `docs/design/GEAR_BONUS_CATALOG.md` — cardápio de afixos (12 atuais + 9
  candidatos + descartes justificados) · §2b–2d = decisões do dono: afixos
  novos Twice-Gilded (Lumens 2×, Cloak), Hollowing Light (enemy −HP%,
  Helmet), Fortune's Torrent (Lumens 4×, assinatura do Cloak no lugar do
  Corona Call) · **promoção em DOIS materiais no Mapa 1** (comum=massa +
  incomum=chave; regra `N→N+1 consome mat(N)+mat(N+1)`).
- `docs/design/MOB_MECHANICS_CATALOG.md` — princípio **tranca-e-chave**
  (mecânica de mob e passiva nascem em pares): 7 trancas (4 existentes + 3
  novas do dono: Duelist=golpe pesado X%, Frenzied=enfurece <35% HP,
  Veiled=esquiva X%), só 4 chaves novas (Duelist→DR e Frenzied→Executioner
  usam peças JÁ PAGAS). Faseamento: trancas novas = Mapa 2/Árvore II;
  **Lightshell fica SEM chave no Mapa 1 de propósito** (fricção que vende a
  Árvore II).

**Decisões maiores do grill (todas com spec no P9 §4, números só com sim):**
1. **Onda de mobs 4–5 no fim do mapa** (packByGroup era teto-de-UI 3).
2. **Árvore I fecha 100% até a área 18** (era 66%); pontos excedentes
   acumulam como banco pro Tier II. Estrutura travada: 16/16 nós mantidos,
   maxLevel 10 uniforme, forma de custo mantida (nó ≈ 85× unlock), fit mexe
   só na escala. Golden Wake UNIT 1.0→0.6 (orçamento com Twice-Gilded).
3. **First Light redesenhado** — piso de ATK/HP **maior que ×2.5 de
   propósito** (par fitado com o Okhra) + **The World Kindles: o tier CORONA
   É ELIMINADO do pré-awaken — o rito REVELA o Corona** (zero menção em UI
   antes!) + Light Remembers (re-subida começa no nível N) + Vessel of Dawn
   (shield pequeno; awakens futuros engordam) + Lumens flat removido.
   **Princípio travado: a escada de Awakens fortalece as MESMAS assinaturas
   a cada mapa** (glossário CONTEXT.md atualizado).
4. **UI:** tooltip de gear v2 (nome-lore, degrau honesto, preview do level
   up) · vender promoção = papel da FORJA (não do tooltip) · onboarding do
   Awaken · Corona invisível pré-awaken.

**Mineração do Gaiadon preservada em `GAIADON_NUMBERS.md §5b–5e`** (afixos
completos por slot/raridade, print endgame validando fórmulas, 37+36 skills,
drops de materiais: mob 5%/receita 2%/boss garantido — nossa economia está
na banda do gênero). Árvores extraídas ainda vivas no scratchpad da sessão
204810fa (caminho no §5b).

**⚠️ GUARDA DO RETUNE: o dono tem comentários sobre o relógio do Mapa 1
guardados — coletar ANTES de re-fitar qualquer número da rodada 4.**

**SESSÃO jul/04 (manhã) — três frentes fechadas:** P9 v8 BAKED (spec
`docs/design/P9_REBALANCE.md`: First Light ~36h±2, crit 44.5%, composição
gear+passivas 83–91%, re-subida ≤2.9) · tela de passivas completa 16/16 ·
reforma arquitetural em 5 lotes (combat/ui decompostos, sim byte-idêntico,
313 asserções). Detalhe no git log e no P9.

---

**FASE DE DESIGN — LORE DO PORTO ✅ TRAVADA (jul/03):** canon em
`docs/lore/mapa1_tema_b_porto_afundado.md` (+ §4c do `DECISOES_JUL26.md`).
Bestiário do Tema B parcialmente produzido (map2.png + medalhões + mobs do
Porto commitados jul/03-04); conferir o que resta antes de reabrir a fila de
arte. Regras da fase: 10-80-10 estrito · commits em lote · arte só aprova
in-game · prompts com alpha real/silhueta fechada/NO red.

**A ESCADA P0–P8(+P8.5b) COMPLETA; P9 substituiu o relógio (36h±2).** Onde
P0–P8.5b divergirem do `P9_REBALANCE.md`, o P9 vence. Histórico completo das
âncoras nas versões anteriores deste doc (git) e no P9 §5–§8.

## O que o simulador descobriu (fatos medidos — não re-descobrir)

`tools/sim.js` (headless, roda os módulos reais, RNG seedado) + harness
`tools/p9/` (gerador de família + fitter, v1→v8, versionado).
- **v8 (vigente):** FL 37h29–58 (3 seeds) · Okhra 71–95 golpes · coroa conv
  11 · re-subida ≤2.9 · composição ATK gear+passivas 83–91% · crit 44.5% ·
  mortes concentradas em entrada prematura · relógio do FL é MATERIAL-GATED
  (dial limpo).
- **F3 histórico** ("sem parede") resolvido pela família de expoentes com gap
  ~0.5 (lição central do Gaiadon §10) — a Wall é ESTRUTURAL.
- Baseline sem prestige TRAVA em G4 por design (meio-mapa exige Convergence).

## Decisões travadas (canon) — NÃO reabrir

- **Grill jul/04:** tudo listado acima + glossário `CONTEXT.md` atualizado
  (Wall estrutural · Convergence escada · Tier=Árvore I 16 nós · Power
  Sources por papel/fase · Awaken=escada que fortalece as mesmas assinaturas).
- **Lore/hierarquia (jul/2026):** `docs/lore/DECISOES_JUL26.md` — Vessels→
  Harbingers→Nihelim→Nihel; Okhra=Map1; 18 áreas; Harbinger a cada 3.
- **Tags de raridade:** Common · Ember (teal) · Lumen (azul) · Corona
  (violeta). ⚠️ ATUALIZAÇÃO grill jul/04: Corona só EXISTE pós-First Light.
- **Identidade Tema A** ("floresta que roubou a Lua") e **World Map em 2
  atos** — inalterados.
- **Método:** SPEC vs LOG · definition-of-done · sim antes de número · um
  sistema por vez · decisão travada não reabre sem número novo · 10-80-10.

## Pendências conhecidas (ordenadas)

0. **PRÓXIMO DA FILA (dono anunciou ao fechar o grill): definir as VARIÁVEIS
   do sim pra rodada 4** — traduzir a pauta do P9 §4 em dials/candidato
   (`tools/p9/`): árvore 100% área 18 · onda 4–5 · afixos novos (Twice-Gilded
   4%, Hollowing 5%, Fortune's Torrent ≤5%) · dois materiais na promoção ·
   First Light novo (piso >2.5 fitado com Okhra + Corona pós-awaken + caps
   Ember/Lumen re-derivados) · Golden Wake 0.6. **ANTES de rodar o fit:
   coletar os comentários de relógio do dono (guarda do retune).**
1. **Playtest rodada 3 do P9 (dono, v8 no jogo)** — roteiro de 6 perguntas
   montado no grill: 1ª Convergence aos ~40min chegou na hora? · promoção
   sentiu épica? · nó da árvore muda o TTK sentido? · onda de 3 sente vazia
   no G4–G6? · quando entendeu que 100k era a missão? · nós restantes da
   árvore pareciam alcançáveis? (Nota: rodada 3 valida o v8; a rodada 4 já
   tem pauta própria — não misturar.)
2. **Fase de UI (zero balance, pode rodar em paralelo):** tooltip de gear v2
   · Forja vende promoção (assinatura 🔒 + ×8 + N/50) · onboarding do Awaken
   · contador de material visível · Corona invisível pré-awaken · UI copy de
   fronteira (item antigo) · formatação % (feita no P9.6).
3. **P8.6 — reabrir balance pós-design:** escolta mecânica (diff pronto em
   `docs/balance/PATCH_P8.6_boss_last_mecanico.patch`) + Okhra invocando
   Harbingers (aprovado em conceito) — pode fundir com a rodada 4.
4. Arte do bestiário do Tema B (conferir o que resta) → renames/blurbs/
   rosters do data.js junto com cada lote.
5. Registrados sem desenhar: Mémoires (1/mapa) · Árvore II (Second Wind,
   Overcrit tier 2, Golden Wake bank, chaves do MOB_MECHANICS_CATALOG:
   Shatterlight, Piercing Light, Stanch, Purifying Flame, True Sight) ·
   mais TIPOS de material de promoção (partes por slot à la
   Gaiadon) · razão 30:1 pro pós-Convergence · promoção Uncommon→Rare exige
   First Light (P7.4).
6. Política do sim (P3): promoções em lockstep; persona a refinar se número
   depender.
7. Sweep de termos nos docs antigos (`node tools/check_canon.js` lista).
8. `/travar` formal dos 3 Harbingers titulares da floresta (arte já usa
   Hollow Cantor/Bramble King/Gilded Hollow).
9. Fila da lore: Séraphine + final/Convergence (Parte IX); depois Mapa 2.

## Infra & contexto operacional

- **Branch:** `main` direto (fase de design commita e pusha em main).
- **Sim:** `node tools/sim.js baseline|gates|campaign` + `tools/p9/` (ver
  CLAUDE.md). Canon-check: `node tools/check_canon.js`.
- **Pipeline de arte (jul/03):** dono gera → Downloads → agente otimiza e
  instala → valida via Chrome MCP → commit em lote (comandos no git log e
  nas versões anteriores deste doc).
- **Comandos de sessão** (`.claude/commands/`): `/retomar` · `/handoff` ·
  `/travar` · `/balance` · `/canon`.
- **Docs de design vivos:** `P9_REBALANCE.md` (trilha + pauta rodada 4) ·
  `GAIADON_NUMBERS.md` (referência do gênero, §5b–5e mineração completa) ·
  `GEAR_BONUS_CATALOG.md` · `MOB_MECHANICS_CATALOG.md` · `CONTEXT.md`
  (glossário canônico).
