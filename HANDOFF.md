# HANDOFF — estado vivo do projeto entre sessões

> **Leia isto ANTES de qualquer trabalho.** Atualizado ao fim de cada sessão (`/handoff`).
> Regra: este doc diz ONDE o trabalho parou e O QUE está travado — não re-derive nem re-litigue.
> Última atualização: **2026-07-02** (sessão de balance framework + harness).

---

## Onde o trabalho está AGORA

**Trilha ativa: reconstrução do balance do Mapa 1** via `docs/design/BALANCE_FRAMEWORK_MAP1.md` (escada de 9 passos, um por vez, sim valida antes de travar).

- **PASSO 0 (Relógio): ✅ TRAVADO** — 18h ativas · sessão 30–50min c/ regra do beat · ~50/50 ativo/idle · 1º prestige 25–40min.
- **PASSO 1 (Esqueleto): 🔶 PROPOSTA NA MESA, aguardando OK do Willian** em 3 pontos:
  1. Cap nível **6000** + faixas das 18 áreas (largura ×1.15/área; área 1 = 1–80; fins de grupo: G1=276, G2=693, G3=1328, G4=2294, G5=3762, G6=6000);
  2. Tempo por grupo: G1 1.0h · G2 1.6h · G3 2.4h (Tema A=5h/28%) · G4 3.2h · G5 4.2h · G6 5.6h (Tema B=13h/72%);
  3. Regra estrutural: **áreas destravam por nível dentro do grupo; Harbinger trava a fronteira de grupo** (spawn por threshold na 3ª área; nº do threshold = Passo 2).
- **Depois vem: PASSO 2 (Fricção)** — inclui o conserto do runaway F3 (achado nº1 do sim).

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

1. **PASSO 1** — colher OK do Willian nos 3 pontos acima.
2. **PASSO 2** — desenhar fricção + freio do F3; validar tempos do P1 no sim.
3. **Import** do `mapa1_tema_b_porto_afundado.md` (criado fora do repo) + ajuste Nebulor→Okhra (área 17).
4. **Sweep de termos** nos docs (Archon→Nihelim etc.) — `node tools/check_canon.js` lista; exports consolidados (`GAME_CONTEXT`, `LORE_COMPLETE`) têm banner mas corpo antigo.
5. Escolher **quais 3 Harbingers** da floresta viram titulares de grupo (lore, sem pressa).
6. Fila da lore: **Séraphine + final/Convergence (Parte IX)** ← próximo item de lore; depois Mapa 2 (Naameth).
7. Renomes no código (Ember/Lumen/Corona, save key etc.) — **só quando o balance mandar** (decisão: lore não entra no código ainda).

## Infra & contexto operacional

- **Branch:** `claude/eclats-lumiere-hierarchy-amsoqc` · **PR #24 aberto** (docs+tooling; sem CI no repo; pushes novos atualizam o PR). Sessão inscrita nos eventos do PR.
- **Sim:** `node tools/sim.js baseline|gates|campaign` (ver CLAUDE.md).
- **Canon-check:** `node tools/check_canon.js` (termos supersedidos nos docs).
- **Comandos de sessão** (`.claude/commands/`): `/retomar` · `/handoff` · `/travar` · `/balance` · `/canon` — ver seção Harness no CLAUDE.md.
