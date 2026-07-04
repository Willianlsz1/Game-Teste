---
name: retomar
description: Protocolo de início de sessão do Éclats — retoma do estado vivo (HANDOFF) e reporta a posição em ≤10 linhas. Use no começo de toda sessão de trabalho.
disable-model-invocation: true
argument-hint: [foco opcional da sessão]
allowed-tools: Bash(node tools/check_canon.js), Bash(git log:*)
---

Protocolo de início de sessão do Éclats. Execute na ordem, sem pular:

## Estado injetado (já rodou — interprete, não re-rode)

Canon check:
!`node tools/check_canon.js`

Últimos commits:
!`git log --oneline -8`

## Passos

1. Leia `docs/agents/fable-mode.md` — o modo de pensar do orquestrador. Opere nele a sessão inteira.
2. Leia `HANDOFF.md` (raiz) — é o estado vivo: onde o trabalho parou, o que está travado, pendências ordenadas.
3. Leia o doc da trilha ativa indicada no HANDOFF.
4. Interprete o canon check injetado acima e anote (não corrija ainda) se apareceu drift novo.
5. Responda ao Willian em NO MÁXIMO 10 linhas: (a) onde paramos, (b) qual é a decisão/tarefa aberta AGORA, (c) o que você propõe fazer nesta sessão. Nada além disso antes do OK dele.

## Regras invioláveis da retomada

- NÃO re-derive fatos que o HANDOFF ou os achados do sim já estabelecem.
- NÃO reabra decisão marcada ✅/travada sem número novo do sim.
- NÃO comece trabalho novo fora da trilha ativa sem o Willian pedir.
- Se o HANDOFF contradisser o código, o código vence — e anote a correção no HANDOFF.

$ARGUMENTS
