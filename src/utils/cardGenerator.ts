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
    id: 'legendes-salon',
    name: 'Légendes du Salon',
    subtitle: 'Édition Souvenirs & Bêtises',
    gradient: 'from-indigo-600 via-purple-600 to-pink-600',
    accentColor: '#f472b6',
    badgeText: 'SET DE BASE • 5 CARTES',
    iconEmoji: '⚡',
  },
  {
    id: 'roi-betises',
    name: 'Roi des Bêtises EX',
    subtitle: 'Extension Énergie Maximale',
    gradient: 'from-amber-500 via-orange-600 to-red-700',
    accentColor: '#fbbf24',
    badgeText: 'EXTENSION • TAUX HOLO +',
    iconEmoji: '🔥',
  },
  {
    id: 'tresors-dores',
    name: 'Trésors de Google Photos',
    subtitle: 'Collection Collector Couronne',
    gradient: 'from-emerald-500 via-teal-600 to-cyan-800',
    accentColor: '#34d399',
    badgeText: 'COLLECTOR • FULL-ART',
    iconEmoji: '👑',
  },
];

const TITLE_TEMPLATES: { suffix: string; subtitle: string; element: ElementType }[] = [
  { suffix: 'Fan de Dinosaures', subtitle: 'Expert T-Rex & Rugissements', element: 'turbulent' },
  { suffix: 'Maître Pokémon', subtitle: 'Dresseur Légendaire', element: 'magique' },
  { suffix: 'Roi des Puzzles', subtitle: 'Concentration Niv. 100', element: 'malice' },
  { suffix: 'Explorateur en Corse', subtitle: 'Soleil & Maquis Sauvage', element: 'explorateur' },
  { suffix: 'Aventurier d’Étretat', subtitle: 'Roi des Galets & Falaises', element: 'explorateur' },
  { suffix: 'Ami des Animaux', subtitle: 'Star du Zoo & de la Ferme', element: 'calin' },
  { suffix: 'Chez Papini & Mamieso', subtitle: 'Chouchou Officiel', element: 'calin' },
  { suffix: 'Chez Manouche & Papou', subtitle: 'Trésor des Grands-Parents', element: 'calin' },
  { suffix: 'Team Tonton Matt', subtitle: 'Complices de Choc', element: 'turbulent' },
  { suffix: 'Team Tonton Arti', subtitle: 'Duo de Fous Rires', element: 'malice' },
  { suffix: 'Chouchou de Tata Lulu', subtitle: 'Câlins & Magie', element: 'magique' },
  { suffix: 'Roi de la Ferme', subtitle: 'Murmure aux Animaux', element: 'explorateur' },
  { suffix: 'Explorateur du Zoo', subtitle: 'Ami des Lions & Girafes', element: 'explorateur' },
  { suffix: 'Roi du Canapé', subtitle: 'Mode Câlin Activé', element: 'calin' },
  { suffix: 'EX Turbo', subtitle: 'Sprint dans le Salon', element: 'turbulent' },
  { suffix: 'Sourire Fatal', subtitle: 'Charme Niv. 99', element: 'malice' },
  { suffix: 'Boss Final', subtitle: 'Couronne Suprême', element: 'legende' },
];

const FIRST_ATTACKS: CardAttack[] = [
  { name: 'Cri du T-Rex', damage: 50, energyCost: 1, description: 'Imite son dinosaure préféré et impressionne tout le salon !' },
  { name: 'Pièce Finale du Puzzle', damage: 40, energyCost: 1, description: 'Termine son puzzle d’un coup de maître sans aucune aide.' },
  { name: 'Lancer de Pokéball', damage: 45, energyCost: 1, description: 'Capture son Pokémon préféré du premier coup !' },
  { name: 'Câlin Papini & Mamieso', damage: 50, energyCost: 2, description: 'Restaure 100% des PV grâce aux bisous de Papini et Mamieso.' },
  { name: 'Goûter chez Manouche & Papou', damage: 50, energyCost: 2, description: 'Double ration de gourmandises avec Manouche et Papou.' },
  { name: 'Cascade avec Tonton Matt', damage: 45, energyCost: 1, description: 'Déclenche une partie de rigolade géante avec Tonton Matt.' },
  { name: 'Blague avec Tonton Arti', damage: 40, energyCost: 1, description: 'Fait rire toute la famille avec son complice Tonton Arti.' },
  { name: 'Bisou de Tata Lulu', damage: 45, energyCost: 1, description: 'Tata Lulu lui donne un pouvoir magique invincible.' },
  { name: 'Galets d’Étretat', damage: 35, energyCost: 1, description: 'Collectionne les plus beaux cailloux face aux falaises d’Étretat.' },
  { name: 'Soleil de Corse', damage: 45, energyCost: 1, description: 'Fait le plein d’énergie sur l’île de Beauté.' },
  { name: 'Tour de la Ferme', damage: 40, energyCost: 1, description: 'Salue les poules, les vaches et les moutons un par un.' },
  { name: 'Yeux Doux', damage: 30, energyCost: 1, description: 'Impossible de le gronder pendant 2 tours.' },
];

const SECOND_ATTACKS: CardAttack[] = [
  { name: 'Méga Rugissement Dino EX', damage: 130, energyCost: 3, description: 'Toute la puissance des dinosaures réunie dans une attaque légendaire !' },
  { name: 'Attaque Pokémon Ultime', damage: 140, energyCost: 3, description: 'Émile invoque tous ses Pokémon préférés pour gagner la partie.' },
  { name: 'Roi du Zoo & des Animaux', damage: 120, energyCost: 3, description: 'Tous les animaux du zoo et de la ferme l’acclament en chœur.' },
  { name: 'Amour des Grands-Parents', damage: 150, energyCost: 3, description: 'L’énergie combinée de Papini, Mamieso, Manouche et Papou !' },
  { name: 'Super Trio Matt, Arti & Lulu', damage: 130, energyCost: 3, description: 'Attaque combinée avec Tonton Matt, Tonton Arti et Tata Lulu !' },
  { name: 'Souvenir de Corse & Étretat', damage: 120, energyCost: 2, description: 'Des vacances inoubliables gravées pour toujours.' },
  { name: 'Maître des 1000 Puzzles', damage: 110, energyCost: 2, description: 'Assemble toutes les pièces à la vitesse de l’éclair.' },
  { name: 'Joie Suprême EX', damage: 120, energyCost: 3, description: 'Illumine instantanément toute la journée de Papa et Maman.' },
];

const FLAVOR_TEXTS: string[] = [
  '« Entre les dinosaures, les Pokémon et les puzzles, Émile ne s’arrête jamais ! »',
  '« Toujours prêt à faire des câlins géants à Papini, Mamieso, Manouche et Papou. »',
  '« Dès que Tonton Matt, Tonton Arti ou Tata Lulu arrivent, la fête commence ! »',
  '« Qu’il soit en Corse ou devant les falaises d’Étretat, c’est le roi des explorateurs. »',
  '« À la ferme comme au zoo, Émile connaît le cri de tous les animaux par cœur ! »',
  '« Aucun puzzle ni aucun dinosaure n’a de secret pour lui. »',
  '« Un sourire malicieux qui fait fondre toute la famille en une seconde. »',
  '« Son rire s’entend à trois pièces quand il joue avec ses Pokémon et ses dinosaures. »',
];

export const LEGACY_GENERIC_FLAVORS = new Set([
  '« Son rire s’entend à trois pièces quand il prépare un coup de génie. »',
  '« Batterie pleine à 200% pile au moment d’aller dormir. »',
  '« Un souvenir précieux capturé au moment parfait. »',
  '« Transforme chaque journée en grande aventure. »',
  '« Un seul sourire suffit à faire oublier toutes ses bêtises. »',
  '« Autant de malice et de tendresse dans une seule carte ! »',
]);

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
}): TCGCard {
  const seed = hashString(params.seedString || params.id || `${params.setNumber}-${Date.now()}-${Math.random()}`);
  const tpl = TITLE_TEMPLATES[seed % TITLE_TEMPLATES.length];
  const atk1 = FIRST_ATTACKS[(seed >> 3) % FIRST_ATTACKS.length];
  const atk2 = SECOND_ATTACKS[(seed >> 6) % SECOND_ATTACKS.length];
  const flavor = FLAVOR_TEXTS[(seed >> 9) % FLAVOR_TEXTS.length];

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

  const baseHp = rarity === 'crown' ? 180 : rarity === 'ultra' ? 150 : rarity === 'holo' ? 120 : rarity === 'rare' ? 90 : 70;
  const hp = baseHp + ((seed % 3) * 10);

  const elemCfg = ELEMENT_CONFIG[tpl.element];
  const cleanName = params.childName.trim() || 'Mon Fils';

  return {
    id: params.id || `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    setNumber: params.setNumber,
    title: `${cleanName} ${tpl.suffix}`,
    subtitle: tpl.subtitle,
    hp,
    element: tpl.element,
    rarity,
    imageUrl: params.imageUrl,
    dateLabel: params.dateLabel || new Date().toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
    attacks: [atk1, atk2],
    flavorText: flavor,
    weakness: elemCfg.weakness,
    resistance: elemCfg.resistance,
    retreatCost: (seed % 3) + 1,
    isCustomPhoto: true,
    googleMediaId: params.googleMediaId,
  };
}

/**
 * Upgrades an existing card that had old generic phrases to the new personalized Émile family & passions lore
 * while preserving its id, setNumber, imageUrl, rarity, and dateLabel.
 */
export function upgradeCardToNewLore(card: TCGCard, childName = 'Émile'): TCGCard {
  if (!LEGACY_GENERIC_FLAVORS.has(card.flavorText)) {
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
    seedString: `${card.id}-v2-${card.setNumber}`,
    googleMediaId: card.googleMediaId,
    forcedRarity: card.rarity,
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
  const randomSeed = `${card.id}-${Date.now()}-${Math.random()}`;
  const updated = createCardFromPhoto({
    id: card.id,
    setNumber: card.setNumber,
    imageUrl: card.imageUrl,
    childName,
    dateLabel: card.dateLabel,
    seedString: randomSeed,
    googleMediaId: card.googleMediaId,
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
export function drawBoosterPack(pool: TCGCard[], packSize = 5): { cards: TCGCard[]; isGodPack: boolean } {
  if (pool.length === 0) return { cards: [], isGodPack: false };

  const isGodPack = Math.random() < 0.08; // 8% chance of a God Pack!
  const byRarity = (rarities: CardRarity[]) => {
    const filtered = pool.filter((c) => rarities.includes(c.rarity));
    return filtered.length > 0 ? filtered : pool;
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
