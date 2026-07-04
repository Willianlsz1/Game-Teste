# Catálogo de bônus de gear — Mapa 1 e além (SPEC vivo)

> Criado no grill de jul/04/2026 a pedido do dono ("preciso de ideias para os
> bônus do gear"). Uso: cardápio de DESIGN — o dono escolhe a lista; números
> saem do método `P9_REBALANCE.md §2.6b` (fit / cap+rampa / orçamento) e
> travam só com sim. Nomes de jogo em inglês (canon).
>
> Regras de composição (travadas pelo desenho atual):
> - Cada peça = 2 afixos primários (Common) + 1 assinatura (Uncommon).
> - Cada peça responde UMA pergunta: Weapon "como mato mais rápido?" ·
>   Armor "como não morro?" · Gloves "precisão" · Boots "ritmo" ·
>   Helmet "crescimento" · Cloak "riqueza".
> - Gear NÃO duplica chave da árvore (sustain, Lightbane, Harbinger's Bane,
>   Deep Memory são identidade da Árvore I).
> - Mapa 1 = degustação: toda mecânica nova nasce com cap baixo (§2.8).

## 1. Os 12 em jogo hoje (v8 — fitados e validados)

| # | Nome | Peça | Efeito | Balde | Escala |
|---|---|---|---|---|---|
| 1 | Gilded Edge | Weapon | ATK flat | flat | A (fit) |
| 2 | Searing Light | Weapon | ATK % | increased | A |
| 3 | Riven Edge (Cleave) | Weapon ✦ | overkill vaza pro próximo (≤25%) | mecânica | B (cap 25) |
| 4 | Sealed Vessel / Golden Seam | Armor | HP flat / HP % | flat/increased | A |
| 5 | Last Vessel (Bulwark) | Armor ✦ | DR dobra abaixo de 35% HP | mecânica | B (cap 20) |
| 6 | Bare Hand's Instinct | Gloves | Crit chance | flat | C (orçamento crit ~45) |
| 7 | Crackfinder + Fracture Sense ✦ | Gloves | CritDmg flat + % | flat/increased | A |
| 8 | Pathfinder's Pace | Boots | Attack speed (degraus) | flat | C (cap ×2 Mapa 1) |
| 9 | Momentum | Boots ✦ | +atkSpeed por kill, 3 stacks/6s | mecânica | B |
| 10 | Watcher's Lens / Steadfast Guard | Helmet | XP % / DmgRed | flat | A / C (cap DR 75) |
| 11 | Gilded Fringe / Fortune's Weave | Cloak | Lumens flat (degraus) + % | flat/increased | A |
| 12 | Ember Trail / Second Sight / Corona Call | Boots/Helmet ✦/Cloak ✦ | Rarity Find (caps 30/15/5%) | flat (degraus) | B |

## 2. Candidatos NOVOS (ideias Fable, jul/04 — nenhum decidido)

### Eixo economia/relógio (o coração do idle)

**Gleaner's Hook — Material Find.** +X% de chance de material (comum e/ou de
Awaken) por kill. *Peça natural: Cloak ou Helmet.* Balde: flat com cap.
Escala: B. **Nota de engine: os hooks `matCommonPct`/`awakenMatPct` JÁ EXISTEM
em `economy.js:104-106`** — implementação quase grátis. É o único afixo
possível que toca os DOIS relógios do jogo (promoção e First Light) — por
isso mesmo, cap pequeno e fit obrigatório (mexe no dial mais sensível).

**Overflow (Gilded Excess) — overkill vira XP.** O excesso do golpe fatal
retorna como XP. Par simétrico do Overkill Echo (folha da árvore, overkill→
Lumens) — fecha o tema "nenhum golpe é desperdiçado". *Peça: Helmet
(crescimento).* Escala: B (% do overkill, cap baixo).

**Harbinger's Toll.** Harbingers/bosses dropam +X% de recompensas (Lumens,
materiais). Spike de boss, não melhora o farm comum. *Peça: Cloak.* Escala: B.

### Eixo dano com CARA (spike, não throughput)

**Dawnstrike — First Strike.** O primeiro golpe em cada inimigo causa +X% de
dano. Spike de ENTRADA: brilha exatamente na parede de área nova (HTK 8–12
vira 7–10) e no trash pós-Convergence (ajuda o 1-hit). Lore perfeita ("every
dawn began as one refusal to go dark"). *Peça: Weapon ou Gloves.* Escala: B.

**Echo Strike (Fifth Light).** A cada N golpes, o golpe ecoa (repete com X%
do dano). Ritmo visível e contável — o jogador VÊ o quinto golpe brilhar.
*Peça: Gloves.* Escala: B (X% sobe, N fixo). Cuidado: parente do Overcrit
(golpe extra) — se entrar, o Overcrit do Mapa 2 precisa se diferenciar.

**Shellbreaker.** Golpes contra Lightshell consomem 2 cargas do escudo.
Counter-mechanic legível contra o modificador mais frustrante. *Peça: Weapon.*
Escala: B (degraus: 2 cargas → cap). Nicho: só aparece vs Corona/Harbinger.

### Eixo defesa dramática

**Last Light — Death Ward.** 1× por run (ou por área), sobreviver ao golpe
fatal com 1 HP e ganhar Bulwark cheio por Ns. Transforma a morte-limite em
história ("quase morri"). *Peça: Armor (2ª assinatura futura) ou Helmet.*
Escala: B (cooldown desce com nível). Sinergia: mortes com intenção (§2.7) —
suaviza a punição da entrada prematura SEM apagá-la.

### Candidatos vindos da mineração completa do Gaiadon (jul/04 — §5b do GAIADON_NUMBERS)

**Hollowing Light — Enemy HP Reduction.** Mobs nascem com −X% do HP máximo.
Funciona como dano multiplicativo, mas LÊ diferente (o mundo enfraquece diante
de você — lore fortíssima pro Seeker). No Gaiadon: 0.05 base +0.01/100 níveis
(minúsculo de propósito — eles tratam como afixo de prestígio). *Peça: Weapon
ou Helmet.* Escala: B com cap BEM baixo no Mapa 1 (ex.: ≤5%). Cuidado: mexe na
família de HP → qualquer número exige re-fit do relógio.

**Seeker's Tally — Kill Count Bonus.** Cada kill conta ×N (ou +X%) para
CONTADORES — no nosso caso, o threshold do Harbinger ("stirs in N kills").
Traduz "quero invocar o boss mais rápido" em afixo. No Gaiadon alimenta o Rage
da arma. *Peça: Boots (ritmo).* Escala: B (degraus). Sinergia direta com o
bossKillThreshold existente — implementação barata.

**Registrados como validação (não candidatos):** GOLD_CRIT_RATE do Gaiadon =
nosso Golden Wake (folha da árvore) — o gênero confirma o desenho; spawn-rates
de Elite/Champion = nosso Rarity Find (idem).

### Descartados com motivo (não reabrir sem argumento novo)

- **Lifesteal em gear** — sustain é identidade da ÁRVORE (Regeneration/Heal
  on Kill); duplicar mata a escolha Provisão×Caça.
- **Thorns/reflect** — com TTD 25s e dano recebido baixo na banda, reflete
  centavos; invisível.
- **+Pontos de Convergence em gear** — chave da folha Deep Memory (árvore).
- **Set bonus (Gaiadon)** — dono descartou (jul/04): completar as 6 não é
  decisão, é inevitabilidade; sem prêmio extra.
- **-respawnDelay** — dial global de pacing no engine; gear não toca relógio
  de spawn.

## 2b. DECISÃO DO DONO (grill jul/04) — matriz nova do Mapa 1

Escolhas do dono sobre o cardápio: entram **chance de Lumens 2× em gear**
("Twice-Gilded", Cloak — segunda fonte do Golden Wake, orçamento conjunto no
cap 10%) e **Enemy HP Reduction com % pequena** ("Hollowing Light", Helmet —
substitui Steadfast Guard/DR, que era redundante com árvore+Bulwark). Rarity
Find MANTÉM o trio diluído em 3 peças (Ember/Lumen/Corona em Boots/Helmet/
Cloak). Regra explícita do dono: **NÃO espalhar ATK por várias peças à la
Gaiadon** — cada peça mantém uma identidade, ATK mora só na Weapon. Os demais
candidatos do catálogo (Gleaner's Hook, Dawnstrike, Seeker's Tally etc.)
ficam em estoque, não decididos. Números-candidatos no §2c; travam só com sim
(rodada 4 — Hollowing Light toca o HP efetivo dos mobs → re-validar relógio).

## 2c. Números-candidatos das entradas novas (método §2.6b; PROPOSTA, não travado)

| Afixo | Peça | Forma | Rampa proposta | Cap Mapa 1 |
|---|---|---|---|---|
| Twice-Gilded (Lumens 2×) | Cloak (substitui Fortune's Weave) | perStep, sem mult de raridade (como Rarity Find) | +0.25%/100 níveis | 4% (árvore re-orçamentada p/ 6% → soma = goldenWakeCap 10%) |
| Hollowing Light (enemy −HP%) | Helmet (substitui Steadfast Guard) | perStep, sem mult de raridade | +0.25%/100 níveis | 5% |
| **Fortune's Torrent (Lumens 4×)** | **Cloak ✦ assinatura (substitui Corona Call)** | perStep | a fitar | ≤5%; rola ANTES do 2×, não empilham |

**Corona Call SAI do Mapa 1 (decisão do dono, jul/04):** com o tier Corona
eliminado do pré-awaken (First Light o revela — ver P9 rodada 4), o afixo
seria inerte E estragaria a revelação ("melhor que o player não saiba").
Princípio travado: **Corona é REVELAÇÃO — zero menção em UI pré-awaken**
(matriz de stats, Rarity Find, tooltips). Corona Call encontra lar no Mapa 2
ou é absorvido pelo The World Kindles.

## 2d. DECISÃO DO DONO (grill jul/04) — economia de promoção em DOIS materiais (Mapa 1)

Inspirado no padrão grind+chave do Gaiadon (§5e do GAIADON_NUMBERS: partes
5% + receita 2%): **a promoção passa a consumir material do tier atual E do
tier de destino** — Common→Uncommon = material comum (massa) + material
INCOMUM (chave); no Mapa 2, Uncommon→Rare = incomum + raro; regra geral:
`promover para N+1 consome mat(N) + mat(N+1)`.

- **Entra no MAPA 1** (ordem do dono) — não espera a Forge do Mapa 2.
- Consequências mapeadas (rodada 4, números via sim): criar o DROP do
  material incomum no Mapa 1 (hoje só existe commonMaterial; o hook
  `uncommonMaterial` já existe em economy.js:84) — proposta: fonte rara à la
  receita do Gaiadon (~2–5%, elites/Corona/boss, áreas mais fundas) ·
  quantidades do par (ex.: 50 comum + N incomum) fitadas pro momento de
  promoção atual não atrasar o relógio 36±2 · Forge exibe os dois contadores.
- **Lembrete do dono (registrado):** hoje há 1 material genérico por tier;
  ADICIONAR MAIS TIPOS depois (à la partes por slot do Gaiadon — Armor
  part/Anvil/Sword part). Fora de escopo agora.

## 3. Como escalar qualquer escolhido (resumo do método §2.6b)

1. FORMA: eixo → balde → peça → cap Mapa 1 (baixo; expressão plena = mapas
   futuros).
2. NÚMERO: relógio → fit (A) · mecânica → cap na mão + rampa aritmética (B) ·
   eixo saturável (crit/DR/atkSpeed) → orçamento de teto (C).
3. Sim nas seeds 1/3/7; qualquer troca na matriz atual = re-fit (rodada 4).
