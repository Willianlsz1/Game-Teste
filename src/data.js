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
  // labels = nomes-lore em inglês (mecânica travada). Despertares novos: specialDmg (arma),
  // siegeWard (armor), rarityFind{Lumen,Ember,Corona} (inertes até o P8 — Rarity Find).
  gearBase: {
    weapon: {
      name: "Worn Blade",
      affixes: [
        { id: "atk",  label: "Gilded Edge",   stat: "atk", layer: "flat", base: 0, perLevel: 80 },
        { id: "atkp", label: "Searing Light", stat: "atk", layer: "pct",  base: 0, perLevel: 1  },
      ],
      uncommonAffixes: [
        { id: "specialDmg", label: "Marked Blade", stat: "specialDmg", layer: "flat", base: 0, perLevel: 0.01 },
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
        { id: "hp",  label: "Sealed Vessel", stat: "hp", layer: "flat", base: 0, perLevel: 20 },
        { id: "hpp", label: "Golden Seam",   stat: "hp", layer: "pct",  base: 0, perLevel: 2  },
      ],
      uncommonAffixes: [
        { id: "siegeWard", label: "Siege Ward", stat: "siegeWard", layer: "flat", base: 0, perLevel: 0.001 }, // dmgRed extra: só onda 2+ (combat)
      ],
    },
    gloves: {
      name: "Worn Gloves",
      affixes: [
        { id: "crit",    label: "Bare Hand's Instinct", stat: "crit",    layer: "flat", base: 0.05, perLevel: 0.025 },
        { id: "critDmg", label: "Crackfinder",          stat: "critDmg", layer: "flat", base: 0,    perLevel: 1     },
      ],
      uncommonAffixes: [
        { id: "critP", label: "Fracture Sense", stat: "crit", layer: "pct", base: 0, perLevel: 0.008 },
      ],
    },
    boots: {
      name: "Worn Boots",
      affixes: [
        { id: "atkspd",          label: "Pathfinder's Pace", stat: "atkSpeed",        layer: "flat", base: 0, perLevel: 0.0005, step: 25 },
        { id: "rarityFindEmber", label: "Ember Trail",       stat: "rarityFindEmber", layer: "flat", base: 0, perStep: 0.5, step: 50, cap: 30 }, // P8.1 Rarity Find — +0.5% Ember chance por degrau de 50 níveis (teto 30%)
      ],
      uncommonAffixes: [
        { id: "xp", label: "Long Road", stat: "xpBonus", layer: "flat", base: 0, perLevel: 0.25 },
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
    { id: "uncommon", name: "Uncommon", color: "#7ec8a0", cap: 3000, statMult: 1.5, costMult: 2.0 }, // PROVISÓRIO — P4 dimensiona caps raridade→grupo
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
      lore: "In the astral hush, the light you carry stirs for the first time — and answers.",
      requirements: {
        area: 18,
        crown: true,
        materials: { firstLight: 3 },
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
      img: "assets/areas/dreaming_wood.png",
      levelRange: [1, 80],
      hp: [10253, 13328],  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar
      enemies: [
        { name: "Candlewisp Shade",  sprite: "🔥", img: "assets/enemies/candlewisp_shade.png"  },
        { name: "Mothlight Herald",  sprite: "🦋", img: "assets/enemies/mothlight_herald.png"  },
        { name: "Dreamhorn Warden",  sprite: "🦌", img: "assets/enemies/dreamhorn_warden.png"  },
      ],
    },
    {
      id: 2, name: "The Lantern Mire", theme: "forest",
      blurb: "A drowned bog of guttering lanterns, where Fragmented souls lost themselves chasing the light.",
      img: "assets/areas/lantern_mire.png",
      levelRange: [81, 171],
      hp: [17715, 44481],  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar
      enemies: [
        { name: "Mirelight Drifter", sprite: "🏮", img: "assets/enemies/mirelight_drifter.png" },
        { name: "Candlewisp Shade",  sprite: "🔥", img: "assets/enemies/candlewisp_shade.png"  },
        { name: "Mothlight Herald",  sprite: "🦋", img: "assets/enemies/mothlight_herald.png"  },
      ],
    },
    {
      id: 3, name: "The Whispering Hollows", theme: "forest",
      blurb: "Hollow trees that sing the trapped light, their murmurs curling endlessly through the dark.",
      img: "assets/areas/whispering_hollows.png",
      levelRange: [172, 276],
      hp: [74135, 222404],  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar
      enemies: [
        { name: "Husklight Murmur",  sprite: "🌳", img: "assets/enemies/husklight_murmur.png"  },
        { name: "Dreamhorn Warden",  sprite: "🦌", img: "assets/enemies/dreamhorn_warden.png"  },
        { name: "Mirelight Drifter", sprite: "🏮", img: "assets/enemies/mirelight_drifter.png" },
      ],
      boss: { name: "The Hollow Cantor", sprite: "🎶", hpMult: 17.42, dmgMult: 2.0, signature: ["lightshell"], img: "assets/enemies/hollow_cantor.png" }, // PLACEHOLDER (lore): titular do grupo a confirmar. P8.3 H1 = Lightshell
    },
    {
      id: 4, name: "The Moonlit Canopy", theme: "forest",
      blurb: "The high canopy, nearest the aurora, where moths and wardens drift through a pale, restless glow.",
      img: "assets/areas/moonlit_canopy.png",
      levelRange: [277, 396],
      hp: [1081932, 1406512],  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar
      enemies: [
        { name: "Boughlight Creeper", sprite: "🍃", img: "assets/enemies/boughlight_creeper.png" },
        { name: "Mothlight Herald",   sprite: "🦋", img: "assets/enemies/mothlight_herald.png"   },
        { name: "Husklight Murmur",   sprite: "🌳", img: "assets/enemies/husklight_murmur.png"   },
      ],
    },
    {
      id: 5, name: "The Sunken Grove", theme: "forest",
      blurb: "A flooded, mirrored grove — every still pool reflects the creeping Mist back at the Seeker.",
      img: "assets/areas/sunken_grove.png",
      levelRange: [397, 534],
      hp: [763757, 992885],  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar
      enemies: [
        { name: "Glasswater Wraith",  sprite: "💧", img: "assets/enemies/glasswater_wraith.png"  },
        { name: "Mirelight Drifter",  sprite: "🏮", img: "assets/enemies/mirelight_drifter.png"  },
        { name: "Boughlight Creeper", sprite: "🍃", img: "assets/enemies/boughlight_creeper.png" },
      ],
    },
    {
      id: 6, name: "The Gilded Thicket", theme: "forest",
      blurb: "A bramble of thorns where the golden corruption climbs — beautiful, and entirely wrong.",
      img: "assets/areas/gilded_thicket.png",
      levelRange: [535, 693],
      hp: [1301741, 1754575],  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar
      enemies: [
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" },
        { name: "Candlewisp Shade",   sprite: "🔥", img: "assets/enemies/candlewisp_shade.png"   },
        { name: "Glasswater Wraith",  sprite: "💧", img: "assets/enemies/glasswater_wraith.png"  },
      ],
      boss: { name: "The Bramble King", sprite: "🥀", hpMult: 4.49, dmgMult: 2.0, signature: ["escorted"], img: "assets/enemies/bramble_king.png" }, // PLACEHOLDER (lore): titular do grupo a confirmar. P8.3 H2 = Escorted
    },
    {
      id: 7, name: "The Hollow Cathedral", theme: "forest",
      blurb: "A cathedral grown of living wood, where the Fragmented kneel and worship the captured light.",
      img: "assets/areas/hollow_cathedral.png",
      levelRange: [694, 876],
      hp: [2924292, 3801580],  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar
      enemies: [
        { name: "Hollowed Acolyte",   sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png"   },
        { name: "Husklight Murmur",   sprite: "🌳", img: "assets/enemies/husklight_murmur.png"   },
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" },
      ],
    },
    {
      id: 8, name: "The Weeping Roots", theme: "forest",
      blurb: "The deep roots, where the forest bleeds light and mourns everything it has lost.",
      img: "assets/areas/weeping_roots.png",
      levelRange: [877, 1086],
      hp: [2592403, 3370124],  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar
      enemies: [
        { name: "Rootbound Weeper",   sprite: "🌱", img: "assets/enemies/rootbound_weeper.png"   },
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" },
        { name: "Hollowed Acolyte",   sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png"   },
      ],
    },
    {
      id: 9, name: "The Hollow Sanctum", theme: "forest",
      blurb: "The heart of the wood — the climax of the Dreaming, where the Gilded Hollow waits in the hush.",
      img: "assets/areas/hollow_sanctum.png",
      levelRange: [1087, 1328],
      hp: [4008236, 5210707],  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar
      enemies: [
        { name: "Rootbound Weeper",   sprite: "🌱", img: "assets/enemies/rootbound_weeper.png"   },
        { name: "Hollowed Acolyte",   sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png"   },
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" },
      ],
      boss: { name: "The Gilded Hollow", sprite: "👁", hpMult: 4.49, dmgMult: 2.0, signature: ["siphoning"], img: "assets/enemies/gilded_hollow.png" }, // PLACEHOLDER (lore): titular do grupo a confirmar. P8.3 H3 = Siphoning
    },
    {
      id: 10, name: "The Salt-Eaten Quay", theme: "port",
      blurb: "The quay lies dry in the shadow of a wave frozen mid-bite, and salt covers everything like snow.",
      img: "assets/areas/salt_eaten_quay.png",
      levelRange: [1329, 1606],
      hp: [8209360, 10672168],  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar
      enemies: [
        { name: "Saltmarrow Wader",  sprite: "🧂", img: "assets/enemies/saltmarrow_wader.png"  },
        { name: "Lanternjaw Angler", sprite: "🏮", img: "assets/enemies/lanternjaw_angler.png" },
        { name: "The Pale Shoal",    sprite: "🐟", img: "assets/enemies/pale_shoal.png"        },
      ],
    },
    {
      id: 11, name: "The Drowned Market", theme: "port",
      blurb: "The market never closed — lanterns still burn beneath the tide, and pale shoals drift between the stalls like customers.",
      img: "assets/areas/drowned_market.png",
      levelRange: [1607, 1926],
      hp: [7843392, 18875731],  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar
      enemies: [
        { name: "Lanternjaw Angler", sprite: "🏮", img: "assets/enemies/lanternjaw_angler.png" },
        { name: "The Pale Shoal",    sprite: "🐟", img: "assets/enemies/pale_shoal.png"        },
        { name: "Mooring Strangler", sprite: "⚓", img: "assets/enemies/mooring_strangler.png" },
      ],
    },
    {
      id: 12, name: "The Sunken Belfry", theme: "port",
      blurb: "The drowned bell-tower still tolls, and every toll moves the black water in slow, visible rings.",
      img: "assets/areas/sunken_belfry.png",
      levelRange: [1927, 2294],
      hp: [31459552, 40897418],  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar
      enemies: [
        { name: "Mooring Strangler", sprite: "⚓", img: "assets/enemies/mooring_strangler.png" },
        { name: "Saltmarrow Wader",  sprite: "🧂", img: "assets/enemies/saltmarrow_wader.png"  },
        { name: "Hollowed Diver",    sprite: "🤿", img: "assets/enemies/hollowed_diver.png"    },
      ],
      boss: { name: "The Drowned Bell", sprite: "🔔", hpMult: 3.60, dmgMult: 2.0, signature: ["quickened"], img: "assets/enemies/drowned_bell.png" }, // P8.3 H4 = Quickened
    },
    // PLACEHOLDER (lore): conteúdo do Porto Afundado pendente de import
    {
      id: 13, name: "The Sunken Port — Descent IV", theme: "port",
      blurb: "Wharf after wharf sinks deeper, the pressure of the deep pressing the light thin.",
      levelRange: [2295, 2717],
      hp: [60815702, 79060413],  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar
      enemies: [
        { name: "Rootbound Weeper",   sprite: "🌱", img: "assets/enemies/rootbound_weeper.png"   },
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" },
        { name: "Hollowed Acolyte",   sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png"   },
      ],
    },
    // PLACEHOLDER (lore): conteúdo do Porto Afundado pendente de import
    {
      id: 14, name: "The Sunken Port — Descent V", theme: "port",
      blurb: "The wreck-fields, where drowned hulls drift in a slow, luminous procession.",
      levelRange: [2718, 3203],
      hp: [40622208, 52808871],  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar
      enemies: [
        { name: "Husklight Murmur",   sprite: "🌳", img: "assets/enemies/husklight_murmur.png"   },
        { name: "Hollowed Acolyte",   sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png"   },
        { name: "Rootbound Weeper",   sprite: "🌱", img: "assets/enemies/rootbound_weeper.png"   },
      ],
    },
    // PLACEHOLDER (lore): conteúdo do Porto Afundado pendente de import
    {
      id: 15, name: "The Sunken Port — Descent VI", theme: "port",
      blurb: "A graveyard of ships fused into a single hollow fleet, crewed by the light of the lost.",
      levelRange: [3204, 3762],
      hp: [61252164, 79627813],  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar
      enemies: [
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" },
        { name: "Rootbound Weeper",   sprite: "🌱", img: "assets/enemies/rootbound_weeper.png"   },
        { name: "Husklight Murmur",   sprite: "🌳", img: "assets/enemies/husklight_murmur.png"   },
      ],
      boss: { name: "The Hollow Fleet", sprite: "🚢", hpMult: 3.65, dmgMult: 2.0, signature: ["lightshell", "quickened"] }, // PLACEHOLDER (lore): Harbinger do grupo a confirmar. P8.3 H5 = par Lightshell+Quickened (burst→velocidade; sem stacking de dano recebido)
    },
    // PLACEHOLDER (lore): conteúdo do Porto Afundado pendente de import
    {
      id: 16, name: "The Sunken Port — Descent VII", theme: "port",
      blurb: "The abyssal shelf, where the last daylight dies and the deep begins to hunger.",
      levelRange: [3763, 4405],
      hp: [97487369, 126733580],  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar
      enemies: [
        { name: "Hollowed Acolyte",   sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png"   },
        { name: "Husklight Murmur",   sprite: "🌳", img: "assets/enemies/husklight_murmur.png"   },
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" },
      ],
    },
    // PLACEHOLDER (lore): conteúdo do Porto Afundado pendente de import
    {
      id: 17, name: "The Sunken Port — Descent VIII", theme: "port",
      blurb: "The trench mouth, where the water itself glows with a slow, starving pulse.",
      levelRange: [4406, 5144],
      hp: [75582580, 98257354],  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar
      enemies: [
        { name: "Rootbound Weeper",   sprite: "🌱", img: "assets/enemies/rootbound_weeper.png"   },
        { name: "Hollowed Acolyte",   sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png"   },
        { name: "Husklight Murmur",   sprite: "🌳", img: "assets/enemies/husklight_murmur.png"   },
      ],
    },
    // PLACEHOLDER (lore): conteúdo do Porto Afundado pendente de import
    {
      id: 18, name: "The Sunken Port — Descent IX", theme: "port",
      blurb: "The bottom of the world, where the Starving Tide coils around the last of the light.",
      levelRange: [5145, 6000],
      hp: [101473110, 202946219],  // P2: derivado da calibração (HTK C3) — não editar à mão, recalibrar
      enemies: [
        { name: "Thornlight Stalker", sprite: "🌵", img: "assets/enemies/thornlight_stalker.png" },
        { name: "Hollowed Acolyte",   sprite: "⛪", img: "assets/enemies/hollowed_acolyte.png"   },
        { name: "Rootbound Weeper",   sprite: "🌱", img: "assets/enemies/rootbound_weeper.png"   },
      ],
      // P8.4 — o finale encenado (dois estágios): H6 (Harbinger, ungated) → Okhra (mapBoss, gated pelo First Light).
      // Matar H6 pela 1ª vez fecha os Marcos 6/6. Okhra manifesta após o H6 SÓ com First Light desperto.
      boss:    { name: "The Tidebound Choir", sprite: "🎼", hpMult: 3.65, dmgMult: 2.0, signature: ["siphoning", "escorted"] }, // PLACEHOLDER (lore): Harbinger H6 do Porto Afundado. P8.3 par Siphoning+Escorted (ensaio geral do Okhra: cura + onda, sem acelerar ataque)
      mapBoss: { name: "Okhra, the Starving Tide", sprite: "🌊", hpMult: 48, dmgMult: 2.5, signature: ["siphoning"] }, // PLACEHOLDER (lore): chefe de Mapa — Siphoning + The Tide Rises; matar Okhra completa o Mapa 1
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
    // ATK do mob POR ÁREA (idx 0-17), as 18 áreas. Calibrado (custo de onda alvo: entrada
    // de grupo 35-50% da vida, interna 10-20% — ver P2.4). Derivado por `tools/sim.js calibrate`
    // (HTK C3) a partir do dano recebido esperado — não editar à mão, recalibrar.
    mobAtkByArea:      [62, 79, 197, 696, 567, 671, 1654, 1328, 1338, 1072, 993, 2071, 4920, 3150, 3228, 6931, 4771, 4917],
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
    baseXp:            245,     // P5: escala de XP reaberta (P1 previu) — comprime o mapa das ~12 convergences do gate escalonado p/ First Light ~18h (era 28); 245 no P8.5b: compensa o fim do farm de boss (re-grind cheio) — relógio re-validado 18h22–18h26 seeds 1/3/7
    xpMultByGroup:     [1, 1, 1, 1, 2.5, 3.0],  // P7: acelerador de XP por grupo (G1..G6) — barateia a SUBIDA final p/ trazer o First Light à banda ~18h; NÃO mexe nas provas do Awaken
    xpCurveBase:       14,      // XP p/ próximo nível = xpCurveBase × nível^xpCurveExp
    xpCurveExp:        1.62,    // expoente: late-game pesa (XP% vira decisão); subir = mais íngreme
    respawnDelay:      0.5,     // respawn mais ágil → kills/min sem precisar de one-shot
    bossKillThresholdBase:     25,   // P2.5: threshold do Harbinger = base + perGroup×(grupo+1) → 30..55 kills sem morrer
    bossKillThresholdPerGroup: 5,    // P2.5: escalada por grupo. Morte zera o contador. Ver docs/design/ENEMY_POWER_PYRAMID.md
    bossRegrindFrac:           1.0,  // re-grind CHEIO — matar o Harbinger zera o contador; re-invocar = re-farmar o threshold inteiro (decisão do dono, P8.5b; 0 = respawn direto era o bug pré-P8.5)
    gearCostBase:      2500,
    gearCostGrowth:    1.022,   // P2.2: freio principal — testado no sim
    promoteCommonCost:    50,   // common material (common → uncommon) — dimensionado no P3
    // promoteUncommonCost / convertCommonToUncommon removidos — Rare e Forge voltam no Mapa 2
    convLegacyAtkPct:     8,    // +atk% direto POR convergence (empilha; sente forte no clique)
    convLegacyHpPct:      8,    // +hp%  direto POR convergence (empilha)
    convGateBase:       276,    // P5.1: gate₁ = fim do G1. gateₙ₊₁ = gateₙ × convGateGrowth (escada)
    convGateGrowth:     1.30,   // P5.1: cada convergence sobe o requisito de nível → ~12 convergences até o cap
    convPointsBase:     400,    // P5.3: pontos = convPointsBase × (nível/convGateBase)^convPointsExp
    convPointsExp:      1.55,   // P5.3: α = ln1.5/ln1.3 → cada convergence no gate rende ~×1.5 a anterior
    dmgReductionCap:      75,   // teto de damageReduction, siegeWard e da SOMA dos dois (combat.applyHitToHero)
  },
};
