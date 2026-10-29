import { BoosterSeries, CardAttack, CardRarity, ElementType, TCGCard } from '../types/tcg';

export const ELEMENT_CONFIG: Record<
  ElementType,
  {
    label: string;
    emoji: string;
    bgGradient: string;
    borderColor: string;
    badgeBg: string;
    textColor: string;
    weakness: string;
    resistance: string;
  }
> = {
  turbulent: {
    label: 'Turbulent',
    emoji: '🔥',
    bgGradient: 'from-orange-600 via-red-600 to-amber-700',
    borderColor: 'border-orange-400',
    badgeBg: 'bg-orange-500/30 border-orange-400/50 text-orange-200',
    textColor: 'text-orange-100',
    weakness: '💧 Bain Chaud x2',
    resistance: '🥦 Brocoli -20',
  },
  calin: {
    label: 'Câlin',
    emoji: '💧',
    bgGradient: 'from-sky-500 via-blue-600 to-indigo-800',
    borderColor: 'border-sky-300',
    badgeBg: 'bg-sky-500/30 border-sky-400/50 text-sky-200',
    textColor: 'text-sky-100',
    weakness: '⚡ Chatouilles x2',
    resistance: '😤 Grosse Colère -30',
  },
  malice: {
    label: 'Malice',
    emoji: '⚡',
    bgGradient: 'from-amber-400 via-yellow-500 to-orange-600',
    borderColor: 'border-yellow-300',
    badgeBg: 'bg-yellow-500/30 border-yellow-300/60 text-yellow-100',
    textColor: 'text-yellow-50',
    weakness: '🌙 Heure du Dodo x2',
    resistance: '🧹 Rangement -20',
  },
  explorateur: {
    label: 'Explorateur',
    emoji: '🌿',
    bgGradient: 'from-emerald-500 via-teal-600 to-green-800',
    borderColor: 'border-emerald-300',
    badgeBg: 'bg-emerald-500/30 border-emerald-400/50 text-emerald-200',
    textColor: 'text-emerald-100',
    weakness: '🧦 Chaussettes Mouillées x2',
    resistance: '🌧️ Flaque de Boue -30',
  },
  magique: {
    label: 'Magique',
    emoji: '✨',
    bgGradient: 'from-fuchsia-600 via-purple-600 to-indigo-800',
    borderColor: 'border-fuchsia-300',
    badgeBg: 'bg-fuchsia-500/30 border-fuchsia-400/50 text-fuchsia-200',
    textColor: 'text-fuchsia-100',
    weakness: '⏰ Réveil Matin x2',
    resistance: '👻 Monstre sous le Lit -30',
  },
  legende: {
    label: 'Roi du Monde',
    emoji: '👑',
    bgGradient: 'from-amber-500 via-yellow-600 to-purple-900',
    borderColor: 'border-amber-300',
    badgeBg: 'bg-amber-500/30 border-amber-300/60 text-amber-100',
    textColor: 'text-amber-100',
    weakness: '🍼 Sieste Forcée x2',
    resistance: '🛡️ Punition -40',
  },
};

export const RARITY_CONFIG: Record<
  CardRarity,
  {
    label: string;
    stars: string;
    shortBadge: string;
    colorClass: string;
    glowHex: string;
    weight: number;
  }
> = {
  common: {
    label: 'Commune',
    stars: '♦',
    shortBadge: '♦',
    colorClass: 'text-slate-300 border-slate-400/40 bg-slate-800/80',
    glowHex: '#94a3b8',
    weight: 42,
  },
  rare: {
    label: 'Rare',
    stars: '♦♦',
    shortBadge: '♦♦',
    colorClass: 'text-sky-300 border-sky-400/50 bg-sky-950/80',
    glowHex: '#38bdf8',
    weight: 28,
  },
  holo: {
    label: 'Holo Foil',
    stars: '★',
    shortBadge: '★ HOLO',
    colorClass: 'text-fuchsia-300 border-fuchsia-400/60 bg-fuchsia-950/80',
    glowHex: '#e879f9',
    weight: 16,
  },
  ultra: {
    label: 'Ultra Rare EX',
    stars: '★★',
    shortBadge: '★★ EX',
    colorClass: 'text-amber-200 border-amber-400/70 bg-gradient-to-r from-pink-900/80 via-purple-900/80 to-indigo-900/80',
    glowHex: '#f472b6',
    weight: 10,
  },
  crown: {
    label: 'Couronne Dorée',
    stars: '👑',
    shortBadge: '👑 SECRET',
    colorClass: 'text-yellow-200 border-yellow-300 bg-gradient-to-r from-amber-700/90 via-yellow-600/90 to-amber-800/90',
    glowHex: '#fbbf24',
    weight: 4,
  },
};

export const BOOSTER_SERIES: BoosterSeries[] = [
  {
    id: 'dinos-pokemon-puzzles',
    name: 'Dinos, Pokémon & Puzzles',
    subtitle: 'Les Grandes Passions d’Émile',
    gradient: 'from-amber-500 via-orange-600 to-red-700',
    accentColor: '#fbbf24',
    badgeText: 'PASSIONS • 5 CARTES',
    iconEmoji: '🦖',
  },
  {
    id: 'famille-amour',
    name: 'Grands-Parents, Tontons & Tata',
    subtitle: 'Papini, Mamieso, Manouche, Papou, Matt, Arti & Lulu',
    gradient: 'from-indigo-600 via-purple-600 to-pink-600',
    accentColor: '#f472b6',
    badgeText: 'FAMILLE • 5 CARTES',
    iconEmoji: '💖',
  },
  {
    id: 'corse-etretat-animaux',
    name: 'Corse, Étretat, Zoo & Ferme',
    subtitle: 'Vacances, Animaux & Explorations',
    gradient: 'from-emerald-500 via-teal-600 to-cyan-800',
    accentColor: '#34d399',
    badgeText: 'AVENTURES • 5 CARTES',
    iconEmoji: '🌿',
  },
];

export interface CoherentCardTheme {
  seriesId: string;
  suffix: string;
  subtitle: string;
  element: ElementType;
  atk1: CardAttack;
  atk2: CardAttack;
  flavor: string;
}

export const COHERENT_CARD_THEMES: CoherentCardTheme[] = [
  // ==================== BOOSTER 1: DINOS, POKÉMON & PUZZLES ====================
  {
    seriesId: 'dinos-pokemon-puzzles',
    suffix: 'Fan de Dinosaures',
    subtitle: 'Expert T-Rex & Jurassique',
    element: 'turbulent',
    atk1: {
      name: 'Rugissement du T-Rex',
      damage: 50,
      energyCost: 1,
      description: 'Émile imite le cri du tyrannosaure et fait trembler tout le salon !',
    },
    atk2: {
      name: 'Charge des Dinosaures EX',
      damage: 140,
      energyCost: 3,
      description: 'Toute sa collection de dinosaures s’unit pour une attaque légendaire !',
    },
    flavor: '« Il adore les dinosaures et connaît le cri du T-Rex et du Tricératops par cœur ! »',
  },
  {
    seriesId: 'dinos-pokemon-puzzles',
    suffix: 'Roi des Dinos',
    subtitle: 'Paléontologue en Herbe',
    element: 'turbulent',
    atk1: {
      name: 'Pas de Diplodocus',
      damage: 45,
      energyCost: 1,
      description: 'Marche comme un dinosaure géant à travers toute la maison.',
    },
    atk2: {
      name: 'Méga Vélociraptor EX',
      damage: 130,
      energyCost: 3,
      description: 'Plus rapide et plus fort que tous les dinosaures réunis !',
    },
    flavor: '« Entre un T-Rex et un Brachiosaure, le cœur d’Émile bat toujours pour les dinosaures ! »',
  },
  {
    seriesId: 'dinos-pokemon-puzzles',
    suffix: 'Maître Pokémon',
    subtitle: 'Dresseur Légendaire',
    element: 'magique',
    atk1: {
      name: 'Lancer de Pokéball',
      damage: 45,
      energyCost: 1,
      description: 'Capture son Pokémon préféré du premier coup avec un grand sourire !',
    },
    atk2: {
      name: 'Attaque Pokémon Ultime EX',
      damage: 150,
      energyCost: 3,
      description: 'Émile appelle tous ses Pokémon favoris pour remporter la victoire !',
    },
    flavor: '« Passionné de Pokémon, Émile est déjà le plus grand dresseur de la famille ! »',
  },
  {
    seriesId: 'dinos-pokemon-puzzles',
    suffix: 'Champion Pokémon',
    subtitle: 'Énergie Pikachu Niv. 100',
    element: 'malice',
    atk1: {
      name: 'Éclair de Malice',
      damage: 40,
      energyCost: 1,
      description: 'Une attaque vive comme Pikachu qui électrise toute la pièce.',
    },
    atk2: {
      name: 'Équipe Pokémon au Complet',
      damage: 130,
      energyCost: 3,
      description: 'Un travail d’équipe imbattable avec ses Pokémon préférés !',
    },
    flavor: '« Il adore les Pokémon et ne se lasse jamais de découvrir de nouvelles créatures ! »',
  },
  {
    seriesId: 'dinos-pokemon-puzzles',
    suffix: 'Roi des Puzzles',
    subtitle: 'Concentration & Logique Niv. 99',
    element: 'malice',
    atk1: {
      name: 'Œil de Lynx',
      damage: 40,
      energyCost: 1,
      description: 'Repère la bonne pièce du puzzle en moins de deux secondes !',
    },
    atk2: {
      name: 'La Dernière Pièce du Puzzle EX',
      damage: 120,
      energyCost: 2,
      description: 'Termine son puzzle tout seul sous les applaudissements de la famille !',
    },
    flavor: '« Il adore faire des puzzles : aucune pièce ne lui résiste ! »',
  },

  // ==================== BOOSTER 2: GRANDS-PARENTS, TONTONS & TATA ====================
  {
    seriesId: 'famille-amour',
    suffix: 'Chez Papini & Mamieso',
    subtitle: 'Amour des Grands-Parents',
    element: 'calin',
    atk1: {
      name: 'Câlin Doux à Mamieso',
      damage: 50,
      energyCost: 1,
      description: 'Un gros bisou à Mamieso qui redonne 100% d’énergie et de bonne humeur !',
    },
    atk2: {
      name: 'Grande Aventure avec Papini EX',
      damage: 140,
      energyCost: 3,
      description: 'Papini et Mamieso entourent Émile d’un amour invincible !',
    },
    flavor: '« Il aime de tout son cœur ses grands-parents Papini et Mamieso ! »',
  },
  {
    seriesId: 'famille-amour',
    suffix: 'Chez Manouche & Papou',
    subtitle: 'Trésor des Grands-Parents',
    element: 'calin',
    atk1: {
      name: 'Bisou Magique à Manouche',
      damage: 50,
      energyCost: 1,
      description: 'Manouche lui prépare ses surprises préférées avec plein de tendresse.',
    },
    atk2: {
      name: 'Super Moment avec Papou EX',
      damage: 140,
      energyCost: 3,
      description: 'Complicité, histoires et fous rires garantis avec Manouche et Papou !',
    },
    flavor: '« Quel bonheur pour Émile de retrouver ses grands-parents Manouche et Papou ! »',
  },
  {
    seriesId: 'famille-amour',
    suffix: 'Complice de Tonton Matt',
    subtitle: 'Duo de Choc & Rigolades',
    element: 'turbulent',
    atk1: {
      name: 'Cascade avec Tonton Matt',
      damage: 45,
      energyCost: 1,
      description: 'Déclenche une séance de jeux et de fous rires géants avec Tonton Matt !',
    },
    atk2: {
      name: 'Super Équipe Tonton Matt EX',
      damage: 130,
      energyCost: 3,
      description: 'Quand Émile et Tonton Matt sont ensemble, l’ambiance est à 200% !',
    },
    flavor: '« Il adore son Tonton Matt, toujours prêt pour jouer et rigoler avec lui ! »',
  },
  {
    seriesId: 'famille-amour',
    suffix: 'Team Tonton Arti',
    subtitle: 'Fous Rires & Malice',
    element: 'malice',
    atk1: {
      name: 'Blague avec Tonton Arti',
      damage: 45,
      energyCost: 1,
      description: 'Un clin d’œil complice avec Tonton Arti qui fait rire toute la table !',
    },
    atk2: {
      name: 'Duo Légendaire Tonton Arti EX',
      damage: 130,
      energyCost: 3,
      description: 'Énergie maximale et nouvelles aventures avec son Tonton Arti !',
    },
    flavor: '« Dès que son Tonton Arti arrive, Émile a les yeux qui brillent de malice ! »',
  },
  {
    seriesId: 'famille-amour',
    suffix: 'Chouchou de Tata Lulu',
    subtitle: 'Tendresse, Jeux & Magie',
    element: 'magique',
    atk1: {
      name: 'Bisou Magique de Tata Lulu',
      damage: 50,
      energyCost: 1,
      description: 'Un câlin géant avec Tata Lulu qui illumine toute la journée !',
    },
    atk2: {
      name: 'Fête Royale avec Tata Lulu EX',
      damage: 135,
      energyCost: 3,
      description: 'Tata Lulu et Émile forment un duo magique et inséparable !',
    },
    flavor: '« Il adore sa Tata Lulu : des câlins, des jeux et une complicité en or ! »',
  },
  {
    seriesId: 'famille-amour',
    suffix: 'Roi de Toute la Famille',
    subtitle: 'Grands-Parents, Tontons & Tata',
    element: 'legende',
    atk1: {
      name: 'Réunion de Famille',
      damage: 60,
      energyCost: 2,
      description: 'Papini, Mamieso, Manouche, Papou, Matt, Arti et Lulu sont tous réunis !',
    },
    atk2: {
      name: 'Amour Familial Infini EX',
      damage: 160,
      energyCost: 3,
      description: 'L’attaque la plus puissante du jeu : entouré de tous ceux qu’il aime !',
    },
    flavor: '« Entouré de Papini, Mamieso, Manouche, Papou, Tonton Matt, Tonton Arti et Tata Lulu, Émile est le roi du monde ! »',
  },

  // ==================== BOOSTER 3: CORSE, ÉTRETAT, ZOO & FERME ====================
  {
    seriesId: 'corse-etretat-animaux',
    suffix: 'Explorateur en Corse',
    subtitle: 'Soleil, Plage & Île de Beauté',
    element: 'explorateur',
    atk1: {
      name: 'Plouf dans l’Eau de Corse',
      damage: 45,
      energyCost: 1,
      description: 'S’amuse dans l’eau turquoise sous le grand soleil de la Corse !',
    },
    atk2: {
      name: 'Souvenir Magique de Corse EX',
      damage: 130,
      energyCost: 3,
      description: 'Des vacances inoubliables sur l’île de Beauté entre mer et maquis !',
    },
    flavor: '« Il adore partir en vacances en Corse pour profiter de la mer et du soleil ! »',
  },
  {
    seriesId: 'corse-etretat-animaux',
    suffix: 'Aventurier d’Étretat',
    subtitle: 'Falaises & Trésors de Galets',
    element: 'explorateur',
    atk1: {
      name: 'Chasse aux Galets d’Étretat',
      damage: 40,
      energyCost: 1,
      description: 'Remplit ses poches des plus beaux galets face aux falaises d’Étretat !',
    },
    atk2: {
      name: 'Grand Vent d’Étretat EX',
      damage: 125,
      energyCost: 2,
      description: 'Debout devant l’Arche d’Étretat, Émile domine l’océan !',
    },
    flavor: '« Il adore partir à Étretat admirer les grandes falaises et jouer avec les galets ! »',
  },
  {
    seriesId: 'corse-etretat-animaux',
    suffix: 'Roi de la Ferme',
    subtitle: 'Ami des Vaches, Poules & Moutons',
    element: 'explorateur',
    atk1: {
      name: 'Tournée de la Ferme',
      damage: 45,
      energyCost: 1,
      description: 'Salue les poules, les moutons, les chèvres et les vaches un par un !',
    },
    atk2: {
      name: 'Concert des Animaux de la Ferme EX',
      damage: 130,
      energyCost: 3,
      description: 'Imite à la perfection tous les animaux de la ferme !',
    },
    flavor: '« Il adore la ferme et passer du temps auprès de tous les animaux ! »',
  },
  {
    seriesId: 'corse-etretat-animaux',
    suffix: 'Explorateur du Zoo',
    subtitle: 'Lions, Girafes & Animaux Sauvages',
    element: 'explorateur',
    atk1: {
      name: 'Grand Safari au Zoo',
      damage: 50,
      energyCost: 1,
      description: 'Observe les girafes, les lions et les éléphants avec émerveillement !',
    },
    atk2: {
      name: 'Meilleur Ami des Animaux EX',
      damage: 140,
      energyCost: 3,
      description: 'Tous les animaux du zoo et de la ferme reconnaissent leur grand ami Émile !',
    },
    flavor: '« Il adore le zoo et les animaux : chaque visite est une fête extraordinaire ! »',
  },
];

export const VALID_THEMED_FLAVORS = new Set(COHERENT_CARD_THEMES.map((t) => t.flavor));

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Generates a complete TCGCard from an imported photo (Google Photos or local file)
 */
export function createCardFromPhoto(params: {
  id?: string;
  setNumber: number;
  imageUrl: string;
  childName: string;
  dateLabel?: string;
  seedString?: string;
  googleMediaId?: string;
  forcedRarity?: CardRarity;
  forcedThemeIndex?: number;
}): TCGCard {
  const seed = hashString(
    params.seedString || params.id || `${params.setNumber}-${Date.now()}-${Math.random()}`
  );
  const themeIndex =
    typeof params.forcedThemeIndex === 'number'
      ? params.forcedThemeIndex % COHERENT_CARD_THEMES.length
      : (Math.max(0, params.setNumber - 1) + (seed % 3)) % COHERENT_CARD_THEMES.length;

  const theme = COHERENT_CARD_THEMES[themeIndex];

  // Assign rarity based on deterministic distribution or forced rarity
  const rarityRoll = seed % 100;
  let rarity: CardRarity = params.forcedRarity || 'common';
  if (!params.forcedRarity) {
    if (rarityRoll < 8) rarity = 'crown';
    else if (rarityRoll < 24) rarity = 'ultra';
    else if (rarityRoll < 48) rarity = 'holo';
    else if (rarityRoll < 75) rarity = 'rare';
    else rarity = 'common';
  }

  const baseHp =
    rarity === 'crown'
      ? 180
      : rarity === 'ultra'
      ? 150
      : rarity === 'holo'
      ? 120
      : rarity === 'rare'
      ? 90
      : 70;
  const hp = baseHp + (seed % 3) * 10;

  const elemCfg = ELEMENT_CONFIG[theme.element];
  const cleanName = params.childName.trim() || 'Émile';

  return {
    id: params.id || `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    setNumber: params.setNumber,
    title: `${cleanName} ${theme.suffix}`,
    subtitle: theme.subtitle,
    hp,
    element: theme.element,
    rarity,
    imageUrl: params.imageUrl,
    dateLabel:
      params.dateLabel ||
      new Date().toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
    attacks: [theme.atk1, theme.atk2],
    flavorText: theme.flavor,
    weakness: elemCfg.weakness,
    resistance: elemCfg.resistance,
    retreatCost: (seed % 3) + 1,
    isCustomPhoto: true,
    googleMediaId: params.googleMediaId,
  };
}

/**
 * Upgrades any existing card that does not yet have one of the 15 coherent themed sets
 * while preserving its id, setNumber, imageUrl, rarity, and dateLabel.
 */
export function upgradeCardToNewLore(card: TCGCard, childName = 'Émile'): TCGCard {
  if (VALID_THEMED_FLAVORS.has(card.flavorText)) {
    return {
      ...card,
      title: card.title.replace(/^Mon Fils\b/i, childName),
    };
  }
  const upgraded = createCardFromPhoto({
    id: card.id,
    setNumber: card.setNumber,
    imageUrl: card.imageUrl,
    childName,
    dateLabel: card.dateLabel,
    seedString: `${card.id}-v3-${card.setNumber}`,
    googleMediaId: card.googleMediaId,
    forcedRarity: card.rarity,
    forcedThemeIndex: Math.max(0, card.setNumber - 1),
  });
  return {
    ...upgraded,
    isCustomPhoto: card.isCustomPhoto,
  };
}

/**
 * Re-rolls the humorous stats/title/attacks of an existing card while keeping its photo
 */
export function rerollCardTraits(card: TCGCard, childName: string): TCGCard {
  const randomThemeIdx = Math.floor(Math.random() * COHERENT_CARD_THEMES.length);
  const randomSeed = `${card.id}-${Date.now()}-${Math.random()}`;
  const updated = createCardFromPhoto({
    id: card.id,
    setNumber: card.setNumber,
    imageUrl: card.imageUrl,
    childName,
    dateLabel: card.dateLabel,
    seedString: randomSeed,
    googleMediaId: card.googleMediaId,
    forcedThemeIndex: randomThemeIdx,
  });
  return {
    ...updated,
    isCustomPhoto: card.isCustomPhoto,
  };
}

/**
 * Generates an SVG DataURL illustration for demo starter cards before the user imports their Google Photos
 */
function makeDemoArtworkDataUrl(themeIndex: number, title: string, emoji: string, bgHex1: string, bgHex2: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 460" width="600" height="460">
    <defs>
      <linearGradient id="g${themeIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgHex1}" />
        <stop offset="100%" stop-color="${bgHex2}" />
      </linearGradient>
      <radialGradient id="glow${themeIndex}" cx="50%" cy="45%" r="50%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="600" height="460" fill="url(#g${themeIndex})" />
    <circle cx="300" cy="210" r="220" fill="url(#glow${themeIndex})" />
    <circle cx="110" cy="90" r="45" fill="#ffffff" fill-opacity="0.08" />
    <circle cx="510" cy="370" r="70" fill="#ffffff" fill-opacity="0.08" />
    <text x="300" y="220" font-size="135" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    <rect x="70" y="345" width="460" height="64" rx="18" fill="#0f172a" fill-opacity="0.55" stroke="#ffffff" stroke-opacity="0.25" stroke-width="2" />
    <text x="300" y="373" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="#f8fafc" text-anchor="middle">${title}</text>
    <text x="300" y="396" font-family="system-ui, sans-serif" font-size="13" fill="#cbd5e1" text-anchor="middle">Importez vos Google Photos pour remplacer par vos vraies photos !</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getDemoStarterCards(childName: string): TCGCard[] {
  const name = childName.trim() || 'Mon Fils';
  const demos: Array<{
    rarity: CardRarity;
    emoji: string;
    c1: string;
    c2: string;
    seed: string;
    date: string;
  }> = [
    { rarity: 'common', emoji: '🦖', c1: '#059669', c2: '#064e3b', seed: 'demo-1', date: 'Souvenir #01' },
    { rarity: 'common', emoji: '🚀', c1: '#2563eb', c2: '#1e1b4b', seed: 'demo-2', date: 'Souvenir #02' },
    { rarity: 'common', emoji: '🧸', c1: '#d97706', c2: '#78350f', seed: 'demo-3', date: 'Souvenir #03' },
    { rarity: 'rare', emoji: '⚡', c1: '#eab308', c2: '#854d0e', seed: 'demo-4', date: 'Souvenir #04' },
    { rarity: 'rare', emoji: '🏖️', c1: '#0284c7', c2: '#0c4a6e', seed: 'demo-5', date: 'Souvenir #05' },
    { rarity: 'holo', emoji: '🦸‍♂️', c1: '#dc2626', c2: '#7f1d1d', seed: 'demo-6', date: 'Souvenir #06' },
    { rarity: 'holo', emoji: '🎂', c1: '#db2777', c2: '#831843', seed: 'demo-7', date: 'Souvenir #07' },
    { rarity: 'ultra', emoji: '🌟', c1: '#9333ea', c2: '#3b0764', seed: 'demo-8', date: 'Souvenir #08' },
    { rarity: 'ultra', emoji: '🎮', c1: '#4f46e5', c2: '#1e1b4b', seed: 'demo-9', date: 'Souvenir #09' },
    { rarity: 'crown', emoji: '👑', c1: '#f59e0b', c2: '#78350f', seed: 'demo-10', date: 'Souvenir #10' },
  ];

  return demos.map((d, idx) => {
    const card = createCardFromPhoto({
      id: `demo-card-${idx + 1}`,
      setNumber: idx + 1,
      imageUrl: makeDemoArtworkDataUrl(idx, `Carte Démo #${idx + 1} — ${name}`, d.emoji, d.c1, d.c2),
      childName: name,
      dateLabel: d.date,
      seedString: d.seed,
      forcedRarity: d.rarity,
    });
    return {
      ...card,
      isCustomPhoto: false,
    };
  });
}

/**
 * Generates a 5-card booster pack from the available card pool.
 * Uses authentic TCG Pocket slot excitement:
 * - Cards 1, 2, 3: build-up cards
 * - Card 4: Rare or Holo+
 * - Card 5 (The Climax Hit!): Guaranteed high excitement (Holo, Ultra Rare EX, or Crown Secret!)
 */
export function drawBoosterPack(
  pool: TCGCard[],
  packSize = 5,
  seriesId?: string
): { cards: TCGCard[]; isGodPack: boolean } {
  if (pool.length === 0) return { cards: [], isGodPack: false };

  // Filter pool by the chosen booster's theme if seriesId is specified
  let activePool = pool;
  if (seriesId) {
    const allowedFlavors = new Set(
      COHERENT_CARD_THEMES.filter((t) => t.seriesId === seriesId).map((t) => t.flavor)
    );
    const matching = pool.filter((c) => allowedFlavors.has(c.flavorText));
    if (matching.length >= 3) {
      activePool = matching;
    }
  }

  const isGodPack = Math.random() < 0.08; // 8% chance of a God Pack!
  const byRarity = (rarities: CardRarity[]) => {
    const filtered = activePool.filter((c) => rarities.includes(c.rarity));
    return filtered.length > 0 ? filtered : activePool;
  };

  const pickRandom = (list: TCGCard[], excludeIds: Set<string>): TCGCard => {
    const candidates = list.filter((c) => !excludeIds.has(c.id));
    const source = candidates.length > 0 ? candidates : list;
    return source[Math.floor(Math.random() * source.length)];
  };

  const chosen: TCGCard[] = [];
  const usedIds = new Set<string>();

  for (let slot = 0; slot < packSize; slot++) {
    let targetRarities: CardRarity[];

    if (isGodPack) {
      targetRarities = ['holo', 'ultra', 'crown'];
    } else if (slot < 3) {
      // Build-up slots
      targetRarities = Math.random() < 0.75 ? ['common', 'rare'] : ['rare', 'holo'];
    } else if (slot === 3) {
      // Slot 4: semi-hit
      const r = Math.random();
      if (r < 0.5) targetRarities = ['rare'];
      else if (r < 0.85) targetRarities = ['holo'];
      else targetRarities = ['ultra'];
    } else {
      // Slot 5: Main hit at the back of the pack!
      const r = Math.random();
      if (r < 0.16) targetRarities = ['crown'];
      else if (r < 0.52) targetRarities = ['ultra'];
      else if (r < 0.88) targetRarities = ['holo'];
      else targetRarities = ['rare'];
    }

    const picked = pickRandom(byRarity(targetRarities), usedIds);
    usedIds.add(picked.id);
    chosen.push(picked);
  }

  return { cards: chosen, isGodPack };
}
