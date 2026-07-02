Travar uma decisão do Éclats: $ARGUMENTS

Protocolo (a mesma disciplina das sessões de lore — decidir, registrar, não reabrir):

1. Identifique o doc-alvo da decisão:
   - Balance/sistemas → `docs/design/BALANCE_FRAMEWORK_MAP1.md` (o passo correspondente + Log de decisões travadas)
   - Lore/hierarquia/nomes → `docs/lore/DECISOES_JUL26.md` (ou sucessor)
   - Regra de dev/arquitetura → `CLAUDE.md`
2. Se for decisão de BALANCE com número: rode o sim ANTES (`node tools/sim.js …`) e anexe o resultado ao registro. Sem sim = marca 🔶 (decidido, aguarda validação), não ✅.
3. Grave a decisão no doc-alvo com data, valor e (se houver) o comando de sim que a validou. Atualize o status do passo (⬜→🔶→✅) e o Log.
4. Atualize `HANDOFF.md` (seção "Decisões travadas" ou o passo ativo).
5. Se a decisão superseder texto em outros docs, reconcilie-os agora ou anote no HANDOFF como pendência de sweep.
6. Commit + push.

Lembrete: decisão travada NÃO reabre sem número novo do sim. Se o Willian pedir pra reabrir, mostre o custo (o que ela destrava em cascata) antes.
