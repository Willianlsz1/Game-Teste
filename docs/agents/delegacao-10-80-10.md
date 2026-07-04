# Regra 10-80-10 · Delegação e Escalação (modo de trabalho travado pelo dono)

> Movido do `CLAUDE.md` (jul/04) para carregamento sob demanda — **leia este
> doc ANTES de spawnar qualquer agente via Agent tool.** O ponteiro curto no
> `CLAUDE.md` resume; a regra completa é esta.

**Delegação escala com o tier: quanto mais alto o seu tier, mais você delega.**
Empurre o trabalho pra baixo e preserve o próprio contexto pro julgamento.
O modelo de ponta (Fable) **NUNCA implementa, testa, roda ou itera código** —
isso inclui código do jogo, harness de simulação, scripts de fit, batches de
dados e loops empíricos. Divisão obrigatória:

- **10% orquestrador** — planejamento, decisão de design, lore/docs/prompts de
  arte, e o PLANO de qualquer tarefa de código (arquivos, mudanças, dials,
  alvos, critérios de aceite executáveis).
- **80% executores via Agent tool** — implementação, testes, execução de
  sims/candidatos, primeira revisão.
- **10% orquestrador** — revisão final dos diffs e dos números medidos,
  validação in-game, commit.

## Roteamento por tier

| Modelo | Melhor para | Delega? | Effort |
|---|---|---|---|
| Haiku | mecânico em massa (renomear, mover, varredura braçal SEM julgamento) | nunca | low |
| Sonnet | spec clara/mecânica · pesquisa escopada · review adversarial padrão | quando ajudar | medium |
| Opus | raciocínio multi-passo · ambíguo/combate/estado · fitting iterativo · review de diff em balance travado | com benefício claro | xhigh |
| Fable | julgamento, taste, design, plano, revisão final | por padrão | medium |

Fable só vai a xhigh nas decisões mais duras; pula o high. Haiku só entra em
tarefa 100% mecânica sem nenhuma decisão — na dúvida, Sonnet.

**Roteamento adicional travado pelo dono (jul/04, re-fit do paradigma):**
implementação = Opus; execução de testes/sims = Sonnet.

## Briefing de todo filho (obrigatório no prompt de cada Agent)

O filho nasce EM BRANCO e não herda nada. Todo prompt de agente carrega:
o CONTEXTO (onde está, o que existe), o PORQUÊ (a decisão que originou), e
COMO É "PRONTO" (critérios de aceite executáveis — o agente prova com saída
de comando, não promete).

## Escalação (nos dois sentidos)

- **Pra cima sem pedir:** o orquestrador tem permissão permanente de escalar
  Sonnet→Opus quando o output não bate a régua. Escalar custa menos que
  shipar mediocridade.
- **O pai não precisa ser o topo:** um agente Opus pode gerar um filho de
  tier mais alto pra UMA decisão dura de julgamento; o filho responde e
  retorna.
- **Trabalho acima do seu tier? DEVOLVA — não queime tokens nele.** Agente
  que encontrar decisão de design/julgamento fora do seu alcance reporta e
  encerra, em vez de chutar.
- **Anti-preguiça:** agente que devolve "estou aguardando" em vez de trabalho:
  matar e relançar UMA vez com regra dura ("não delegue; o relatório É a
  mensagem final"); nunca insistir 2× no mesmo agente zumbi.

## Review adversarial (obrigatório em trabalho grande — adotado jul/04)

Diff grande de executor (re-fit, reforma arquitetural, sistema novo) passa
por um crítico independente (Sonnet por padrão, Opus se o diff é de balance
travado) ANTES de chegar ao orquestrador. O crítico tenta DERRUBAR o
trabalho, não aprová-lo. Só o que sobrevive consome o julgamento do
orquestrador.

**ESCOPO DESTA REGRA — leia antes de se aplicar a ela:** ela rege o
ORQUESTRADOR da sessão. **Se você é um SUBAGENTE lançado via Agent tool,
você É a camada dos 80%: implementar/executar/testar é o SEU papel, com as
próprias mãos, nesta sessão.** Re-delegar a outro agente ou devolver
"aguardando" é violação da regra — a única exceção é a escalação legítima:
devolver ao orquestrador trabalho ACIMA do seu tier.
