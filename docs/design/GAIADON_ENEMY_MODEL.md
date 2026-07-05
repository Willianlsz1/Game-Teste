# Modelo de Inimigo Gaiadon — SPEC (dono jul/05)

> Decisão de fundação: adotar o modelo de inimigo do Gaiadon (ref:
> `GAIADON_MATH.md §2`) no lugar do nosso "mob preso ao piso da área + tabelas
> de HP na mão". **Revisa a IMPLEMENTAÇÃO do P1, não o seu espírito.**
> Multi-sessão: Fase 1 = estrutura (params provisórios) → Fase 2 = re-fit do
> relógio → review adversarial → bake. Roteamento: Opus fita/julga, Sonnet roda
> os sims. Última: 2026-07-05.

## O que muda (e o que fica)

**Descoberta que motivou:** no Gaiadon o nível do mob TAMBÉM vem da área/location
(não do herói — o código deles compara `mob_level < hero_level` pra penalidade
de XP, prova de que são grandezas distintas). Mas o mob deles nunca fica
"congelado" como o nosso porque (1) o nível do mob **acompanha a banda da área
e sobe junto** conforme o jogador progride (não prende no piso) e (2) a
penalidade de XP empurra o jogador pra frente, então ele está sempre numa área
cujo nível ≈ o seu. O nosso erro foi prender o mob no piso (Lv 1) de uma área
gigante (1–80).

**FICA (P1 vive):** o nível do mob é da ÁREA (o mundo/World Map continua com
sentido; áreas gateiam ONDE você pode estar). FICA P3 (Lumens curva própria),
P5 (escada de recompensa dos acesos), P6 (custo de gear quadrático), P7
(penalidade de backtrack — agora raramente dispara, pois mob ≈ seu nível no
fluxo normal), P8 (Oferenda), P9 (porta por nível = teto da faixa da área).

**MUDA:**
1. **Nível do mob acompanha o jogador dentro da banda da área:**
   `mob_level = clamp(player_level, area.levelRange[0], area.levelRange[1])`.
   Na área 1 (banda 1–80) o mob sobe de Lv 1 a 80 junto com você; ao avançar,
   a próxima área continua de onde a banda dela começa. O mob nunca mais
   congela.
2. **Stats do mob pela fórmula paramétrica** `stat(mob_level) = (mob_level/x)^y`
   (substitui as 18 tabelas de HP/ATK na mão). `(x,y)` por bucket (por faixa de
   nível do mob ou por grupo G1–G6). Provisórios primeiro; re-fit depois. NÃO
   copiar os números do Gaiadon — fitar os NOSSOS pra escala do Éclats.
3. **A parede vira o GAP DE EXPOENTE:** `y_HP ≈ y_ATK + ~0.5`. Mesmo com o mob
   ≈ seu nível, o HP cresce mais rápido que o seu dano (linear em nível + gear),
   então HTK sobe como `nível^(y_HP−1)` → Gear/Convergence/Awaken continuam
   OBRIGATÓRIOS por construção. Um dial de gap em vez de 18 tabelas.

**Consequência de feel (aceita pelo dono):** o "entra difícil → derrete →
avança" do P2b é SUPERADO. Com mob ≈ seu nível, o combate vira desafio
~constante que a parede de expoente vai lentamente tornando mais duro (força
gear/prestige) — o feel do gênero (Gaiadon), "sempre dando trabalho", que o
dono escolheu explicitamente. **P2b (curva TTK entra-derrete) fica marcado como
superado por este modelo.**

## Re-fit (Fase 2) — alvos do dono
- Hook de economia inicial: primeiros ~3-4 upgrades de gear em segundos (o tune
  que estava rodando — reintegrar ao novo modelo).
- Porta da área 2 = nível 80 (decisão jul/05).
- Relógio macro (First Light, convergences, coroa, Okhra) re-descoberto sob o
  modelo novo — sem gate de relógio, medido em TTK; reportar o que emergir.
- P4 curva nua: nenhum kill dá 2+ níveis (agora com mob ≈ seu nível, cuidar da
  cascata de XP via o fit dos buckets de XP + a curva do herói).

## Fases
1. **Estrutura (Opus):** `enemyFactory` novo (mob_level clamp + fórmula
   paramétrica com buckets provisórios + gap), remover/aposentar as tabelas
   hp[]/mobAtkByArea como fonte primária (podem virar fallback até o fit).
   Critério: campaign roda ponta a ponta sem crash, tests passam. Relógio
   destunado é ESPERADO.
2. **Re-fit (Opus fita, Sonnet roda):** buckets `(x,y)` + gap + gates +
   economia → alvos acima → bake.
3. **Review adversarial (Sonnet/Opus)** → revisão do orquestrador → commit.
