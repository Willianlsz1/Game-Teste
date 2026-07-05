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

Project skills (`.claude/skills/<name>/SKILL.md` — migradas de `.claude/commands/` em jul/04; saída do canon check e do git log é INJETADA no prompt via `` !`comando` ``, não dependa de o modelo lembrar de rodar):

| Skill | When | What it does |
|---------|------|--------------|
| `/retomar` | start of session | read fable-mode + HANDOFF + active track doc, canon check injetado, report position in ≤10 lines |
| `/handoff` | end of session | rewrite HANDOFF, verify definition-of-done, run canon check, commit+push (só o dono invoca) |
| `/travar <decisão>` | a decision is made | record it in the right SPEC + HANDOFF, with sim validation if numeric (só o dono invoca) |
| `/balance <pergunta>` | any balance question | answer ONLY via `tools/sim.js` (never from theory); in-memory overrides for candidates. **Método de decisão: `docs/design/COMO_BALANCEAR.md`** (ordem de dependência, ciclo de 4 passos, as 5 formas, checklist de sistema novo) |
| `/canon` | doc hygiene | roda isolado (fork, modelo barato): fix live drift (superseded terms), extend TERMS list |

**Doc discipline:** SPEC (living, one per system) vs LOG (dated audit — act on it, then delete or banner). A doc that contradicts the code gets fixed or bannered within the session that notices it. `node tools/check_canon.js` exits 1 on live drift (docs only; `src/` is exempt until renames are ordered by the balance work).

---

## Agent skills

### Issue tracker

Issues live in GitHub Issues (`Willianlsz1/eclats_of_lumiere`, via `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` at repo root (canonical glossary) + `docs/adr/`. See `docs/agents/domain.md`.

---

## Como pensar e como delegar (os dois docs obrigatórios do orquestrador)

1. **`docs/agents/fable-mode.md` — leia ANTES de responder à primeira mensagem
   do dono.** O modo de trabalho que destravou o projeto: extrair intenção (o
   dono explica por sensação/exemplo — traduzir é papel SEU), converter feel
   em critério mensurável no sim, assumir a matemática, uma pergunta por vez
   com recomendação, registrar decisões na hora, terminar em vez de recomeçar.
   Vale para QUALQUER modelo orquestrando (Opus incluso).

2. **`docs/agents/delegacao-10-80-10.md` — leia ANTES de spawnar qualquer
   agente via Agent tool.** Regra 10-80-10 completa (travada pelo dono):
   orquestrador planeja/decide/revisa (10+10); executores implementam/testam/
   rodam (80), com roteamento por tier, briefing obrigatório (contexto +
   porquê + critério de aceite executável), escalação nos dois sentidos e
   review adversarial em trabalho grande. **Se você é um SUBAGENTE: você É a
   camada dos 80% — implementar/executar/testar com as próprias mãos é o seu
   papel; não re-delegue e não devolva "aguardando".**
