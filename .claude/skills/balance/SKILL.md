---
name: balance
description: Pergunta de balance do Éclats — responde SÓ via tools/sim.js, nunca por teoria. Use para qualquer pergunta de números, tempos, curvas ou candidatos de tuning.
argument-hint: <pergunta de balance>
---

Pergunta de balance do Éclats: $ARGUMENTS

Regra de ouro: **nenhuma resposta de balance sai da teoria — toda resposta sai do simulador.** (Lição F1: a análise estática já errou 5×.)

1. Traduza a pergunta num cenário de `tools/sim.js`:
   - "quanto tempo até X?" → `baseline [--to-level N] [--hours H]`
   - "qual gate/quanto rende a 1ª convergence?" → `gates --gates a,b,c`
   - "como fica o mapa inteiro / meta de convergences / First Light?" → `campaign --gate G [--push P]`
   - Pergunta que o sim não cobre → ESTENDA o sim primeiro (nova métrica/política), depois responda. O sim carrega os módulos reais de `src/` — nunca espelhe fórmula à mão.
2. Pra testar um candidato de tuning: monkey-patch em memória no cenário (override de `G.data.balance.*` / `G.convergence.*` antes do run) — `data.js` NÃO muda até a decisão travar (✅).
3. Rode com `--seed` fixo (comparabilidade) e, se a variância importar, 2–3 seeds.
4. Responda com: números lado a lado (antes/depois ou candidatos A/B/C) · leitura em 2–3 frases · recomendação única. Cole o comando usado pra ser reproduzível.
5. Se o resultado contradisser um achado registrado ou uma decisão travada, destaque isso explicitamente — é sinal de mudança de regime, não de erro.
6. Conforme a 10-80-10: a EXECUÇÃO dos batches de sim desce pra um agente Sonnet quando forem várias rodadas; o julgamento dos números fica com o orquestrador.
