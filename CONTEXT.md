# Éclats of Lumière — Contexto

Glossário canônico dos termos de **design e balanceamento** do Mapa 1. Não é spec
nem lista de tarefas — só vocabulário. Em conflito de termos, este arquivo manda.
Visão e pilares completos: `docs/project/CONSTITUICAO.md`.

## Language

**The Loop** (o Loop):
O ciclo central de poder: lutar → bater na Wall → Convergence → comprar Passiva →
voltar mais forte. É o que precisa "sentir bom" para o jogo ser jogável.
_Avoid_: grind, ciclo de farm.

**The Wall** (a Parede):
Ponto deliberado onde o poder do jogador para de acompanhar a dificuldade e ele
precisa **evoluir** para seguir. É projetada de propósito — nunca um beco sem
saída. Sensação alvo: *"consigo avançar, mas preciso crescer de novo"*, nunca
*"estou travado"*. Desde o P9 a Wall é **estrutural**: o HP inimigo cresce com
expoente fixo acima do dano "de nível" do jogador (gap de expoente, lição do
Gaiadon), então Gear, Convergence e Awaken são obrigatórios por construção —
upar nunca fecha o gap sozinho.
_Avoid_: gate de dano, soft-cap.

**Playable Slice** (a Fatia Jogável):
O alvo do passe de balanceamento atual: o trecho inicial do Mapa 1 onde o Loop
completo é experimentável e tunado para ser divertido — do jogo novo até a
primeira Convergence + primeira Passiva, sentindo-se mais forte na run seguinte.
Não inclui sistemas ainda não construídos (promoção Uncommon, Mini Boss, Elite).
_Avoid_: MVP, demo.

**Convergence**:
Reset da run (nível, XP, Lumens, área) que concede **Pontos de Convergence**.
Desbloqueada por **nível** — o gate é uma **escada**: o primeiro cai no fim do
G1 (~40min de jogo) e cada gate seguinte sobe multiplicativamente. **Não dá
poder direto NENHUM — só Pontos** (decisão do dono jul/05: o legado residual de
2%/conv foi ZERADO; `convLegacyAtkPct/HpPct = 0`). 100% do poder vem das
Passivas compradas com os Pontos.
_Avoid_: prestige (no chat tudo bem, mas o termo do jogo é Convergence).

**Convergence Point** (Ponto de Convergence):
Moeda concedida pela Convergence, gasta para desbloquear e subir nós de Passiva.
A primeira Convergence deve render Pontos suficientes para comprar **alguns nós +
1–2 níveis**, não só um único nó.

**Tier** (de Passiva):
Uma geração da World Tree. O Mapa 1 tem a **Árvore I (Tier I)**: topologia
binária 1→2→4→8 + coroa = 16 nós — tronco (fundações de %) e 8 folhas
(mecânicas com cara). A coroa é o único multiplicador da árvore e requisito do
Awaken. Tiers seguintes (Árvore II...) chegam com os próximos mapas. A árvore é
**permanente** (sobrevive a Convergence e Awaken) e é dimensionada pra NÃO
fechar dentro do mapa (sink de pontos até o fim).
_Avoid_: grupo, group, camada; "3 árvores" (Éclat/Vestige/Fracture morreram no P6).

**Additive fades / Multiplier persists**:
Bônus aditivos (Primary/Bonus) são diluídos quando o gear cresce — o gear vence
essas colunas. Multiplicadores (×more) e o par de crit não diluem. Por isso o valor
que "segura" os ~40% das Passivas vem das partes multiplicativas (crit), não do flat.

**Increased vs More** (buckets de dano):
**Increased** = bônus % que somam num único balde e têm retorno decrescente
(mapa: camada `pct`). **More** = multiplicadores que se multiplicam entre si,
raros e fortes (mapa: camada `mult`). **Flat** = soma na base (camada `flat`).
Variedade num galho de dano vem de usar baldes diferentes, não repetir o mesmo.

**Spike node vs Throughput node**:
Throughput = ajuda em toda kill (dano/crit/atk speed comum). Spike = só dispara
em situações específicas (ex.: dano vs Boss/Elite/Rare). Spikes "quebram paredes";
não melhoram o farm de mob comum.

**TTK** (Time-To-Kill):
Tempo-alvo para matar cada tipo de inimigo, a régua de balanceamento de combate
(de `CONSTITUICAO.md`): Mob 1–3s · Elite 10–20s · Mini Boss 30–60s · Boss 1–3min.
**Desde jul/04 (decisão do dono), TTK é a ÂNCORA de balance** (substitui HTK):
o combate é medido em segundos, a velocidade de ataque vira DPS sem teto baixo.
_Contraste_: HTK (golpes contados) era a âncora até o P9; foi trocado na virada
pro paradigma do gênero (ver P9_REBALANCE §8c).

**Power Sources** (fontes de poder do Mapa 1):
Três fontes, três papéis — a distribuição é por FASE, não por fatia fixa:
**Gear** = poder dentro da run (resolve a parede de entrada de área) ·
**Passivas** = poder permanente que atravessa a Convergence (derrete a
re-subida) · **Awaken** = a chave do finale (o requisito é o relógio do fim
do mapa; o bônus é o que torna o chefe de Mapa lutável). "Todos importam" =
cada um é A resposta para uma parede diferente.
_Avoid_: split percentual fixo (ex.: 60/40) como alvo de design.

**Awaken** (a escada de despertar):
Rito de passagem, 1 por mapa (First Light no Mapa 1 → … → Lumière). O
requisito é o relógio do fim do mapa; o bônus é a chave do chefe de Mapa.
Identidade travada: a escada **fortalece as mesmas assinaturas a cada mapa**
(piso multiplicativo de ATK/HP + The World Kindles + Light Remembers +
Vessel of Dawn), nunca inventa bônus novos — o jogador aprende o rito uma
vez e cada mapa cumpre a promessa mais alto.
_Avoid_: prestige (Awaken não reseta nada), ascension.

**Offering** (Oferenda):
Requisito de Lumens do rito do Awaken, pago uma vez além dos materiais —
devolver a luz colhida para despertar. É o sink de fim de mapa que dá destino
à aceleração de Lumens (P3); depois de paga, o excedente de Lumens é
espetáculo, não desperdício.
_Avoid_: taxa, custo do Awaken (o custo em materiais é outro requisito).

**Power Curve / Difficulty Curve**:
Power Curve = quão forte o jogador fica (Gear + Passivas + Convergence + Awaken).
Difficulty Curve = quão forte o inimigo fica (HP e ATK do mob). Balancear é manter
as duas próximas, com Walls deliberadas.
