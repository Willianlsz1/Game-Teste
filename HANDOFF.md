# HANDOFF — estado vivo do projeto entre sessões

> **Leia isto ANTES de qualquer trabalho.** Atualizado ao fim de cada sessão (`/handoff`).
> Regra: este doc diz ONDE o trabalho parou e O QUE está travado — não re-derive nem re-litigue.
> Última atualização: **2026-07-02** (sessão de balance framework + harness).

---

## Onde o trabalho está AGORA

**Trilha ativa: reconstrução do balance do Mapa 1** via `docs/design/BALANCE_FRAMEWORK_MAP1.md` (escada de 9 passos, um por vez, sim valida antes de travar).

- **PASSO 0 (Relógio): ✅** — 18h · 30–50min/beat · 50/50 · 1º prestige 25–40min.
- **PASSO 1 (Esqueleto): ✅ TRAVADO E IMPLEMENTADO** (ciclo 10-80-10: Opus implementou, Sonnet achou+corrigiu 1 bug de migração de save, Fable revisou) — 18 áreas no código, cap 6000, Harbinger por grupo, Okhra fecha o mapa. Tempos por grupo = contrato a cumprir no P2.
- **PASSO 2 (Fricção): EM ANDAMENTO, FATIADO** — 2.1 TTK-alvo ✅ (Opção A, em golpes) → 2.2 freio F3 ✅ (A+C) → 2.3 curvas HP → 2.4 dano/ondas/morte → 2.5 threshold+boss mults. Travar cada sub em conversa; IMPLEMENTAR TUDO JUNTO no fim (decisão do Willian).
- **Modo de trabalho travado: 10-80-10** — 10% planejamento+pesquisa (Fable) · 80% implementação+review (Opus/Sonnet, nunca Haiku) · 10% review final (Fable).

## O que o simulador descobriu (fatos medidos — não re-descobrir)

`tools/sim.js` (headless, roda os módulos reais, RNG seedado). Achados com o tuning atual (9 áreas):
- **F1:** gate 351 = 1º prestige em **27min** ✓ (análise estática antiga errava 5× — afixos de XP compõem).
- **F2:** fórmula de pontos é **flat** — convergir no gate rende sempre C=400; empurrar 2× o nível = só +32%. Decisão de convergir é degenerada.
- **F3 (o mais grave):** **o jogo não tem parede após o min ~15** — TTK nas entradas de área: 0.8s/0.7s/0.1s. Causa: loop composto income×lumensBonus×gear. Consertar no Passo 2.
- **F4:** passivas quase decorativas — 8 convergences compram ~45 níveis de nó; `atkFlat 100/nível` vs ATK 15M = morto. `UNIT` precisa re-derivação.
- **F5:** Map 1 (9 áreas) completo = **3h04m** ativas.

## Decisões travadas (canon) — NÃO reabrir

- **Lore/hierarquia (jul/2026):** `docs/lore/DECISOES_JUL26.md` — escada Vessels→Harbingers→Nihelim→Nihel; 7 Nihelim (Okhra=Map1); Map 1 = 18 áreas (Floresta+Porto), Harbinger a cada 3 áreas; tipos = bestiário; cores = assinaturas; Seeker de nome roubado; ranks da Ordre = escada de conhecimento. **Onde divergir de docs antigos, ele vence.**
- **Tags de raridade:** Common (sem tag) · Ember (teal) · Lumen (azul) · Corona (violeta). *(Ainda NÃO implementado em `src/data.js` — de propósito; código usa Kindled/Luminous/Radiant.)*
- **Método de trabalho:** SPEC vs LOG (auditoria = agir e apagar) · definition-of-done (código+spec+sim+CLAUDE.md) · sim antes de número · um sistema por vez · decisão travada não reabre sem número novo.

## Pendências conhecidas (ordenadas)

1. **P2.3** — travar a forma das curvas de HP (opções na mesa).
2. **P2.2–2.5** — travar em sequência; depois implementar o P2 inteiro junto (10-80-10).
3. **UI copy (do review):** `ui.js` mostra "Reach level X" pra áreas de fronteira (deveria indicar o Harbinger) e o hint de Awaken material por área ficou obsoleto (idx>=5) — corrigir na fase de UI.
4. **Observação de balance (review):** no baseline, área 3 pode reter o jogador ~2h40 no grind do threshold com mobs capados — cruzar `bossKillThreshold` × TTK no P2.5.
5. **Import** do `mapa1_tema_b_porto_afundado.md` (criado fora do repo) + ajuste Nebulor→Okhra (área 17).
6. **Sweep de termos** nos docs (Archon→Nihelim etc.) — `node tools/check_canon.js` lista; exports consolidados (`GAME_CONTEXT`, `LORE_COMPLETE`) têm banner mas corpo antigo.
7. Escolher **quais 3 Harbingers** da floresta viram titulares de grupo (lore, sem pressa).
8. Fila da lore: **Séraphine + final/Convergence (Parte IX)** ← próximo item de lore; depois Mapa 2 (Naameth).
9. Renomes no código (Ember/Lumen/Corona, save key etc.) — **só quando o balance mandar** (decisão: lore não entra no código ainda).

## Infra & contexto operacional

- **Branch:** `claude/eclats-lumiere-hierarchy-amsoqc` · **PR #24 aberto** (docs+tooling; sem CI no repo; pushes novos atualizam o PR). Sessão inscrita nos eventos do PR.
- **Sim:** `node tools/sim.js baseline|gates|campaign` (ver CLAUDE.md).
- **Canon-check:** `node tools/check_canon.js` (termos supersedidos nos docs).
- **Comandos de sessão** (`.claude/commands/`): `/retomar` · `/handoff` · `/travar` · `/balance` · `/canon` — ver seção Harness no CLAUDE.md.
