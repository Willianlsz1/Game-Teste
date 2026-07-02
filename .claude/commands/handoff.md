Protocolo de fim de sessão do Éclats — atualiza o estado vivo pra próxima sessão (humana ou modelo).

1. Reescreva `HANDOFF.md` (raiz) refletindo ESTA sessão: onde o trabalho está agora · decisões travadas novas (com data) · achados de sim novos · pendências reordenadas · infra (branch/PR/tools). Mantenha a estrutura de seções existente; atualize a data.
2. Se alguma decisão foi travada nesta sessão e ainda não está no doc-alvo (framework de balance, DECISOES da lore, etc.), grave lá TAMBÉM — o HANDOFF aponta, os SPECs guardam.
3. Confira o definition-of-done da sessão: SPECs atualizadas? `CLAUDE.md` ainda verdadeiro (save key, curvas, comandos)? Docs mortos apagados (auditoria = LOG: agiu, apagou)?
4. Rode `node tools/check_canon.js`; se a sessão introduziu drift novo, corrija antes de fechar.
5. Commit com mensagem descritiva + push na branch de trabalho (atualiza o PR aberto, se houver).
6. Feche com um resumo de 5 linhas pro Willian: o que foi feito, o que ficou travado, qual é o primeiro passo da próxima sessão.

$ARGUMENTS
