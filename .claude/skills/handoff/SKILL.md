---
name: handoff
description: Protocolo de fim de sessão do Éclats — reescreve o HANDOFF com o estado desta sessão, verifica definition-of-done e commita. Só o dono invoca.
disable-model-invocation: true
argument-hint: [notas de fechamento]
allowed-tools: Bash(node tools/check_canon.js), Bash(git:*)
---

Protocolo de fim de sessão do Éclats — atualiza o estado vivo pra próxima sessão (humana ou modelo).

## Canon check injetado (já rodou — interprete, não re-rode)

!`node tools/check_canon.js`

## Passos

1. Reescreva `HANDOFF.md` (raiz) refletindo ESTA sessão: onde o trabalho está agora · decisões travadas novas (com data) · achados de sim novos · pendências reordenadas · infra (branch/PR/tools). Mantenha a estrutura de seções existente; atualize a data.
2. Se alguma decisão foi travada nesta sessão e ainda não está no doc-alvo (DECISOES_DONO, SPECs de design, DECISOES da lore), grave lá TAMBÉM — o HANDOFF aponta, os SPECs guardam.
3. Confira o definition-of-done da sessão: SPECs atualizadas? `CLAUDE.md` ainda verdadeiro (save key, curvas, comandos)? Docs mortos apagados (auditoria = LOG: agiu, apagou)?
4. Se o canon check injetado acima acusou drift novo introduzido nesta sessão, corrija antes de fechar.
5. Commit com mensagem descritiva + push na branch de trabalho (atualiza o PR aberto, se houver).
6. Feche com um resumo de 5 linhas pro Willian: o que foi feito, o que ficou travado, qual é o primeiro passo da próxima sessão.

$ARGUMENTS
