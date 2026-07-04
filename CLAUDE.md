# Éclats of Lumière

Browser-based idle/loot game (Map 1 focus). Vanilla JS, no framework, no build step for development. We are in active development of Map 1's core loop — finishing, not restarting.

---

## Stack

| Layer | Detail |
|-------|--------|
| Runtime | Browser (Chrome/Edge) |
| Language | Vanilla JS (ES5-compatible, no modules, no TypeScript) |
| Module system | Global `G` object — every module registers itself as `G.module = {...}` |
| Entry point | `index.html` loads CSS then JS via `<script>` tags (order matters) |
| Script order | `util → data → gear → state → economy → rates → enemyFactory → income → progression → combat → convergence → awaken → passives → ui-core → ui-{hud,battle,gear,forge,passives,awaken,convergence,worldmap} → main`. Hard constraints: `gear` before `state` (`state.fresh()` calls `G.gear.freshSet()`), `ui-core` before the other `ui-*` (it defines `G.ui`; screens `Object.assign` into it), `main` last. |
| CSS | Split into `styles/base.css`, `components.css`, `hud.css`, `gear.css`, `convergence.css`, `awaken.css`, `worldmap.css`, `passives.css` |
| Save | `localStorage` key `eclats_v5` (JSON). Falls back to in-memory if `file://` |
| Fonts | Google Fonts: Cormorant Garamond (display), Outfit (UI) |
| Dev server | `node .claude/static-server.js` or double-click `Jogar Eclats.bat` |
| Tests | `node tests/hygiene.test.js` (+ rarityfind, modifiers, economy, convergence, awaken) — run after any src/ change |
| Libraries | None in source code (node_modules has break_infinity.js but it is not imported) |


## How to Run

```
node .claude/static-server.js
# then open http://localhost:3000
```

Or double-click `Jogar Eclats.bat`. Do **not** open `index.html` directly as `file://` — localStorage is blocked and saves won't persist.

**Balance simulator** (headless, runs the real `src/` modules in Node — never mirror formulas by hand):

```
node tools/sim.js baseline [--to-level N] [--hours H]   # one run, no prestige: time-to-level, TTK/TTD per area
node tools/sim.js gates --gates 80,150,351              # time + points of the 1st Convergence per candidate gate
node tools/sim.js campaign --gate 351 [--push 2.0]      # full Map 1 loop to First Light
```

Seeded RNG (`--seed`), deterministic. Any balance change must be justified with sim output.

To reset save from the browser console: `G.state.reset(); location.reload()`

---

## Session Harness

**`HANDOFF.md` (repo root) is the living state between sessions — read it before any work.** It says where work stopped, what is locked, and the ordered pending list. Do not re-derive established facts or reopen locked decisions.

Project slash commands (`.claude/commands/`):

| Command | When | What it does |
|---------|------|--------------|
| `/retomar` | start of session | read HANDOFF + active track doc, run canon check, report position in ≤10 lines |
| `/handoff` | end of session | rewrite HANDOFF, verify definition-of-done, run canon check, commit+push |
| `/travar <decisão>` | a decision is made | record it in the right SPEC + HANDOFF, with sim validation if numeric |
| `/balance <pergunta>` | any balance question | answer ONLY via `tools/sim.js` (never from theory); in-memory overrides for candidates |
| `/canon` | doc hygiene | run `tools/check_canon.js`, fix live drift (superseded terms), extend TERMS list |

**Doc discipline:** SPEC (living, one per system) vs LOG (dated audit — act on it, then delete or banner). A doc that contradicts the code gets fixed or bannered within the session that notices it. `node tools/check_canon.js` exits 1 on live drift (docs only; `src/` is exempt until renames are ordered by the balance work).

---

## Regra 10-80-10 · Delegação e Escalação (modo de trabalho travado pelo dono)

**Delegação escala com o tier: quanto mais alto o seu tier, mais você delega.**
Empurre o trabalho pra baixo e preserve o próprio contexto pro julgamento.
O modelo de ponta (Fable) **NUNCA implementa, testa, roda ou itera código** —
isso inclui código do jogo, harness de simulação, scripts de fit, batches de
dados e loops empíricos. Divisão obrigatória:

- **10% Fable** — planejamento, decisão de design, lore/docs/prompts de arte,
  e o PLANO de qualquer tarefa de código (arquivos, mudanças, dials, alvos,
  critérios de aceite executáveis).
- **80% executores via Agent tool** — implementação, testes, execução de
  sims/candidatos, primeira revisão.
- **10% Fable** — revisão final dos diffs e dos números medidos, validação
  in-game, commit.

### Roteamento por tier

| Modelo | Melhor para | Delega? | Effort |
|---|---|---|---|
| Haiku | mecânico em massa (renomear, mover, varredura braçal SEM julgamento) | nunca | low |
| Sonnet | spec clara/mecânica · pesquisa escopada · review adversarial padrão | quando ajudar | medium |
| Opus | raciocínio multi-passo · ambíguo/combate/estado · fitting iterativo · review de diff em balance travado | com benefício claro | xhigh |
| Fable | julgamento, taste, design, plano, revisão final | por padrão | medium |

Fable só vai a xhigh nas decisões mais duras; pula o high. Haiku só entra em
tarefa 100% mecânica sem nenhuma decisão — na dúvida, Sonnet.

### Briefing de todo filho (obrigatório no prompt de cada Agent)

O filho nasce EM BRANCO e não herda nada. Todo prompt de agente carrega:
o CONTEXTO (onde está, o que existe), o PORQUÊ (a decisão que originou), e
COMO É "PRONTO" (critérios de aceite executáveis — o agente prova com saída
de comando, não promete).

### Escalação (nos dois sentidos)

- **Pra cima sem pedir:** Fable tem permissão permanente de escalar
  Sonnet→Opus quando o output não bate a régua. Escalar custa menos que
  shipar mediocridade.
- **O pai não precisa ser o topo:** um agente Opus pode gerar um filho Fable
  pra UMA decisão dura de julgamento; o filho responde e retorna.
- **Trabalho acima do seu tier? DEVOLVA — não queime tokens nele.** Agente
  que encontrar decisão de design/julgamento fora do seu alcance reporta e
  encerra, em vez de chutar.
- **Anti-preguiça:** agente que devolve "estou aguardando" em vez de trabalho:
  matar e relançar UMA vez com regra dura ("não delegue; o relatório É a
  mensagem final"); nunca insistir 2× no mesmo agente zumbi.

**ESCOPO DESTA REGRA — leia antes de se aplicar a ela:** ela rege o
ORQUESTRADOR da sessão (Fable). **Se você é um SUBAGENTE lançado via Agent
tool, você É a camada dos 80%: implementar/executar/testar é o SEU papel,
com as próprias mãos, nesta sessão.** Re-delegar a outro agente ou devolver
"aguardando" é violação da regra — a única exceção é a escalação legítima:
devolver ao orquestrador trabalho ACIMA do seu tier.
