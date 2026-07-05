# LAUNCH — Mapa 1 jogável no itch.io (SPEC viva da trilha de lançamento)

> Criada jul/04 (pedido do dono). Roda EM PARALELO ao fit do paradigma
> (zero balance). Regra de conflito: enquanto o fit não bakear, NENHUM lote
> desta trilha toca `data.js` — texto de lore que more lá espera o fit
> aterrissar. UI SEMPRE em inglês.
>
> **✅ Aprovado pelo dono (jul/04):** tabela de gatilhos do L2 como está
> (Passivas abrem sozinhas na 1ª Convergence; Awaken no 1º material incomum;
> Corona zero menção pré-rito) · corte de lore da v1 = L4 como está (cartões
> de área + ritos + Harbingers; journal colecionável fica pra pós-launch).

## Fases (ordem de execução)

### L1 — Menu & Settings (sem dependências; PRIMEIRO)
Botão de menu (⚙) na HUD → modal no padrão visual das telas existentes:
- **Save:** indicador de autosave · Save now · Reset save (confirmação dupla).
- **Export save:** JSON do save em base64 → copiar pro clipboard + download .txt.
- **Import save:** colar string / upload de arquivo → valida → aplica → reload.
- **Display:** botão Fullscreen + UI scale (Small/Default/Large — multiplicador
  de font-size root). "Resolução" em jogo HTML = isso; canvas é responsivo.
- Rodapé: versão do jogo + link itch/credits (placeholder).

### L2 — Revelação progressiva das HUDs (o coração do onboarding)
Telas/botões NASCEM ocultos e aparecem por gatilho, com beacon (pulso visual)
+ 1 linha de intro na primeira vez. Tabela de gatilhos (aprovada pelo dono,
ajustável por playtest):

| Elemento | Nasce | Aparece quando | Primeira vez |
|---|---|---|---|
| Battle + Gear | visível | — (é o jogo) | hint "upgrade your gear" no 1º acúmulo de Lumens |
| Forge | oculto | 1º material dropa | beacon + "The Forge remembers fire." |
| World Map | oculto | porta da área 2 batida | beacon + "The grove deepens." |
| Convergence | oculto | ~80% do 1º gate de nível | beacon + tooltip do que é (sem spoiler de pontos) |
| Passives (World Tree) | oculto | 1ª Convergence concluída | a tela abre SOZINHA na 1ª vez (o prêmio é a revelação) |
| Awaken | oculto | 1º material INCOMUM dropa (G3+) | beacon + "A distant light calls." — onboarding do rito (o que é, o que dá, requisitos) |
| Corona (tier) | oculto | pós-First Light (canon The World Kindles) | revelação do rito — zero menção antes |

### L2.5 — Onboarding GUIADO nos desbloqueios (dono, jul/04 — evolução do beacon)

O pulso passivo do L2 vira **spotlight de 2 passos** a cada sistema novo:
1. No desbloqueio: tela escurece levemente, o botão novo fica iluminado com
   indicador apontando + 1 linha ("The Forge has awakened — open it").
   Clicar fora PULA o guia (marca como visto).
2. Dentro da tela nova, UM spotlight no elemento central + 1 linha:
   Forge → botão de promoção · World Map → nó da próxima área · Convergence →
   botão de convergir · Passives → nó First Spark (a tela já abre sozinha) ·
   Awaken → painel de requisitos (materiais + Offering).
Nunca repete (flags `d.hints` do sistema existente). O beacon dourado
continua existindo APENAS como fallback se o jogador pular o passo 1.
Rodar APÓS o lote P-UI-1 (mesmos arquivos de HUD).

### L3b — Intro v2: o juramento da Ordre (dono, jul/04 — substitui o card genérico)

Reframe canônico (LORE_COMPLETE: "O Seeker entra na Ordre como qualquer
iniciante… absorve Le Premier Éclat sem saber"): a intro vira uma CENA em 3
tempos (fade-in encadeado, mesma tela, skippável):
1. **A Ordre** — "Since the light broke, the Ordre des Éclairés has kept the
   roads. Its Seekers hunt what the light left twisted — and the world
   sleeps safer for it."
2. **O juramento** — "Today you take the oath. An Éclat is set into your
   hands — routine, they say. Yet something in its light seems to remember
   you." (NUNCA revelar que é a Semente/importância — mistério é canon.)
3. **A primeira missão** (bloco estilizado como ordem de missão com selo da
   Ordre) — "FIRST ASSIGNMENT — THE DREAMING WOOD · The forest that stole
   the Moon. Villages at its edge report shades among the trees. Hunt them.
   Gather the Lumens they shed. Return stronger." Botão: **"Accept"**.
Arte dedicada `assets/ui/intro_bg.png` (dono gera; fallback = awaken_bg até
chegar). Área 1 = primeira missão TAMBÉM no jogo: o cartão de área do L4
para a área 1 usa o registro de missão ("First assignment"), amarrando
intro→gameplay.

### L3 — Onboarding dos primeiros minutos
- Intro curta (1 tela, skippável): 3–4 linhas de lore situando o Seeker no
  bosque + o verbo do jogo ("fight, gather Lumens, grow").
- Hints contextuais one-shot (dispensáveis, nunca modais bloqueantes):
  1º level-up de gear · 1ª morte ("the light retreats, not you") · 1ª
  promoção de raridade · 1º Harbinger counter visível.
- Tudo persiste em save (hints não repetem).

### L4 — Lore através do jogo (DEPOIS do fit bakear — texto mora perto de data.js)
- Cartão de área na 1ª entrada (nome + 1–2 linhas, arte do bg já existe).
- Linha de manifestação de cada Harbinger + intro do Okhra.
- Textos do rito do Awaken (First Light) e da 1ª Convergence.
- Fonte: docs/LORE_COMPLETE.md + eclats_lore.md — adaptar, não inventar.

### Lotes de polimento da tela de batalha (crítica jul/04, decisões do dono)

**Lote P-UI-1 (aprovado; rodar APÓS o L3 pra não conflitar nos arquivos de HUD):**
"GOLD/MIN"→"LUMENS/MIN" · "DMG"→DPS real (dano×cadência) · barra de HP do
inimigo em cor única esvaziando · Chronicle agrupa kills repetidos ("×3"),
linha individual só pra evento (drop/revelação/Harbinger/área) · **botões da
toolbar SEM brilho dourado permanente** (dono, jul/04: desbloqueado = moldura
normal; tela aberta = marcação sutil; pulso dourado é EXCLUSIVO do beacon
one-shot do L2).

**Decisões do dono na crítica:** Lv do mob FICA visível (será sempre
relevante) · pause/reset são botões de teste; arte do ⚙ o dono faz ·
contador de Harbinger só nas áreas de Harbinger (comportamento correto).

**Pendente de aprovação (item 6):** placa única do Seeker (nome+Lv+barras
numa moldura) com marcador da porta da próxima área na barra de XP.

### L6 — Navegação: telas próprias, não modais (dono, jul/05)

Virada estrutural: **acabar com os modais-overlay**. Toda tela (Gear/Equipment,
Forge, Awaken, Convergence, Settings) vira uma VIEW de tela cheia consistente
com as que já são full-screen (Passives, World Map): viewport inteiro, arte de
fundo própria onde existe, um **X** consistente no topo pra voltar ao combate.
Combate/idle continua rodando por baixo (não pausa). Uma tela por vez; X (ou
ESC) volta ao combate. **Todos os ícones LIBERADOS** por enquanto — o sistema
de revelação progressiva (L2) + spotlight (L2.5) + beacons fica DORMENTE (não
apaga o código; o dono vai repensar o onboarding). A intro do juramento
(introSeen) permanece. L4 (lore/cartões) foi pausado e será relançado SOBRE
esta estrutura nova. [[ui-art-decal-principle]]

### Botões secundários — 🅿️ REENCAMINHAMENTO PENDENTE (dono, jul/05)

O dono reprovou a arte de botão-barra ESCURA (`btn_frame.png`) e pediu "outro
encaminhamento" pro tratamento de botões secundários/comuns. Assets mortos
removidos (`btn_frame.png` + `kit/btn.png`). **MANTIDO e em uso:** botão
CERIMONIAL dourado (`kit/btn_gold.png` → `.kit-btn-ceremonial`: Accept,
Converge, Awaken, Promote) — aprovado por contexto na cena do juramento. Botões
comuns seguem em CSS sóbrio (`.kit-btn2`) até o dono definir o novo rumo da
arte de botão secundário. **Não regenerar btn-bar escura sem o dono reabrir.**

### Fila de UI (ordem do dono, jul/05)

Ordem de implementação definida pelo dono:
1. **Ícones da toolbar** (EM ANDAMENTO — dono gera a arte). Frameless (só o
   símbolo, sem moldura baked), **cel-shading**, **cores variadas por sistema**
   (Gear=aço/azul · World Map=bússola teal · Convergence=violeta · Forge=âmbar
   · Passives=verde · Awaken=dourado). Fundo transparente, silhueta que lê a
   40px. Orquestrador: instalar + montar chip de CSS neutro + estados
   hover/ativo (sai a moldura baked). Ver `combat-hud`/`ui-art-decal-principle`.
2. **Mover Passivas PARA DENTRO da Convergence** (DECISÃO DO DONO, na fila — só
   implementar quando ele sinalizar). Tela combinada: ação de convergir +
   saldo de pontos no TOPO, a **World Tree** no CORPO (gasta os pontos ali). O
   **ícone de Passivas SAI** da toolbar (Convergence abre a tela combinada).
   Cuidados: o fit de stage da árvore recalcula embutido; o spotlight/reveal
   das passivas passa a apontar dentro da Convergence. Layout default =
   empilhado (topo converge + corpo árvore); alternativa = abas Converge/Tree.
3. **Distribuição/posição dos mobs + mover o Seeker pra direita** (dono faz o
   layout; orquestrador ajusta o que for código quando pedido).

### L5 — Empacotamento itch.io — **🔒 CONGELADA PELO DONO (jul/04)**

> **Não executar em nenhuma sessão.** O dono sente que o nível de polimento
> ainda não é o que ele quer; a L5 só destrava quando ELE declarar
> explicitamente "pode empacotar/lançar". Nenhum agente prepara zip, página
> ou upload antes disso — nem como "adiantamento".
- Zip do jogo (index.html raiz + assets; sem node) · teste no iframe do itch
  (localStorage funciona; export/import do L1 é o seguro contra limpeza).
- Título/favicon/meta · página itch (cover, GIF, descrição) — arte do dono.
- Checklist final: save antigo migra · performance · fullscreen no iframe.

## Definition of done da trilha
Um jogador novo, sem explicação externa, entende o loop nos primeiros 5
minutos, descobre cada sistema na hora certa (nunca antes), e consegue
salvar/exportar/importar e jogar em fullscreen no itch.io.
