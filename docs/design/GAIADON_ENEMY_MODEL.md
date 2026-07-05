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
4. **Economia de Lumens ancorada na gold math do Gaiadon (§2.2), dono jul/05:**
   Lumens/kill = `(mob_level / x_gold)^y_gold` — MESMA família paramétrica, com
   buckets próprios de gold. **O expoente do gold SOBE por bucket e ultrapassa o
   do HP no late game** (Gaiadon: ~2.82 vs ~2.33) → Lumens ACELERAM no fim = o
   P3 (espetáculo) vira estrutural (o expoente de gold crescente SUBSTITUI o
   `lumensByArea`, que fica fallback). Os multiplicadores de rank dos acesos (P5)
   multiplicam por cima ("caçar raro > grindar", = gold×40 do FIEND). Provisório;
   fit na Fase 2.

**Consequência de feel (aceita pelo dono):** o "entra difícil → derrete →
avança" do P2b é SUPERADO. Com mob ≈ seu nível, o combate vira desafio
~constante que a parede de expoente vai lentamente tornando mais duro (força
gear/prestige) — o feel do gênero (Gaiadon), "sempre dando trabalho", que o
dono escolheu explicitamente. **P2b (curva TTK entra-derrete) fica marcado como
superado por este modelo.**

## ESCOPO AMPLIADO — adoção TOTAL da Gaiadon math (dono jul/05)

O dono pediu: incorporar o documento INTEIRO (`GAIADON_MATH.md`) — economia,
materiais, gear, XP — adaptando onde a fórmula deles tem algo que não usamos.
E **tirar o cap/alvo de relógio**: nada de perseguir "First Light em 16–22h".
Modo DESCOBERTA — adota a math fiel, mede, e REPORTA o que emergir pra limpar
o Mapa 1 (HP dos mobs, dano necessário, custos, materiais, tempo).

Sistemas a ancorar (todos na família paramétrica; adaptar à escala do Éclats,
NUNCA copiar os x,y crus):

- **Inimigo (HP/ATK):** `(mob_level/x)^y`, buckets, gap de expoente. (Fase 1)
- **Economia (Lumens):** `(mob_level/x_gold)^y_gold`, y_gold crescente/acelera
  no fim (P3 estrutural), rank dos acesos por cima (P5). (Fase 1)
- **XP (§3.1 + §2.3):** curva do herói na forma potência invertível (a nossa
  ancorada nisso, cap nível 6000 do Mapa 1, não 1M); XP do mob paramétrico com
  a penalidade de backtrack (P7). Cuidar da cascata (P4 nua).
- **Gear (§4):** custo de level-up quadrático (JÁ temos, P6); salto
  front-loaded na promoção de raridade; nº de afixo cresce por raridade;
  promoção por material. Adaptar às NOSSAS raridades de gear (não confundir com
  os tiers de luz Ember/Lumen/Corona, que são dos acesos/mobs).
- **Materiais (§4.6):** drop escalado por RANK (aceso = fonte da chave), boss
  com token garantido. Adaptar à nossa estrutura (material comum ×50 +
  incomum-chave dos acesos) — ancorar as TAXAS na banda deles (mob 5% / elite
  15–45% / boss 100%, que já medimos estar na banda).

## Entregável: PROJEÇÃO do Mapa 1 (sem cap de relógio)
Sim rodando até o clear NATURAL (First Light/Okhra), SEM `--hours` cortando.
Reportar por área/grupo: mob HP · dano/DPS necessário · Lumens/custos de gear ·
materiais · TTK · tempo do grupo · tempo TOTAL de clear. É o que o dono quer
ver antes de decidir se as magnitudes agradam (e antes do design/polimento).

## ALVO CENTRAL DO FIT (Fase 2) — DESAFIO CONSTANTE (dono jul/05, pós-projeção)

A projeção crua mostrou combate trivial (gear maxa instantâneo → invencível na
área 12) + 6,5h de farm de material no G6. O dono decidiu: **o Mapa 1 inteiro
tem que ser mais CONSTANTE — se o player ficar forte, ok, mas a PRÓXIMA área já
é um desafio maior.**

**ÂNCORA PRECISA (dono jul/05): TTK-alvo = 1 SEGUNDO.** Dentro de cada área o
TTK CONVERGE pra ~1s (o "cruise"); ao ENTRAR numa área nova o TTK SOBE acima de
1s (a parede — mob mais forte que o poder carregado); os upgrades (gear +
passivas/awaken/convergence) trazem o TTK de volta pra ~1s. Serrote ancorado em
1s, repetido nas 18 áreas — a saída de TODA área deve convergir pra ~1s, a
entrada spike. **Consequências que encaixam:** spike de entrada MAIOR nas áreas
tardias → mais kills pra puxar o TTK de volta → **tempo por área ESCALA** (área
1 ~40min, cada área mais longa, com alívio dos upgrades DENTRO da área; ex.:
área 2 bruto ~2h cai pra ~1h20m); e o **gear é a escada MAP-LONG** que faz o
"trazer de volta" — custo por nível sobe pra o gear (Common→promover→Uncommon
maxed) só COMPLETAR ~área 17/18 (nunca "pronto" antes do finale; primeiros 3-4
upgrades rápidos = hook).

**Mecanismo (razão de duas curvas, NÃO cortar bônus):**
1. **Gear maxa ~AO LONGO de uma área, não instantâneo** — manter os primeiros
   upgrades rápidos (o hook), mas a curva de custo sobe pra o gear completo levar
   ~uma área. Você cresce DENTRO da área, não entra no talo.
2. **Degrau do inimigo por área firme** (gap de expoente calibrado) — o salto de
   HP por transição de área supera o poder carregado → cada entrada re-walla.
3. **NÃO mexer nos bônus de passiva/awaken** — são poder de prestige (derretem a
   re-subida pós-Convergence); cortá-los machuca isso sem resolver o desafio
   por-área (que é gear-vs-inimigo).
4. Re-ancorar o drop de material do First Light (G6 não pode ser 6,5h de farm).
5. Re-checar o cap de nível 6000 (batido na área 12 — cedo demais) e as portas.
Clear-time = emergente; reportar, o dono dial-a depois.

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
