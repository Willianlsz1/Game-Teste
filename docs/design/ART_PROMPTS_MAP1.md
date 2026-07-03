# Kit de Prompts — Arte do Mapa 1 (ChatGPT imagens)

> Pipeline travado (jul/2026): reboot total via ChatGPT imagens. Este doc é o kit de trabalho.
> A chave de arte vem da lore (`DECISOES_JUL26.md §8`) — travada, não reinventar.

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
- **Porto Afundado (áreas 10–18):** `Palette: drowned blue-greens and cold slate, pale teal for the carried light, waterlogged wood and verdigris bronze. Accent: deep violet in the shadows.`
- **Tags de raridade (mobs acesos):** Ember = teal glow · Lumen = blue glow · Corona = violet glow (o glow da tag SOBREPÕE a luz normal da criatura).

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

**Direção travada pro visual dos Harbingers (dono, jul/2026):** designs únicos e
incomuns, ar de criatura que COMANDA (boss) — nunca "mob grande". **Espécies variadas,
não necessariamente humanoides:** elfos, anões, reis, sereias, seres etéreos, demônios
etc. — cada Harbinger é de uma espécie/natureza diferente. Quando a espécie pedir rosto
humanoide, ele é humanoide-mas-inumano/eerie (canon de boss). Ingredientes das
referências do dono: melancolia nobre (serenidade + veias escuras) · carisma teatral
(pose, adornos, presença) · silhueta de divindade (manto que engole o corpo, filigrana
dourada, ponto luminoso pequeno no alto da forma vertical).

### Background de área
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
**Design JÁ APROVADO na lore — o prompt descreve o design travado, não inventa.** Okhra: maré vertical em espiral, tentáculos grossos, carga afogada em silhueta (mastro, torre de sino, peixes, lanterna teal fraca), boca-redemoinho com anel quebrado em filigrana dourada. (Nihel: ver §8 — é conteúdo de mapa final, não gerar agora.)

## Ordem de produção (espelha o roadmap)

| Lote | Chat | Assets |
|---|---|---|
| 1 | Mobs Floresta | os 4 iniciais (Candlewisp Shade, Mothlight Herald, Dreamhorn Warden, Mirelight Drifter) → aprovar estilo → os outros 6 |
| 2 | Harbingers A | H1 Hollow Cantor · H2 Bramble King · H3 Gilded Hollow (+ os 6 reservados refeitos, quando a lore escolher os titulares) |
| 3 | Backgrounds A | áreas 1–9 |
| 4 | *(depois do import da lore do Porto)* | bestiário novo do Tema B → H4/H5/H6 → backgrounds 10–18 |
| 5 | Finale | Okhra (design aprovado) + palco da manifestação |

## Especificações técnicas (padrão dos arquivos)

- **Sprites:** PNG fundo transparente, quadrado (1024×1024 da geração; o jogo redimensiona), criatura ocupando ~80% da altura.
- **Backgrounds:** 16:9 (1536×864+), sem personagens, meio-de-cena aberto.
- **Nomes de arquivo:** snake_case igual aos atuais (`candlewisp_shade.png`) — trocar o arquivo em `assets/enemies/` e `assets/areas/` não exige mexer em código.
- Antes de substituir em massa: valide 1 sprite no jogo (proporção no card do inimigo).
