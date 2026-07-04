// data.js — conteúdo do jogo (fonte da verdade)
// Balanceamento = mexer só aqui. Nenhuma lógica.

G.data = {
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
  // cleave (weapon), bulwark (armor), overcrit (gloves), momentum (boots),
  // rarityFind{Lumen,Ember,Corona} (helmet/cloak). Mecânicas no combat.js; caps Mapa 1 em §2.8.
  gearBase: {
    weapon: {
      name: "Worn Blade",
      affixes: [
        { id: "atk",  label: "Gilded Edge",   stat: "atk", layer: "flat", base: 0, perLevel: 220 },  // perLevel P9: tools/p9 (era 80)
        { id: "atkp", label: "Searing Light", stat: "atk", layer: "pct",  base: 0, perLevel: 1  },
      ],
      uncommonAffixes: [
        { id: "cleave", label: "Riven Edge", stat: "cleave", layer: "flat", base: 0, perLevel: 0.012, cap: 25 }, // % do overkill do golpe fatal transferido ao próximo vivo (combat)
      ],
    },
    helmet: {
      name: "Worn Helm",
      affixes: [
        { id: "xp",     label: "Watcher's Lens",  stat: "xpBonus",         layer: "flat", base: 0, perLevel: 0.5   },
        { id: "dmgRed", label: "Steadfast Guard", stat: "damageReduction", layer: "flat", base: 0, perLevel: 0.001 },
      ],
      uncommonAffixes: [
        { id: "rarityFindLumen", label: "Second Sight", stat: "rarityFindLumen", layer: "flat", base: 0, perStep: 0.25, step: 50, cap: 15 }, // P8.1 Rarity Find — +0.25% Lumen chance por degrau de 50 níveis (teto 15%)
      ],
    },
    armor: {
      name: "Worn Cuirass",
      affixes: [
        { id: "hp",  label: "Sealed Vessel", stat: "hp", layer: "flat", base: 0, perLevel: 60 },  // perLevel P9: tools/p9 (era 20)
        { id: "hpp", label: "Golden Seam",   stat: "hp", layer: "pct",  base: 0, perLevel: 2  },
      ],
      uncommonAffixes: [
        { id: "bulwark", label: "Last Vessel", stat: "bulwark", layer: "flat", base: 0, perLevel: 0.008, cap: 20 }, // dmgRed EXTRA só abaixo de 35% HP (combat); soma clampa em dmgReductionCap
      ],
    },
    gloves: {
      name: "Worn Gloves",
      affixes: [
        { id: "crit",    label: "Bare Hand's Instinct", stat: "crit",    layer: "flat", base: 0.05, perLevel: 0.025 },
        { id: "critDmg", label: "Crackfinder",          stat: "critDmg", layer: "flat", base: 0,    perLevel: 1     },
      ],
      uncommonAffixes: [
        { id: "overcrit", label: "Fracture Sense", stat: "overcrit", layer: "flat", base: 0, perLevel: 0.012, cap: 30 }, // teto de chance de golpe duplo destravada por crit acima de 100% (combat)
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
        { id: "lumens",   label: "Gilded Fringe",   stat: "lumensBonus", layer: "flat", base: 5, perLevel: 0.2, step: 50, cap: 150 },
        { id: "lumensBP", label: "Fortune's Weave", stat: "lumensBonus", layer: "pct",  base: 0, perLevel: 0.01 },
      ],
      uncommonAffixes: [
        { id: "rarityFindCorona", label: "Corona Call", stat: "rarityFindCorona", layer: "flat", base: 0, perStep: 0.085, step: 50, cap: 5 }, // P8.1 Rarity Find — +0.085% Corona chance por degrau de 50 níveis (teto 5%)
      ],
    },
  },

  rarities: [
    { id: "common",   name: "Common",   color: "#9aa7bd", cap: 500,  statMult: 1.0, costMult: 1.0 },
    { id: "uncommon", name: "Uncommon", color: "#7ec8a0", cap: 3000, statMult: 8, costMult: 2.0 }, // statMult P9: tools/p9 (era 1.5) — P4 dimensiona caps raridade→grupo
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
        materials: { firstLight: 100000 },  // P9: tools/p9 — não editar à mão, re-fitar
      },
      bonus: { atkMult: 2.5, hpMult: 1.5, lumensBonus: 25 },
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
  rarityTiers: [
    { key: "corona", findKey: "corona", tag: "Corona", color: "#9d7bff",
      hpMult: 10, atkMult: 3, rewardMult: 10,   // P8.2: cada Corona rola exatamente 1 modificador (combat._buildOne)
      names: ["Lumin Tyrant", "Veilbreaker", "Hollow Warden", "Gilded Reaver", "Dawnscourge"] },
    { key: "lumen", findKey: "lumen", tag: "Lumen", color: "#4fa8ff",
      hpMult: 6, atkMult: 2, rewardMult: 6,
      names: ["Luminal Wraith", "Éclat Splinter", "Hollow Sovereign", "Veil Incarnate", "Shard of Luce"] },
    { key: "ember", findKey: "ember", tag: "Ember", color: "#5ee0d2",
      hpMult: 3, atkMult: 1.5, rewardMult: 3,
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

  // Tetos máximos (%) do Rarity Find — atingidos com os 6 Marcos. capPerHarbinger = cap/6:
  // cada Harbinger morto pela 1ª vez levanta 1/6 (permanente, sobrevive à Convergence).
  // 6 Marcos (idx 2,5,8,11,14 + H6 na área 18) → a 6ª morte fecha os caps em 30/15/5.
  rarityCaps: { ember: 30, lumen: 15, corona: 5 },

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
      hp: [2584, 104957],  // P9: gerado pela família de expoentes (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar
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
      hp: [349857, 800178],  // P9: gerado pela família de expoentes (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar
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
      hp: [2667261, 2667261],  // P9: gerado pela família de expoentes (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar
      enemies: [
        { name: "Husklight Murmur",  sprite: "🌳", img: "assets/enemies/husklight_murmur.png"  },
        { name: "Dreamhorn Warden",  sprite: "🦌", img: "assets/enemies/dreamhorn_warden.png"  },
        { name: "Mirelight Drifter", sprite: "🏮", img: "assets/enemies/mirelight_drifter.png" },
      ],
      boss: { name: "The Hollow Cantor", sprite: "🎶", hpMult: 0.483, dmgMult: 2.0, signature: ["lightshell"], img: "assets/enemies/hollow_cantor.png" }, // PLACEHOLDER (lore): titular do grupo a confirmar. P8.3 H1 = Lightshell. hpMult P9: tools/p9
    },
    {
      id: 4, name: "The Moonlit Canopy", theme: "forest",
      blurb: "The high canopy, nearest the aurora, where moths and wardens drift through a pale, restless glow.",
      lore: "Closest to the aurora, the canopy is where the forest touches what it lost. Moths carry flecks of pale light between the branches like offerings. The wardens do not guard the canopy. They guard the way down.",
      img: "assets/areas/moonlit_canopy.png",
      levelRange: [277, 396],
      hp: [6693870, 6693870],  // P9: gerado pela família de expoentes (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar
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
      hp: [12123953, 12123953],  // P9: gerado pela família de expoentes (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar
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
      hp: [19302327, 19302327],  // P9: gerado pela família de expoentes (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar
      enemies: [
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" },
        { name: "Candlewisp Shade",   sprite: "🔥", img: "assets/enemies/candlewisp_shade.png"   },
        { name: "Glasswater Wraith",  sprite: "💧", img: "assets/enemies/glasswater_wraith.png"  },
      ],
      boss: { name: "The Bramble King", sprite: "🥀", hpMult: 3, dmgMult: 2.0, signature: ["escorted"], img: "assets/enemies/bramble_king.png" }, // PLACEHOLDER (lore): titular do grupo a confirmar. P8.3 H2 = Escorted. hpMult P9: tools/p9
    },
    {
      id: 7, name: "The Hollow Cathedral", theme: "forest",
      blurb: "A cathedral grown of living wood, where the Fragmented kneel and worship the captured light.",
      lore: "No one built the cathedral. The wood grew it around the kneeling Fragmented, arch by arch, as if the forest wanted to keep their worship. The captured light burns on the altar, and it is not grateful.",
      img: "assets/areas/hollow_cathedral.png",
      levelRange: [694, 876],
      hp: [22818714, 290026931],  // P9: gerado pela família de expoentes (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar
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
      hp: [966756435, 966756435],  // P9: gerado pela família de expoentes (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar
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
      hp: [1354200911, 1354200911],  // P9: gerado pela família de expoentes (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar
      enemies: [
        { name: "Rootbound Weeper",   sprite: "🌱", img: "assets/enemies/rootbound_weeper.png"   },
        { name: "Hollowed Acolyte",   sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png"   },
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" },
      ],
      boss: { name: "The Gilded Hollow", sprite: "👁", hpMult: 90, dmgMult: 2.0, signature: ["siphoning"], img: "assets/enemies/gilded_hollow.png" }, // PLACEHOLDER (lore): titular do grupo a confirmar. P8.3 H3 = Siphoning. hpMult P9: tools/p9
    },
    {
      id: 10, name: "The Salt-Eaten Quay", theme: "port",
      blurb: "The quay lies dry in the shadow of a wave frozen mid-bite, and salt covers everything like snow.",
      lore: "The wave stopped mid-bite the day the tide learned patience. The quay lives dry inside its shadow, salt falling like slow snow. The dockfolk never left. They just stopped being folk.",
      img: "assets/areas/salt_eaten_quay.png",
      levelRange: [1329, 1606],
      hp: [1653628261, 1653628261],  // P9: gerado pela família de expoentes (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar
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
      hp: [1858231353, 20649847393],  // P9: gerado pela família de expoentes (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar
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
      hp: [68832824643, 68832824643],  // P9: gerado pela família de expoentes (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar
      enemies: [
        { name: "Mooring Strangler", sprite: "⚓", img: "assets/enemies/mooring_strangler.png" },
        { name: "Saltmarrow Wader",  sprite: "🧂", img: "assets/enemies/saltmarrow_wader.png"  },
        { name: "Hollowed Diver",    sprite: "🤿", img: "assets/enemies/hollowed_diver.png"    },
      ],
      boss: { name: "The Drowned Bell", sprite: "🔔", hpMult: 5.49, dmgMult: 2.0, signature: ["quickened"], img: "assets/enemies/drowned_bell.png" }, // P8.3 H4 = Quickened. hpMult P9: tools/p9
    },
    {
      id: 13, name: "The Wreckfields", theme: "port",
      blurb: "Ships that never finish sinking, hulls hang suspended in the blue, frozen mid-fall, chains stretched toward a surface they will never reach.",
      lore: "A graveyard where nothing is allowed to finish dying. The hulls hang frozen mid-fall, chains straining toward a surface the tide keeps only as a memory. Divers move between the wrecks, tending them.",
      img: "assets/areas/wreckfields.png",
      levelRange: [2295, 2717],
      hp: [97749688304, 97749688304],  // P9: gerado pela família de expoentes (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar
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
      hp: [113168313595, 113168313595],  // P9: gerado pela família de expoentes (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar
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
      hp: [310162551483, 310162551483],  // P9: gerado pela família de expoentes (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar
      enemies: [
        { name: "Depthlight Lure", sprite: "🪼", img: "assets/enemies/depthlight_lure.png" },
        { name: "Wrackwood Hulk",  sprite: "🚢", img: "assets/enemies/wrackwood_hulk.png"  },
        { name: "Hollowed Diver",  sprite: "🤿", img: "assets/enemies/hollowed_diver.png"  },
      ],
      boss: { name: "The Hollow Fleet", sprite: "🚢", hpMult: 1.33, dmgMult: 2.0, signature: ["lightshell", "quickened"], img: "assets/enemies/hollow_fleet.png" }, // PLACEHOLDER (lore): Harbinger do grupo a confirmar. P8.3 H5 = par Lightshell+Quickened (burst→velocidade; sem stacking de dano recebido). hpMult P9: tools/p9
    },
    {
      id: 16, name: "The Abyssal Shelf", theme: "port",
      blurb: "The edge of the abyss, where the surface is a distant dead sky, and something far too large passes below, slowly.",
      lore: "The last shelf of stone before the dark goes all the way down. The surface hangs far above like a dead sky. What passes beneath the shelf is too large to fight and too slow to flee, and it knows you are on the edge.",
      img: "assets/areas/abyssal_shelf.png",
      levelRange: [3763, 4405],
      hp: [417438402162, 417438402162],  // P9: gerado pela família de expoentes (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar
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
      hp: [502538281661, 502538281661],  // P9: gerado pela família de expoentes (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar
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
      hp: [431768682174, 647653023261],  // P9: gerado pela família de expoentes (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar
      enemies: [
        { name: "Tidespawn Husk",    sprite: "🌀", img: "assets/enemies/tidespawn_husk.png"    },
        { name: "Siltveil Shade",    sprite: "🧜", img: "assets/enemies/siltveil_shade.png"    },
        { name: "Coralbone Creeper", sprite: "🦀", img: "assets/enemies/coralbone_creeper.png" },
      ],
      // P8.4 — o finale encenado (dois estágios): H6 (Harbinger, ungated) → Okhra (mapBoss, gated pelo First Light).
      // Matar H6 pela 1ª vez fecha os Marcos 6/6. Okhra manifesta após o H6 SÓ com First Light desperto.
      boss:    { name: "The Tidebound Choir", sprite: "🎼", hpMult: 13.87, dmgMult: 2.0, signature: ["siphoning", "escorted"], img: "assets/enemies/tidebound_choir.png" }, // PLACEHOLDER (lore): Harbinger H6 do Porto Afundado. P8.3 par Siphoning+Escorted (ensaio geral do Okhra: cura + onda, sem acelerar ataque). hpMult P9: tools/p9
      mapBoss: { name: "Okhra, the Starving Tide", sprite: "🌊", hpMult: 323, dmgMult: 2.5, signature: ["siphoning"] }, // PLACEHOLDER (lore): chefe de Mapa — Siphoning + The Tide Rises; matar Okhra completa o Mapa 1. hpMult P9: tools/p9
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

  mobHpAt(level, area) {
    area = area || this.areaAt(level);
    const lo = area.levelRange[0];
    const within = G.util.clamp(level, lo, area.levelRange[1]) - lo;
    return area.hp[0] * Math.pow(this.areaHpGrowth(area), within);
  },

  currentArea() {
    const i = G.util.clamp(G.state.data.areaIndex || 0, 0, this.areas.length - 1);
    return this.areas[i];
  },

  balance: {
    // ATK do mob POR ÁREA (idx 0-17), as 18 áreas. P9: gerado pela família de expoentes
    // (tools/p9) — ver docs/design/P9_REBALANCE.md; não editar à mão, re-fitar.
    mobAtkByArea:      [40, 616, 4391, 4971, 8342, 12498, 18481, 23939, 30245, 680187, 783113, 954409, 1174337, 1348758, 3475185, 4402042, 5221176, 6638968],
    groupSize:         3,     // Harbinger (boss) a cada 3 áreas — fronteira de grupo
    packByGroup:       [1, 2, 2, 3, 3, 3],   // P2.4: ondas por grupo (teto 3 = restrição de UI)
    atkSpeedBase:      0.9,
    atkSpeedCap:       15,    // teto-assíntota FINAL do jogo (futuros mapas; nunca alcançado em Mapa 1/2)
    map1AtkSpeedCap:   2,     // teto-assíntota Mapa 1
    map2AtkSpeedCap:   4,     // teto-assíntota Mapa 2 (placeholder — Mapa 2 fora de escopo)
    atkSpeedSoftFrac:  0.85,  // soft cap começa a comprimir em ceil×frac (Mapa1≈1.7, Mapa2≈3.4)
    healOnKillFrac:    0,      // P2.4: sustain é 100% construído pelo jogador (passivas)
    lumensLevelCap:    100,    // P2.2: teto do bônus de lumensBonus por nível (level × lumensLevelPerLevel, capado)
    lumensLevelPerLevel: 0.15,
    bossHpMult:        4,
    bossDmgMult:       1.5,
    bossRewardMult:    6,
    bossLumenMult:     5,
    goldRatio:         0.35,   // lumens/HP — calibrado p/ gear acompanhar (não estourar) o HP do mob
    baseXp:            245,     // valor P5/P8.5b mantido pelo P9; o relógio agora é ~36h (First Light 36h13 seed 1, banda 36±2 nas seeds 1/3/7) — ver docs/design/P9_REBALANCE.md §7
    xpMultByGroup:     [1, 1, 1, 1, 1, 1],  // P9: tools/p9 — não editar à mão, re-fitar (era acelerador por grupo P7)
    xpCurveBase:       14,      // XP p/ próximo nível = xpCurveBase × nível^xpCurveExp
    xpCurveExp:        1.9,     // P9: tools/p9 — não editar à mão, re-fitar (expoente: late-game pesa; era 1.62)
    respawnDelay:      0.5,     // respawn mais ágil → kills/min sem precisar de one-shot
    bossKillThresholdBase:     25,   // P2.5: threshold do Harbinger = base + perGroup×(grupo+1) → 30..55 kills sem morrer
    bossKillThresholdPerGroup: 5,    // P2.5: escalada por grupo. Morte zera o contador. Ver docs/design/ENEMY_POWER_PYRAMID.md
    bossRegrindFrac:           1.0,  // re-grind CHEIO — matar o Harbinger zera o contador; re-invocar = re-farmar o threshold inteiro (decisão do dono, P8.5b; 0 = respawn direto era o bug pré-P8.5)
    gearCostBase:      2500,
    gearCostGrowth:    1.022,   // P2.2: freio principal — testado no sim
    promoteCommonCost:    50,   // common material (common → uncommon) — dimensionado no P3
    // promoteUncommonCost / convertCommonToUncommon removidos — Rare e Forge voltam no Mapa 2
    convLegacyAtkPct:     2,    // P9: tools/p9 — não editar à mão, re-fitar (+atk% direto POR convergence; era 8)
    convLegacyHpPct:      2,    // P9: tools/p9 — não editar à mão, re-fitar (+hp%  direto POR convergence; era 8)
    convGateBase:       276,    // P5.1: gate₁ = fim do G1. gateₙ₊₁ = gateₙ × convGateGrowth (escada)
    convGateGrowth:     1.35,   // P9: tools/p9 — não editar à mão, re-fitar (era 1.30)
    convPointsBase:     400,    // P5.3: pontos = convPointsBase × (nível/convGateBase)^convPointsExp
    convPointsExp:      1.55,   // P5.3: α = ln1.5/ln1.3 → cada convergence no gate rende ~×1.5 a anterior
    dmgReductionCap:      75,   // teto de damageReduction, bulwark e da SOMA dos dois (combat.applyHitToHero)
    // P9 §2.8 — caps de assinatura de gear / mecânicas de folha (Mapa 1 = degustação).
    bulwarkHpThreshold:   35,   // % do HP máx abaixo do qual o Bulwark (armor) ativa a redução extra
    overcritCritCeil:    100,   // crit acima deste valor vira chance de golpe duplo (Overcrit, gloves)
    momentumMaxStacks:     3,   // stacks de Momentum (boots) — cada kill +1, teto Mapa 1
    momentumDuration:      6,   // segundos até o timer de Momentum zerar os stacks
    goldenWakeCap:        10,   // teto de chance de Lumens em dobro por kill (folha Golden Wake)
    executionerCap:        8,   // teto do limiar de execução (% do HP máx) da folha Executioner's Light
    // P9: crescimento de atk/hp do player por nível — flat(nível) = base (Lv.1) + coef × nível^exp (Character Level, state.js:stats()).
    // Substitui a reta linear (era (nível-1)×5 atk, (nível-1)×2 hp). Não editar à mão, re-fitar via tools/p9.
    playerAtkBase:      1000,
    playerAtkCoef:         8,
    playerAtkExp:        1.5,
    playerHpBase:       1000,
    playerHpCoef:          4,
    playerHpExp:        1.45,
  },
};
