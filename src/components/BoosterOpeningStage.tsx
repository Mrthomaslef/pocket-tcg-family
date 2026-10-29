import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { BoosterSeries, CollectionMap, PulledCardResult, TCGCard } from '../types/tcg';
import { BOOSTER_SERIES, RARITY_CONFIG, drawBoosterPack } from '../utils/cardGenerator';
import { soundFX } from '../utils/soundFX';
import { HoloCard } from './HoloCard';
import {
  Sparkles,
  Scissors,
  RotateCcw,
  Images,
  ChevronRight,
  Crown,
  Flame,
  Hand,
  Eye,
} from 'lucide-react';

interface BoosterOpeningStageProps {
  allCards: TCGCard[];
  collection: CollectionMap;
  childName: string;
  onPackOpened: (pulled: PulledCardResult[]) => void;
  onInspectCard: (card: TCGCard) => void;
  onOpenPhotoManager: () => void;
}

type StagePhase = 'ready' | 'bursting' | 'stack' | 'summary';

interface SparkParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

export const BoosterOpeningStage: React.FC<BoosterOpeningStageProps> = ({
  allCards,
  collection,
  childName,
  onPackOpened,
  onInspectCard,
  onOpenPhotoManager,
}) => {
  const [selectedSeries, setSelectedSeries] = useState<BoosterSeries>(BOOSTER_SERIES[0]);
  const [phase, setPhase] = useState<StagePhase>('ready');

  // Interactive foil tear state (0 to 100)
  const [tearProgress, setTearProgress] = useState<number>(0);
  const [isDraggingTear, setIsDraggingTear] = useState<boolean>(false);
  const [packTilt, setPackTilt] = useState({ rx: 0, ry: 0, glareX: 50, glareY: 50 });
  const [sparks, setSparks] = useState<SparkParticle[]>([]);

  // Pulled cards in current booster
  const [pulledCards, setPulledCards] = useState<PulledCardResult[]>([]);
  const [isGodPack, setIsGodPack] = useState<boolean>(false);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);

  // Card swipe animation state
  const [cardSwipeOffset, setCardSwipeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSwipingCard, setIsSwipingCard] = useState<boolean>(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState<boolean>(false);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const packRef = useRef<HTMLDivElement>(null);
  const customPhotosCount = allCards.filter((c) => c.isCustomPhoto).length;
  // Only show an already-pulled custom photo on the pack cover so unpulled photos remain a 100% surprise!
  const coverPhotoUrl =
    allCards.find((c) => c.isCustomPhoto && (collection[c.id]?.count || 0) > 0)?.imageUrl ||
    allCards.find((c) => !c.isCustomPhoto)?.imageUrl ||
    '';

  // Pre-roll the pack when entering 'ready' so the internal seam glow matches the best card inside!
  const pendingPackRef = useRef<{ cards: TCGCard[]; isGodPack: boolean } | null>(null);
  useEffect(() => {
    if (phase === 'ready' && allCards.length > 0) {
      pendingPackRef.current = drawBoosterPack(allCards, 5);
    }
  }, [phase, allCards, selectedSeries]);

  const getPackSeamGlowColor = (): string => {
    const pending = pendingPackRef.current;
    if (!pending) return '#38bdf8';
    if (pending.isGodPack || pending.cards.some((c) => c.rarity === 'crown')) return '#fbbf24';
    if (pending.cards.some((c) => c.rarity === 'ultra')) return '#f472b6';
    if (pending.cards.some((c) => c.rarity === 'holo')) return '#c084fc';
    return '#38bdf8';
  };

  // Trigger confetti for Ultra Rare or Crown cards
  const triggerRarityConfetti = (rarity: string) => {
    if (rarity === 'crown') {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#fbbf24', '#fef08a', '#f59e0b', '#ffffff'],
      });
    } else if (rarity === 'ultra') {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.55 },
        colors: ['#f472b6', '#c084fc', '#38bdf8', '#fbbf24'],
      });
    }
  };

  // Handle tearing drag across the booster top
  const updateTearFromClientX = (clientX: number, clientY: number) => {
    if (!packRef.current || phase !== 'ready') return;
    const rect = packRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const percentage = Math.round(relX * 100);

    // Allow smooth progressive tearing (or starting from left side)
    if (percentage > tearProgress - 15) {
      const nextProgress = Math.max(tearProgress, percentage);
      setTearProgress(nextProgress);
      soundFX.playTearStep(nextProgress / 100);

      // Spawn metallic foil sparks
      const glowColor = getPackSeamGlowColor();
      const newSparks: SparkParticle[] = Array.from({ length: 3 }).map((_, i) => ({
        id: Date.now() + Math.random() + i,
        x: relX * 100,
        y: Math.max(8, Math.min(26, ((clientY - rect.top) / rect.height) * 100)),
        vx: (Math.random() - 0.3) * 35,
        vy: (Math.random() - 0.8) * 35,
        color: i % 2 === 0 ? '#ffffff' : glowColor,
      }));
      setSparks((prev) => [...prev.slice(-15), ...newSparks]);

      if (nextProgress >= 86) {
        completePackTear();
      }
    }
  };

  const completePackTear = () => {
    if (phase !== 'ready') return;
    setIsDraggingTear(false);
    setTearProgress(100);

    const drawn = pendingPackRef.current || drawBoosterPack(allCards, 5);
    const results: PulledCardResult[] = drawn.cards.map((card, idx) => ({
      card,
      isNew: !collection[card.id] || collection[card.id].count === 0,
      pullIndex: idx,
    }));

    const hasBigHit = results.some(
      (r) => r.card.rarity === 'ultra' || r.card.rarity === 'crown' || r.card.rarity === 'holo'
    );

    soundFX.playPackBurst(hasBigHit);
    setPulledCards(results);
    setIsGodPack(drawn.isGodPack);
    setCurrentCardIndex(0);
    setPhase('bursting');

    // Commit to collection immediately so player never loses cards
    onPackOpened(results);

    setTimeout(() => {
      setPhase('stack');
      if (results[0]) {
        soundFX.playRarityReveal(results[0].card.rarity);
        triggerRarityConfetti(results[0].card.rarity);
      }
    }, 680);
  };

  // Booster 3D hover tilt when not tearing
  const handlePackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingTear) {
      updateTearFromClientX(e.clientX, e.clientY);
      return;
    }
    if (!packRef.current) return;
    const rect = packRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const ry = ((px - 50) / 50) * 12;
    const rx = -((py - 50) / 50) * 10;
    setPackTilt({ rx, ry, glareX: px, glareY: py });
  };

  const handlePackPointerLeave = () => {
    if (isDraggingTear && tearProgress < 86) {
      setIsDraggingTear(false);
    }
    setPackTilt({ rx: 0, ry: 0, glareX: 50, glareY: 50 });
  };

  // Swipe / Advance to next card in the 5-card stack
  const advanceToNextCard = () => {
    if (isAnimatingOut) return;
    setIsAnimatingOut(true);
    soundFX.playCardSwipe();

    setTimeout(() => {
      const nextIdx = currentCardIndex + 1;
      setCardSwipeOffset({ x: 0, y: 0 });
      setIsAnimatingOut(false);

      if (nextIdx >= pulledCards.length) {
        setPhase('summary');
      } else {
        setCurrentCardIndex(nextIdx);
        const nextCard = pulledCards[nextIdx].card;
        soundFX.playRarityReveal(nextCard.rarity);
        triggerRarityConfetti(nextCard.rarity);
      }
    }, 240);
  };

  const handleCardStackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isAnimatingOut) return;
    swipeStartRef.current = { x: e.clientX, y: e.clientY };
    setIsSwipingCard(true);
  };

  const handleCardStackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSwipingCard || !swipeStartRef.current) return;
    const dx = e.clientX - swipeStartRef.current.x;
    const dy = e.clientY - swipeStartRef.current.y;
    setCardSwipeOffset({ x: dx, y: dy });
  };

  const handleCardStackPointerUp = () => {
    if (!isSwipingCard) return;
    setIsSwipingCard(false);
    const dist = Math.hypot(cardSwipeOffset.x, cardSwipeOffset.y);
    if (dist > 65) {
      advanceToNextCard();
    } else {
      setCardSwipeOffset({ x: 0, y: 0 });
    }
    swipeStartRef.current = null;
  };

  const resetForNextBooster = () => {
    setTearProgress(0);
    setSparks([]);
    setPulledCards([]);
    setCurrentCardIndex(0);
    setPhase('ready');
  };

  const seamGlowHex = getPackSeamGlowColor();
  const currentPulled = pulledCards[currentCardIndex];
  const nextPulled = pulledCards[currentCardIndex + 1];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 flex flex-col items-center">
      {/* Subtle Prompt if user hasn't imported real Google Photos yet */}
      {customPhotosCount === 0 && (
        <div className="w-full max-w-2xl mb-5 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-purple-950/90 to-slate-900/90 border border-amber-400/40 p-3.5 sm:px-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-300">
              <Images className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white">
                Mode Démo Actif — Transformez les photos de {childName} en vraies cartes !
              </p>
              <p className="text-[11px] text-slate-300">
                Connectez Google Photos Picker ou glissez vos photos favorites en 1 clic.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenPhotoManager}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-extrabold text-xs whitespace-nowrap shadow-md hover:brightness-110 transition flex items-center gap-1.5"
          >
            <Images className="w-4 h-4" />
            Importer Google Photos
          </button>
        </div>
      )}

      {/* ==================== PHASE 1 & 2: BOOSTER SELECTION & TEARING ==================== */}
      {(phase === 'ready' || phase === 'bursting') && (
        <div className="w-full flex flex-col items-center">
          {/* Booster Edition Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {BOOSTER_SERIES.map((series) => {
              const active = series.id === selectedSeries.id;
              return (
                <button
                  key={series.id}
                  onClick={() => {
                    setSelectedSeries(series);
                    setTearProgress(0);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                    active
                      ? 'bg-white/15 border-amber-400 text-white shadow-[0_0_20px_rgba(251,191,36,0.25)] scale-105'
                      : 'bg-slate-900/70 border-white/10 text-slate-400 hover:text-white hover:border-white/25'
                  }`}
                >
                  <span>{series.iconEmoji}</span>
                  <span>{series.name}</span>
                </button>
              );
            })}
          </div>

          {/* Instruction Banner */}
          <div className="mb-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-400/30 text-amber-200 text-xs font-semibold shadow-inner">
            <Scissors className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>
              {tearProgress === 0
                ? 'Glissez votre doigt ou la souris sur la ligne pointillée pour déchirer le booster !'
                : tearProgress < 86
                ? `Continuez de déchirer... (${tearProgress}%)`
                : 'Ouverture magique !'}
            </span>
          </div>

          {/* 3D Interactive Booster Pack */}
          <div className="relative flex items-center justify-center my-2 perspective-1500">
            {/* Internal Seam Light Burst when tearing or bursting */}
            <div
              style={{
                opacity: phase === 'bursting' ? 1 : tearProgress / 90,
                transform: `scale(${phase === 'bursting' ? 2.2 : 0.8 + (tearProgress / 100) * 0.6})`,
                background: `radial-gradient(circle, ${seamGlowHex} 0%, transparent 70%)`,
              }}
              className="absolute w-80 h-80 rounded-full pointer-events-none blur-2xl transition-all duration-300 z-0"
            />

            {/* THE FOIL BOOSTER PACK */}
            <div
              ref={packRef}
              onPointerDown={(e) => {
                setIsDraggingTear(true);
                updateTearFromClientX(e.clientX, e.clientY);
              }}
              onPointerMove={handlePackPointerMove}
              onPointerUp={() => setIsDraggingTear(false)}
              onPointerLeave={handlePackPointerLeave}
              style={{
                transform:
                  phase === 'bursting'
                    ? 'scale(1.18) translateY(30px)'
                    : `rotateX(${packTilt.rx}deg) rotateY(${packTilt.ry}deg) ${
                        tearProgress > 0 && tearProgress < 86
                          ? `translate(${(Math.random() - 0.5) * 3}px, ${(Math.random() - 0.5) * 3}px)`
                          : ''
                      }`,
                opacity: phase === 'bursting' ? 0 : 1,
                transition: isDraggingTear
                  ? 'none'
                  : 'transform 450ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease',
              }}
              className="relative z-10 w-[290px] sm:w-[320px] h-[450px] sm:h-[490px] select-none cursor-grab active:cursor-grabbing touch-none"
            >
              {/* ================= TOP TEARABLE FOIL STRIP ================= */}
              <div
                style={{
                  transformOrigin: '100% 100%',
                  transform:
                    phase === 'bursting'
                      ? 'translateY(-140px) rotate(28deg) scale(0.9)'
                      : `translateY(${-tearProgress * 0.28}px) rotate(${tearProgress * 0.18}deg)`,
                  opacity: phase === 'bursting' ? 0 : 1,
                  transition: isDraggingTear ? 'none' : 'all 350ms ease',
                }}
                className="absolute top-0 inset-x-0 h-[76px] z-30 rounded-t-2xl overflow-hidden shadow-lg"
              >
                {/* Crimped Silver Foil Ridges */}
                <div className="w-full h-5 bg-[repeating-linear-gradient(90deg,#cbd5e1_0px,#cbd5e1_3px,#64748b_3px,#64748b_6px)] border-b border-white/40" />
                <div
                  className={`w-full h-full bg-gradient-to-r ${selectedSeries.gradient} relative flex items-center justify-center`}
                >
                  <div className="absolute inset-0 booster-metallic-sheen opacity-50" />
                  <span className="relative z-10 text-[10px] font-black tracking-[0.22em] uppercase text-white/90 drop-shadow">
                    {selectedSeries.badgeText}
                  </span>
                </div>
              </div>

              {/* ================= GLOWING INTERNAL SEAM (Revealed as top tears) ================= */}
              <div
                style={{
                  opacity: Math.min(1, tearProgress / 25),
                  boxShadow: `0 0 ${15 + tearProgress * 0.5}px ${seamGlowHex}`,
                  backgroundColor: seamGlowHex,
                }}
                className="absolute top-[70px] left-3 right-3 h-3 rounded-full z-20 pointer-events-none transition-opacity"
              />

              {/* ================= INTERACTIVE CUT LINE GUIDE ================= */}
              <div className="absolute top-[62px] -inset-x-3 h-9 z-40 flex items-center">
                <div className="w-full h-full rounded-full flex items-center relative px-3">
                  {/* Uncut dotted line */}
                  <div className="w-full border-b-2 border-dashed border-amber-300/90 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                  {/* Progress Glowing Laser Line */}
                  <div
                    style={{
                      width: `${tearProgress}%`,
                      backgroundColor: seamGlowHex,
                      boxShadow: `0 0 18px ${seamGlowHex}, 0 0 32px #ffffff`,
                    }}
                    className="absolute left-3 h-1.5 rounded-full transition-all duration-75"
                  />
                  {/* Sliding Scissor / Spark Handle */}
                  <div
                    style={{ left: `calc(${Math.min(94, Math.max(4, tearProgress))}% )` }}
                    className="absolute -translate-x-1/2 w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,1)] border-2 border-white transition-all duration-75"
                  >
                    <Scissors className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* ================= MAIN BOOSTER BODY ================= */}
              <div
                className={`absolute top-[74px] bottom-0 inset-x-0 rounded-b-2xl overflow-hidden bg-gradient-to-br ${selectedSeries.gradient} border-x-2 border-b-2 border-white/30 shadow-[0_25px_60px_rgba(0,0,0,0.75)] flex flex-col items-center justify-between p-5`}
              >
                {/* Foil Metallic Specular Reflection */}
                <div
                  style={{
                    backgroundPosition: `${packTilt.glareX * 2}% ${packTilt.glareY * 2}%`,
                  }}
                  className="absolute inset-0 booster-metallic-sheen pointer-events-none z-20 opacity-60"
                />

                {/* Decorative background pattern */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />

                {/* Top Series Emblem */}
                <div className="relative z-10 text-center mt-1">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/25 text-[10px] font-extrabold text-amber-300 tracking-widest uppercase mb-1">
                    <Sparkles className="w-3 h-3" /> {childName} TCG
                  </div>
                  <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight uppercase drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] leading-none">
                    {selectedSeries.name}
                  </h2>
                  <p className="text-[11px] text-white/85 font-semibold mt-1">
                    {selectedSeries.subtitle}
                  </p>
                </div>

                {/* Central Hero Medallion featuring the Son's Photo */}
                <div className="relative z-10 my-auto">
                  <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-full p-1.5 bg-gradient-to-tr from-amber-300 via-white to-pink-400 shadow-[0_0_35px_rgba(251,191,36,0.5)]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 relative border-2 border-slate-950 flex items-center justify-center">
                      {coverPhotoUrl ? (
                        <img
                          src={coverPhotoUrl}
                          alt={childName}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-amber-300">
                          <Crown className="w-16 h-16 drop-shadow-[0_0_15px_rgba(251,191,36,0.9)] animate-pulse" />
                          <span className="font-display font-black text-xs tracking-widest mt-1 text-white">
                            SURPRISE ?
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    </div>
                  </div>
                  <div className=" -mt-3 mx-auto w-max px-3 py-0.5 rounded-full bg-slate-950/90 border border-amber-400/60 text-amber-300 font-display font-black text-xs tracking-wider uppercase shadow-lg relative z-20">
                    ★ 5 CARTES GARANTIES ★
                  </div>
                </div>

                {/* Bottom Foil Crimp */}
                <div className="relative z-10 w-full flex items-center justify-between text-[10px] font-bold text-white/80 pt-2 border-t border-white/20">
                  <span>ÉDITION FAMILLE</span>
                  <span>1 HOLO+ POSSIBLE</span>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-3.5 bg-[repeating-linear-gradient(90deg,#cbd5e1_0px,#cbd5e1_3px,#64748b_3px,#64748b_6px)] opacity-85" />
              </div>

              {/* Foil Sparks Overlay */}
              {sparks.map((s) => (
                <div
                  key={s.id}
                  style={{
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    backgroundColor: s.color,
                    boxShadow: `0 0 10px ${s.color}`,
                  }}
                  className="pointer-events-none absolute w-2 h-2 rounded-full z-50 animate-ping"
                />
              ))}
            </div>
          </div>

          {/* Quick Open Button for accessibility / 1-click convenience */}
          <button
            onClick={completePackTear}
            className="mt-4 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-slate-200 hover:text-white transition flex items-center gap-2"
          >
            <Scissors className="w-4 h-4 text-amber-400" />
            Ou cliquez ici pour déchirer d’un coup
          </button>
        </div>
      )}

      {/* ==================== PHASE 3: CARD-BY-CARD STACK REVEAL ==================== */}
      {phase === 'stack' && currentPulled && (
        <div className="w-full flex flex-col items-center py-2 animate-fadeIn">
          {/* Top Progress Bar */}
          <div className="flex items-center gap-3 mb-5">
            {isGodPack && (
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 text-white font-black text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-bounce flex items-center gap-1">
                <Crown className="w-4 h-4" /> GOD PACK LÉGENDAIRE !
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-white/15 px-3.5 py-1.5 rounded-full">
              {pulledCards.map((item, idx) => {
                const isCurrent = idx === currentCardIndex;
                const isPast = idx < currentCardIndex;
                return (
                  <div
                    key={idx}
                    className={`h-2.5 rounded-full transition-all ${
                      isCurrent
                        ? 'w-7 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]'
                        : isPast
                        ? 'w-2.5 bg-emerald-400'
                        : 'w-2.5 bg-slate-700'
                    }`}
                  />
                );
              })}
              <span className="ml-2 text-xs font-bold text-slate-300">
                Carte {currentCardIndex + 1} / {pulledCards.length}
              </span>
            </div>
          </div>

          {/* 3D CARD STACK STAGE */}
          <div className="relative w-[350px] sm:w-[390px] h-[510px] sm:h-[550px] flex items-center justify-center my-1">
            {/* Ambient Rarity Backlight Aura */}
            <div
              style={{
                backgroundColor: RARITY_CONFIG[currentPulled.card.rarity].glowHex,
              }}
              className={`absolute w-80 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
                currentPulled.card.rarity === 'crown' || currentPulled.card.rarity === 'ultra'
                  ? 'opacity-55 scale-110 animate-pulse'
                  : 'opacity-25 scale-95'
              }`}
            />

            {/* Next Card Preview Underneath */}
            {nextPulled && (
              <div
                style={{
                  transform: 'scale(0.94) translateY(14px)',
                  boxShadow:
                    nextPulled.card.rarity === 'crown' || nextPulled.card.rarity === 'ultra'
                      ? `0 0 35px ${RARITY_CONFIG[nextPulled.card.rarity].glowHex}`
                      : undefined,
                }}
                className="absolute z-10 pointer-events-none opacity-80 transition-transform duration-300 rounded-[18px]"
              >
                <HoloCard card={nextPulled.card} size="lg" interactive={false} />
              </div>
            )}

            {/* Current Active Top Card (Swipeable / Interactive 3D) */}
            <div
              onPointerDown={handleCardStackPointerDown}
              onPointerMove={handleCardStackPointerMove}
              onPointerUp={handleCardStackPointerUp}
              style={{
                transform: isAnimatingOut
                  ? `translate(${cardSwipeOffset.x > 0 ? 420 : -420}px, ${cardSwipeOffset.y - 40}px) rotate(${
                      cardSwipeOffset.x > 0 ? 18 : -18
                    }deg) scale(0.9)`
                  : `translate(${cardSwipeOffset.x}px, ${cardSwipeOffset.y}px) rotate(${
                      cardSwipeOffset.x * 0.04
                    }deg)`,
                opacity: isAnimatingOut ? 0 : 1,
                transition: isSwipingCard
                  ? 'none'
                  : 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease',
              }}
              className="relative z-20 touch-none cursor-grab active:cursor-grabbing"
            >
              <HoloCard
                card={currentPulled.card}
                size="lg"
                interactive={true}
                isNew={currentPulled.isNew}
              />
            </div>
          </div>

          {/* Rarity Banner & Controls */}
          <div className="mt-4 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                  RARITY_CONFIG[currentPulled.card.rarity].colorClass
                }`}
              >
                {RARITY_CONFIG[currentPulled.card.rarity].stars}{' '}
                {RARITY_CONFIG[currentPulled.card.rarity].label}
              </span>
              {currentPulled.isNew && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold">
                  Ajoutée au Classeur !
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={advanceToNextCard}
                className="px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 text-slate-950 font-display font-black text-sm shadow-[0_0_25px_rgba(251,191,36,0.4)] hover:brightness-110 active:scale-95 transition flex items-center gap-2"
              >
                <span>
                  {currentCardIndex + 1 < pulledCards.length
                    ? 'Carte Suivante'
                    : 'Voir le Résumé du Pack'}
                </span>
                <ChevronRight className="w-5 h-5" />
              </button>

              {currentCardIndex + 1 < pulledCards.length && (
                <button
                  onClick={() => setPhase('summary')}
                  className="px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-xs font-bold text-slate-300 transition"
                >
                  Tout révéler
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Hand className="w-3.5 h-3.5 text-amber-400" />
              Inclinez la carte pour admirer les reflets holographiques ou glissez-la sur le côté
            </p>
          </div>
        </div>
      )}

      {/* ==================== PHASE 4: PACK SUMMARY ("RÉSUMÉ DU TIRAGE") ==================== */}
      {phase === 'summary' && (
        <div className="w-full flex flex-col items-center py-2 animate-fadeIn">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-extrabold mb-2">
              <Flame className="w-4 h-4" /> TIRAGE TERMINÉ !
            </div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
              Vos 5 Cartes Obtenues
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Cliquez sur n’importe quelle carte pour l’inspecter en 3D ou personnaliser ses attaques
            </p>
          </div>

          {/* 5-Card Showcase Grid */}
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6 my-2">
            {pulledCards.map((item, idx) => (
              <div
                key={`${item.card.id}-${idx}`}
                className="flex flex-col items-center gap-2 group"
              >
                <HoloCard
                  card={item.card}
                  size="md"
                  interactive={true}
                  isNew={item.isNew}
                  onClick={() => onInspectCard(item.card)}
                />
                <button
                  onClick={() => onInspectCard(item.card)}
                  className="px-3 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-[11px] font-semibold text-slate-300 group-hover:text-amber-300 transition flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" /> Inspecter / Éditer
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={resetForNextBooster}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 font-display font-black text-base shadow-[0_0_30px_rgba(251,191,36,0.45)] hover:brightness-110 active:scale-95 transition flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Ouvrir un Nouveau Booster !
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
