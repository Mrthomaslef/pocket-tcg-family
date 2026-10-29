import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppSettings, CollectionMap, PulledCardResult, TCGCard } from './types/tcg';
import {
  clearAllStoredCards,
  deleteStoredCard,
  getAllStoredCards,
  parseHugePackFileStreaming,
  saveStoredCards,
} from './utils/db';
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
  Download,
  Loader2,
} from 'lucide-react';

const STORAGE_SETTINGS_KEY = 'sonny_tcg_settings_v1';
const STORAGE_COLLECTION_KEY = 'sonny_tcg_collection_v1';

const DEFAULT_CLIENT_ID =
  '817822977351-5m288vfdn4arbv5o35rd8skt2le8ektu.apps.googleusercontent.com';

const DEFAULT_SETTINGS: AppSettings = {
  childName: 'Émile',
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
        childName:
          !parsed.childName || parsed.childName === 'Mon Fils' ? 'Émile' : parsed.childName,
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

  // Custom photo cards stored in IndexedDB (no demo cards!)
  const [customCards, setCustomCards] = useState<TCGCard[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Direct Home Page Pack Import status
  const [isImportingPack, setIsImportingPack] = useState(false);
  const [importStatusText, setImportStatusText] = useState<string | null>(null);
  const directPackInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [inspectedCard, setInspectedCard] = useState<TCGCard | null>(null);
  const [isPhotoManagerOpen, setIsPhotoManagerOpen] = useState(false);

  // Load stored custom cards on mount
  useEffect(() => {
    getAllStoredCards().then((stored) => {
      const normalized = stored.map((c) => ({
        ...c,
        title: c.title.replace(/^Mon Fils\b/i, 'Émile'),
      }));
      setCustomCards(normalized);
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

  const allCards = customCards;

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
      title: c.title.replace(/^Mon Fils\b/i, 'Émile'),
    }));
    await saveStoredCards(merged);
    setCustomCards(merged);
  };

  const handleDirectPackFileSelected = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setIsImportingPack(true);
    const sizeMb = Math.round(file.size / (1024 * 1024));
    setImportStatusText(`Lecture du pack (${sizeMb} Mo)...`);

    try {
      const parsed = await parseHugePackFileStreaming(file, (count, pct) => {
        setImportStatusText(`Import & compression : ${count} cartes (${pct}%)...`);
      });

      if (!parsed.cards || parsed.cards.length === 0) {
        throw new Error('Aucune carte trouvée dans ce fichier.');
      }

      if (parsed.childName) {
        handleUpdateSettings({ childName: parsed.childName });
      }

      await handleAddCustomCards(parsed.cards);
      setImportStatusText(`🎉 ${parsed.cards.length} cartes importées avec succès !`);
      setTimeout(() => setImportStatusText(null), 4000);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erreur lors de la lecture du pack.');
      setImportStatusText(null);
    } finally {
      setIsImportingPack(false);
      if (directPackInputRef.current) {
        directPackInputRef.current.value = '';
      }
    }
  };

  const handleUpdateCard = async (updated: TCGCard) => {
    const next = customCards.map((c) => (c.id === updated.id ? updated : c));
    await saveStoredCards(next);
    setCustomCards(next);
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
    <div
      className={
        activeTab === 'booster'
          ? 'h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between overscroll-none'
          : 'min-h-[100dvh] flex flex-col justify-between pb-8'
      }
    >
      {/* Hidden Direct Pack File Input accessible from anywhere on Home Page */}
      <input
        ref={directPackInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => handleDirectPackFileSelected(e.target.files)}
      />

      {/* ==================== TOP NAVIGATION HEADER (Single compact row on all phones) ==================== */}
      <header className="shrink-0 z-40 backdrop-blur-xl bg-slate-950/85 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-2.5 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab('booster')}
            className="flex items-center gap-2 cursor-pointer group shrink-0"
          >
            <img
              src="./icon-192.png"
              alt="milTCG"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl shadow-[0_0_16px_rgba(251,191,36,0.4)] group-hover:scale-105 transition object-cover"
            />
            <div>
              <h1 className="font-display font-black text-base sm:text-xl tracking-tight text-white leading-none">
                mil<span className="text-amber-400">TCG</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium hidden md:block mt-0.5">
                {settings.totalPacksOpened} booster(s) • {ownedUniqueCount}/{allCards.length} cartes
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-white/10 shrink-0">
            <button
              onClick={() => setActiveTab('booster')}
              className={`px-2.5 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-extrabold transition flex items-center gap-1 ${
                activeTab === 'booster'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <PackageOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Boosters</span>
            </button>

            <button
              onClick={() => setActiveTab('binder')}
              className={`px-2.5 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-extrabold transition flex items-center gap-1 ${
                activeTab === 'binder'
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Classeur</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] ${
                  activeTab === 'binder'
                    ? 'bg-slate-950/25 text-slate-950 font-black'
                    : 'bg-white/10 text-amber-300'
                }`}
              >
                {ownedUniqueCount}/{allCards.length}
              </span>
            </button>
          </nav>

          {/* Right Actions: Direct Pack Import + Google Photos Picker + Sound Toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => directPackInputRef.current?.click()}
              disabled={isImportingPack}
              title="Importer un Pack (.json)"
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/35 border border-pink-400/50 text-[11px] sm:text-xs font-extrabold text-pink-200 transition flex items-center gap-1 shadow-sm disabled:opacity-50"
            >
              {isImportingPack ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-300" />
              ) : (
                <Download className="w-3.5 h-3.5 text-pink-300" />
              )}
              <span className="hidden sm:inline">Importer un Pack</span>
              <span className="sm:hidden">Pack</span>
            </button>

            <button
              onClick={() => setIsPhotoManagerOpen(true)}
              title="Google Photos & Gestion du Pack"
              className="px-2 sm:px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/50 text-[11px] sm:text-xs font-bold text-indigo-100 transition flex items-center gap-1 shadow-sm"
            >
              <Images className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">Google Photos</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-950/80 text-amber-300 text-[10px] font-extrabold border border-indigo-400/30">
                {customCards.length}
              </span>
            </button>

            <button
              onClick={() => handleUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              title={settings.soundEnabled ? 'Couper le son' : 'Activer le son'}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 hover:text-amber-300 transition"
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* Live Streaming Pack Import Banner */}
        {importStatusText && (
          <div className="bg-emerald-500/20 border-t border-emerald-400/40 px-3 py-1.5 text-center text-[11px] font-bold text-emerald-200 flex items-center justify-center gap-2">
            {isImportingPack && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300" />}
            <span>{importStatusText}</span>
          </div>
        )}
      </header>

      {/* ==================== MAIN CONTENT STAGE ==================== */}
      <main
        className={
          activeTab === 'booster'
            ? 'flex-1 min-h-0 w-full flex flex-col overflow-hidden'
            : 'flex-1 flex flex-col justify-center'
        }
      >
        {activeTab === 'booster' ? (
          <BoosterOpeningStage
            allCards={allCards}
            collection={collection}
            childName={settings.childName}
            isImportingPack={isImportingPack}
            importStatusText={importStatusText}
            onPackOpened={handlePackOpened}
            onInspectCard={(card) => setInspectedCard(card)}
            onOpenPhotoManager={() => setIsPhotoManagerOpen(true)}
            onTriggerImportPack={() => directPackInputRef.current?.click()}
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

      {/* ==================== FOOTER (Binder view only, so Booster stage stays 100% locked) ==================== */}
      {activeTab === 'binder' && (
        <footer className="mt-6 text-center text-[11px] text-slate-500 px-4">
          <p className="flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400/70" />
            <span>
              milTCG — Toutes vos cartes restent stockées 100% en local dans votre navigateur.
            </span>
          </p>
        </footer>
      )}

      {/* ==================== MODALS ==================== */}
      {inspectedCard && (
        <CardInspectModal
          card={inspectedCard}
          childName={settings.childName}
          countOwned={collection[inspectedCard.id]?.count || 0}
          onClose={() => setInspectedCard(null)}
          onUpdateCard={handleUpdateCard}
          onDeleteCard={handleDeleteCard}
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
