# Roteiro de Arte & UI — Mapa 1

> Criado jul/2026 na virada pós-balance (escada P0–P8 fechada). Guia da fase de design.
> Dono: Willian. Referências visuais: boards no Pinterest, 1 por etapa.

## O inventário real (extraído do código, jul/2026)

| Categoria | Existe | Falta |
|---|---|---|
| Mobs distintos | 10 (todos com PNG) | Tema B usa mobs da FLORESTA como placeholder — o bestiário do Porto não existe |
| Harbingers | H1–H3 com arte | **H4 (Drowned Bell) · H5 (Hollow Fleet) · H6 (Tidebound Choir) — sem arte** |
| Okhra (boss do mapa) | — | **sem arte** (sprite 🌊) + o palco da Maré (`.okhra-manifest` é só um tint CSS) |
| Backgrounds de área | 9 (Floresta) | **9 do Porto Afundado** |
| Reservados | 6 Harbingers da floresta têm arte (waking_bloom, drowned_lantern, moonlit_sovereign, stillwater_maiden, gilded_confessor, heartroot_mourner) | decisão de lore: quais 3 viram titulares |
| UI | HUD/modais/ícones funcionais | pele visual (skin), World Map do Porto, painel Lights, palco do finale |

## Vocabulário mínimo (os termos, sem mistério)

- **Sprite** — a imagem de um personagem/mob, recortada (fundo transparente). O que fica no "card" do inimigo.
- **Background** — a imagem de fundo do cenário da área.
- **HUD** — os números e barras sempre visíveis por cima do jogo (HP, Lumens, XP).
- **Modal** — a "janela" que abre por cima de tudo (Gear, Forge, Convergence, Awaken, Passives). Já existem os 5; a fase de arte é dar pele, não criar novos.
- **Banner** — faixa decorativa com título (ex.: nome da área no topo).
- **Mood board** — mural de referências (o board do Pinterest É isso).
- **Style guide / direção de arte** — 1 página que fixa: paleta de cores, estilo do traço, iluminação. É o que faz 30 artes parecerem do MESMO jogo.
- **Silhueta** — o contorno da criatura. Boss bom se reconhece pela silhueta antes da cor.
- **Paleta** — o conjunto fechado de cores permitidas.

## A regra de ouro da ordem

**Comece pelo que o jogador olha 90% do tempo, na ordem em que ele vê.** O jogador passa o jogo inteiro olhando o palco de combate (mob + fundo), e decide se fica nos primeiros 30 minutos (Grupo 1). Modais e botões são onde ele passa segundos. Então: palco antes de UI, começo do jogo antes do fim, e NUNCA arte de um conteúdo cuja lore não existe ainda.

## As etapas

### Etapa 0 — Direção de arte (1 sessão, ANTES de qualquer imagem)
Uma página só, feita a partir dos boards: paleta (fundo escuro + dourado dos Lumens + as 3 cores de raridade travadas: Ember teal / Lumen azul / Corona violeta) · estilo do traço (escolher UM: pintado/painterly, flat, pixel…) · regra de luz (TODA criatura carrega luz roubada — a luz vem DELA, não do ambiente; isso já está na linguagem visual dos Nihelim, DECISOES_JUL26 §8) · formato padrão dos arquivos (PNG transparente, mesmo tamanho por categoria).
**Por quê primeiro:** refazer 10 mobs sem isso = 10 estilos diferentes.

### Etapa 1 — O palco do G1 (a primeira impressão)
Backgrounds das áreas 1–3 · refazer os sprites dos 4 mobs iniciais (Candlewisp Shade, Mothlight Herald, Dreamhorn Warden, Mirelight Drifter) · **H1, The Hollow Cantor** (o primeiro "uau" do jogo, ~35min de jogo).

### Etapa 2 — Resto da Floresta (áreas 4–9)
Sprites restantes do Tema A · H2 (Bramble King) e H3 (Gilded Hollow) · backgrounds 4–9 (os 9 existem — decidir o que refaz).
**Gancho pro Porto (travado jul/2026):** os backgrounds 7–9 introduzem indícios do Tema B na borda da cena (sal, água parada subindo, verdete, madeira encharcada) — a descida se anuncia antes da virada.

### Etapa 3 — Porto Afundado: LORE ANTES DE ARTE ⚠️
O bestiário do Tema B **não existe** (as áreas 10–18 reusam mobs da floresta como placeholder). Ordem obrigatória: importar o doc do Porto (pendência 6 do HANDOFF) → definir 4–6 mobs novos + nomes → SÓ ENTÃO: backgrounds 10–18, sprites novos, **H4/H5/H6** (hoje sem arte nenhuma).

### Etapa 4 — O finale (a cena mais importante do jogo)
**Okhra** (sprite grande, silhueta de maré faminta) · o palco da manifestação (a troca de background quando H6 o invoca — hoje é um tint; virar cenário próprio) · o visual da Maré subindo (a escolta chegando em ondas).

### Etapa 5 — Pele da UI (por último, é pele e não osso)
HUD · os 5 modais · **World Map em 2 atos (travado jul/2026): tela A = áreas 1–9 (Floresta), tela B = áreas 10–18 (Porto), com navegação entre elas** — o Porto precisa de traçado e arte de mapa própria · painel Lights · banner de área · ícones que faltarem. Aqui entram também os renomes no código (Kindled/Luminous/Radiant → Ember/Lumen/Corona) e os copy fixes registrados.

## Fluxo Pinterest → prompt (por asset)

1. Board da etapa; 3–5 referências por asset.
2. Pra cada referência, escreva UMA linha: "o que essa imagem tem que eu quero" (a pose? a luz? a textura?). Isso vira o prompt.
3. Prompt = linguagem visual da lore (§8) + as linhas das referências + a regra de luz da Etapa 0.
4. Gerou/recebeu a arte → teste NO JOGO antes de aprovar (a arte que funciona isolada às vezes morre em cima do background).

## Decisões do dono ✅ (jul/2026)
1. **REBOOT TOTAL de arte** — com os Nihelim a temática do mapa mudou; todos os mobs ganham arte nova (⚠️ flag de lore: se além da ARTE o dono quiser trocar NOMES/roster do bestiário da floresta, é decisão de lore a travar antes dos prompts — os 10 nomes atuais são canon).
2. **Pipeline: IA — ChatGPT imagens.** Kit de prompts em `ART_PROMPTS_MAP1.md` (bloco de estilo mestre + templates por categoria + fluxo de consistência).
3. **Os 6 Harbingers reservados também são refeitos** (sem reaproveitamento). A decisão de lore "quais 3 viram titulares" segue aberta.
4. **Identidade do Tema A travada (jul/2026):** "a floresta que roubou a Lua e dorme sonhando" — física de sonho, Lua enjaulada, céu sem-lua cinzento. Detalhe por área em `DECISOES_JUL26.md §4b`. **Ordem de produção travada: backgrounds antes de mobs** (arte se aprova sobre o fundo real; o fundo escuro é o que faz a luz roubada funcionar).
5. **World Map em 2 atos (jul/2026):** ver Etapa 5 e `DECISOES_JUL26.md §4b`.

## Vantagem herdada da lore (não redescobrir)
A **chave de arte já está travada** em `DECISOES_JUL26.md §8`: cel-shaded limpo + detalhe deliberado, blocos de cor "água de vitral", filigrana onde importa, detalhe = forma (NUNCA ruído), silhueta vertical fechada, fundo neutro, 1 ponto focal luminoso. **Okhra e Nihel já têm design aprovado em arte.** Marca de família dos Nihelim: o eco do anel quebrado. A Etapa 0 então se reduz a: paleta por tema (Floresta vs Porto) + o bloco de estilo mestre em inglês pros prompts.
