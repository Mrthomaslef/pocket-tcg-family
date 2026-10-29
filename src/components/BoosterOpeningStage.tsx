import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { BoosterSeries, CollectionMap, PulledCardResult, TCGCard } from '../types/tcg';
import { BOOSTER_SERIES, RARITY_CONFIG, drawBoosterPack } from '../utils/cardGenerator';
import { soundFX } from '../utils/soundFX';
import { HoloCard } from './HoloCard';
import {
  Sparkles,
  RotateCcw,
  Images,
  Crown,
  Flame,
  Hand,
  Eye,
  Download,
  Loader2,
} from 'lucide-react';

interface BoosterOpeningStageProps {
  allCards: TCGCard[];
  collection: CollectionMap;
  childName: string;
  isImportingPack?: boolean;
  importStatusText?: string | null;
  onPackOpened: (pulled: PulledCardResult[]) => void;
  onInspectCard: (card: TCGCard) => void;
  onOpenPhotoManager: () => void;
  onTriggerImportPack: () => void;
}

type StagePhase = 'ready' | 'bursting' | 'stack' | 'summary';

interface SparkParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  angle: number;
  distance: number;
  color: string;
}

export const BoosterOpeningStage: React.FC<BoosterOpeningStageProps> = ({
  allCards,
  collection,
  childName,
  isImportingPack = false,
  importStatusText = null,
  onPackOpened,
  onInspectCard,
  onOpenPhotoManager,
  onTriggerImportPack,
}) => {
  const [selectedSeries, setSelectedSeries] = useState<BoosterSeries>(BOOSTER_SERIES[0]);
  const [phase, setPhase] = useState<StagePhase>('ready');

  // Interactive foil tear state (0 to 100)
  const [tearProgress, setTearProgress] = useState<number>(0);
  const [isDraggingTear, setIsDraggingTear] = useState<boolean>(false);
  const [packTilt, setPackTilt] = useState({ rx: 0, ry: 0, glareX: 50, glareY: 50 });
  const [sparks, setSparks] = useState<SparkParticle[]>([]);
  const [screenFlash, setScreenFlash] = useState<boolean>(false);

  // Pulled cards in current booster
  const [pulledCards, setPulledCards] = useState<PulledCardResult[]>([]);
  const [isGodPack, setIsGodPack] = useState<boolean>(false);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);

  // Mystery Hit Card Face-Down Flip state (for Holo / Ultra / Crown cards!)
  const [isCurrentCardFaceDown, setIsCurrentCardFaceDown] = useState<boolean>(false);

  // Card swipe animation state
  const [cardSwipeOffset, setCardSwipeOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSwipingCard, setIsSwipingCard] = useState<boolean>(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState<boolean>(false);
  const [exitDirection, setExitDirection] = useState<{ x: number; y: number }>({ x: 420, y: -40 });
  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

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

  const isBigHitRarity = (rarity: string) =>
    rarity === 'holo' || rarity === 'ultra' || rarity === 'crown';

  // Trigger confetti for Ultra Rare or Crown cards
  const triggerRarityConfetti = (rarity: string) => {
    if (rarity === 'crown') {
      confetti({
        particleCount: 110,
        spread: 90,
        origin: { y: 0.52 },
        colors: ['#fbbf24', '#fef08a', '#f59e0b', '#ffffff'],
      });
    } else if (rarity === 'ultra') {
      confetti({
        particleCount: 75,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#f472b6', '#c084fc', '#38bdf8', '#fbbf24'],
      });
    } else if (rarity === 'holo') {
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.58 },
        colors: ['#e879f9', '#38bdf8', '#fde047'],
      });
    }
  };

  // Start tearing from the left side of the booster seam
  const handleSeamPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'ready' || !packRef.current) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    const rect = packRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    // Must start on the left side (0% to 35%) or near current tear progress
    if (relX <= 0.38 || Math.abs(relX * 100 - tearProgress) < 25) {
      setIsDraggingTear(true);
      soundFX.playNotchGrab();
      const startPct = Math.max(tearProgress, Math.min(18, Math.round(relX * 100)));
      setTearProgress(startPct);
    }
  };

  // Update progressive foil tear as finger/mouse slices across the pack
  const updateTearFromClientX = (clientX: number, clientY: number) => {
    if (!packRef.current || phase !== 'ready' || !isDraggingTear) return;
    const rect = packRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const percentage = Math.round(relX * 100);

    // Smooth forward slicing without jumping from 0% straight to 100%
    if (percentage > tearProgress && percentage - tearProgress <= 45) {
      setTearProgress(percentage);
      soundFX.playTearStep(percentage / 100);

      // Spawn burst of metallic & glowing sparks at the tear point
      const glowColor = getPackSeamGlowColor();
      const newSparks: SparkParticle[] = Array.from({ length: 5 }).map((_, i) => ({
        id: Date.now() + Math.random() + i,
        x: percentage,
        y: Math.max(10, Math.min(24, ((clientY - rect.top) / rect.height) * 100)),
        size: 4 + Math.random() * 6,
        angle: -90 + (Math.random() - 0.5) * 140,
        distance: 25 + Math.random() * 55,
        color: i % 2 === 0 ? '#ffffff' : glowColor,
      }));
      setSparks((prev) => [...prev.slice(-24), ...newSparks]);

      if (percentage >= 88) {
        completePackTear();
      }
    }
  };

  // If user releases finger before finishing the tear, snap back with tension!
  const handleReleaseTearEarly = () => {
    if (!isDraggingTear) return;
    setIsDraggingTear(false);
    if (tearProgress < 88 && phase === 'ready') {
      setTearProgress(0);
      setSparks([]);
    }
  };

  const completePackTear = () => {
    if (phase !== 'ready') return;
    setIsDraggingTear(false);
    setTearProgress(100);
    setScreenFlash(true);
    setTimeout(() => setScreenFlash(false), 450);

    const drawn = pendingPackRef.current || drawBoosterPack(allCards, 5);
    const results: PulledCardResult[] = drawn.cards.map((card, idx) => ({
      card,
      isNew: !collection[card.id] || collection[card.id].count === 0,
      pullIndex: idx,
    }));

    const hasBigHit = results.some((r) => isBigHitRarity(r.card.rarity));

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
        const firstIsHit = isBigHitRarity(results[0].card.rarity);
        setIsCurrentCardFaceDown(firstIsHit);
        if (!firstIsHit) {
          soundFX.playRarityReveal(results[0].card.rarity);
        }
      }
    }, 850);
  };

  // Booster 3D hover tilt when inspecting pack
  const handlePackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingTear) {
      updateTearFromClientX(e.clientX, e.clientY);
      return;
    }
    if (!packRef.current) return;
    const rect = packRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const ry = ((px - 50) / 50) * 14;
    const rx = -((py - 50) / 50) * 11;
    setPackTilt({ rx, ry, glareX: px, glareY: py });
  };

  const handlePackPointerLeave = () => {
    if (isDraggingTear) {
      handleReleaseTearEarly();
    }
    setPackTilt({ rx: 0, ry: 0, glareX: 50, glareY: 50 });
  };

  // Flip a face-down Mystery Hit card with dramatic reveal!
  const revealFaceDownHitCard = () => {
    if (!isCurrentCardFaceDown || !pulledCards[currentCardIndex]) return;
    const currentCard = pulledCards[currentCardIndex].card;
    setIsCurrentCardFaceDown(false);
    setScreenFlash(true);
    setTimeout(() => setScreenFlash(false), 380);
    soundFX.playRarityReveal(currentCard.rarity);
    triggerRarityConfetti(currentCard.rarity);
  };

  // Swipe / Fling the current card off the stack to reveal the next card
  const flingCurrentCardOffStack = (dirX: number, dirY: number) => {
    if (isAnimatingOut) return;
    const norm = Math.hypot(dirX, dirY) || 1;
    const targetX = (dirX / norm) * 480;
    const targetY = (dirY / norm) * 280 - 30;

    setExitDirection({ x: targetX, y: targetY });
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
        const nextIsHit = isBigHitRarity(nextCard.rarity);
        setIsCurrentCardFaceDown(nextIsHit);
        if (!nextIsHit) {
          soundFX.playRarityReveal(nextCard.rarity);
        }
      }
    }, 270);
  };

  const handleCardStackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isAnimatingOut) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    swipeStartRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    setIsSwipingCard(true);
  };

  const handleCardStackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSwipingCard || !swipeStartRef.current) return;
    const dx = e.clientX - swipeStartRef.current.x;
    const dy = e.clientY - swipeStartRef.current.y;
    setCardSwipeOffset({ x: dx, y: dy });
  };

  const handleCardStackPointerUp = () => {
    if (!isSwipingCard || !swipeStartRef.current) return;
    setIsSwipingCard(false);

    const dx = cardSwipeOffset.x;
    const dy = cardSwipeOffset.y;
    const dist = Math.hypot(dx, dy);
    const elapsed = Math.max(1, performance.now() - swipeStartRef.current.time);
    const velocity = dist / elapsed; // px per ms

    swipeStartRef.current = null;

    // If card is face-down (Mystery Hit!), a tap or small swipe flips it face-up first!
    if (isCurrentCardFaceDown) {
      setCardSwipeOffset({ x: 0, y: 0 });
      revealFaceDownHitCard();
      return;
    }

    // If user dragged far enough (>75px) or flicked quickly (velocity > 0.45 and dist > 30px), fling card off!
    if (dist > 75 || (velocity > 0.45 && dist > 30)) {
      flingCurrentCardOffStack(dx || 1, dy);
    } else {
      setCardSwipeOffset({ x: 0, y: 0 });
    }
  };

  const resetForNextBooster = () => {
    setTearProgress(0);
    setSparks([]);
    setPulledCards([]);
    setCurrentCardIndex(0);
    setIsCurrentCardFaceDown(false);
    setPhase('ready');
  };

  const seamGlowHex = getPackSeamGlowColor();
  const currentPulled = pulledCards[currentCardIndex];
  const nextPulled = pulledCards[currentCardIndex + 1];

  // Dynamic shake intensity & camera zoom as you slice the booster
  const shakeOffset =
    isDraggingTear && tearProgress > 5
      ? {
          x: (Math.random() - 0.5) * (2 + (tearProgress / 100) * 8),
          y: (Math.random() - 0.5) * (2 + (tearProgress / 100) * 8),
        }
      : { x: 0, y: 0 };

  const tensionScale =
    phase === 'bursting' ? 1.15 : 1 + (tearProgress / 100) * 0.09;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 flex flex-col items-center relative">
      {/* Full-Screen Dramatic Light Flash on Pack Burst / Hit Flip */}
      {screenFlash && (
        <div
          style={{
            background: `radial-gradient(circle, #ffffff 0%, ${seamGlowHex} 50%, transparent 100%)`,
          }}
          className="fixed inset-0 z-50 pointer-events-none animate-ping opacity-70"
        />
      )}

      {/* ==================== EMPTY STATE: DIRECT PACK IMPORT OR GOOGLE PHOTOS ==================== */}
      {allCards.length === 0 && (
        <div className="w-full max-w-xl my-8 rounded-3xl bg-gradient-to-br from-slate-900/95 via-indigo-950/90 to-slate-900/95 border border-white/15 p-7 sm:p-10 text-center shadow-2xl flex flex-col items-center gap-5">
          <img
            src="./icon-512.png"
            alt="milTCG"
            className="w-28 h-28 rounded-3xl shadow-[0_0_40px_rgba(251,191,36,0.5)] object-cover"
          />

          <div className="space-y-2">
            <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
              Bienvenue sur mil<span className="text-amber-400">TCG</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Importez un fichier de Pack (`.json`) directement ou tirez vos photos au hasard depuis
              Google Photos pour commencer la collection.
            </p>
          </div>

          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onTriggerImportPack}
              disabled={isImportingPack}
              className="w-full sm:w-auto flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 font-display font-black text-sm shadow-[0_0_30px_rgba(251,191,36,0.4)] hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              {isImportingPack ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{importStatusText || 'Importation en cours...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>📥 Importer un Pack (.json)</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenPhotoManager}
              disabled={isImportingPack}
              className="w-full sm:w-auto py-4 px-5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-white/15 text-white font-display font-bold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Images className="w-5 h-5 text-amber-400" />
              <span>Google Photos</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== PHASE 1 & 2: TACTILE BOOSTER TEARING ==================== */}
      {allCards.length > 0 && (phase === 'ready' || phase === 'bursting') && (
        <div className="w-full flex flex-col items-center">
          {/* Booster Edition Selector Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
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

          {/* Interactive Gesture Prompt */}
          <div className="mb-5 flex items-center gap-2.5 px-5 py-2 rounded-full bg-slate-900/90 border border-amber-400/40 text-amber-200 text-xs font-bold shadow-[0_0_20px_rgba(251,191,36,0.15)]">
            <Hand className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>
              {tearProgress === 0
                ? 'Attrapez l’encoche brillante à gauche et glissez jusqu’à droite pour déchirer le sachet !'
                : tearProgress < 88
                ? `Continuez de glisser jusqu’au bout pour ouvrir ! (${tearProgress}%)`
                : '✨ Explosion du booster !'}
            </span>
          </div>

          {/* 3D Interactive Booster Pack Stage */}
          <div className="relative flex items-center justify-center my-3 perspective-1500">
            {/* Ambient Rarity Halo Behind Booster */}
            <div
              style={{
                opacity: phase === 'bursting' ? 1 : 0.15 + (tearProgress / 100) * 0.85,
                transform: `scale(${
                  phase === 'bursting' ? 2.4 : 0.85 + (tearProgress / 100) * 0.75
                })`,
                background: `radial-gradient(circle, ${seamGlowHex} 0%, transparent 68%)`,
              }}
              className="absolute w-80 h-80 rounded-full pointer-events-none blur-2xl transition-all duration-200 z-0"
            />

            {/* Rising Card Stack Inside the Pack (visible as top tears and during burst!) */}
            <div
              style={{
                opacity: phase === 'bursting' ? 1 : Math.max(0, (tearProgress - 20) / 80),
                transform:
                  phase === 'bursting'
                    ? 'translateY(-35px) scale(0.95)'
                    : `translateY(${40 - (tearProgress / 100) * 35}px) scale(0.84)`,
                transition: 'all 500ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              className="absolute z-10 w-[260px] h-[380px] rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 p-1.5 shadow-[0_0_50px_rgba(251,191,36,0.8)] pointer-events-none"
            >
              <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center border border-amber-300/50">
                <Crown className="w-16 h-16 text-amber-300 animate-pulse" />
              </div>
            </div>

            {/* THE FOIL BOOSTER PACK */}
            <div
              ref={packRef}
              onPointerDown={handleSeamPointerDown}
              onPointerMove={handlePackPointerMove}
              onPointerUp={handleReleaseTearEarly}
              onPointerLeave={handlePackPointerLeave}
              style={{
                transform: `rotateX(${packTilt.rx}deg) rotateY(${packTilt.ry}deg) translate(${shakeOffset.x}px, ${shakeOffset.y}px) scale(${tensionScale})`,
                transition: isDraggingTear
                  ? 'none'
                  : 'transform 450ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
              className="relative z-20 w-[300px] sm:w-[330px] h-[465px] sm:h-[505px] select-none touch-none"
            >
              {/* ================= VOLUMETRIC GOD RAYS SHOOTING OUT OF THE TORN SEAM ================= */}
              {tearProgress > 4 && (
                <div
                  style={{
                    width: `${tearProgress}%`,
                    opacity: Math.min(1, tearProgress / 30),
                  }}
                  className="absolute top-[12px] left-0 h-[72px] z-20 pointer-events-none overflow-hidden"
                >
                  <div
                    style={{
                      background: `conic-gradient(from 180deg at 50% 100%, transparent 0deg, ${seamGlowHex} 35deg, #ffffff 55deg, ${seamGlowHex} 75deg, transparent 110deg)`,
                    }}
                    className="w-full h-full blur-md opacity-90 animate-pulse"
                  />
                </div>
              )}

              {/* ================= ALREADY-PEELED LEFT FOIL STRIP (Curls & lifts in 3D!) ================= */}
              {tearProgress > 0 && (
                <div
                  style={{
                    clipPath: `polygon(0 0, ${tearProgress}% 0, ${tearProgress}% 100%, 0 100%)`,
                    transformOrigin: `${Math.min(100, tearProgress + 5)}% 100%`,
                    transform:
                      phase === 'bursting'
                        ? 'translate(160px, -220px) rotate(42deg) scale(0.8)'
                        : `translateY(${-6 - tearProgress * 0.38}px) rotate(${
                            -4 - tearProgress * 0.22
                          }deg) skewX(${-tearProgress * 0.12}deg)`,
                    opacity: phase === 'bursting' ? 0 : 1,
                    transition: isDraggingTear ? 'none' : 'all 420ms ease-out',
                  }}
                  className="absolute top-0 inset-x-0 h-[82px] z-40 rounded-t-2xl overflow-hidden shadow-[0_18px_30px_rgba(0,0,0,0.65)] pointer-events-none"
                >
                  {/* Crimped Silver Foil Ridges */}
                  <div className="w-full h-5 bg-[repeating-linear-gradient(90deg,#e2e8f0_0px,#e2e8f0_3px,#64748b_3px,#64748b_6px)] border-b border-white/50" />
                  <div
                    className={`w-full h-full bg-gradient-to-r ${selectedSeries.gradient} relative flex items-center justify-center`}
                  >
                    {/* Shiny Metallic Silver Foil Backside Reflection */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-200/60 via-white/25 to-transparent" />
                    <span className="relative z-10 text-[10px] font-black tracking-[0.22em] uppercase text-white drop-shadow">
                      {selectedSeries.badgeText}
                    </span>
                  </div>
                </div>
              )}

              {/* ================= UNCUT RIGHT FOIL STRIP (Stays attached until sliced!) ================= */}
              {tearProgress < 100 && (
                <div
                  style={{
                    clipPath: `polygon(${tearProgress}% 0, 100% 0, 100% 100%, ${tearProgress}% 100%)`,
                  }}
                  className="absolute top-0 inset-x-0 h-[82px] z-30 rounded-t-2xl overflow-hidden pointer-events-none"
                >
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
              )}

              {/* ================= MOLTEN ENERGY SEAM & TACTILE TEAR HANDLE ================= */}
              <div
                onPointerDown={handleSeamPointerDown}
                className="absolute top-[60px] -inset-x-4 h-12 z-50 flex items-center cursor-grab active:cursor-grabbing"
              >
                <div className="w-full h-full flex items-center relative px-4">
                  {/* Uncut perforated foil notch line */}
                  <div className="w-full border-b-2 border-dashed border-amber-200/80 shadow-[0_0_12px_rgba(251,191,36,0.6)]" />

                  {/* Glowing Sliced Energy Trail */}
                  <div
                    style={{
                      width: `${tearProgress}%`,
                      backgroundColor: '#ffffff',
                      boxShadow: `0 0 12px #ffffff, 0 0 25px ${seamGlowHex}, 0 0 45px ${seamGlowHex}`,
                    }}
                    className="absolute left-4 h-2 rounded-full transition-none"
                  />

                  {/* Glowing Pull-Tab / Finger Target */}
                  {phase === 'ready' && (
                    <div
                      style={{
                        left: `calc(${Math.min(95, Math.max(5, tearProgress))}% )`,
                        boxShadow: `0 0 25px ${seamGlowHex}, 0 0 45px rgba(251,191,36,0.95)`,
                      }}
                      className={`absolute -translate-x-1/2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400 text-slate-950 font-display font-black text-[11px] flex items-center gap-1 border-2 border-white transition-transform ${
                        isDraggingTear ? 'scale-125' : 'scale-100 animate-pulse'
                      }`}
                    >
                      <span>{tearProgress === 0 ? 'TIRER ➔' : `${tearProgress}%`}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ================= MAIN BOOSTER BODY (Slides down & opens on burst!) ================= */}
              <div
                style={{
                  transform:
                    phase === 'bursting'
                      ? 'translateY(180px) scale(0.92) rotateX(-18deg)'
                      : 'translateY(0px)',
                  opacity: phase === 'bursting' ? 0 : 1,
                  transition: 'all 650ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                className={`absolute top-[80px] bottom-0 inset-x-0 rounded-b-2xl overflow-hidden bg-gradient-to-br ${selectedSeries.gradient} border-x-2 border-b-2 border-white/30 shadow-[0_28px_65px_rgba(0,0,0,0.85)] flex flex-col items-center justify-between p-5`}
              >
                {/* Foil Metallic Specular Reflection */}
                <div
                  style={{
                    backgroundPosition: `${packTilt.glareX * 2}% ${packTilt.glareY * 2}%`,
                  }}
                  className="absolute inset-0 booster-metallic-sheen pointer-events-none z-20 opacity-65"
                />

                {/* Decorative background pattern */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:16px_16px] pointer-events-none" />

                {/* Top Series Emblem */}
                <div className="relative z-10 text-center mt-1 pointer-events-none">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/45 backdrop-blur-md border border-white/25 text-[10px] font-extrabold text-amber-300 tracking-widest mb-1">
                    <Sparkles className="w-3 h-3" /> milTCG
                  </div>
                  <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight uppercase drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] leading-none">
                    {selectedSeries.name}
                  </h2>
                  <p className="text-[11px] text-white/85 font-semibold mt-1">
                    {selectedSeries.subtitle}
                  </p>
                </div>

                {/* Central Hero Medallion */}
                <div className="relative z-10 my-auto pointer-events-none">
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
                  <div className="-mt-3 mx-auto w-max px-3 py-0.5 rounded-full bg-slate-950/90 border border-amber-400/60 text-amber-300 font-display font-black text-xs tracking-wider uppercase shadow-lg relative z-20">
                    ★ 5 CARTES GARANTIES ★
                  </div>
                </div>

                {/* Bottom Foil Crimp */}
                <div className="relative z-10 w-full flex items-center justify-between text-[10px] font-bold text-white/80 pt-2 border-t border-white/20 pointer-events-none">
                  <span>ÉDITION FAMILLE</span>
                  <span>1 HOLO+ GARANTIE</span>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-3.5 bg-[repeating-linear-gradient(90deg,#cbd5e1_0px,#cbd5e1_3px,#64748b_3px,#64748b_6px)] opacity-85 pointer-events-none" />
              </div>

              {/* Dynamic Flying Foil Sparks Overlay */}
              {sparks.map((s) => {
                const rad = (s.angle * Math.PI) / 180;
                const tx = Math.cos(rad) * s.distance;
                const ty = Math.sin(rad) * s.distance;
                return (
                  <div
                    key={s.id}
                    style={{
                      left: `${s.x}%`,
                      top: `${s.y}%`,
                      width: `${s.size}px`,
                      height: `${s.size}px`,
                      backgroundColor: s.color,
                      boxShadow: `0 0 12px ${s.color}, 0 0 20px #ffffff`,
                      transform: `translate(${tx}px, ${ty}px)`,
                    }}
                    className="pointer-events-none absolute rounded-full z-50 animate-ping"
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== PHASE 3: TACTILE CARD-BY-CARD STACK REVEAL ==================== */}
      {phase === 'stack' && currentPulled && (
        <div className="w-full flex flex-col items-center py-2 animate-fadeIn">
          {/* Top Progress Indicator */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
            {isGodPack && (
              <div className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 text-white font-black text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(251,191,36,0.8)] animate-bounce flex items-center gap-1">
                <Crown className="w-4 h-4" /> GOD PACK LÉGENDAIRE !
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-white/15 px-4 py-1.5 rounded-full">
              {pulledCards.map((_, idx) => {
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
                Carte {currentCardIndex + 1} sur {pulledCards.length}
              </span>
            </div>
          </div>

          {/* 3D CARD STACK STAGE */}
          <div className="relative w-[360px] sm:w-[400px] h-[545px] sm:h-[580px] flex items-center justify-center my-1">
            {/* Ambient Rarity Backlight Aura */}
            <div
              style={{
                backgroundColor: RARITY_CONFIG[currentPulled.card.rarity].glowHex,
              }}
              className={`absolute w-80 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
                isBigHitRarity(currentPulled.card.rarity)
                  ? 'opacity-65 scale-115 animate-pulse'
                  : 'opacity-25 scale-95'
              }`}
            />

            {/* Remaining Stack Depth Cards Underneath (Peek at next card as you drag!) */}
            {nextPulled && (
              <div
                style={{
                  transform: `scale(${
                    0.95 + Math.min(0.05, Math.hypot(cardSwipeOffset.x, cardSwipeOffset.y) / 1800)
                  }) translateY(${
                    12 - Math.min(12, Math.hypot(cardSwipeOffset.x, cardSwipeOffset.y) / 15)
                  }px)`,
                  boxShadow: isBigHitRarity(nextPulled.card.rarity)
                    ? `0 0 40px ${RARITY_CONFIG[nextPulled.card.rarity].glowHex}`
                    : undefined,
                }}
                className="absolute z-10 pointer-events-none opacity-90 transition-transform duration-150 rounded-[18px]"
              >
                <HoloCard
                  card={nextPulled.card}
                  size="lg"
                  interactive={false}
                  flipped={isBigHitRarity(nextPulled.card.rarity)}
                />
              </div>
            )}

            {/* Current Active Top Card (Swipeable & 3D Flippable!) */}
            <div
              onPointerDown={handleCardStackPointerDown}
              onPointerMove={handleCardStackPointerMove}
              onPointerUp={handleCardStackPointerUp}
              style={{
                transform: isAnimatingOut
                  ? `translate(${exitDirection.x}px, ${exitDirection.y}px) rotate(${
                      exitDirection.x > 0 ? 22 : -22
                    }deg) scale(0.88)`
                  : `translate(${cardSwipeOffset.x}px, ${cardSwipeOffset.y}px) rotate(${
                      cardSwipeOffset.x * 0.045
                    }deg)`,
                opacity: isAnimatingOut ? 0 : 1,
                transition: isSwipingCard
                  ? 'none'
                  : 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 250ms ease',
              }}
              className="relative z-20 touch-none cursor-grab active:cursor-grabbing"
            >
              {/* Mystery Hit Floating Prompt when card is face-down */}
              {isCurrentCardFaceDown && (
                <div className="absolute -top-4 inset-x-0 z-40 flex justify-center pointer-events-none">
                  <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-300 via-pink-400 to-amber-300 text-slate-950 font-display font-black text-xs tracking-wider uppercase shadow-[0_0_25px_rgba(251,191,36,1)] animate-bounce border-2 border-white">
                    ✨ CARTE RARE DÉTECTÉE — TOUCHEZ POUR RETOURNER ! ✨
                  </div>
                </div>
              )}

              <HoloCard
                card={currentPulled.card}
                size="lg"
                interactive={!isSwipingCard}
                flipped={isCurrentCardFaceDown}
                isNew={currentPulled.isNew && !isCurrentCardFaceDown}
              />
            </div>
          </div>

          {/* Rarity Badge & Gesture Instruction (NO auto-advance buttons!) */}
          <div className="mt-4 flex flex-col items-center gap-2.5">
            {!isCurrentCardFaceDown && (
              <div className="flex items-center gap-2">
                <span
                  className={`px-3.5 py-1 rounded-full text-xs font-extrabold border ${
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
            )}

            <div className="px-5 py-2 rounded-full bg-slate-900/85 border border-white/15 text-xs font-bold text-amber-200 flex items-center gap-2 shadow-lg">
              <Hand className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>
                {isCurrentCardFaceDown
                  ? 'Touchez la carte dorée pour la retourner en 3D !'
                  : currentCardIndex + 1 < pulledCards.length
                  ? 'Glissez la carte sur le côté (gauche ou droite) pour découvrir la suivante !'
                  : 'Glissez cette dernière carte pour voir le résumé de votre booster !'}
              </span>
            </div>
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
              Choisir un Nouveau Booster !
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
