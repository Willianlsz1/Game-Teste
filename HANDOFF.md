# HANDOFF — estado vivo do projeto entre sessões

> **Leia isto ANTES de qualquer trabalho.** Atualizado ao fim de cada sessão (`/handoff`).
> Regra: este doc diz ONDE o trabalho parou e O QUE está travado — não re-derive nem re-litigue.
> Última atualização: **2026-07-02** (sessão de balance framework + harness).

---

## Onde o trabalho está AGORA

**A ESCADA P0–P8 ESTÁ COMPLETA (jul/2026)** — balance do Mapa 1 travado, implementado e revisado de ponta a ponta (`docs/design/BALANCE_FRAMEWORK_MAP1.md`). **Trilha seguinte declarada pelo dono: playtest humano + fase de design — mapas, mobs e UI.**

- **PASSO 0 (Relógio): ✅** — 18h · 30–50min/beat · 50/50 · 1º prestige 25–40min.
- **PASSO 1 (Esqueleto): ✅ TRAVADO E IMPLEMENTADO** (ciclo 10-80-10: Opus implementou, Sonnet achou+corrigiu 1 bug de migração de save, Fable revisou) — 18 áreas no código, cap 6000, Harbinger por grupo, Okhra fecha o mapa. Tempos por grupo = contrato a cumprir no P2.
- **P8.5b (jul/2026, ordem do dono): ✅** — matar Harbinger **zera o contador por completo** (`bossRegrindFrac 1.0`; o parcial 0.2 do P8.5 foi vetado) + `baseXp 245` compensa o fim do farm de boss. Relógio 18h22–18h26 seeds 1/3/7 (alvo P0 18h) — **estas âncoras substituem P8 e P8.5**. Okhra sem re-manifestação pós-vitória (fix da review). UI travada pelo dono: contador de invocação "{Boss} stirs in N kills" (topo-direito, sob os Lumens) · **nameplate tipográfico** de boss (tag ⟡ HARBINGER ⟡ / ◆ NIHELIM ◆ + nome caps em faixa escura angulada dourada/violeta + assinatura teal) — a ideia de banner heráldico em PNG foi testada e DESCARTADA (não reabrir) · banner de área minimalista (sem moldura; filete âmbar na Floresta / teal no Porto) · Lightshell legível (badge/aura/floater/log).
- **PASSOS 2–7: ✅ TODOS FECHADOS.** P2–P5: fricção calibrada · economia Gaiadon · matriz de gear · gate escalonado ×1.30. P6: Árvore I sequencial (15 nós, coroa, save `eclats_v5`). **P7 ✅ TRAVADO E IMPLEMENTADO**: Awaken = rito de passagem 1/mapa (escada First Light → … → Lumière) · três provas (área 18 + coroa + 3 materiais) · portão limpo do Okhra · `xpMultByGroup [1,1,1,1,2.5,3.0]` · Okhra `hpMult 48`. Âncoras (seeds 1/3/5): 1ª conv 38.7–39.9min · coroa conv 8 · First Light 17h40–17h57 · Okhra 82–98 golpes · mapa completo ~18h. **P8 ✅ também fechado — escada completa** (Rarity Find, 4 modificadores, assinaturas H1–H6, finale: H6 invoca Okhra + The Tide Rises; mapa completo 17h01–17h13 seeds 1/3/7; suíte 278/278).
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
- **Identidade do Tema A (jul/2026):** "a floresta que roubou a Lua e dorme sonhando" — física de sonho, Lua enjaulada no dossel, céu sem-lua cinzento; imagem impossível por área em `DECISOES_JUL26.md §4b`. **Ordem de produção de arte: backgrounds antes de mobs.**
- **World Map em 2 atos (jul/2026):** Mapa 1 = 2 telas de mapa (A: áreas 1–9 · B: áreas 10–18); segue UM mapa (1 Nihelim, 1 Awaken). Backgrounds 7–9 fazem gancho visual pro Porto. Implementação da tela dupla = fase de UI (Etapa 5 do roadmap).
- **Método de trabalho:** SPEC vs LOG (auditoria = agir e apagar) · definition-of-done (código+spec+sim+CLAUDE.md) · sim antes de número · um sistema por vez · decisão travada não reabre sem número novo.

## Pendências conhecidas (ordenadas)

1. **P8 ✅ FECHADO** — Rarity Find + modificadores + assinaturas + finale encenado, tudo no PR #24. Números finais no framework. **Próximo da fila: fase de UI/design** (item 4) e playtest humano (item 4b).
1b. **Registrado (dono, não desenhar agora):** repensar sistema tipo Ascension antigo com **Mémoires** — 1 por mapa, história do mundo + bônus poderosos.
1c. **Registrado pro Mapa 2 (P7.4):** promoção Uncommon→Rare exige First Light (o Awaken abre o próximo estágio do gear a cada mapa).
3. **Registrados pra Árvore II (Mapa 2):** Second Wind · Golden Wake e o banco · awakenEfficiency/awakenReqReduction (removidos do código no P6) · pós-cap da convergence aberto de propósito.
4. **UI copy (do review):** `ui.js` mostra "Reach level X" pra áreas de fronteira (deveria indicar o Harbinger) — corrigir na fase de UI.
4b. **Pergunta aberta PRO PLAYTEST (não pro sim):** HP bruto cai em algumas fronteiras (13→14, 16→17 etc.) porque o cruzamento acontece pós-Convergence (dano esperado menor; golpes sentidos são monótonos). Se humanos estranharem, plano B pronto: piso cosmético `hp entrada ≥ hp fim anterior` no calibrador (custo: re-subidas ~8–10 golpes na entrada). Decisão atual: fidelidade de golpes > estética de número.
4c. **Registrado (review adversarial P8.5, jul/2026):** estado do finale (`_bossKills`, `_okhraManifest`, tide) vive em `G.combat` e NÃO persiste — reload entre a morte do H6 e o spawn do Okhra perde a manifestação imediata (re-farma o threshold). Pré-existente, janela estreita; se incomodar no playtest: persistir em `state.data` e hidratar no load.
5. **Política do sim (registrado no P3):** promoções em lockstep no G2–G3; jogador realista espalharia — refinar a persona se algum número futuro depender disso.
6. **Import** do `mapa1_tema_b_porto_afundado.md` (criado fora do repo) + ajuste Nebulor→Okhra (área 17).
7. **Sweep de termos** nos docs (Archon→Nihelim etc.) — `node tools/check_canon.js` lista; exports consolidados (`GAME_CONTEXT`, `LORE_COMPLETE`) têm banner mas corpo antigo.
8. Escolher **quais 3 Harbingers** da floresta viram titulares de grupo (lore, sem pressa).
9. Fila da lore: **Séraphine + final/Convergence (Parte IX)** ← próximo item de lore; depois Mapa 2 (Naameth).
10. Renomes no código (Kindled/Luminous/Radiant → Ember/Lumen/Corona etc.) — **DESBLOQUEADO: a escada fechou, o balance mandou.** Entra na fase de UI/design.

## Infra & contexto operacional

- **Branch:** `claude/eclats-lumiere-hierarchy-amsoqc` · **PR #24 aberto** (docs+tooling; sem CI no repo; pushes novos atualizam o PR). Sessão inscrita nos eventos do PR.
- **Sim:** `node tools/sim.js baseline|gates|campaign` (ver CLAUDE.md).
- **Canon-check:** `node tools/check_canon.js` (termos supersedidos nos docs).
- **Comandos de sessão** (`.claude/commands/`): `/retomar` · `/handoff` · `/travar` · `/balance` · `/canon` — ver seção Harness no CLAUDE.md.
