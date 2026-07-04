---
name: travar
description: Travar uma decisão do Éclats no doc-alvo certo, com validação de sim se for numérica. Só o dono invoca — o modelo nunca trava decisão sozinho.
disable-model-invocation: true
argument-hint: <decisão a travar>
---

Travar uma decisão do Éclats: $ARGUMENTS

Protocolo (a mesma disciplina das sessões de lore — decidir, registrar, não reabrir):

1. Identifique o doc-alvo da decisão:
   - Balance/sistemas → `docs/design/DECISOES_DONO.md` (livro-razão) + a SPEC do sistema (`P9_REBALANCE.md` ou equivalente)
   - Lore/hierarquia/nomes → `docs/lore/DECISOES_JUL26.md` (ou sucessor)
   - Regra de dev/arquitetura → `CLAUDE.md` (ou `docs/agents/` se for regra de agente)
2. Se for decisão de BALANCE com número: rode o sim ANTES (`node tools/sim.js …`) e anexe o resultado ao registro. Sem sim = marca 🔶 (decidido, aguarda validação), não ✅.
3. Grave a decisão no doc-alvo com data, valor e (se houver) o comando de sim que a validou. Atualize o status do passo (⬜→🔶→✅) e o Log.
4. Se a decisão criou/alterou um TERMO de design, atualize o glossário `CONTEXT.md` na mesma resposta.
5. Atualize `HANDOFF.md` (seção "Decisões travadas" ou o passo ativo).
6. Se a decisão superseder texto em outros docs, reconcilie-os agora ou anote no HANDOFF como pendência de sweep.
7. Commit + push.

Lembrete: decisão travada NÃO reabre sem número novo do sim. Se o Willian pedir pra reabrir, mostre o custo (o que ela destrava em cascata) antes.
