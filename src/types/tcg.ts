export type CardRarity = 'common' | 'rare' | 'holo' | 'ultra' | 'crown';

export type ElementType = 'turbulent' | 'calin' | 'malice' | 'explorateur' | 'magique' | 'legende';

export interface CardAttack {
  name: string;
  damage: number;
  energyCost: number;
  description: string;
}

export interface TCGCard {
  id: string;
  setNumber: number;
  title: string;
  subtitle: string;
  hp: number;
  element: ElementType;
  rarity: CardRarity;
  imageUrl: string;
  dateLabel: string;
  attacks: [CardAttack, CardAttack];
  flavorText: string;
  weakness: string;
  resistance: string;
  retreatCost: number;
  isCustomPhoto: boolean;
  googleMediaId?: string;
}

export interface CollectionMap {
  [cardId: string]: {
    count: number;
    firstPulledAt: number;
  };
}

export interface PulledCardResult {
  card: TCGCard;
  isNew: boolean;
  pullIndex: number;
}

export interface BoosterSeries {
  id: string;
  name: string;
  subtitle: string;
  gradient: string;
  accentColor: string;
  badgeText: string;
  iconEmoji: string;
}

export interface AppSettings {
  childName: string;
  soundEnabled: boolean;
  googleClientId: string;
  lastGoogleSync?: string;
  totalPacksOpened: number;
}
