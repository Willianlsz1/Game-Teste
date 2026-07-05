# COMO BALANCEAR — o manual do método (SPEC viva)

> Criado jul/05 (pedido do dono, transcrição da aula do Fable na passagem de
> bastão). **Para o orquestrador (Opus ou qualquer modelo): quando o dono
> pedir "como balancear X" ou abrir um sistema novo, ESTE doc é o método.**
> Ele foi destilado da experiência real do projeto (P1–P10) + da autópsia
> completa do Gaiadon Steam (medida, não teoria — ver
> `Desktop\gaiadon_backup_20260705\` e GAIADON_*.md).
> Complementa `docs/agents/fable-mode.md` (como pensar) — este aqui é
> especificamente COMO DECIDIR BALANCE.

---

## A regra de ouro: esqueleto de uma vez, carne por partes

- Balancear TUDO de uma vez não funciona: 10 variáveis mudadas e o jogo ruim
  = impossível saber qual estragou.
- Balancear por partes SEM MAPA também não: o custo de gear fitado hoje
  quebra amanhã quando o income mudar.
- **Método:** (1) decidir as FORMAS de todos os sistemas de uma vez, no papel
  (barato de mudar); (2) fitar os NÚMEROS um sistema por vez, no sim, na
  ordem de dependência (caro de mudar). Foi exatamente o P1–P10: decisões de
  forma primeiro (DECISOES_DONO.md), fit depois.
- Decisão de forma = "custo cresce devagar no começo e explode no fim".
- Número = "começa em 5K, +0.73K/nível". Número SÓ COM SIM (regra da casa).

## As partes, na ordem de dependência (balancear fora de ordem = refazer)

| # | Sistema | Por que vem antes | A variável que importa |
|---|---|---|---|
| 0 | **A régua** | Sem régua, "balanceado" não significa nada | TTK do mob (1–3s) + relógio da sessão (1ª Convergence ~40min) |
| 1 | **Curva do inimigo** | É o terreno; tudo empurra contra ela | HP/ATK por nível + gap de expoente (Wall estrutural) |
| 2 | **Player pelado** | O piso de referência | ATK/HP flat por nível |
| 3+4 | **Income + Custo (JUNTOS, nunca solteiros)** | São um casal | **segundos por upgrade** (a razão — não cada um sozinho) |
| 5 | **Poder do gear por nível** | Quanto cada compra move o TTK | +flat e +% por nível (linear, literal) |
| 6 | **Paredes e portas** | O ritmo da caminhada | spike de entrada de área, level gates |
| 7 | **Prestige** | Só depois que existe um ciclo pra resetar | o que zera / o que fica / o que paga / a Oferenda |
| 8 | **Tempero** | Multiplicadores em cima do bolo pronto | crit, raros desproporcionais, jackpot, imposto de morte |

Evidência de campo: o Gaiadon fitou income+custo como uma coisa só (custo
idêntico entre slots, income derivado pra dar ~segundos-por-upgrade no
early) — mesmo movimento do nosso "custo começa em 5K, deriva o income".

## O ciclo de decisão de CADA parte (4 passos, papéis fixos)

1. **Frase de sensação** (DONO): "quero que a primeira compra chegue
   rapidinho, mas a décima já peça escolha". O dono explica por sensação/
   exemplo — NUNCA interrogá-lo sobre número exato (fable-mode).
2. **Critério mensurável** (ORQUESTRADOR): traduzir — "1ª compra ≤ 15s de
   farm; 10ª ≥ 60s". Escrever ANTES de abrir o sim.
3. **Sim, nunca teoria** (EXECUTOR roda, orquestrador julga):
   `tools/sim.js` roda os módulos reais. Número que não passou pelo sim não
   existe. Justificar toda mudança com output do sim.
4. **Jogar e ajustar** (DONO): o sim acerta a matemática; só a mão do dono
   no jogo acerta a sensação. (O "mob congelado no Lv1" que virou o P10
   nasceu do passo 4, não do sim.)

## As 5 formas que resolvem ~90% do gênero (cardápio fechado)

Da autópsia do Gaiadon — quando um sistema novo aparecer, a PRIMEIRA
pergunta é "qual destas formas ele usa?", e o fit vira rotina:

1. **Linear** → o que o jogador toca toda hora (stat por nível de gear:
   +15, +15, +15... legível e honesto; sem retorno decrescente).
2. **Linear→exponencial** → custos: `(base + slope·N) × r^N` (generoso no
   early — no Gaiadon medimos +0.73K/nível constante; sink no late —
   r≈1.0014, dobra a cada ~495 níveis).
3. **Exponencial com gap** → HP do inimigo acima do dano "de nível" do
   jogador (gap ≈ 0.5 de expoente): a Wall é ESTRUTURAL, upar nunca fecha
   o gap sozinho — gear/passiva/rito são obrigatórios por construção.
4. **Exponencial ACIMA do HP** → income (P3, o espetáculo): o gold cresce
   mais rápido que a dificuldade; no endgame do Gaiadon, gold/min cresce
   ordens de magnitude acima do HP por World Tier.
5. **Escada geométrica** → gates de prestige (Gaiadon: Lv150→300→590→1000→
   1500; Oferenda 10M→30M; recompensa DOBRA por rito). Nossa escada de
   Convergence é a mesma forma.

Regra estrutural que amarra tudo (medida no save do Gaiadon, cadeia
verificada com 3 dígitos contra a tela): **dentro de um sistema, o
crescimento é linear/aditivo; ENTRE sistemas (fontes), os fatores se
MULTIPLICAM** — total = flat × (1+%) × mult × (camadas novas de update).
É o nosso flat/pct/mult do gear.js e o nosso Gear × Convergence × Awaken.

## Checklist de 5 perguntas para QUALQUER sistema novo (antes de balancear)

1. **Qual sensação ele serve?** (spike? throughput? espetáculo? melt?)
2. **O que custa e em qual moeda?** (gold líquido? material raro? tempo?)
3. **O que sobrevive a reset?** (define se é poder de run ou permanente)
4. **Em qual balde paga?** (flat / % / multiplicador — mult é raro e forte)
5. **Qual o modo de falha?** (forte demais mata o quê? fraco demais, quem
   o ignora?)

Exemplo-gabarito (Ascension do Gaiadon): serve o melt da re-subida / custa
level + gold (Oferenda) / gear sobrevive (~82% do poder atravessa) / paga em
flat-por-nível DOBRADO / se fosse forte demais trivializaria o early — por
isso o gate dobra a cada rito.

## Sinais de alarme (padrões que já nos morderam)

- **Casal separado**: fitar custo sem re-checar income (ou vice-versa) —
  sempre re-medir "segundos por upgrade" depois de mexer em qualquer um.
- **Um número, dez efeitos**: mudou curva de inimigo → re-rodar TTK, TTD,
  XP/min e tempo-até-gate juntos (o sim faz isso; não confiar em olhômetro).
- **Push prematuro deve ser auto-punitivo, não bloqueado**: o Gaiadon deixa
  entrar na área seguinte e a punição é econômica (XP/min PIOR + morte come
  ~25% do gold líquido). Elegante: ensina o Loop sem tutorial.
- **Teto baixo re-erguido > curva infinita**: caps por sistema erguidos por
  tier/update (MAX_EQUIPMENT_LEVEL progressivo, moons cap 240) — a escada
  nunca fecha, mas cada degrau é finito e legível.

## Estado atual da fila (jul/05) — carne pendente, esqueleto pronto

O esqueleto do Mapa 1 está DECIDIDO (P1–P10 em DECISOES_DONO.md — não
reabrir). Ordem da carne:

1. Fit da curva de custo de gear: quadrático → linear·exponencial (achado
   do estudo Steam; estrutura `gearCostBase/Linear/Exp` já existe — é fit,
   não refactor). ~1 sessão de sim.
2. Re-verificar o casal income+custo (segundos por upgrade, áreas 1–6).
3. Decisão do dono: adotar imposto de morte (~25% dos Lumens líquidos)?
4. Rodada 4 já pautada (P9_REBALANCE §4): árvore 100%, afixos novos,
   First Light novo.

Uma de cada vez, cada uma com a frase de sensação escrita ANTES do sim.
