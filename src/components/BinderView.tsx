import React, { useState, useMemo } from 'react';
import { CardRarity, CollectionMap, ElementType, TCGCard } from '../types/tcg';
import { ELEMENT_CONFIG, RARITY_CONFIG } from '../utils/cardGenerator';
import { HoloCard } from './HoloCard';
import { BookOpen, Search, Sparkles, Lock, Filter, Trophy } from 'lucide-react';

interface BinderViewProps {
  allCards: TCGCard[];
  collection: CollectionMap;
  childName: string;
  onInspectCard: (card: TCGCard) => void;
  onSwitchToBooster: () => void;
}

export const BinderView: React.FC<BinderViewProps> = ({
  allCards,
  collection,
  childName,
  onInspectCard,
  onSwitchToBooster,
}) => {
  const [rarityFilter, setRarityFilter] = useState<CardRarity | 'all'>('all');
  const [elementFilter, setElementFilter] = useState<ElementType | 'all'>('all');
  const [onlyOwned, setOnlyOwned] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const ownedUniqueCount = useMemo(
    () => allCards.filter((c) => (collection[c.id]?.count || 0) > 0).length,
    [allCards, collection]
  );

  const totalDuplicates = useMemo(
    () => Object.values(collection).reduce((sum, entry) => sum + entry.count, 0),
    [collection]
  );

  const completionPct =
    allCards.length > 0 ? Math.round((ownedUniqueCount / allCards.length) * 100) : 0;

  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      const owned = (collection[card.id]?.count || 0) > 0;
      if (onlyOwned && !owned) return false;
      if (rarityFilter !== 'all' && card.rarity !== rarityFilter) return false;
      if (elementFilter !== 'all' && card.element !== elementFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = card.title.toLowerCase().includes(q);
        const matchSub = card.subtitle.toLowerCase().includes(q);
        const matchAtk = card.attacks.some((a) => a.name.toLowerCase().includes(q));
        if (!matchTitle && !matchSub && !matchAtk) return false;
      }
      return true;
    });
  }, [allCards, collection, onlyOwned, rarityFilter, elementFilter, searchQuery]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4">
      {/* Collector Album Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900/95 via-indigo-950/90 to-slate-900/95 border border-white/15 p-5 sm:p-6 shadow-2xl mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.4)] shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                  Classeur Collector — {childName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold">
                  {completionPct}% Complété
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                {ownedUniqueCount} / {allCards.length} cartes uniques débloquées • {totalDuplicates}{' '}
                cartes tirées au total
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full md:w-64 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1 text-amber-300">
                <Trophy className="w-3.5 h-3.5" /> Progression du Set
              </span>
              <span>
                {ownedUniqueCount}/{allCards.length}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-950 border border-white/10 overflow-hidden p-0.5">
              <div
                style={{ width: `${completionPct}%` }}
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-indigo-400 transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          {/* Rarity Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 mr-1" />
            <button
              onClick={() => setRarityFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                rarityFilter === 'all'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Toutes
            </button>
            {(['crown', 'ultra', 'holo', 'rare', 'common'] as CardRarity[]).map((r) => (
              <button
                key={r}
                onClick={() => setRarityFilter(r)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
                  rarityFilter === r
                    ? 'bg-white text-slate-950 border-white'
                    : 'bg-slate-900/80 text-slate-300 border-white/10 hover:border-white/30'
                }`}
              >
                {RARITY_CONFIG[r].stars} {RARITY_CONFIG[r].label}
              </button>
            ))}
          </div>

          {/* Search & Element / Owned Toggle */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={elementFilter}
              onChange={(e) => setElementFilter(e.target.value as ElementType | 'all')}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="all">Tous les types</option>
              {(Object.keys(ELEMENT_CONFIG) as ElementType[]).map((el) => (
                <option key={el} value={el}>
                  {ELEMENT_CONFIG[el].emoji} {ELEMENT_CONFIG[el].label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setOnlyOwned(!onlyOwned)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                onlyOwned
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                  : 'bg-slate-950 border-white/15 text-slate-300'
              }`}
            >
              {onlyOwned ? '✓ Possédées uniquement' : 'Afficher les manquantes'}
            </button>

            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Chercher une carte..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* BINDER POCKET GRID */}
      <div className="rounded-3xl bg-slate-950/85 border-2 border-slate-800/90 p-5 sm:p-8 shadow-[inset_0_0_50px_rgba(0,0,0,0.85)]">
        {filteredCards.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <Sparkles className="w-10 h-10 text-amber-400/60" />
            <p className="text-base font-bold text-slate-300">
              Aucune carte ne correspond à ces filtres.
            </p>
            <button
              onClick={() => {
                setRarityFilter('all');
                setElementFilter('all');
                setOnlyOwned(false);
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-white/10 text-xs font-bold text-amber-300 hover:bg-white/15"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 justify-items-center">
            {filteredCards.map((card) => {
              const entry = collection[card.id];
              const count = entry?.count || 0;
              const isOwned = count > 0;

              return (
                <div
                  key={card.id}
                  className="relative p-3 rounded-2xl bg-slate-900/50 border border-white/10 shadow-inner flex flex-col items-center justify-center group"
                >
                  {/* Top stitch line like a real binder sleeve */}
                  <div className="w-full border-t border-dashed border-white/15 mb-2.5" />

                  {isOwned ? (
                    <div className="flex flex-col items-center">
                      <HoloCard
                        card={card}
                        size="md"
                        interactive={true}
                        countBadge={count}
                        onClick={() => onInspectCard(card)}
                      />
                      <div className="mt-2.5 flex items-center justify-between w-full px-1 text-[11px] text-slate-400">
                        <span className="font-bold text-slate-300">
                          #{String(card.setNumber).padStart(3, '0')}
                        </span>
                        <button
                          onClick={() => onInspectCard(card)}
                          className="text-amber-300 hover:underline font-semibold"
                        >
                          Inspecter en 3D →
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Unowned Mystery Pocket Slot */
                    <div className="w-[296px] h-[445px] rounded-[18px] bg-slate-950/90 border-2 border-dashed border-slate-700/70 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                      {/* Blurred preview silhouette of the card */}
                      <img
                        src={card.imageUrl}
                        alt="Carte mystère"
                        className="absolute inset-0 w-full h-full object-cover opacity-15 blur-md grayscale pointer-events-none"
                      />
                      <div className="relative z-10 w-14 h-14 rounded-2xl bg-slate-900/90 border border-white/10 flex items-center justify-center text-slate-500 mb-3">
                        <Lock className="w-6 h-6" />
                      </div>
                      <span className="relative z-10 text-xs font-black text-slate-400 tracking-widest">
                        CARTE #{String(card.setNumber).padStart(3, '0')}
                      </span>
                      <span
                        className={`relative z-10 mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          RARITY_CONFIG[card.rarity].colorClass
                        }`}
                      >
                        {RARITY_CONFIG[card.rarity].stars} {RARITY_CONFIG[card.rarity].label}
                      </span>
                      <p className="relative z-10 text-[11px] text-slate-400 mt-4">
                        Ouvrez des boosters pour débloquer ce souvenir dans votre classeur !
                      </p>
                      <button
                        onClick={onSwitchToBooster}
                        className="relative z-10 mt-4 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-slate-950 text-xs font-bold text-slate-200 transition"
                      >
                        Ouvrir un Booster
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
