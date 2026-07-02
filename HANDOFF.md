# HANDOFF — estado vivo do projeto entre sessões

> **Leia isto ANTES de qualquer trabalho.** Atualizado ao fim de cada sessão (`/handoff`).
> Regra: este doc diz ONDE o trabalho parou e O QUE está travado — não re-derive nem re-litigue.
> Última atualização: **2026-07-02** (sessão de balance framework + harness).

---

## Onde o trabalho está AGORA

**Trilha ativa: reconstrução do balance do Mapa 1** via `docs/design/BALANCE_FRAMEWORK_MAP1.md` (escada de 9 passos, um por vez, sim valida antes de travar).

- **PASSO 0 (Relógio): ✅** — 18h · 30–50min/beat · 50/50 · 1º prestige 25–40min.
- **PASSO 1 (Esqueleto): ✅ TRAVADO E IMPLEMENTADO** (ciclo 10-80-10: Opus implementou, Sonnet achou+corrigiu 1 bug de migração de save, Fable revisou) — 18 áreas no código, cap 6000, Harbinger por grupo, Okhra fecha o mapa. Tempos por grupo = contrato a cumprir no P2.
- **PASSOS 2–6: ✅ TODOS FECHADOS.** P2–P5: fricção calibrada · economia Gaiadon · matriz de gear · gate escalonado ×1.30. **P6 ✅ TRAVADO E IMPLEMENTADO** (Árvore I sequencial de 15 nós, coroa conquistável, save `eclats_v5`; ciclo 10-80-10 completo — review Sonnet achou+corrigiu 1 bug crítico de save NaN; âncoras validadas seeds 1 e 3: 1ª conv ~39min, coroa conv 8, árvore 100% conv 12, First Light 18h10–18h27). **Faltam só P7 (First Light re-mapeado) e P8 (Rarity Find + encontros).**
- **Modo de trabalho travado: 10-80-10** — 10% planejamento+pesquisa (Fable) · 80% implementação+review (Opus/Sonnet, nunca Haiku) · 10% review final (Fable).

## O que o simulador descobriu (fatos medidos — não re-descobrir)

`tools/sim.js` (headless, roda os módulos reais, RNG seedado). Achados com o tuning atual (9 áreas):
- **F1:** gate 351 = 1º prestige em **27min** ✓ (análise estática antiga errava 5× — afixos de XP compõem).
- **F2:** fórmula de pontos é **flat** — convergir no gate rende sempre C=400; empurrar 2× o nível = só +32%. Decisão de convergir é degenerada.
- **F3 (o mais grave):** **o jogo não tem parede após o min ~15** — TTK nas entradas de área: 0.8s/0.7s/0.1s. Causa: loop composto income×lumensBonus×gear. Consertar no Passo 2.
- **F4:** ~~passivas quase decorativas (flats mortos)~~ **RESOLVIDO no P6** — Árvore I toda em %, custos re-derivados da renda real do P5.
- **F5:** Map 1 (9 áreas) completo = **3h04m** ativas.

## Decisões travadas (canon) — NÃO reabrir

- **Lore/hierarquia (jul/2026):** `docs/lore/DECISOES_JUL26.md` — escada Vessels→Harbingers→Nihelim→Nihel; 7 Nihelim (Okhra=Map1); Map 1 = 18 áreas (Floresta+Porto), Harbinger a cada 3 áreas; tipos = bestiário; cores = assinaturas; Seeker de nome roubado; ranks da Ordre = escada de conhecimento. **Onde divergir de docs antigos, ele vence.**
- **Tags de raridade:** Common (sem tag) · Ember (teal) · Lumen (azul) · Corona (violeta). *(Ainda NÃO implementado em `src/data.js` — de propósito; código usa Kindled/Luminous/Radiant.)*
- **Método de trabalho:** SPEC vs LOG (auditoria = agir e apagar) · definition-of-done (código+spec+sim+CLAUDE.md) · sim antes de número · um sistema por vez · decisão travada não reabre sem número novo.

## Pendências conhecidas (ordenadas)

1. **P7 — Awaken/First Light EM TRAVAMENTO FATIADO**: P7.1 função ✅ (rito de passagem 1/mapa: CHAVE + PONTE + resquício de sistema) · P7.2 nome ✅ (Awaken + escada do amanhecer: First Light → Daybreak → … → Lumière) · P7.3 requisitos ✅ (três provas: área 18 + coroa acesa + N materiais). Na mesa: **P7.4** — magnitude via sim + forma da CHAVE + resquício do gear. Formato: 1 decisão por vez com o dono.
1b. **Registrado (dono, não desenhar agora):** repensar sistema tipo Ascension antigo com **Mémoires** — 1 por mapa, história do mundo + bônus poderosos.
2. **P8 — Encontros especiais**: Rarity Find (spec em `RARITY_FIND.md`) · modificadores Corona+/Marcos · luta Harbinger/Okhra.
3. **Registrados pra Árvore II (Mapa 2):** Second Wind · Golden Wake e o banco · awakenEfficiency/awakenReqReduction (removidos do código no P6) · pós-cap da convergence aberto de propósito.
4. **UI copy (do review):** `ui.js` mostra "Reach level X" pra áreas de fronteira (deveria indicar o Harbinger) — corrigir na fase de UI.
5. **Política do sim (registrado no P3):** promoções em lockstep no G2–G3; jogador realista espalharia — refinar a persona se algum número futuro depender disso.
6. **Import** do `mapa1_tema_b_porto_afundado.md` (criado fora do repo) + ajuste Nebulor→Okhra (área 17).
7. **Sweep de termos** nos docs (Archon→Nihelim etc.) — `node tools/check_canon.js` lista; exports consolidados (`GAME_CONTEXT`, `LORE_COMPLETE`) têm banner mas corpo antigo.
8. Escolher **quais 3 Harbingers** da floresta viram titulares de grupo (lore, sem pressa).
9. Fila da lore: **Séraphine + final/Convergence (Parte IX)** ← próximo item de lore; depois Mapa 2 (Naameth).
10. Renomes no código (Ember/Lumen/Corona etc.) — **só quando o balance mandar** (decisão: lore não entra no código ainda).

## Infra & contexto operacional

- **Branch:** `claude/eclats-lumiere-hierarchy-amsoqc` · **PR #24 aberto** (docs+tooling; sem CI no repo; pushes novos atualizam o PR). Sessão inscrita nos eventos do PR.
- **Sim:** `node tools/sim.js baseline|gates|campaign` (ver CLAUDE.md).
- **Canon-check:** `node tools/check_canon.js` (termos supersedidos nos docs).
- **Comandos de sessão** (`.claude/commands/`): `/retomar` · `/handoff` · `/travar` · `/balance` · `/canon` — ver seção Harness no CLAUDE.md.
