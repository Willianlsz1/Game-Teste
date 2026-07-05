# HANDOFF — estado vivo do projeto entre sessões

> **Leia isto ANTES de qualquer trabalho.** Atualizado ao fim de cada sessão (`/handoff`).
> Regra: este doc diz ONDE o trabalho parou e O QUE está travado — não re-derive nem re-litigue.
> Última atualização: **2026-07-05** (passagem de bastão Fable→Opus a 98% do limite; estudo de campo do Gaiadon STEAM completo; ícones die-cut instalados).

---

## Onde o trabalho está AGORA

**🎓 ESTUDO DE CAMPO GAIADON STEAM ✅ COMPLETO (jul/05) — 3 fases, tudo no cofre `C:\Users\KABUM\Desktop\gaiadon_backup_20260705\`:**
- **Cofre**: backup SHA256-verificado do save de endgame do dono (155 arquivos) + mineração (`mining\REPORT.md`, 4 CSVs limpos + diffs) + `OBSERVATORY_F1.md` (endgame ao vivo) + `EARLYGAME_F2.md` (run cronometrada reset→1º prestige, 64min).
- **Fórmulas medidas** (não teoria): custo de gear = `(base + slope·N)·r^N` (linear early +0.73K/nível uniforme entre slots; exponencial late r≈1.0014) · stats de gear lineares (+15 ATK/+1% por nível, arma) · stat total = cadeia de 6 fatores multiplicativos (t0 flat × (1+t1%) × t2 mult × (1+t3%) × (1+t4%) × (1+t5%), verificado 3 dígitos vs tela) · mob trackeia player com clamp no teto da área · morte custa ~25% do gold líquido · Ascension: Lv150+10M gold (Oferenda!), zera gold+levels, MANTÉM gear (~82% do poder atravessa), dobra stats-base/level por rito (geométrico), escada 150/300/590/1000/1500, 1º rito revela sistema novo (Pets).
- **Valida nossas decisões travadas**: P1 clamp, P2b spike de entrada, P7 backtrack, P8 Oferenda, escada multiplicativa de gates, gate de materiais na promoção (4 mats + 2B gold + peça no cap), "o prêmio é a revelação".
- **⏳ PENDENTE 1 — RESTAURAR O SAVE DO DONO** (ele decide quando): fechar o jogo ANTES (salva ao sair) → desligar Steam Cloud do Gaiadon (Properties→General) se ainda on → copiar `cofre\savedir\*` de volta para `%APPDATA%\Godot\app_userdata\Gaiadon- Eternal Quest\` → abrir e conferir. O jogo está num save de estudo (Asc 1).
- **✅ SÍNTESE FEITA (jul/05)**: `docs/design/GAIADON_STEAM_PLAYTEST.md` — fórmulas F1–F7 medidas (agregação de stat, custo de gear, poder por nível, inimigo, economia/morte, prestige, relógio), ancoradas no `COMO_BALANCEAR.md` seção a seção. **⏳ Resta o FIT no sim**: candidata nº1 custo de gear quadrático → `(base+slope·N)·r^N` (estrutura `gearCostBase/Linear/Exp` já existe — é fit, não refactor); candidata nº2 (decisão do dono) imposto de morte ~25% dos Lumens líquidos. Regra da casa: número só com sim.

**🎨 UI — ÍCONES DA TOOLBAR (jul/05): leva 2 die-cut INSTALADA.** 6 ícones 512px transparentes em `assets/ui/icon_*.png` (backup dos antigos em `assets/ui/_icons_baked_backup/`), settings wired no index.html, chip CSS atualizado (`components.css`: ico-img 82% + drop-shadow + hover scale). Gear teve xadrez baked removido via Python (script no scratchpad). Verificado in-game via Chrome MCP. **Aguardando veredito do dono**: awaken/settings leem como "borrão" a 54px — se incomodar, regerar só esses 2 como FORMA SÓLIDA (disco-sol / 2 engrenagens; kit de prompt na conversa de jul/05). Fila do dono (LAUNCH_ITCHIO §Fila de UI): 2) passivas PARA DENTRO da Convergence (ele sinaliza quando) · 3) posição mobs/Seeker.

**⚙️ LIÇÕES DE PROCESSO (jul/05, custaram tokens — não repetir):**
- **Subagentes RECUSAM controle de desktop/jogo longo** (3 recusas seguidas, corretas: consentimento não sobrevive a delegação). Computer-use de jogo = SESSÃO PRINCIPAL, rajadas curtas, transcrever números pra disco imediatamente.
- **Sonnet re-delega em corrente** se o briefing não proibir: 1ª linha do prompt de todo executor = "NÃO use a ferramenta Agent".
- **Export Stats do Gaiadon abre diálogo NATIVO do Windows** — cliques cegos cancelam sem feedback; screenshot antes de assumir sucesso.
- Botões x10/x100 do Gaiadon: cliques rápidos demais não registram no UI do Godot (0.4s+ entre cliques).

**🔨 TRACK ATIVO (jul/05): MODELO DE INIMIGO GAIADON** — spec
`docs/design/GAIADON_ENEMY_MODEL.md` (decisão P10 no DECISOES_DONO). O dono
jogou a fatia inicial, o "mob congelado Lv 1" incomodou, e a Gaiadon math
mostrou o caminho: o nível do mob ACOMPANHA o jogador dentro da banda da área
(`clamp(player, area.min, area.max)`) + stats pela fórmula `(nível/x)^y` com
gap de expoente = a parede. Revisa a IMPLEMENTAÇÃO do P1 (não o espírito) e
SUPERA o P2b. Multi-sessão: Fase 1 estrutura (Opus) → Fase 2 re-fit (Opus fita,
Sonnet roda) → review → bake. **O tune de começo (gate área2=80 + hook de
economia) foi PAUSADO e absorvido pela Fase 2 deste modelo** (agente
a48a87124a3411bba parado; progresso no transcript). O jogo COMMITADO (0e2ce51 +
o fit anterior) segue jogável com o modelo antigo até este re-fit bakear.

**Trilha de LANÇAMENTO (L1–L6 commitadas; L4 lore pendente):** intacta, roda em
paralelo — é UI, não colide com o modelo de inimigo. Ver `LAUNCH_ITCHIO.md`.

---


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
- Baseline sem prestige TRAVA em **G2** por design (ratificado pelo dono
  jul/04 pós-fit; supera o "G4" do paradigma velho — mid-map exige prestige,
  e todo jogador real converge aos ~44min).

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

-1. **Bug menor de infra:** `node tools/sim.js campaign` retorna exit code
   255 com output válido (achado do crítico jul/04) — investigar antes de
   qualquer gate de CI que cheque exit code.

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
2. **TRILHA DE LANÇAMENTO ITCH.IO (jul/04, dono) — SPEC:
   `docs/design/LAUNCH_ITCHIO.md`** (absorve a antiga "fase de UI"). Fases:
   L1 menu/settings/export-import (EM EXECUÇÃO, agente Sonnet) → L2
   revelação progressiva das HUDs (tabela de gatilhos ✅ aprovada) → L3
   onboarding primeiros minutos → L4 lore in-game (cartões de área + ritos +
   Harbingers ✅; SÓ depois do fit bakear — data.js) → L5 empacotamento
   itch. Itens antigos da fase de UI (tooltip v2, Forja vende promoção,
   onboarding do Awaken, Corona invisível, contador de material) entram no
   L2/L3/L4 correspondente.
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
- **Docs de design vivos:** `COMO_BALANCEAR.md` (**o MÉTODO de decisão de
  balance — ler quando o dono pedir "como balancear X" ou abrir sistema
  novo**) · `P9_REBALANCE.md` (trilha + pauta rodada 4) ·
  `GAIADON_NUMBERS.md` (referência do gênero, §5b–5e mineração completa) ·
  `GEAR_BONUS_CATALOG.md` · `MOB_MECHANICS_CATALOG.md` · `CONTEXT.md`
  (glossário canônico).
