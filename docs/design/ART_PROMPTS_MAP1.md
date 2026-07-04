# Kit de Prompts — Arte do Mapa 1 (ChatGPT imagens)

> Pipeline travado (jul/2026): reboot total via ChatGPT imagens. Este doc é o kit de trabalho.
> A chave de arte vem da lore (`DECISOES_JUL26.md §8`) — travada, não reinventar.

## ⚠️ PROCESSO ANTI-DERIVA DE ESTILO (dono, jul/03 — após 5 versões do Okhra saírem "pintura")

Quando o estilo teima em sair errado, o problema é PROCESSO, não prompt:
- **Edição em cadeia herda o render da imagem editada** — as palavras de estilo perdem
  pra imagem na frente do gerador. NUNCA tentar consertar estilo via "edite mantendo tudo".
- **O chat ancora**: geração nova no mesmo chat herda o estilo das anteriores.
- **Prompt longo dilui**: 400 palavras de lore afogam 20 de estilo.

Receita quando o estilo derrapar (ou pra personagens novos importantes):
1. **Chat 100% NOVO.** Anexar SÓ imagens que JÁ SÃO o estilo-alvo (pra anime key visual:
   as refs de anime do dono + o sprite do Seeker). ZERO imagens do estilo errado — nem
   "só pro design": o gerador não separa design de render de uma imagem anexada.
2. **Rosto primeiro:** gerar um RETRATO EM BUSTO do personagem (o rosto domina o
   orçamento de pixels → sai bem + o estilo trava no chat). Aprovar o retrato.
3. **Só então o corpo inteiro:** "full body of this exact character" — o retrato
   aprovado ancora rosto E estilo.
4. **Prompt curto**: estilo nas primeiras linhas E repetido no fim; design em lista
   telegráfica; lore fica fora (lore é nossa, não do gerador).

## Como usar (o fluxo, passo a passo)

1. **Um chat por categoria** (mobs da floresta / Harbingers / backgrounds / finale). A IA "lembra" do estilo dentro do mesmo chat — isso é sua ferramenta de consistência nº 1.
2. **Primeira mensagem do chat = o BLOCO DE ESTILO (abaixo) + a primeira criatura.** Quando sair uma imagem que você ame, diga "use esta imagem como referência de estilo para as próximas" — âncora de consistência nº 2.
3. **Uma criatura por geração.** Nunca peça duas na mesma imagem.
4. **Sempre peça fundo transparente** para sprites (o ChatGPT gera PNG transparente se pedir). Backgrounds não (são a cena inteira).
   ⚠️ Lições do Lote 1 (jul/2026), acrescentar ao prompt de TODO sprite:
   *"REAL transparent background (alpha PNG). The creature must be FULLY OPAQUE with a
   closed, complete silhouette — dark parts must have a drawn edge, never fading into
   the background. Clean image: no floating butterflies, sparkles or scattered dust."*
   (Se vier fundo preto com a criatura desbotando pro preto, o meio do corpo fica
   irrecuperável no recorte — regenerar, não recortar.)
5. Gerou → **teste no jogo** (troca o PNG em `assets/`, F5). Arte só é aprovada em cima do background real.
6. Referências do Pinterest: anexe 1–2 no chat com a linha "o que eu quero desta imagem é ___" (a pose, a luz, a textura — nunca "faça igual").

## O BLOCO DE ESTILO MESTRE (colar no início de todo chat, em inglês)

```
Art style (use this EXACT style for every image in this chat):
Clean cel-shaded game art with deliberate detail. Crisp dark outlines,
layered flat color blocks like stained glass, fine filigree details only
where they matter. Detail means DRAWN SHAPES — never noise, speckle,
grain or scribble. Closed vertical silhouette, neutral dark background,
exactly ONE luminous focal point on the creature.
World rule: this is a world where light is dying. Every creature CARRIES
stolen light inside or on its body — the light comes FROM the creature,
never from the environment. Environment light is dim, cold and ashen.
Format: single character, full body, centered, transparent background PNG.
```

## Paleta por tema (anexar ao bloco conforme o chat)

- **Floresta (áreas 1–9):** `Palette: deep forest greens and umber shadows, warm amber/gold for the carried light, muted moss and bark tones. Accent: candle-flame orange.`
- **Porto Afundado (áreas 10–18)** *(travada jul/03 das refs do Okhra — `refs_okhra.jpg` + lore doc §1)*: `Palette: deep drowned teal (#175A57 to #0E3B3B) and storm-black marine shadow (#081418), pale grey-green foam (#AEBFBD), verdigris bronze (#4E8C7A) on digested metal, luminous teal (#41D9C5) for harbour lanterns. Gold (#E7B84C) ONLY for stolen light. NO red.`
- **Tags de raridade (mobs acesos):** Ember = teal glow · Lumen = blue glow · Corona = violet glow (o glow da tag SOBREPÕE a luz normal da criatura).

## ⚠️ REGRA-MESTRA DE ESTILO (dono, jul/03, após o avatar do Okhra v1): LEGIBILIDADE

O estilo da casa NÃO é cel-shaded puro — é **ilustração de tinta detalhada** (contornos
nítidos, hachura fina — família Darkest Dungeon). O que separa arte aprovada de arte
reprovada é **LEGIBILIDADE**, e o exemplar canônico é o background da área 16
(`abyssal_shelf.png`): "limpa e conseguimos ver os visuais".

**UM ESTILO DA CASA (decisão final do dono, jul/03, após a saga do Okhra):**
**ilustração de tinta detalhada** (contornos nítidos, hachura fina — o acervo aprovado
inteiro; exemplar: `lanternjaw_angler.png`). Os experimentos "anime key visual" e "flat
estilizado" foram testados no Okhra e DESCARTADOS — quebravam a coerência do conjunto.
O problema real nunca foi o estilo: era rosto ilegível.

**REGRA DO ROSTO (dono, jul/03 — a lição da saga):** toda cabeça/rosto precisa de
**OLHO DESENHADO E VISÍVEL** — globo ocular com estrutura (esclera/pupila, órbita,
arcada) como as órbitas leitosas do Lanternjaw — NUNCA só um ponto de luz no lugar.
Não precisa ser ultra-detalhado; precisa LER como olho. Frase de prompt: *"VISIBLE
DRAWN EYES — pale orb eyeballs with small dark pupils set in defined sockets under a
brow ridge — never glowing dots, never empty light."* O orçamento de detalhe fino do
sprite vai primeiro pro rosto (pontos focais da regra de legibilidade).

Todo prompt de agora em diante declara as 4 leis da legibilidade:
1. **Formas grandes primeiro** — a silhueta e as massas principais leem a 100px de
   distância; o detalhe mora DENTRO de formas simples, nunca no lugar delas.
2. **Detalhe concentrado nos pontos focais** (rosto/luz/assinatura do design) — o resto
   do corpo tem áreas de DESCANSO visual (blocos escuros quase chapados).
3. **Três camadas de valor bem separadas**: massa escura · meio-tom · UM brilho focal.
   Se tudo é meio-tom detalhado, a imagem "vira pintura" e reprova.
4. Frase de prompt: *"CLEAN and READABLE like a game asset: big simple shapes first,
   detail only at focal points, large areas of visual rest, three clearly separated
   value layers. NEVER uniform detail density."*

## ⚠️ Lições do Lote 4 — mobs do Porto (jul/03, feedback do dono)

O trio v1 da área 10 saiu **pintura realista monocromática** (tudo cinza, sem cel-shading,
sem detalhe único). Regras pra TODO prompt de criatura do Tema B daqui em diante:

1. **Re-declarar o estilo em TODA geração** (não confiar na memória do chat):
   *"Clean cel-shaded game art: crisp dark outlines, layered FLAT color blocks,
   stained-glass shading — NOT painterly, NOT photorealistic, NO watercolor or
   airbrush texture."*
2. **Âncora de família = sprite aprovado do Tema A anexado** ("match the rendering
   style of this attached sprite") — a paleta muda pro Porto, o RENDER não muda.
3. **Sincronia de cor ≠ monocromia.** Cada mob recebe: (a) material dominante
   próprio · (b) UM acento secundário próprio dentro da paleta do Porto ·
   (c) **1 detalhe-assinatura ornamentado** que o torna único (a lanterna, as boias
   de vidro, as moedas de latão...). Distribuir espuma/verdete/teal/madeira
   deliberadamente — nunca entregar um mob de uma cor só.
4c. **Variedade DENTRO da família (dono, jul/03, após H4): frio ≠ monocromia.**
   A base fria (teal/verdete/espuma) segue dominando, mas cada mob leva **UM acento
   de matiz próprio** que os outros não têm — violeta profundo, azul abissal,
   marfim-osso, cobre frio, verde-alga, azul-gelo — e **nunca dois mobs seguidos
   com o mesmo acento**. Declarar o acento no prompt ("accent color of THIS
   creature: deep violet — no other creature in this set uses it"). Acentos
   atribuídos aos mobs 6–10: ver mapa de variedade no lore doc (§4b).
4b. **Cores do Porto ≠ cores da Floresta (dono, jul/03, após mobs 4–5):** o Strangler
   e o Diver saíram com marrons QUENTES dominantes (corda/couro) que leem como Tema A.
   Daqui em diante: **teal profundo / verdete / espuma pálida DOMINAM a leitura** do
   sprite; marrom só frio, dessaturado e coadjuvante; nada de âmbar/dourado-quente
   exceto a luz roubada. E o cel-shaded ainda não pegou: se a geração vier painterly
   (gradientes suaves, textura de pincel), **REJEITAR e regenerar** — não aprovar por
   cansaço; testar o prompt de estilo como PRIMEIRA linha e pedir explicitamente
   "flat cel shading like a modern animated game, hard-edged shadow shapes".
4. **Régua Pinterest (dono, jul/03): cada mob tem que valer como imagem sozinho.**
   O prompt de cada criatura declara explicitamente: **silhueta-base própria**
   (vertical curvada / serpentina horizontal / radial / nó / massa assimétrica /
   baixa-larga / etérea / espiral...) + **pose com atitude** (nunca "parado de
   frente") + **esquema de cor próprio** (2–3 blocos dominantes distintos do mob
   anterior) + **1 ideia-conceito forte** que dá vontade de olhar de novo.
   Anti-convergência: se a geração sair parecida com outro mob do lote, gerar em
   chat novo sem o histórico. Mapa de variedade dos 10 mobs do Porto: ver
   `docs/lore/mapa1_tema_b_porto_afundado.md §4b` (adendo jul/03).

## Templates por categoria

### Mob comum (sprite)
```
[BLOCO DE ESTILO] + [PALETA DO TEMA]
Creature: <nome>, a <descrição em 1-2 frases: o que é, postura, tamanho relativo>.
It carries its stolen light as <onde a luz mora: lanterna no peito, olhos, seiva...>.
Mood: <1 palavra: mournful / feral / hollow / vigilant>.
```

### Harbinger (chefe de grupo — sprite maior, mais filigrana)
```
[BLOCO DE ESTILO] + [PALETA] +
This is a HARBINGER — a lieutenant of the light-thieves. Larger, more
ornate: add gold filigree details and a FAINT broken-ring motif somewhere
in its design (crown, halo, collar, wheel — a ring that does not close).
Its stolen light is hoarded, not carried: <onde/como ele acumula luz roubada>.
```
(O anel-que-não-fecha é a marca de família Nihelim — nos Harbingers aparece FRACO/incompleto, eco do eco.)
⚠️ **Regra do vermelho (REVISADA jul/03 — dono aboliu o banimento total):** vermelho
é PERMITIDO como cor de design — vermelho+preto é combinação poderosa e entra quando
o DESIGN pedir (com parcimônia; nem tudo leva). O que continua SELADO é o
comportamento da assinatura (§5): **"vermelho que não ilumina"** (brilho que não lança
luz em nada ao redor) é exclusivo do Nihel/Nil Aeternum — nenhuma arte do Mapa 1 usa
esse efeito. Na prática dos prompts: vermelho só aparece quando NÓS escrevemos ele no
prompt deliberadamente; se o gerador enfiar vermelho por conta própria onde não foi
pedido, regenera (a decisão é de design, nunca do gerador).

**Direção travada pro visual dos Harbingers (dono, jul/2026):** designs únicos e
incomuns, ar de criatura que COMANDA (boss) — nunca "mob grande". **Espécies variadas,
não necessariamente humanoides:** elfos, anões, reis, sereias, seres etéreos, demônios
etc. — cada Harbinger é de uma espécie/natureza diferente. Quando a espécie pedir rosto
humanoide, ele é humanoide-mas-inumano/eerie (canon de boss). Ingredientes das
referências do dono: melancolia nobre (serenidade + veias escuras) · carisma teatral
(pose, adornos, presença) · silhueta de divindade (manto que engole o corpo, filigrana
dourada, ponto luminoso pequeno no alto da forma vertical).

### Background de área

⚠️ **Regra dos backgrounds do Tema B (dono, jul/03 — após bg 13 v1):** cena "fisicamente
plausível" é REPROVADA por definição — o mundo do Éclats é mágico, a física real não se
aplica (ver `eclats-surreal-biomes`). TODO background do Porto carrega os 4 ingredientes:
1. **Pedaços da cidade engolida em física impossível** — torre de cabeça pra baixo, rua de
   paralelepípedos ondulando como fita, praça pendurada por correntes, escada em espiral
   sem prédio (gramática Escher: estrutura familiar + orientação errada).
2. **UMA presença meio-vista ao fundo** ("algo te assistindo"): dois pontos de luz teal na
   escuridão distante, ou uma silhueta colossal que não cabe no quadro (lição Sunless Sea:
   basta quase nada — luz onde não devia haver luz).
3. **Micro-vida errada** — cardume parado em formação de gente, lanterna acesa em janela
   afogada, porta que se abre sozinha na corrente.
4. **Luz como evento**: escuro por padrão, cada fonte de luz é preciosa e intencional.
```
Art style: clean cel-shaded game environment, layered flat color blocks,
crisp shapes, no noise or grain. Wide 16:9 scene, NO characters.
A dying world where ambient light is dim and ashen — any visible light
sources are small, stolen, and precious.
Scene: <descrição da área a partir do blurb em data.js + a IMAGEM
IMPOSSÍVEL da área (DECISOES_JUL26.md §4b — física de sonho do Tema A)>.
[PALETA DO TEMA]
Composition: open middle ground (creatures render in front), darker at
the edges, one distant point of faint light for depth.
```
Tema A: a identidade travada é "a floresta que roubou a Lua e dorme sonhando" —
todo background da Floresta expressa física de sonho (nada de floresta genérica);
o ponto de luz distante É a Lua presa vazando pelo dossel. Backgrounds 7–9:
adicionar indícios do Porto na borda (sal, água subindo, verdete, madeira encharcada).

### Okhra e Nihel
**Okhra em DUAS formas (revisão do dono, jul/03):** o corpo verdadeiro é a MARÉ (refs_okhra.jpg — vive nos backgrounds: vórtice, garganta, palco do finale); o sprite de boss é o **AVATAR quase-humanoide descido do cosmo** — sereno, belo e errado, juba de tentáculos d'água, olhos fechados (os abertos ficam bordados no manto), halo = anel de filigrana dourada QUEBRADO atrás da cabeça, glaive de maré endurecida, vestes negro-teal com a cidade engolida na barra. Prompt canônico: ver lore doc §6. (Nihel: ver §8 — conteúdo de mapa final, não gerar agora.)

## Ordem de produção (espelha o roadmap)

| Lote | Chat | Assets | Status |
|---|---|---|---|
| 1 | Mobs Floresta | 10 mobs da floresta | ✅ jul/03 (10/10 aprovados in-game) |
| 2 | Harbingers A | H1 Hollow Cantor · H2 Bramble King · H3 Gilded Hollow | ✅ jul/03 (fluxo: forma → refs do dono → prompt) |
| 3 | Backgrounds A | áreas 1–9 + World Map Ato A (map1.png + medalhões) | ✅ jul/03 |
| 4 | *(depois do import da lore do Porto)* | bestiário novo do Tema B → H4/H5/H6 → backgrounds 10–18 → map2.png (Ato B) | ⏳ PRÓXIMO — bloqueado pela lore |
| 5 | Finale | Okhra (design aprovado §8) + palco da manifestação | — |

**Fluxo vigente pra criaturas (jul/03, ordem do dono):** o agente propõe NOME + FORMA →
o dono caça referências → o prompt é construído SOBRE as refs (anexadas no chat com
linhas "From this reference I want ___"). Harbingers = espécies variadas (ver direção
acima). Faces de mobs NUNCA convergem (variar material/olhos/temperatura/silhueta).

## Especificações técnicas (padrão dos arquivos)

- **Sprites:** PNG fundo transparente, quadrado (1024×1024 da geração; o jogo redimensiona), criatura ocupando ~80% da altura.
- **Backgrounds:** 16:9 (1536×864+), sem personagens, meio-de-cena aberto.
- **Nomes de arquivo:** snake_case igual aos atuais (`candlewisp_shade.png`) — trocar o arquivo em `assets/enemies/` e `assets/areas/` não exige mexer em código.
- Antes de substituir em massa: valide 1 sprite no jogo (proporção no card do inimigo).

## Licao 5 — LEI DE COR: nunca monocromatico (dono, jul/04)

"O mundo nao e composto por uma unica cor." Toda arte (mob, background, tile
de passiva, icone) especifica uma COMBINACAO de cores no prompt: corpo numa
familia, luz noutra, ambiente numa terceira, e um acento (quente ou frio) no
coracao. Nunca "tudo teal", nunca "tudo dourado". Exemplo canonizado
(Regeneration, tile pv_2): folha esmeralda + bordas teal + ambiente
azul-violeta + sussurro rosa-morno no nucleo. Padrao dos tiles de passiva:
formato TILE de ponta a ponta com fundo navy embutido (#0A1226-#101A38),
sujeito GRANDE, legivel a 64px, sem moldura/texto (a moldura e do jogo).

### Licao 5b (refinamento do dono, jul/04): espectro inteiro + identidade por passiva

A combinacao de cores NAO se limita a paleta da casa (teal/violeta/dourado):
todo o RGB e permitido. E cada passiva tem IDENTIDADE cromatica propria (a
cor-ancora dela na arvore), com a combinacao interna da Licao 5 construida ao
redor dessa ancora. Mapa de identidades dos 16 tiles: ver tabela na secao de
passivas (proposta Fable, veredito do dono pendente por tile, 1 a 1).
