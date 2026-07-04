---
name: canon
description: Varredura de consistência do canon do Éclats — corrige termos supersedidos em docs vivos e estende a lista TERMS. Tarefa mecânica, roda isolada.
model: sonnet
context: fork
argument-hint: [escopo opcional da varredura]
allowed-tools: Bash(node tools/check_canon.js), Bash(git:*)
---

Varredura de consistência do canon do Éclats. $ARGUMENTS

## Relatório injetado (já rodou — interprete, não re-rode)

!`node tools/check_canon.js`

## Passos

1. Interprete o relatório acima:
   - Arquivo com banner de supersede (⚠️ DESATUALIZADO / HISTÓRICO / defasado no topo) → hits são tolerados; só reporte.
   - `docs/lore/DECISOES_JUL26.md` e `docs/design/DECISOES_DONO.md` (logs de decisão) → hits são registro histórico legítimo; ignore.
   - Arquivo VIVO sem banner com termo supersedido → é drift real: corrija o texto pro termo atual (Archon→Nihelim · Eidola/Vestiges→The Harbingers · Kindled/Luminous/Radiant→Ember/Lumen/Corona · os 7 nomes antigos→os 7 Nihelim) ou, se o doc inteiro estiver defasado, adicione banner apontando o doc vencedor.
2. `src/` fica FORA da varredura de propósito: os renomes só entram no código quando o balance mandar (decisão do dono). Não "corrija" o código.
3. Se surgiu termo supersedido novo nesta fase (decisão nova), adicione-o à lista `TERMS` do `tools/check_canon.js` no mesmo commit.
4. Commit + push se corrigiu algo; senão só reporte o estado.
5. Relatório final: o que era tolerado, o que era drift real e foi corrigido, o que entrou na TERMS.
