import React, { useState, useEffect, useMemo } from 'react';
import { AppSettings, CollectionMap, PulledCardResult, TCGCard } from './types/tcg';
import {
  clearAllStoredCards,
  deleteStoredCard,
  getAllStoredCards,
  saveStoredCards,
} from './utils/db';
import { getDemoStarterCards } from './utils/cardGenerator';
import { soundFX } from './utils/soundFX';
import { BoosterOpeningStage } from './components/BoosterOpeningStage';
import { BinderView } from './components/BinderView';
import { CardInspectModal } from './components/CardInspectModal';
import { PhotoManagerModal } from './components/PhotoManagerModal';
import {
  Sparkles,
  BookOpen,
  Images,
  Volume2,
  VolumeX,
  Crown,
  PackageOpen,
} from 'lucide-react';

const STORAGE_SETTINGS_KEY = 'sonny_tcg_settings_v1';
const STORAGE_COLLECTION_KEY = 'sonny_tcg_collection_v1';

const DEFAULT_CLIENT_ID =
  '817822977351-5m288vfdn4arbv5o35rd8skt2le8ektu.apps.googleusercontent.com';

const DEFAULT_SETTINGS: AppSettings = {
  childName: 'Mon Fils',
  soundEnabled: true,
  googleClientId: DEFAULT_CLIENT_ID,
  totalPacksOpened: 0,
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'booster' | 'binder'>('booster');

  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        googleClientId: parsed.googleClientId || DEFAULT_CLIENT_ID,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Collection map (cardId -> count)
  const [collection, setCollection] = useState<CollectionMap>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_COLLECTION_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Custom photo cards stored in IndexedDB
  const [customCards, setCustomCards] = useState<TCGCard[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Modals
  const [inspectedCard, setInspectedCard] = useState<TCGCard | null>(null);
  const [isPhotoManagerOpen, setIsPhotoManagerOpen] = useState(false);

  // Load stored custom cards on mount
  useEffect(() => {
    getAllStoredCards().then((stored) => {
      setCustomCards(stored);
      setIsLoaded(true);
    });
  }, []);

  // Sync sound engine state
  useEffect(() => {
    soundFX.enabled = settings.soundEnabled;
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Persist collection
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_COLLECTION_KEY, JSON.stringify(collection));
    } catch {}
  }, [collection]);

  // Active card pool: if user has imported real photos of their son, use those! Otherwise use starter demo set.
  const allCards = useMemo(() => {
    if (customCards.length > 0) {
      return customCards;
    }
    return getDemoStarterCards(settings.childName);
  }, [customCards, settings.childName]);

  const ownedUniqueCount = useMemo(
    () => allCards.filter((c) => (collection[c.id]?.count || 0) > 0).length,
    [allCards, collection]
  );

  const handleUpdateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const handlePackOpened = (pulled: PulledCardResult[]) => {
    setCollection((prev) => {
      const next = { ...prev };
      for (const item of pulled) {
        const existing = next[item.card.id];
        next[item.card.id] = {
          count: (existing?.count || 0) + 1,
          firstPulledAt: existing?.firstPulledAt || Date.now(),
        };
      }
      return next;
    });
    setSettings((prev) => ({
      ...prev,
      totalPacksOpened: prev.totalPacksOpened + 1,
    }));
  };

  const handleAddCustomCards = async (newCards: TCGCard[]) => {
    const merged = [...customCards, ...newCards].map((c, idx) => ({
      ...c,
      setNumber: idx + 1,
    }));
    await saveStoredCards(merged);
    setCustomCards(merged);
  };

  const handleUpdateCard = async (updated: TCGCard) => {
    if (updated.isCustomPhoto) {
      const next = customCards.map((c) => (c.id === updated.id ? updated : c));
      await saveStoredCards(next);
      setCustomCards(next);
    }
    setInspectedCard(updated);
  };

  const handleDeleteCard = async (cardId: string) => {
    await deleteStoredCard(cardId);
    const remaining = customCards
      .filter((c) => c.id !== cardId)
      .map((c, idx) => ({ ...c, setNumber: idx + 1 }));
    await saveStoredCards(remaining);
    setCustomCards(remaining);
  };

  const handleClearCustomCards = async () => {
    await clearAllStoredCards();
    setCustomCards([]);
    setCollection({});
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-amber-300 font-display font-bold">
        Chargement de la collection...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between pb-10">
      {/* ==================== TOP NAVIGATION HEADER ==================== */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab('booster')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 p-0.5 shadow-[0_0_20px_rgba(251,191,36,0.4)] group-hover:scale-105 transition">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-display font-black text-base sm:text-lg tracking-tight text-white">
                  {settings.childName} <span className="text-amber-400">Pocket TCG</span>
                </h1>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                {settings.totalPacksOpened} booster(s) ouvert(s) • {ownedUniqueCount}/
                {allCards.length} cartes
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-white/10">
            <button
              onClick={() => setActiveTab('booster')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                activeTab === 'booster'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <PackageOpen className="w-4 h-4" />
              <span>Boosters</span>
            </button>

            <button
              onClick={() => setActiveTab('binder')}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                activeTab === 'binder'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Classeur</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'binder'
                    ? 'bg-slate-950/25 text-slate-950 font-black'
                    : 'bg-white/10 text-amber-300'
                }`}
              >
                {ownedUniqueCount}/{allCards.length}
              </span>
            </button>
          </nav>

          {/* Right Actions: Google Photos Picker & Sound Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPhotoManagerOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/50 text-xs font-bold text-indigo-100 transition flex items-center gap-1.5 shadow-sm"
            >
              <Images className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Google Photos</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-950/80 text-amber-300 text-[10px] font-extrabold border border-indigo-400/30">
                {customCards.length > 0 ? customCards.length : 'Démo'}
              </span>
            </button>

            <button
              onClick={() => handleUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              title={settings.soundEnabled ? 'Couper le son' : 'Activer le son'}
              className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 hover:text-amber-300 transition"
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ==================== MAIN CONTENT STAGE ==================== */}
      <main className="flex-1 flex flex-col justify-center">
        {activeTab === 'booster' ? (
          <BoosterOpeningStage
            allCards={allCards}
            collection={collection}
            childName={settings.childName}
            onPackOpened={handlePackOpened}
            onInspectCard={(card) => setInspectedCard(card)}
            onOpenPhotoManager={() => setIsPhotoManagerOpen(true)}
          />
        ) : (
          <BinderView
            allCards={allCards}
            collection={collection}
            childName={settings.childName}
            onInspectCard={(card) => setInspectedCard(card)}
            onSwitchToBooster={() => setActiveTab('booster')}
          />
        )}
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="mt-8 text-center text-[11px] text-slate-500 px-4">
        <p className="flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400/70" />
          <span>
            {settings.childName} Pocket TCG — Toutes vos photos restent stockées 100% en local dans
            votre navigateur (IndexedDB).
          </span>
        </p>
      </footer>

      {/* ==================== MODALS ==================== */}
      {inspectedCard && (
        <CardInspectModal
          card={inspectedCard}
          childName={settings.childName}
          countOwned={collection[inspectedCard.id]?.count || 0}
          onClose={() => setInspectedCard(null)}
          onUpdateCard={handleUpdateCard}
          onDeleteCard={inspectedCard.isCustomPhoto ? handleDeleteCard : undefined}
        />
      )}

      {isPhotoManagerOpen && (
        <PhotoManagerModal
          settings={settings}
          customCards={customCards}
          onUpdateSettings={handleUpdateSettings}
          onAddCustomCards={handleAddCustomCards}
          onClearCustomCards={handleClearCustomCards}
          onClose={() => setIsPhotoManagerOpen(false)}
        />
      )}
    </div>
  );
};
