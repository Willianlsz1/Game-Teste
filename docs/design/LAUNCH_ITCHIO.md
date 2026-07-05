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
