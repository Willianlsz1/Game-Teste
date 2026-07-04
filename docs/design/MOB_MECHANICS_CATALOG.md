# Catálogo de mecânicas de mob + contra-passivas (SPEC vivo)

> Criado no grill de jul/04/2026. Princípio do dono, travado nesta sessão:
> **tranca-e-chave** — mecânica de mob e passiva nascem em PARES. A passiva só
> faz sentido se a ameaça existe; a ameaça só é justa se a resposta é
> comprável. Objetivo declarado: o ATK dos mobs passa a IMPORTAR quando o
> jogador não está preparado. Números pelo método `P9_REBALANCE.md §2.6b`;
> nada trava sem sim. Nomes de jogo em inglês (canon).

## 1. Trancas que JÁ existem (P8, travadas) e o estado das chaves

| Tranca | Efeito | Chave hoje | Gap |
|---|---|---|---|
| Lightshell | absorve os primeiros N golpes do jogador | nenhuma real | ⚠️ sem chave |
| Quickened | mob ataca +40% mais rápido | HP/DR/Bulwark (genéricas) | ok |
| Siphoning | cura-se de fração do dano que causa | só out-damage | ⚠️ sem chave |
| Escorted | enche a onda até o teto | Cleave (parcial) | vai apertar com a onda 4–5 (rodada 4) |

## 2. Pares NOVOS (ideias do dono ★ + Fable; nenhum travado)

### Chaves para trancas existentes

**★ Shatterlight** (ideia do dono) — X% de chance por golpe de ESTILHAÇAR o
Lightshell inteiro (todas as cargas de uma vez, com "clang" visível). Fecha o
gap #1. Forma: passiva de árvore (folha mecânica), padrão B (cap de chance
baixo no tier de estreia).

**★ Piercing Light** (ideia do dono) — golpes do jogador ATRAVESSAM o alvo e
acertam o mob de trás com Y% do dano. Difere do Cleave (Cleave = só o
overkill do golpe FATAL; Pierce = TODO golpe vaza). É a chave natural da
onda 4–5 aprovada na rodada 4 — mais atacantes = mais pressão = pierce
responde. Forma: passiva de árvore; padrão B (Y% com cap). Cuidado de
orçamento: Pierce + Cleave juntos derretem ondas — dimensionar os dois caps
UM contra o OUTRO.

**Stanch the Draught** — a cura dos inimigos (Siphoning, escolta que cura
boss) é reduzida em X%. Fecha o gap do Siphoning e prepara o finale (Okhra é
Siphoning). Padrão B.

### Trancas novas (fazem o ATK do mob importar) + suas chaves

**Duelist (mob)** — *(forma final do dono, jul/04)* — X% de chance por golpe
de causar DANO EXTRA (golpe pesado, ×Y). O "crit do mob": ameaça constante e
aleatória, não só na entrada. Chave: **Damage Reduction** — o eixo JÁ EXISTE
(Hardened Light na árvore + afixo) e finalmente ganha emprego visível ("é o
DR que amortece o golpe pesado"). Par sem passiva nova.
*(Versão anterior — 1º golpe ×2 fixo — substituída pelo dono.)*

**Withering (mob)** — golpes aplicam 1 stack de decay (a luz do Seeker
apagando: % do HP máx por segundo, acumulável). Transforma TTD em recurso
ativo. Chave: **Purifying Flame** — cada kill limpa 1 stack (sinergia com o
loop de kills; sustain segue identidade da árvore).

**Frenzied (mob)** — *(forma final do dono, jul/04)* — abaixo de 35% do HP o
mob ENFURECE: ataca mais rápido E com mais dano. Termine a luta ou sofra.
Chave: **JÁ EXISTE** — Executioner's Light (execute ≤8%) é a resposta
perfeita; par completo sem passiva nova (liga duas peças já pagas).

**Veiled (mob)** — *(forma final do dono, jul/04)* — X% de chance de ESQUIVAR
o golpe do jogador (anti-atk-speed; punição a builds só-velocidade). Chave:
**True Sight** — ignora/reduz a esquiva. Nota de review (Fable): % de miss
pode frustrar em idle — o dono escolheu a forma de chance mesmo assim;
validar sensação no playtest quando estrear (magnitude baixa + feedback
visual de "veil" no miss).

## 2b. Validação e adições da mineração de skills do Gaiadon (jul/04)

O Gaiadon confirma os pares do §2 (detalhe em `GAIADON_NUMBERS.md §5d`):
**Slay** (kill instantâneo, não-boss) = nosso Executioner's Light ✓ ·
**Splash** (ataque básico atinge todos) = Piercing Light ✓ · rank atkSpeed
crescente + Incursion resistance/penetration/dread = "ATK de mob importa" é
padrão do gênero no endgame. E os mobs base deles são mais POBRES que os
nossos (só o affix Corrupted) — nossas 4 assinaturas já estão à frente.

Candidatos NOVOS vindos da mineração (registrar, não desenhar agora):

**Light Remembers** (dos Retained Knowledge/Ascension; ✅ ABSORVIDO como
bônus do First Light na mesma sessão — ver P9 rodada 4) — após a Convergence,
começa no nível N (comprável, N sobe por nível). QoL de re-subida DIRETO —
candidato forte pra Árvore II e pro alvo aspiracional re-subida ≤2. Cuidado:
interage com o relógio inteiro (pula XP early) — fit obrigatório.

**Onslaught** (deles, tier 5 Steam) — onda maior como COMPRA do jogador
(+1 mob na tela por nível, até o cap da área). Inverte a onda 4–5 da rodada 4:
em vez de imposição do mapa, escolha de farm (mais risco, mais renda).
Avaliar na rodada 4 qual dos dois modelos (imposto vs comprável) serve o
Mapa 1 — ou imposto no Mapa 1 e comprável como passiva no Mapa 2.

## 3. Onde cada par entra (proposta de faseamento)

- **Mapa 1 (rodada 4, junto da onda 4–5):** NENHUMA tranca nova — o P8 está
  travado e o Mapa 1 é introdução (§2.8). Avaliar APENAS se Piercing Light
  precisa estrear junto da onda 4–5 (se o sim mostrar TTD apertado demais).
- **DECISÃO DO DONO (grill jul/04): o Lightshell fica SEM CHAVE no Mapa 1,
  de propósito** — a tranca sem resposta é fricção introdutória que cria o
  desejo; Shatterlight chega na Árvore II como recompensa ("lembra daquele
  escudo? agora você quebra"). Não reabrir sem nota de playtest.
- **Mapa 2 / Árvore II (Tier 2):** os pares novos estreiam aqui — os mobs do
  Porto→Mapa 2 ganham as trancas (Duelist/Withering/Frenzied/Veiled) e a
  Árvore II vende as chaves (Shatterlight, Piercing Light, Stanch, Steadfast
  Arrival, Purifying Flame, True Sight) ao lado das já registradas (Overcrit,
  Second Wind, banco do Golden Wake).
- Regra permanente: tranca e chave entram no MESMO patch, com sim medindo o
  antes/depois da chave comprada.

## 4. Método de número (referência)

Trancas: magnitude via fit (padrão A — TTD/mortes nos alvos §2.7). Chaves:
cap de design + rampa (padrão B). Par calibrado JUNTO: o gate do sim é "a
tranca sem chave machuca mas não trava; com chave maxada, neutraliza ~70–80%
(nunca 100% — a ameaça não pode sumir)".
