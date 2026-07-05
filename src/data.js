// data.js — conteúdo do jogo (fonte da verdade)
// Balanceamento = mexer só aqui. Nenhuma lógica.

G.data = {
  // afixos exibidos como % (não flat) — fonte única; gear.buildPiece e ui.statMatrixHtml leem daqui
  pctStats: ["crit", "critDmg", "xpBonus", "lumensBonus", "rarityFindEmber", "rarityFindLumen",
    "rarityFindCorona", "cleave", "bulwark", "overcrit", "momentum", "damageReduction",
    "twiceGilded", "fortuneTorrent", "hollowing"],  // P9 r4: novos afixos exibidos como %

  // Tiers do Seeker (visual progression)
  tiers: [
    { level: 1,    name: "Seeker",     code: "T1" },
    { level: 10,   name: "Illuminate", code: "T2" },
    { level: 25,   name: "Éclairé",    code: "T3" },
    { level: 50,   name: "L'Éveillé",  code: "T4" },
    { level: 100,  name: "Lumière",    code: "T5" },
  ],

  // 6 slots de gear (fixos, nunca dropam)
  slots: [
    { id: "weapon", label: "Weapon", icon: "⚔️" },
    { id: "helmet", label: "Helmet", icon: "🪖" },
    { id: "armor",  label: "Armor",  icon: "🛡️" },
    { id: "gloves", label: "Gloves", icon: "🧤" },
    { id: "boots",  label: "Boots",  icon: "🥾" },
    { id: "cloak",  label: "Cloak",  icon: "🧥" },
  ],

  // Base de cada peça. affixes[].base = valor no Lv.1, perLevel = ganho/nível.
  // valor final no Lv. N = base + perLevel × (N - 1)
  // P4.2a — a MATRIZ do Mapa 1: cada peça = 2 primários (Common) + 1 despertar (Uncommon).
  // labels = nomes-lore em inglês (mecânica travada). Despertar = ASSINATURA da peça (P9 §2.4):
  // cleave (weapon), bulwark (armor), critDmg% (gloves — overcrit saiu do Mapa 1, vira passiva
  // tier 2 no Mapa 2; engine inerte), momentum (boots), rarityFind{Lumen,Corona} (helmet/cloak).
  // Mecânicas no combat.js; caps Mapa 1 em §2.8.
  gearBase: {
    weapon: {
      name: "Worn Blade",
      affixes: [
        { id: "atk",  label: "Gilded Edge",   stat: "atk", layer: "flat", base: 0, perLevel: 55 },  // perLevel P9 r4: tools/p9 — não editar à mão, re-fitar (era 300)
        { id: "atkp", label: "Searing Light", stat: "atk", layer: "pct",  base: 0, perLevel: 1  },
      ],
      uncommonAffixes: [
        { id: "cleave", label: "Riven Edge", stat: "cleave", layer: "flat", base: 0, perLevel: 0.012, cap: 25 }, // % do overkill do golpe fatal transferido ao próximo vivo (combat)
      ],
    },
    helmet: {
      name: "Worn Helm",
      affixes: [
        { id: "xp",     label: "Watcher's Lens",  stat: "xpBonus", layer: "flat", base: 0, perLevel: 0.5 },
        // P9 r4: Steadfast Guard (DR) SAI (redundante com árvore Hardened Light + Bulwark), entra
        // Hollowing Light — inimigo spawna com −X% do HP máx (perStep, cap 5). Aplicado no _buildOne.
        { id: "hollowing", label: "Hollowing Light", stat: "hollowing", layer: "flat", base: 0, perStep: 0.25, step: 100, cap: 5 },
      ],
      uncommonAffixes: [
        { id: "rarityFindLumen", label: "Second Sight", stat: "rarityFindLumen", layer: "flat", base: 0, perStep: 0.25, step: 50, cap: 15 }, // P8.1 Rarity Find — +0.25% Lumen chance por degrau de 50 níveis (teto 15%)
      ],
    },
    armor: {
      name: "Worn Cuirass",
      affixes: [
        { id: "hp",  label: "Sealed Vessel", stat: "hp", layer: "flat", base: 0, perLevel: 22 },  // perLevel P9 r4: tools/p9 — não editar à mão, re-fitar (era 80)
        { id: "hpp", label: "Golden Seam",   stat: "hp", layer: "pct",  base: 0, perLevel: 2  },
      ],
      uncommonAffixes: [
        { id: "bulwark", label: "Last Vessel", stat: "bulwark", layer: "flat", base: 0, perLevel: 0.008, cap: 20 }, // dmgRed EXTRA só abaixo de 35% HP (combat); soma clampa em dmgReductionCap
      ],
    },
    gloves: {
      name: "Worn Gloves",
      affixes: [
        { id: "crit",    label: "Bare Hand's Instinct", stat: "crit",    layer: "flat", base: 0.05, perLevel: 0.0022 },  // perLevel P9 v8: tools/p9 (era 0.025)
        { id: "critDmg", label: "Crackfinder",          stat: "critDmg", layer: "flat", base: 0,    perLevel: 0.1   },  // FASE 2 R2: 1→0.1 — crit vira modificador modesto (critMult ~2×), não o dano inteiro (era one-shot no uncommon)
      ],
      uncommonAffixes: [
        { id: "critDmgP", label: "Fracture Sense", stat: "critDmg", layer: "pct", base: 0, perLevel: 0.01 },  // P9 v8: overcrit SAI do Mapa 1; uncommonAffix vira crit dmg % (engine do overcrit intacto no combat, sem fonte)
      ],
    },
    boots: {
      name: "Worn Boots",
      affixes: [
        { id: "atkspd",          label: "Pathfinder's Pace", stat: "atkSpeed",        layer: "flat", base: 0, perLevel: 0.0005, step: 25 },
        { id: "rarityFindEmber", label: "Ember Trail",       stat: "rarityFindEmber", layer: "flat", base: 0, perStep: 0.5, step: 50, cap: 30 }, // P8.1 Rarity Find — +0.5% Ember chance por degrau de 50 níveis (teto 30%)
      ],
      uncommonAffixes: [
        { id: "momentum", label: "Momentum", stat: "momentum", layer: "flat", base: 0, perLevel: 0.002, cap: 5 }, // +attack speed% por stack de kill (até momentumMaxStacks, momentumDuration s) — combat
      ],
    },
    cloak: {
      name: "Worn Cloak",
      affixes: [
        { id: "lumens",     label: "Gilded Fringe",   stat: "lumensBonus", layer: "flat", base: 5, perLevel: 0.2, step: 50, cap: 150 },
        // P9 r4: Fortune's Weave (lumensBP) SAI, entra Twice-Gilded — chance de Lumens 2× por kill,
        // em degraus (perStep, sem mult de raridade); soma com goldenWake (árvore) no goldenWakeCap 10 (combat).
        { id: "twiceGilded", label: "Twice-Gilded", stat: "twiceGilded", layer: "flat", base: 0, perStep: 0.25, step: 100, cap: 4 },
      ],
      uncommonAffixes: [
        // P9 r4: Corona Call SAI (Corona é revelação, zero menção em UI pré-awaken), entra
        // Fortune's Torrent — chance de Lumens 4× por kill (perStep, cap 5). Rola ANTES do 2× (combat); não empilham.
        { id: "fortuneTorrent", label: "Fortune's Torrent", stat: "fortuneTorrent", layer: "flat", base: 0, perStep: 0.3, step: 100, cap: 5 },
      ],
    },
  },

  // P10 fase1b (modelo Gaiadon §4.2 — salto front-loaded de raridade): o poder do gear mora na
  //   PROMOÇÃO, não no level-up dentro do tier. Common → Uncommon = statMult ×8 (o salto grande na
  //   1ª promoção), NA BANDA do ×11.5 do Gaiadon (Common 1.5 → Uncommon 17.25). Adaptado às NOSSAS
  //   raridades (Common/Uncommon — NÃO os tiers de luz Ember/Lumen/Corona, que são dos acesos/mobs).
  //   Mantido em 8 (não subido pra 11.5) porque a Wall (gap de expoente) está fitada em par com este
  //   salto — subir aqui exigiria re-fitar os buckets de HP. Fase 2 re-ancora se o feel pedir.
  rarities: [
    { id: "common",   name: "Common",   color: "#9aa7bd", cap: 500,  statMult: 1.0, costMult: 1.0 },
    { id: "uncommon", name: "Uncommon", color: "#7ec8a0", cap: 3000, statMult: 8, costMult: 2.0 }, // statMult ×8 = salto front-loaded (§4.2, banda do ×11.5 Gaiadon); costMult 2.0 = level-up mais caro no tier alto
    // Rare volta no Mapa 2 (diretriz do dono jul/2026)
  ],

  // ---- Awaken definitions ----
  // A ESTRUTURA dos requisitos é final; os NÚMEROS são PLACEHOLDERS. area = nº
  // da área (1-based). materials consome awakenMaterials.
  awakens: [
    {
      id: "first_light",
      name: "First Light",
      tier: 1,
      lore: "In the astral hush, the light you carry stirs for the first time, and answers.",
      requirements: {
        area: 18,
        crown: true,
        materials: { firstLight: 40000 },  // FASE 2 (fitter jul/05): 100000→40000 — re-ancorado ao G6 novo (material pinga do boss/comum sem virar parede-de-farm; ver drops em economy.js)
        // P8 (Oferenda de Lumens): além dos materiais, o First Light exige uma oferenda ONE-TIME
        //   de Lumens (consumida no rito) — sink temático de fim de mapa (devolver a luz colhida).
        //   Na casa do acumulado da fase final de UMA run (P3 acelera renda × P6 desacelera custo).
        //   PROVISÓRIO — o fit final ancora no Lumens acumulado medido no fim do mapa. — DIAL
        lumens: 6.0e16,  // FASE 2 R3 (fitter jul/05, dono OPÇÃO A): 6e13→6e16 — escalado ×S=1000 em par com goldBuckets/gearCostBase (renda e custo do jogo inteiro sobem ×1000; a Oferenda tem que subir junto pra continuar a MESMA fatia do acumulado de UMA run no G6). É a fatia dominante do acumulado de UMA run no G6, consumida no rito — sink temático, NÃO gate de farm (não atrasa o clear além do nível 6000+crown+material)
      },
      // P9 rodada 4 (§9): piso ×5 ATK / ×3 HP (fitado EM PAR com o Okhra hpMult).
      // lumensBonus flat REMOVIDO. As mecânicas de revelação/re-subida/escudo do rito:
      //   worldKindles → revela o tier Corona no mundo (pré-awaken NÃO spawna nem aparece
      //     em UI) e abre os caps de Rarity Find (pós = rarityCapsAwakened).
      //   lightRemembers → re-subida pós-Convergence começa no nível = X% do MAIOR nível
      //     já alcançado (persistido em state.highestLevel).
      //   vesselOfDawn → o Seeker absorve os N primeiros golpes recebidos de cada onda.
      bonus: { atkMult: 5, hpMult: 3, worldKindles: true, lightRemembers: 0.10, vesselOfDawn: 2 },
    },
  ],

  // ---- Rarity Find (P8.1) — mobs "acesos" carregam luz roubada ----
  // Base 0%: sem gear nem Marcos, só Common spawna. A cor conta a história: quanto mais
  // luz a criatura carrega, mais rara e mais forte. Roll em combat._buildOne, do mais raro
  // pro mais comum (Corona → Lumen → Ember → Common); cada tier: chance = min(find, cap).
  //   • Gear ACHA  → rarityFind* (afixos em degraus de 50 níveis) sobe a chance.
  //   • Marcos ABREM o teto → cada Harbinger morto pela 1ª vez levanta os caps em 1/6.
  // Ladder de cor (assinatura): Ember(teal) → Lumen(azul) → Corona(violeta). Ver docs/design/RARITY_FIND.md
  // Poder ~×3/×6/×10 (hp/atk; lumens acompanham a hp via goldRatio, xp via rewardMult).
  // P5 (recompensa DESPROPORCIONAL dos acesos): rewardMult (Lumens/XP/material) MUITO acima do
  //   hpMult, com o RATIO reward/hp CRESCENDO por tier — caçar aceso vira a economia central.
  //     Ember  = bônus claro   (rew 6 / hp 2  → ratio ~3×)
  //     Lumen  = achado        (rew 24 / hp 4 → ratio ~6×)
  //     Corona = jackpot       (rew 130 / hp 10 → ratio ~13×, na banda Gaiadon 10–15× hpMult)
  //   hpMult mantém o mob "aceso" mais grosso (mais tempo de TTK), mas a recompensa dispara.
  //   rewardMult multiplica xp em _buildOne e (via lumens = base×rewardMult) a renda de Lumens.
  //   Números PROVISÓRIOS (DIAL por tier) — o fit final re-deriva mantendo o ratio crescente.
  rarityTiers: [
    { key: "corona", findKey: "corona", tag: "Corona", color: "#9d7bff",
      hpMult: 10, atkMult: 3, rewardMult: 130,   // P5: jackpot (~13× hpMult). P8.2: cada Corona rola exatamente 1 modificador (combat._buildOne)
      names: ["Lumin Tyrant", "Veilbreaker", "Hollow Warden", "Gilded Reaver", "Dawnscourge"] },
    { key: "lumen", findKey: "lumen", tag: "Lumen", color: "#4fa8ff",
      hpMult: 4, atkMult: 2, rewardMult: 24,     // P5: achado (~6× hpMult)
      names: ["Luminal Wraith", "Éclat Splinter", "Hollow Sovereign", "Veil Incarnate", "Shard of Luce"] },
    { key: "ember", findKey: "ember", tag: "Ember", color: "#5ee0d2",
      hpMult: 2, atkMult: 1.5, rewardMult: 6,     // P5: bônus claro (~3× hpMult)
      names: ["Pale Wanderer", "Dusk Remnant", "Mist Shard", "Fractured Echo", "Gilded Wisp"] },
  ],
  // ---- Modificadores de combate (P8.2/P8.3/P8.4) ----
  // SÓ Corona (rola exatamente 1, uniforme) e os Harbingers (assinatura FIXA) os carregam.
  // Aplicados em combat.js. Magnitudes de MOB e de BOSS separadas (boss estoura a banda HTK
  // 20–40 se usar a do mob; ajusta-se a magnitude do boss, nunca o hpMult calibrado).
  //   • Lightshell — absorve os primeiros N golpes do jogador (0 dano até acabar).
  //   • Quickened  — mob ataca +40% mais rápido (intervalo ÷ atkSpeedFactor).
  //   • Siphoning  — cura-se de healFrac do dano que causa ao herói (clamp no maxHp dele).
  //   • Escorted   — chega com onda CHEIA de comuns (enche até fullWave; se já cheia, +extra até cap).
  modifiers: {
    order:      ["lightshell", "quickened", "siphoning", "escorted"],
    lightshell: { label: "Lightshell", absorb: 3,   bossAbsorb: 8 },
    quickened:  { label: "Quickened",  atkSpeedFactor: 1.4 },
    siphoning:  { label: "Siphoning",  healFrac: 0.5, bossHealFrac: 0.5 },
    escorted:   { label: "Escorted",   fullWave: 3, extra: 1, cap: 4 },
    // The Tide Rises (P8.4): mecânica exclusiva do Okhra — re-invoca a escolta a cada `interval`s,
    // enchendo até `maxEscort` comuns vivos. Ajustado p/ ~4–5 subidas por luta.
    tide:       { interval: 10, maxEscort: 6 },
  },

  // Tetos máximos (%) do Rarity Find. P9 rodada 4 (§9 item 3): DOIS regimes —
  //   • pré-First Light: Ember 8 · Lumen 3 · Corona 0 (o tier Corona NÃO EXISTE — não
  //     spawna, não aparece em NENHUMA UI: princípio de revelação do The World Kindles).
  //   • pós-First Light (worldKindles): Ember 30 · Lumen 15 · Corona 5 — o rito revela
  //     o Corona e abre os caps. Os 6 Marcos ainda escalonam de 0→cap em 1/6 por morte.
  // state.stats() escolhe o regime lendo G.awaken.isDone("first_light").
  rarityCaps:         { ember: 8,  lumen: 3,  corona: 0 },  // pré-awaken (Corona gateado)
  rarityCapsAwakened: { ember: 30, lumen: 15, corona: 5 },  // pós-First Light (Corona revelado)

  // 6 Harbingers da floresta guardados (DECISOES_JUL26 §4) — sem função por enquanto
  reservedHarbingers: [
    { name: "The Waking Bloom",      sprite: "🌸", img: "assets/enemies/waking_bloom.png"      },
    { name: "The Drowned Lantern",   sprite: "🕯", img: "assets/enemies/drowned_lantern.png"   },
    { name: "The Moonlit Sovereign", sprite: "👑", img: "assets/enemies/moonlit_sovereign.png" },
    { name: "The Stillwater Maiden", sprite: "🪷", img: "assets/enemies/stillwater_maiden.png" },
    { name: "The Gilded Confessor",  sprite: "✝", img: "assets/enemies/gilded_confessor.png"  },
    { name: "The Heartroot Mourner", sprite: "🩸", img: "assets/enemies/heartroot_mourner.png" },
  ],

  // 18 sub-áreas do Mapa 1 — 6 grupos de 3 (Tema A · Floresta = 1-9, Tema B · Porto = 10-18).
  // Harbinger (boss) só na 3ª área de cada grupo (idx 2,5,8,11,14,17); fronteira de grupo = matar
  // o Harbinger. Dentro do grupo, a próxima área destrava por NÍVEL (levelRange[0]).
  areas: [
    {
      id: 1, name: "The Dreaming Wood", theme: "forest",
      blurb: "Where the Seeker first wakes. Soft auroras drip through ancient boughs, and here the light still dreams.",
      lore: "The Seeker wakes here because the forest allows it. The oldest boughs remember the Lumiere whole, and they dream it still, aurora dripping like sap. Nothing here wants to hurt you. That is what makes it a lie.",
      img: "assets/areas/dreaming_wood.png",
      levelRange: [1, 80],
      hp: [114, 342],  // re-fit único P1-P9: hp[0] dimensionado ao envelope de poder do jogador (TTK entrada ~6.5s -> derrete). hp[1] = hp[0]×3 (headroom; mob usa hp[0] fixo)
      enemies: [
        { name: "Candlewisp Shade",  sprite: "🔥", img: "assets/enemies/candlewisp_shade.png"  },
        { name: "Mothlight Herald",  sprite: "🦋", img: "assets/enemies/mothlight_herald.png"  },
        { name: "Dreamhorn Warden",  sprite: "🦌", img: "assets/enemies/dreamhorn_warden.png"  },
      ],
    },
    {
      id: 2, name: "The Lantern Mire", theme: "forest",
      blurb: "A drowned bog of guttering lanterns, where Fragmented souls lost themselves chasing the light.",
      lore: "Every lantern in the bog was lit by a Fragmented soul that believed the light would lead it home. The bog kept the lanterns and the souls both. They gutter, but they refuse to go out.",
      img: "assets/areas/lantern_mire.png",
      levelRange: [81, 171],
      hp: [3456, 10368],  // re-fit único P1-P9
      enemies: [
        { name: "Mirelight Drifter", sprite: "🏮", img: "assets/enemies/mirelight_drifter.png" },
        { name: "Candlewisp Shade",  sprite: "🔥", img: "assets/enemies/candlewisp_shade.png"  },
        { name: "Mothlight Herald",  sprite: "🦋", img: "assets/enemies/mothlight_herald.png"  },
      ],
    },
    {
      id: 3, name: "The Whispering Hollows", theme: "forest",
      blurb: "Hollow trees that sing the trapped light, their murmurs curling endlessly through the dark.",
      lore: "The hollow trees sing because light is trapped inside them, and trapped light does not stay quiet. Pilgrims once pressed their ears to the bark to hear it. Some are still listening. The Hollow Cantor conducts them.",
      img: "assets/areas/whispering_hollows.png",
      levelRange: [172, 276],
      hp: [29562, 88686],  // re-fit único P1-P9
      enemies: [
        { name: "Husklight Murmur",  sprite: "🌳", img: "assets/enemies/husklight_murmur.png"  },
        { name: "Dreamhorn Warden",  sprite: "🦌", img: "assets/enemies/dreamhorn_warden.png"  },
        { name: "Mirelight Drifter", sprite: "🏮", img: "assets/enemies/mirelight_drifter.png" },
      ],
      boss: { name: "The Hollow Cantor", sprite: "🎶", hpMult: 41, dmgMult: 2.0, signature: ["lightshell"], img: "assets/enemies/hollow_cantor.png" }, // P8.3 H1 = Lightshell. hpMult re-fit único: 22-25 HTK no 1º contato (banda 20-40)
    },
    {
      id: 4, name: "The Moonlit Canopy", theme: "forest",
      blurb: "The high canopy, nearest the aurora, where moths and wardens drift through a pale, restless glow.",
      lore: "Closest to the aurora, the canopy is where the forest touches what it lost. Moths carry flecks of pale light between the branches like offerings. The wardens do not guard the canopy. They guard the way down.",
      img: "assets/areas/moonlit_canopy.png",
      levelRange: [277, 396],
      hp: [444903, 1334709],  // re-fit único P1-P9
      enemies: [
        { name: "Boughlight Creeper", sprite: "🍃", img: "assets/enemies/boughlight_creeper.png" },
        { name: "Mothlight Herald",   sprite: "🦋", img: "assets/enemies/mothlight_herald.png"   },
        { name: "Husklight Murmur",   sprite: "🌳", img: "assets/enemies/husklight_murmur.png"   },
      ],
    },
    {
      id: 5, name: "The Sunken Grove", theme: "forest",
      blurb: "A flooded, mirrored grove, every still pool reflects the creeping Mist back at the Seeker.",
      lore: "The pools do not reflect the sky. They reflect the Mist, patient and creeping, wearing the faces of things that once drank here. The Seeker's own reflection arrives a moment late.",
      img: "assets/areas/sunken_grove.png",
      levelRange: [397, 534],
      hp: [1362792, 4088376],  // re-fit único P1-P9
      enemies: [
        { name: "Glasswater Wraith",  sprite: "💧", img: "assets/enemies/glasswater_wraith.png"  },
        { name: "Mirelight Drifter",  sprite: "🏮", img: "assets/enemies/mirelight_drifter.png"  },
        { name: "Boughlight Creeper", sprite: "🍃", img: "assets/enemies/boughlight_creeper.png" },
      ],
    },
    {
      id: 6, name: "The Gilded Thicket", theme: "forest",
      blurb: "A bramble of thorns where the golden corruption climbs, beautiful, and entirely wrong.",
      lore: "Here the gold began. It climbed the thorns like a beautiful infection, gilding everything it touched and hollowing everything it gilded. The Bramble King wears the first crown it ever made.",
      img: "assets/areas/gilded_thicket.png",
      levelRange: [535, 693],
      hp: [3859515, 11578545],  // re-fit único P1-P9
      enemies: [
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" },
        { name: "Candlewisp Shade",   sprite: "🔥", img: "assets/enemies/candlewisp_shade.png"   },
        { name: "Glasswater Wraith",  sprite: "💧", img: "assets/enemies/glasswater_wraith.png"  },
      ],
      boss: { name: "The Bramble King", sprite: "🥀", hpMult: 40, dmgMult: 2.0, signature: ["escorted"], img: "assets/enemies/bramble_king.png" }, // P8.3 H2 = Escorted. hpMult re-fit único: H2 é INSTÁVEL por natureza (1º contato salta de estado no cliff de prestígio G2/G3; HTK 1-224 entre seeds) — valor mediano aceito
    },
    {
      id: 7, name: "The Hollow Cathedral", theme: "forest",
      blurb: "A cathedral grown of living wood, where the Fragmented kneel and worship the captured light.",
      lore: "No one built the cathedral. The wood grew it around the kneeling Fragmented, arch by arch, as if the forest wanted to keep their worship. The captured light burns on the altar, and it is not grateful.",
      img: "assets/areas/hollow_cathedral.png",
      levelRange: [694, 876],
      hp: [3922344502, 11767033506],  // re-fit único P1-P9 (G3 = plateau ~4B; o cliff de poder do prestígio começa aqui)
      enemies: [
        { name: "Hollowed Acolyte",   sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png"   },
        { name: "Husklight Murmur",   sprite: "🌳", img: "assets/enemies/husklight_murmur.png"   },
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" },
      ],
    },
    {
      id: 8, name: "The Weeping Roots", theme: "forest",
      blurb: "The deep roots, where the forest bleeds light and mourns everything it has lost.",
      lore: "The deep roots bleed raw light where the corruption cut them. The forest mourns loudly here, sap and glow running together. Everything that grieves eventually comes down to drink.",
      img: "assets/areas/weeping_roots.png",
      levelRange: [877, 1086],
      hp: [4118461727, 12355385181],  // re-fit único P1-P9
      enemies: [
        { name: "Rootbound Weeper",   sprite: "🌱", img: "assets/enemies/rootbound_weeper.png"   },
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" },
        { name: "Hollowed Acolyte",   sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png"   },
      ],
    },
    {
      id: 9, name: "The Hollow Sanctum", theme: "forest",
      blurb: "The heart of the wood, the climax of the Dreaming, where the Gilded Hollow waits in the hush.",
      lore: "The heart of the Dreaming, hushed like a held breath. The Gilded Hollow waits at the center with its stolen radiance, the forest's whole sickness gathered into one patient shape. Beyond it, the land smells of salt.",
      img: "assets/areas/hollow_sanctum.png",
      levelRange: [1087, 1328],
      hp: [4324384813, 12973154439],  // re-fit único P1-P9
      enemies: [
        { name: "Rootbound Weeper",   sprite: "🌱", img: "assets/enemies/rootbound_weeper.png"   },
        { name: "Hollowed Acolyte",   sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png"   },
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" },
      ],
      boss: { name: "The Gilded Hollow", sprite: "👁", hpMult: 80, dmgMult: 2.0, signature: ["siphoning"], img: "assets/enemies/gilded_hollow.png" }, // P8.3 H3 = Siphoning. hpMult re-fit único: mediana ~30 HTK (instável no cliff de prestígio; 1-293 entre seeds)
    },
    {
      id: 10, name: "The Salt-Eaten Quay", theme: "port",
      blurb: "The quay lies dry in the shadow of a wave frozen mid-bite, and salt covers everything like snow.",
      lore: "The wave stopped mid-bite the day the tide learned patience. The quay lives dry inside its shadow, salt falling like slow snow. The dockfolk never left. They just stopped being folk.",
      img: "assets/areas/salt_eaten_quay.png",
      levelRange: [1329, 1606],
      hp: [53892960850, 161678882550],  // re-fit único P1-P9: Porto = ×12 sobre G3 (pré-awaken). O grande salto de HP (×230) é G4->G5, casado com o cliff de poder do First Light
      enemies: [
        { name: "Saltmarrow Wader",  sprite: "🧂", img: "assets/enemies/saltmarrow_wader.png"  },
        { name: "Lanternjaw Angler", sprite: "🏮", img: "assets/enemies/lanternjaw_angler.png" },
        { name: "The Pale Shoal",    sprite: "🐟", img: "assets/enemies/pale_shoal.png"        },
      ],
    },
    {
      id: 11, name: "The Drowned Market", theme: "port",
      blurb: "The market never closed. Lanterns still burn beneath the tide, and pale shoals drift between the stalls like customers.",
      lore: "Trade never ended, it only drowned. The lanterns burn under the water because the tide likes them lit, and the pale shoals make their rounds of the stalls, browsing for what is left of the sellers.",
      img: "assets/areas/drowned_market.png",
      levelRange: [1607, 1926],
      hp: [56587608893, 169762826679],  // re-fit único P1-P9
      enemies: [
        { name: "Lanternjaw Angler", sprite: "🏮", img: "assets/enemies/lanternjaw_angler.png" },
        { name: "The Pale Shoal",    sprite: "🐟", img: "assets/enemies/pale_shoal.png"        },
        { name: "Mooring Strangler", sprite: "⚓", img: "assets/enemies/mooring_strangler.png" },
      ],
    },
    {
      id: 12, name: "The Sunken Belfry", theme: "port",
      blurb: "The drowned bell-tower still tolls, and every toll moves the black water in slow, visible rings.",
      lore: "The bell was rung to warn the port. The tide swallowed the tower mid-toll and kept the sound. Now the Drowned Bell tolls a count of drownings that have not happened yet. Yours has a number.",
      img: "assets/areas/sunken_belfry.png",
      levelRange: [1927, 2294],
      hp: [59416989338, 178250968014],  // re-fit único P1-P9
      enemies: [
        { name: "Mooring Strangler", sprite: "⚓", img: "assets/enemies/mooring_strangler.png" },
        { name: "Saltmarrow Wader",  sprite: "🧂", img: "assets/enemies/saltmarrow_wader.png"  },
        { name: "Hollowed Diver",    sprite: "🤿", img: "assets/enemies/hollowed_diver.png"    },
      ],
      boss: { name: "The Drowned Bell", sprite: "🔔", hpMult: 2057, dmgMult: 2.0, signature: ["quickened"], img: "assets/enemies/drowned_bell.png" }, // P8.3 H4 = Quickened. hpMult re-fit único: MUITO alto porque H4 é alcançado super over-geared (pós-cliff de prestígio na área 12) — 21-38 HTK; cavalga o mob HP baixo do G4 (~59B)
    },
    {
      id: 13, name: "The Wreckfields", theme: "port",
      blurb: "Ships that never finish sinking, hulls hang suspended in the blue, frozen mid-fall, chains stretched toward a surface they will never reach.",
      lore: "A graveyard where nothing is allowed to finish dying. The hulls hang frozen mid-fall, chains straining toward a surface the tide keeps only as a memory. Divers move between the wrecks, tending them.",
      img: "assets/areas/wreckfields.png",
      levelRange: [2295, 2717],
      hp: [13529504392471, 40588513177413],  // re-fit único P1-P9: G5 pós-First Light (×230 sobre G4 — o cliff do rito ×5 ATK)
      enemies: [
        { name: "Wrackwood Hulk",  sprite: "🚢", img: "assets/enemies/wrackwood_hulk.png"  },
        { name: "Hollowed Diver",  sprite: "🤿", img: "assets/enemies/hollowed_diver.png"  },
        { name: "The Pale Shoal",  sprite: "🐟", img: "assets/enemies/pale_shoal.png"      },
      ],
    },
    {
      id: 14, name: "The Drowned Shipyard", theme: "port",
      blurb: "The shipyard the water finished: half-built hulls grown shut with coral, and stairways of current standing where stairs should be.",
      lore: "The shipwrights fled and the water took up their tools. It finishes the half-built hulls in coral and verdigris, patient and wrong, building ships for a fleet that no one living will sail.",
      img: "assets/areas/drowned_shipyard.png",
      levelRange: [2718, 3203],
      hp: [14205979612095, 42617938836285],  // re-fit único P1-P9
      enemies: [
        { name: "Coralbone Creeper", sprite: "🦀", img: "assets/enemies/coralbone_creeper.png" },
        { name: "Wrackwood Hulk",    sprite: "🚢", img: "assets/enemies/wrackwood_hulk.png"    },
        { name: "Mooring Strangler", sprite: "⚓", img: "assets/enemies/mooring_strangler.png" },
      ],
    },
    {
      id: 15, name: "The Hollow Armada", theme: "port",
      blurb: "A fleet fused into a single body, masts like ribs, torn sails like membranes, deck-lights burning with no crew to tend them.",
      lore: "The port's great fleet never sailed. The tide fused it into a single vast body, masts for ribs, sails for skin, and lit the deck-lights itself. The Hollow Fleet answers no flag. It answers the hunger.",
      img: "assets/areas/hollow_armada.png",
      levelRange: [3204, 3762],
      hp: [14916278592700, 44748835778100],  // re-fit único P1-P9
      enemies: [
        { name: "Depthlight Lure", sprite: "🪼", img: "assets/enemies/depthlight_lure.png" },
        { name: "Wrackwood Hulk",  sprite: "🚢", img: "assets/enemies/wrackwood_hulk.png"  },
        { name: "Hollowed Diver",  sprite: "🤿", img: "assets/enemies/hollowed_diver.png"  },
      ],
      boss: { name: "The Hollow Fleet", sprite: "🚢", hpMult: 9.4, dmgMult: 2.0, signature: ["lightshell", "quickened"], img: "assets/enemies/hollow_fleet.png" }, // P8.3 H5 = par Lightshell+Quickened. hpMult re-fit único: BAIXO porque cavalga o mob HP alto do G5 pós-awaken (~15T); 28-39 HTK (banda 20-40)
    },
    {
      id: 16, name: "The Abyssal Shelf", theme: "port",
      blurb: "The edge of the abyss, where the surface is a distant dead sky, and something far too large passes below, slowly.",
      lore: "The last shelf of stone before the dark goes all the way down. The surface hangs far above like a dead sky. What passes beneath the shelf is too large to fight and too slow to flee, and it knows you are on the edge.",
      img: "assets/areas/abyssal_shelf.png",
      levelRange: [3763, 4405],
      hp: [15662092522335, 46986277567005],  // re-fit único P1-P9
      enemies: [
        { name: "Siltveil Shade",    sprite: "🧜", img: "assets/enemies/siltveil_shade.png"    },
        { name: "Depthlight Lure",   sprite: "🪼", img: "assets/enemies/depthlight_lure.png"   },
        { name: "Coralbone Creeper", sprite: "🦀", img: "assets/enemies/coralbone_creeper.png" },
      ],
    },
    {
      id: 17, name: "The Starving Trench", theme: "port",
      blurb: "The trench glows with a slow, starving pulse, and everything, wreckage, chains, light, leans toward the mouth.",
      lore: "The trench pulses like a throat swallowing. Light bends toward the mouth, wreckage bends, even the water leans. The port was not sunk. It is being digested.",
      img: "assets/areas/starving_trench.png",
      levelRange: [4406, 5144],
      hp: [16445197148452, 49335591445356],  // re-fit único P1-P9
      enemies: [
        { name: "Tidespawn Husk",  sprite: "🌀", img: "assets/enemies/tidespawn_husk.png"  },
        { name: "Siltveil Shade",  sprite: "🧜", img: "assets/enemies/siltveil_shade.png"  },
        { name: "Depthlight Lure", sprite: "🪼", img: "assets/enemies/depthlight_lure.png" },
      ],
    },
    {
      id: 18, name: "The Tide's Maw", theme: "port",
      blurb: "The throat of the tide: a black maw ringed by broken gold filigree, where the swallowed cargo still orbits the dark.",
      lore: "The throat of the Starving Tide, ringed with the broken gold of a halo that once meant something holy. The Tidebound Choir rehearses at the rim, singing the swallowed cargo down. Okhra listens from below.",
      img: "assets/areas/tides_maw.png",
      imgFinale: "assets/areas/tides_maw_finale.png",
      levelRange: [5145, 6000],
      hp: [19253529045173, 57760587135519],  // re-fit único P1-P9
      enemies: [
        { name: "Tidespawn Husk",    sprite: "🌀", img: "assets/enemies/tidespawn_husk.png"    },
        { name: "Siltveil Shade",    sprite: "🧜", img: "assets/enemies/siltveil_shade.png"    },
        { name: "Coralbone Creeper", sprite: "🦀", img: "assets/enemies/coralbone_creeper.png" },
      ],
      // P8.4 — o finale encenado (dois estágios): H6 (Harbinger, ungated) → Okhra (mapBoss, gated pelo First Light).
      // Matar H6 pela 1ª vez fecha os Marcos 6/6. Okhra manifesta após o H6 SÓ com First Light desperto.
      boss:    { name: "The Tidebound Choir", sprite: "🎼", hpMult: 15.5, dmgMult: 2.0, signature: ["siphoning", "escorted"], img: "assets/enemies/tidebound_choir.png" }, // P8.3 par Siphoning+Escorted. hpMult re-fit único: 26-35 HTK (banda 20-40); H6 é PRÉ-awaken (gate do rito), por isso mult baixo sobre o mob HP alto do G6
      mapBoss: { name: "Okhra, the Starving Tide", sprite: "🌊", hpMult: 320, dmgMult: 2.5, signature: ["siphoning"] }, // chefe de Mapa — Siphoning + The Tide Rises. hpMult re-fit único: 91-102 golpes PÓS-awaken (banda 60-120, ~90 no centro); Okhra é POST-awaken (god mode), por isso mult alto
    },
  ],

  // HP do mob em dois níveis: curva suave dentro da área + salto brusco entre áreas.
  // hp: [inicial, final] por área. areaHpGrowth deriva a taxa interna.
  areaAt(level) {
    for (const a of this.areas) if (level <= a.levelRange[1]) return a;
    return this.areas[this.areas.length - 1];
  },

  areaHpGrowth(area) {
    const [lo, hi] = area.levelRange;
    const [hpIni, hpFim] = area.hp;
    const span = hi - lo;
    if (span <= 0 || hpIni <= 0) return 1;
    return Math.pow(hpFim / hpIni, 1 / span);
  },

  // [LEGADO/FALLBACK P1-P9] HP do mob pela tabela hp[] por área. Substituído pela fórmula
  //   paramétrica do P10 (mobHpParam). Mantido como fallback e p/ os consumidores antigos
  //   (calibrate/persona) até o fit da Fase 2 confirmar a saída.
  mobHpAt(level, area) {
    area = area || this.areaAt(level);
    const lo = area.levelRange[0];
    const within = G.util.clamp(level, lo, area.levelRange[1]) - lo;
    return area.hp[0] * Math.pow(this.areaHpGrowth(area), within);
  },

  // ═══ P10 (modelo Gaiadon) — fórmula paramétrica de stat do mob ═══════════════════
  // stat(mob_level) = (mob_level / x)^y, com (x,y) do bucket de nível do mob (enemyBuckets).
  //   É a fonte PRIMÁRIA de HP e ATK do mob (mobHpAt/mobAtkByArea viram fallback). A parede
  //   é o gap y_hp = y_atk + 0.5 dialado nos buckets.
  _enemyBucketFor(level) {
    const arr = this.balance.enemyBuckets;
    level = Math.max(1, level || 1);
    for (const b of arr) if (level < b.maxLevel) return b;
    return arr[arr.length - 1];
  },
  // HP paramétrico do mob comum no nível dado. Fonte primária (P10).
  mobHpParam(level) {
    const b = this._enemyBucketFor(level);
    return Math.pow(Math.max(1, level || 1) / b.hpX, b.hpY);
  },
  // ATK paramétrico do mob comum no nível dado. Fonte primária (P10).
  mobAtkParam(level) {
    const b = this._enemyBucketFor(level);
    return Math.pow(Math.max(1, level || 1) / b.atkX, b.atkY);
  },
  // Gold/Lumens BASE paramétrico (gold math do Gaiadon §2.2): (mob_level / goldX)^goldY, buckets
  //   próprios (goldBuckets) com y_gold crescente que ultrapassa y_hp no fim → Lumens aceleram.
  //   ANTES do rewardMult dos acesos (P5), que multiplica por cima. Fonte primária (P3 via P10).
  mobGoldParam(level) {
    const arr = this.balance.goldBuckets;
    level = Math.max(1, level || 1);
    let b = arr[arr.length - 1];
    for (const g of arr) if (level < g.maxLevel) { b = g; break; }
    return Math.pow(level / b.x, b.y);
  },

  currentArea() {
    const i = G.util.clamp(G.state.data.areaIndex || 0, 0, this.areas.length - 1);
    return this.areas[i];
  },

  balance: {
    // ═══ P10 (modelo Gaiadon) — DIAL da fórmula paramétrica de inimigo ═══════════════
    // stat(mob_level) = (mob_level / x)^y, selecionando (x,y) por BUCKET de nível do mob
    //   (mob_level < maxLevel). Substitui as tabelas hp[]/mobAtkByArea como fonte PRIMÁRIA
    //   de HP/ATK do mob (elas viram FALLBACK — ver mobStatAt()). Buckets seguem a FORMA da
    //   tabela do GAIADON_MATH §2.1, mas os (x,y) são PROVISÓRIOS, fitados à ESCALA do Éclats
    //   (player nasce ATK 15/HP 50; mob lvl 1 ~HP 90/ATK 2; topo lvl 6000 ~HP 2e12/ATK 2e7).
    //   NÃO são os x,y crus do Gaiadon. O fit da Fase 2 re-ancora.
    // A PAREDE (P10.3): em cada bucket y_hp = y_atk + 0.5 (gap de expoente). HTK cresce como
    //   ~level^(y_hp-1) → Gear/Convergence/Awaken OBRIGATÓRIOS por construção, mesmo com mob ≈
    //   nível do jogador. Um dial de gap no lugar de 18 tabelas de HP na mão. — DIAL
    // Princípio do fit provisório: hpY nasce logo ABAIXO/perto do expoente de crescimento do
    //   jogador (playerAtkExp 1.30) no 1º bucket e SOBE bucket-a-bucket (1.24→1.74) — a parede se
    //   constrói GRADUAL e chega DEPOIS da 1ª Convergence (bucket1 cobre até nv 200, HTK pré-gear
    //   ~2 até o gate ~130; se a parede batesse dentro da área 1 o loop morria no 1º kill, quando
    //   1 kill = 1 nível). O mob acompanha o jogador; a parede vem de (a) hpY ultrapassando o
    //   expoente do jogador ao subir por bucket e (b) o gap hpY = atkY + 0.5 no dano recebido.
    //   HTK pré-gear sobe ~2→37+ ao longo do mapa → gear/prestige obrigatórios. Escala: HP(1)~13,
    //   HP(6000)~1.5e9. Baseline NU alcança o 1º gate e converge; a parede endurece no pós-prestige.
    // FASE 2 (fitter jul/05, RÉGUA = HTK): buckets CONTÍNUOS (x resolvido p/ HP contínuo nas fronteiras —
    //   sem os cliffs de 232×/6.9×/9.8×/12.5× do fit anterior). hpY RAMPA 1.55→3.92, fitado (tools/genbuckets)
    //   ao HP-alvo de HTK-entrada ~8 no frontier E que faz o gear COMUM maxado NÃO vencer sozinho:
    //     HTK comum sobe 1.2→11→65→241 nas áreas 6/11/15/18 = PAREDE real do baseline (gear-só-perde ✓);
    //     HTK nua sobe 1→9→96→600→2076 (parede estrutural via gap de expoente);
    //     área 1-2 beatável com pouco gear (HTK nua entrada ~1-9, cai com os 1ºs upgrades).
    //   hpY late alto (3.9) casa a magnitude do HP com a explosão de dano do prestige (~×247 ATK das
    //   passivas+Convergence Legacy) — sem isso o frontier one-shota (HTK<1). Top HP ~1e9. Gap y_hp = y_atk
    //   + 0.50 preservado. ⚠ PENDENTE: a promoção Uncommon ×8 (rarities.statMult) e o crown são CLIFFS
    //   discretos de poder — onde caem, derrubam o HTK localmente (o frontier vira <1 hit). Um serrote de
    //   HTK CONSTANTE nas 18 áreas exige suavizar esses cliffs (fora dos levers desta fase). — DIAL
    enemyBuckets: [
      { maxLevel:  200, hpX: 0.14325, hpY: 1.32, atkX: 0.66343, atkY: 0.82 },  // gap 0.50
      { maxLevel:  600, hpX: 1.68027, hpY: 2.00, atkX: 8.82500, atkY: 1.50 },  // gap 0.50
      { maxLevel: 1600, hpX: 13.52699, hpY: 3.10, atkX: 52.59887, atkY: 2.60 },  // gap 0.50
      { maxLevel: 3200, hpX: 47.21809, hpY: 4.20, atkX: 145.18141, atkY: 3.70 },  // gap 0.50
      { maxLevel: Infinity, hpX: 73.94351, hpY: 4.70, atkX: 209.80721, atkY: 4.20 },  // gap 0.50 (topo)
    ],
    // P3 via P10 (gold math do Gaiadon §2.2): Lumens/kill = (mob_level / goldX)^goldY, MESMA
    //   família paramétrica, com buckets PRÓPRIOS. Regra-chave: y_gold SOBE por bucket e
    //   ULTRAPASSA y_hp nos buckets altos (1.55→2.60 vs hp 1.55→2.22) → os Lumens ACELERAM no
    //   late game — o espetáculo do P3 vira o expoente de gold crescente (não mais lumensByArea).
    //   rewardMult dos acesos (P5 Ember/Lumen/Corona) MULTIPLICA por cima disto (igual ao gold×40
    //   do FIEND no Gaiadon: "caçar raro" é a fonte real de riqueza). PROVISÓRIO — fit Fase 2. — DIAL
    // FASE 2 (fitter jul/05): gold contínuo, y_gold RAMPA acima de y_hp no late (P3: Lumens aceleram
    //   no fim). goldBase(1)~2930 pós-escala R3 (era ~2.93 pré-escala; âncora do early hook). — DIAL
    // FASE 2 R3 (fitter jul/05, dono OPÇÃO A — "sensação de milhares"): escala S=1000× aplicada em
    //   TODOS os dials de Lumens (renda + custos + Oferenda) pra sair de dezenas ("estranho/pequeno")
    //   pra milhares no minuto zero, igual ao Gaiadon. Proporcional por construção: x_novo = x /
    //   S^(1/y) por bucket (mobGoldParam(nível)×S EXATO em qualquer nível, curva/forma preservada,
    //   fronteiras entre buckets continuam sem cliff). y_gold intocado. Renda nível 1 vira ~2930
    //   Lumens/kill (era ~2.93). — DIAL
    goldBuckets: [
      { maxLevel:  200, x: 0.0023637, y: 1.32 },  // = y_hp (early)
      { maxLevel:  600, x: 0.1343496, y: 2.05 },  // > y_hp (2.05 vs 2.00)
      { maxLevel: 1600, x: 2.5281903, y: 3.15 },  // > y_hp (3.15 vs 3.10)
      { maxLevel: 3200, x: 13.4231601, y: 4.25 },  // > y_hp (4.25 vs 4.20)
      { maxLevel: Infinity, x: 23.8834107, y: 4.75 },  // > y_hp (4.75 vs 4.70) — o espetáculo do fim
    ],
    // [LEGADO/FALLBACK P1-P9] ATK do mob POR ÁREA (idx 0-17). Substituído pela fórmula
    //   paramétrica (enemyBuckets.atk); mantido como fallback e p/ compat de save/sim até o
    //   fit da Fase 2 confirmar a saída. Não é mais a fonte primária de ATK do mob.
    mobAtkByArea:      [2, 9, 86, 1201, 3365, 5030, 8187, 8596, 9026, 59880, 59512, 71520, 13784642, 15899225, 18338187, 13398117, 13877907, 18830237],  // re-fit único P1-P9: TTD do envelope pior por seed (G4 baixado ~100× p/ matar death-loop; G6 ~0.6× p/ TTD ~30s)
    groupSize:         3,     // Harbinger (boss) a cada 3 áreas — fronteira de grupo
    packByGroup:       [1, 2, 2, 3, 4, 5],   // P9 r4 (§9 item 2): onda cresce a 4 (G5) e 5 (G6); UI de batalha suporta 5
    atkSpeedBase:      0.9,
    // P2 (paradigma TTK): teto GLOBAL de cadência = 15 golpes/s pro jogo INTEIRO.
    // Substitui o antigo par map1AtkSpeedCap 2 / map2AtkSpeedCap 4 (que troava o DPS por mapa).
    // Cada golpe dá dano CHEIO; DPS = ATK × golpes/s. O Mapa 1 alcança ~2–3/s — o teto só
    // encosta em mapas futuros. atkSpeedCapMap* mantidos como aliases inertes (compat de save/UI).
    atkSpeedCapGlobal: 15,    // P2: cap global de cadência (golpes/s) — DIAL
    map1AtkSpeedCap:   15,    // P2: alias do cap global (era 2) — mantido só p/ compat de leitura antiga
    map2AtkSpeedCap:   15,    // P2: alias do cap global (era 4) — mapas futuros re-abrem se quiserem teto próprio
    atkSpeedSoftFrac:  0.15,  // P2: soft cap comprime a partir de cap×frac (15×0.15≈2.25/s: o Mapa 1 sente o softcap ~lá em cima, DPS livre embaixo) — DIAL
    healOnKillFrac:    0,      // P2.4: sustain é 100% construído pelo jogador (passivas)
    lumensLevelCap:    100,    // P2.2: teto do bônus de lumensBonus por nível (level × lumensLevelPerLevel, capado)
    lumensLevelPerLevel: 0.15,
    bossHpMult:        4,
    bossDmgMult:       1.5,
    bossRewardMult:    6,
    bossLumenMult:     5,
    goldRatio:         0.35,   // P3 LEGADO: só usado como FALLBACK (área sem lumensByArea) e p/ Overkill Echo. A renda principal vem da curva própria de Lumens (lumensByArea) — DIAL
    // P10 (modelo Gaiadon): o NÍVEL do mob ACOMPANHA o jogador dentro da banda da área:
    //   mob_level = clamp(player_level, area.levelRange[0], area.levelRange[1]). O mob sobe junto
    //   com você, preso à banda da área (nunca mais congela no piso — revisão da implementação do
    //   P1). mobLevelByArea[i] continua como FORÇAR-NÍVEL opcional (sobrescreve o clamp por área);
    //   null/ausente = clamp do nível do jogador. Ver enemyFactory.mobLevelFor. — DIAL
    mobLevelByArea:    [],      // vazio = clamp(player_level) na banda da área (P10). Preencher só p/ forçar nível fixo numa área
    // P9 corrigida (porta dupla): NÍVEL DE PORTA por área — a liberação da ENTRADA (meta visível
    //   pro jogador), DESACOPLADA do levelRange do mob (que agora é SÓ definição de stat). Com P1
    //   o XP/kill é FIXO por área → os níveis do v9-r7 (levelRange[0]) ficaram inalcançáveis
    //   (nv 81 pra sair da área 1 = 6h58 medido vs alvo ~1h de G1). Valores PROVISÓRIOS derivados
    //   da curva NUA: nível alcançável farmando o mob fixo da área dentro do relógio-alvo de
    //   permanência (orçamento por grupo [1.0,1.6,2.4,3.2,4.2,5.6]h ÷ 3 áreas, ~18 kills/min).
    //   progression.levelGateFor(idx) lê daqui; fallback = levelRange[0]. O fit re-ancora. — DIAL
    //   Derivação (curva nua, orçamento/3 por área, 18 kills/min): a porta da área 2 cai de 81
    //   pra 22 (o bloqueante morto); das áreas 3+ o pool de XP da área anterior estoura o teto
    //   da banda → o cap (levelRange[1] da área farmada, pra P7 não morder antes da porta) prende
    //   os valores ≈ nos antigos. O serrote real é a fronteira 1→2 (XP/kill ×81) — reportado.
    levelGateByArea:   [1, 40, 171, 276, 396, 534, 693, 876, 1086, 1328, 1606, 1926, 2294, 2717, 3203, 3762, 4405, 5144],  // re-fit único: porta área 2 = 40 (era 22) — mata o cascade de níveis na fronteira 1->2 (P4 nua: 1.37 lvls/kill, era 2.30)
    // [LEGADO/FALLBACK P3] Lumens por ÁREA. Substituído pela gold math paramétrica do Gaiadon
    //   (goldBuckets, ver mobGoldParam / lumensBaseFor): a aceleração do P3 no late game agora vem do
    //   y_gold crescente por bucket (ultrapassa y_hp no fim), não de uma curva por área. Mantido
    //   como fallback (área sem bucket / compat) até o fit da Fase 2 confirmar a saída. — DIAL
    lumensByArea:      null,    // [legado] curva provisória por área; agora fonte primária = goldBuckets
    lumensEndAccel:    2.5,     // P3: multiplicador de aceleração da renda no G6 (áreas 16–18) — o espetáculo do fim — DIAL
    baseXp:            245,     // valor P5/P8.5b mantido pelo P9; o relógio agora é ~36h (First Light 36h13 seed 1, banda 36±2 nas seeds 1/3/7) — ver docs/design/P9_REBALANCE.md §7
    xpMultByGroup:     [1, 1.7, 2.3, 0.6, 0.6, 1],  // P9 r4: tools/p9 — não editar à mão, re-fitar
    // ═══ P10 fase1b (modelo Gaiadon §3.1) — curva de XP na FORMA INVERTÍVEL deles ═══
    //   Gaiadon: XP_para(nível) = ((nível-1)/k)^e  (XP CUMULATIVO pra alcançar o nível), invertível
    //     nível_de(xp) = (xp^(1/e)) × k + 1. Adaptado à escala do Éclats: cap 6000 (NÃO 1M),
    //     e = xpCurveExp, k = xpCurveK. state.xpToNext() = delta da cumulativa (XP(L+1) - XP(L)),
    //     preservando a família Gaiadon E a semântica incremental do engine (xp/xpToNext por nível).
    //   Por que e = 2.0 (não os 2.6 do Gaiadon): o XP/kill do Éclats é baseXp × mob_level ≈ LINEAR
    //     no nível (mob acompanha o jogador — P10). O delta de uma cumulativa e=2 cresce ~linear
    //     também → lvls/kill fica ~CONSTANTE (a Wall NÃO é o XP; ela mora em HP/gear). e>2 faria o
    //     XP virar parede secundária; e<2 faria a cauda cascatear. e=2 é o ponto onde "XP não é o
    //     muro" — exatamente a intenção do gênero. k dimensiona a magnitude (lvls/kill nua ~0.75).
    //   CRITÉRIO P4 (nua, mob≈jogador): pico de lvls/kill = 1.49 no L1 (< 2 ✓); flat ~0.745 depois.
    //     cum(6000) ≈ 5.9e9 (invertível, bem abaixo dos 1e12 do Éclats). — DIAL
    xpCurveK:          0.078,   // P10 fase1b: k da forma invertível ((L-1)/k)^e — dimensiona a magnitude — DIAL
    xpCurveExp:        2.00,    // P10 fase1b: e da forma invertível (2.0 = XP não é a Wall; lvls/kill ~constante) — DIAL
    xpCurveCap:        6000,    // P10 fase1b: nível-cap do Mapa 1 (Gaiadon usa 1M; nós 6000) — DIAL
    respawnDelay:      0.5,     // respawn mais ágil → kills/min sem precisar de one-shot
    // P7 (freio de backtrack): se o nível do Seeker passa do TOPO da banda da área
    //   (levelRange[1] — referência: dentro da própria banda NÃO morde), o XP do mob cai
    //   LINEARMENTE até o floor. Lumens e material INTACTOS (só XP). Invisível em UI. Nunca
    //   morde a re-subida pós-Convergence (herói renasce abaixo da área — por construção).
    //   redução = clamp(1 - backtrackPerLevel × (seekerLvl - bandaTopo), backtrackFloor, 1). — DIAL
    // FASE 2 (fitter jul/05): floor 0.02→0.0 + perLevel 0.01→0.05. O cap de nível 6000 estava sendo
    //   batido na ÁREA ~12-15 (cedo) — o jogador SOBRE-nivelava enquanto parado numa área (grindando o
    //   Harbinger), pinando o mob_level no cap e ACHATANDO a parede do late (áreas 15-18 no mesmo nível 6000).
    //   Com floor 0 + queda 5×, a XP MORRE acima do topo da banda da área → o nível trava na banda de cada
    //   área até avançar → mob_level acompanha a área → o cap 6000 cai perto do FIM (área ~18) e a parede do
    //   late fica graduada. NB: nunca morde a re-subida pós-Convergence (herói renasce abaixo da área). — DIAL
    backtrackFloor:      0.0,   // FASE 2: piso 0 — XP morre acima do topo da banda (trava o nível na área) — DIAL
    backtrackPerLevel:   0.05,  // FASE 2: queda de XP por nível acima do topo da banda (5× mais rápida) — DIAL
    // P9 r7 (§9 var 22): threshold do Harbinger em ESCADA GEOMÉTRICA por grupo (G1→G6),
    //   indexado por Math.floor(areaIndex/groupSize). Substitui o antigo base+perGroup (200,220..320).
    //   Morte zera o contador (bossRegrindFrac 1.0 = re-farm do threshold inteiro).
    bossKillThresholdByGroup: [200, 500, 1000, 2000, 4000, 8000],
    bossRegrindFrac:           1.0,  // re-grind CHEIO — matar o Harbinger zera o contador; re-invocar = re-farmar o threshold inteiro (decisão do dono, P8.5b; 0 = respawn direto era o bug pré-P8.5)
    // P10 fase1b (hook de começo, dono jul/05): gearCostBase re-ancorado de 2500 → 8 pra que os
    //   PRIMEIROS upgrades venham em SEGUNDOS (custo Lv.1→2 = 8 Lumens ≈ 3 kills ≈ 5s no mob lvl 1,
    //   que rende ~2.9 Lumens/kill). A curva ALCANÇA depois via o linear (Σ quadrático) × o cap de
    //   nível × o costMult da raridade × a raridade do mob (rewardMult). Antes o 1º upgrade custava
    //   ~850 kills (~23min) — o oposto do hook. O relógio macro re-emerge sob o modelo novo (modo
    //   descoberta, sem cap de relógio) — reportado na PROJEÇÃO. — DIAL
    // FASE 2 R2 (fitter jul/05, dono OPÇÃO 1 — desafio por ciclo): gearPowerScale reduz a magnitude de
    //   poder do gear (atk/hp flat+pct, critDmg) — ver gear.affixValue. Sem isto o gear maxado (comum e,
    //   sobretudo, uncommon ×8) vence o Mapa 1 SEM prestige (quebra o canon). Escalado, o baseline no-prestige
    //   TRAVA no meio (~G2-G4) e as passivas (prêmio da Convergence) voltam a ser obrigatórias. — DIAL
    gearPowerScale:    0.25,
    // FASE 2 R3 (fitter jul/05, dono OPÇÃO A): re-ancorado 8→60000 — sweep anterior achou que a
    //   RAZÃO custo:renda equivalente a gearCostBase=60 (na renda de ENTÃO) dá o 1º upgrade em
    //   ~14s/5 kills ("rápido mas sentido"); escalado por S=1000 junto com goldBuckets, o 1º upgrade
    //   continua ~14s/5 kills (ratio custo/renda idêntico), só que agora em 60000 Lumens (a sensação
    //   de milhares) em vez de 60. Medido no sim: t=14.1s, kills=5, custo pago=60000. — DIAL
    gearCostBase:      60000,
    // P6 + FASE 2 (custo de gear SUPER-LINEAR, map-long): custo(N) = base × (1 + linear × (N-1)^exp) × costMult.
    //   A renda de Lumens cresce ~nível^2.1 (goldBuckets); com um custo LINEAR (exp=1) o gear maxa NA HORA
    //   (o oposto do desejado). gearCostExp=2.2 faz o custo por nível crescer ~nível^2.2 → acompanha a renda,
    //   e o gear COMPLETO (Common→promover→Uncommon maxed, 6 slots) só fecha ~área 16-18 (progressão MAP-LONG,
    //   dono jul/05). Os PRIMEIROS 3-4 upgrades continuam ~base (hook de segundos). gearCostGrowth inerte
    //   (fallback geométrico só se gearCostLinear=null); gearCostExp=null cai no linear puro do P6. — DIAL
    gearCostExp:       2.2,     // FASE 2: expoente do custo por nível (super-linear → gear dura o mapa) — DIAL
    gearCostLinear:    0.05,    // FASE 2: inclinação do custo (par com gearCostExp 2.2) — DIAL
    gearCostGrowth:    1.022,   // P2.2: freio principal — testado no sim
    // P9 r4 (§9 item 4): promoção em DOIS materiais. Common→Uncommon consome
    //   commonMaterial (massa) + uncommonMaterial (chave). Ver gear.promoteCost.
    promoteCommonCost:      50,  // common material (massa) por promoção Common→Uncommon
    promoteUncommonCost:     8,  // uncommon material (chave) por promoção Common→Uncommon (a fitar)
    convLegacyAtkPct:     0,    // FASE 2 R2 (dono jul/05): Convergence = SÓ pontos, ZERO bônus direto (100% do poder vem das passivas compradas com os pontos; era 2)
    convLegacyHpPct:      0,    // FASE 2 R2 (dono jul/05): idem — sem resíduo de %/conv (era 2)
    convGateBase:       130,    // re-fit único: gate₁ = 130 (era 276) — 1ª Convergence aos ~44min (alvo ~40min)
    convGateGrowth:     1.32,   // re-fit único: razão de pontos 1.63 (banda 1.4-1.7); 1.35 dava 1.70, 1.30 colapsava (10 convs)
    convPointsBase:     400,    // P5.3: pontos = convPointsBase × (nível/convGateBase)^convPointsExp
    convPointsExp:      1.55,   // P5.3: α = ln1.5/ln1.3 → cada convergence no gate rende ~×1.5 a anterior
    dmgReductionCap:      75,   // teto de damageReduction, bulwark e da SOMA dos dois (combat.applyHitToHero)
    // P9 §2.8 — caps de assinatura de gear / mecânicas de folha (Mapa 1 = degustação).
    bulwarkHpThreshold:   35,   // % do HP máx abaixo do qual o Bulwark (armor) ativa a redução extra
    overcritCritCeil:    100,   // crit acima deste valor vira chance de golpe duplo (Overcrit, gloves)
    momentumMaxStacks:     3,   // stacks de Momentum (boots) — cada kill +1, teto Mapa 1
    momentumDuration:      6,   // segundos até o timer de Momentum zerar os stacks
    goldenWakeCap:        10,   // teto da folha Golden Wake — chance de Lumens 15× (P9 r6 var 18; escada 15×→4×→2×; Twice-Gilded tem cap próprio)
    executionerCap:        8,   // teto do limiar de execução (% do HP máx) da folha Executioner's Light
    // P9 r4 (§9 item 7): caps dos afixos novos (Mapa 1 = degustação).
    twiceGildedCap:        4,   // teto de Twice-Gilded (Cloak): chance de Lumens 2× (somada ao goldenWakeCap conjunto)
    fortuneTorrentCap:     5,   // teto de Fortune's Torrent (Cloak ✦): chance de Lumens 4× (rola antes do 2×)
    hollowingCap:          5,   // teto de Hollowing Light (Helmet): −% do HP máx do inimigo no spawn
    // P9: crescimento de atk/hp do player por nível — flat(nível) = base (Lv.1) + coef × nível^exp (Character Level, state.js:stats()).
    // Substitui a reta linear (era (nível-1)×5 atk, (nível-1)×2 hp). Não editar à mão, re-fitar via tools/p9.
    // P9 r4 (§9 item 14): âncora inicial em DEZENAS (era 1000). O topo do mapa se mantém
    // (mob área 18 ~10¹¹) → o crescimento total sentido sobe (~×10⁷–⁸). coef/exp re-fitam via tools/p9.
    playerAtkBase:        15,
    playerAtkCoef:         4,   // P9 r4: tools/p9 — não editar à mão, re-fitar (era 8)
    playerAtkExp:       1.30,   // P9 r4: tools/p9 — não editar à mão, re-fitar (era 1.42)
    playerHpBase:         50,
    playerHpCoef:          2,   // P9 r4: tools/p9 — não editar à mão, re-fitar (era 4)
    playerHpExp:        1.30,   // P9 r4: tools/p9 — não editar à mão, re-fitar (era 1.4)
  },

  // P3 via P10 (gold math do Gaiadon §2.2) — renda BASE de Lumens do mob comum.
  //   FONTE PRIMÁRIA: fórmula paramétrica mobGoldParam(mob_level) — buckets de gold com y_gold
  //     crescente que ultrapassa y_hp no fim → Lumens ACELERAM no late game (o espetáculo do P3).
  //   FALLBACK (legado): lumensByArea[idx] se definido; senão goldRatio × hp[0] × lumensEndAccel.
  //   ANTES do rewardMult dos acesos (P5), aplicado no _buildOne. enemyFactory._buildOne e
  //   income.estimateAreaIncome leem daqui. `level` = nível do mob (clamp do jogador na banda);
  //   se ausente, cai no default da área (levelRange[0]) só p/ compat.
  lumensBaseFor(idx, level) {
    const b = this.balance;
    idx = G.util.clamp(idx || 0, 0, this.areas.length - 1);
    const area = this.areas[idx];
    if (Array.isArray(b.goldBuckets) && b.goldBuckets.length) {
      const lvl = (level != null) ? level : area.levelRange[0];
      return this.mobGoldParam(lvl);
    }
    // ---- fallback legado (só se goldBuckets sumir) ----
    const tbl = b.lumensByArea;
    if (Array.isArray(tbl) && tbl[idx] != null) return tbl[idx];
    const accel = (idx >= (this.areas.length - 3)) ? (b.lumensEndAccel || 1) : 1;   // G6 = 3 últimas áreas
    return area.hp[0] * b.goldRatio * accel;
  },
};
