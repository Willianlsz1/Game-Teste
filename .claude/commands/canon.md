Varredura de consistência do canon do Éclats. $ARGUMENTS

1. Rode `node tools/check_canon.js`.
2. Interprete o relatório:
   - Arquivo com banner de supersede (⚠️ DESATUALIZADO / HISTÓRICO / defasado no topo) → hits são tolerados; só reporte.
   - `docs/lore/DECISOES_JUL26.md` (e sucessores de log de decisão) → hits são registro histórico legítimo; ignore.
   - Arquivo VIVO sem banner com termo supersedido → é drift real: corrija o texto pro termo atual (Archon→Nihelim · Eidola/Vestiges→The Harbingers · Kindled/Luminous/Radiant→Ember/Lumen/Corona · os 7 nomes antigos→os 7 Nihelim) ou, se o doc inteiro estiver defasado, adicione banner apontando o doc vencedor.
3. `src/` fica FORA da varredura de propósito: os renomes só entram no código quando o balance mandar (decisão do dono). Não "corrija" o código.
4. Se surgiu termo supersedido novo nesta fase (decisão nova), adicione-o à lista `TERMS` do `tools/check_canon.js` no mesmo commit.
5. Commit + push se corrigiu algo; senão só reporte o estado.
