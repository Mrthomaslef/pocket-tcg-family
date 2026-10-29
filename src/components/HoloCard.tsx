import React, { useRef, useState } from 'react';
import { TCGCard } from '../types/tcg';
import { ELEMENT_CONFIG, RARITY_CONFIG } from '../utils/cardGenerator';
import { Sparkles, Crown } from 'lucide-react';

interface HoloCardProps {
  card: TCGCard;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  flipped?: boolean;
  isNew?: boolean;
  countBadge?: number;
  onClick?: () => void;
  className?: string;
}

export const HoloCard: React.FC<HoloCardProps> = ({
  card,
  size = 'md',
  interactive = true,
  flipped = false,
  isNew = false,
  countBadge,
  onClick,
  className = '',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, px: 50, py: 50, active: false });

  const elem = ELEMENT_CONFIG[card.element];
  const rarity = RARITY_CONFIG[card.rarity];
  const isFullArt = card.rarity === 'ultra' || card.rarity === 'crown';

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const py = Math.max(0, Math.min(100, (y / rect.height) * 100));

    const ry = ((px - 50) / 50) * 16; // -16deg to +16deg
    const rx = -((py - 50) / 50) * 16;

    setTilt({ rx, ry, px, py, active: true });
  };

  const handlePointerLeave = () => {
    if (!interactive) return;
    setTilt({ rx: 0, ry: 0, px: 50, py: 50, active: false });
  };

  // Dimensions by size preset — generous proportions so photo + all text are 100% readable
  const sizeClasses = {
    sm: 'w-[195px] h-[285px] text-[10px]',
    md: 'w-[296px] h-[445px] text-xs',
    lg: 'w-[350px] sm:w-[380px] h-[525px] sm:h-[560px] text-sm',
  }[size];

  const outerBorderClasses = {
    common: 'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 p-[7px]',
    rare: 'bg-gradient-to-br from-sky-200 via-slate-200 to-sky-400 p-[7px] shadow-[0_0_25px_rgba(56,189,248,0.3)]',
    holo: 'bg-gradient-to-br from-amber-200 via-fuchsia-300 to-cyan-300 p-[7px] shadow-[0_0_30px_rgba(232,121,249,0.4)]',
    ultra: 'bg-gradient-to-br from-pink-400 via-amber-300 to-indigo-400 p-[8px] shadow-[0_0_40px_rgba(244,114,182,0.55)]',
    crown: 'bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-600 p-[8px] shadow-[0_0_50px_rgba(251,191,36,0.75)]',
  }[card.rarity];

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={
        {
          '--pointer-x': `${tilt.px}%`,
          '--pointer-y': `${tilt.py}%`,
        } as React.CSSProperties
      }
      className={`perspective-1000 select-none relative ${sizeClasses} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* New / Count Badges */}
      {isNew && !flipped && (
        <div className="absolute -top-3 -left-2 z-30 bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 font-extrabold px-2.5 py-0.5 rounded-full text-[11px] tracking-wider shadow-lg border border-white animate-bounce">
          ✨ NOUVEAU !
        </div>
      )}
      {typeof countBadge === 'number' && countBadge > 1 && !flipped && (
        <div className="absolute -top-2.5 -right-2 z-30 bg-slate-900/95 text-amber-300 font-bold px-2 py-0.5 rounded-full text-[11px] border border-amber-400/50 shadow-md">
          x{countBadge}
        </div>
      )}

      {/* 3D Rotating Container */}
      <div
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${
            flipped ? 180 + tilt.ry : tilt.ry
          }deg) scale(${tilt.active ? 1.03 : 1})`,
          transition: tilt.active
            ? 'transform 60ms ease-out'
            : 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className="w-full h-full relative preserve-3d rounded-[18px]"
      >
        {/* ================= CARD FRONT ================= */}
        <div
          className={`w-full h-full rounded-[18px] ${outerBorderClasses} backface-hidden relative overflow-hidden flex flex-col justify-between`}
        >
          {/* Inner Card Canvas */}
          <div
            className={`w-full h-full rounded-[12px] relative overflow-hidden flex flex-col justify-between bg-gradient-to-b ${elem.bgGradient}`}
          >
            {/* FULL ART BACKGROUND PHOTO (For Ultra & Crown Rarities) */}
            {isFullArt && (
              <div className="absolute inset-0 z-0">
                <img
                  src={card.imageUrl}
                  alt={card.title}
                  className="w-full h-full object-cover object-center"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/95" />
              </div>
            )}

            {/* TOP HEADER BAR — Full readable title without truncation */}
            <div className="relative z-10 px-2.5 pt-2 pb-1 flex items-start justify-between gap-1.5">
              <div className="flex items-start gap-1.5 min-w-0 flex-1">
                <span className="mt-0.5 px-1.5 py-0.5 rounded bg-black/55 backdrop-blur-md text-[8px] font-extrabold uppercase tracking-wider text-amber-300 border border-amber-400/30 shrink-0">
                  {isFullArt ? 'EX' : 'BASE'}
                </span>
                <h3
                  className={`font-display font-extrabold leading-tight text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.95)] break-words ${
                    size === 'sm'
                      ? 'text-[10px]'
                      : size === 'md'
                      ? 'text-[13px]'
                      : 'text-[16px]'
                  }`}
                >
                  {card.title}
                </h3>
              </div>

              <div className="flex items-center gap-1 shrink-0 bg-black/55 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20">
                <span className="text-[9px] font-bold text-amber-300">PV</span>
                <span
                  className={`font-display font-black text-white ${
                    size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
                  }`}
                >
                  {card.hp}
                </span>
                <span className="text-sm leading-none">{elem.emoji}</span>
              </div>
            </div>

            {/* FRAMED ARTWORK WINDOW (For Common, Rare, Holo) */}
            {!isFullArt ? (
              <div className="relative z-10 mx-2.5 my-0.5 flex-1 min-h-[135px] flex flex-col">
                <div className="relative w-full h-full rounded-lg overflow-hidden border-[2.5px] border-amber-200/80 shadow-[inset_0_0_15px_rgba(0,0,0,0.6),0_4px_12px_rgba(0,0,0,0.4)] bg-slate-900">
                  <img
                    src={card.imageUrl}
                    alt={card.title}
                    className="w-full h-full object-cover object-center"
                    draggable={false}
                  />
                  {/* Holo Shimmer strictly inside the photo frame for Holo cards */}
                  {(card.rarity === 'holo' || card.rarity === 'rare') && (
                    <div
                      className="absolute inset-0 pointer-events-none holo-foil-diagonal opacity-55"
                      style={{
                        backgroundPosition: `${tilt.px * 2}% ${tilt.py * 2}%`,
                      }}
                    />
                  )}
                  {/* Subtitle ribbon */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-slate-950/90 backdrop-blur-sm px-2 py-0.5 flex items-center justify-between gap-1 text-[9px] text-amber-100 border-t border-white/15">
                    <span className="font-medium leading-tight">{card.subtitle}</span>
                    <span className="text-amber-300 font-semibold shrink-0">
                      {card.dateLabel}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Full-Art Spacer showing off the photo in the center */
              <div className="relative z-10 flex-1 flex items-end justify-between gap-1 px-2.5 pb-1">
                <span className="px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-[10px] text-amber-200 font-semibold border border-amber-300/30 leading-tight">
                  {card.subtitle}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-[10px] text-white/95 border border-white/20 shrink-0">
                  {card.dateLabel}
                </span>
              </div>
            )}

            {/* ATTACKS & STATS BOX — Full multiline text without clipping */}
            <div
              className={`relative z-10 mx-2 mb-2 rounded-lg p-2 flex flex-col justify-between gap-1.5 ${
                isFullArt
                  ? 'bg-slate-950/82 backdrop-blur-md border border-white/25'
                  : 'bg-slate-950/68 backdrop-blur-sm border border-white/15'
              }`}
            >
              {/* Attacks List */}
              <div className="space-y-1.5">
                {card.attacks.map((atk, i) => (
                  <div
                    key={i}
                    className={`${
                      i === 0 ? 'border-b border-white/10 pb-1.5' : ''
                    } flex flex-col`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="flex items-center text-[10px] shrink-0">
                          {Array.from({ length: atk.energyCost }).map((_, idx) => (
                            <span key={idx} className="-mr-0.5">
                              {elem.emoji}
                            </span>
                          ))}
                        </span>
                        <span
                          className={`font-bold text-white leading-tight ${
                            size === 'sm'
                              ? 'text-[10px]'
                              : size === 'md'
                              ? 'text-[11.5px]'
                              : 'text-[13px]'
                          }`}
                        >
                          {atk.name}
                        </span>
                      </div>
                      <span
                        className={`font-display font-black text-amber-300 shrink-0 ${
                          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-xs' : 'text-sm'
                        }`}
                      >
                        {atk.damage}
                      </span>
                    </div>
                    {size !== 'sm' && (
                      <p
                        className={`text-slate-100/90 leading-snug mt-0.5 ${
                          size === 'md' ? 'text-[10px]' : 'text-[11px]'
                        }`}
                      >
                        {atk.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Weakness / Resistance / Rarity Footer */}
              <div className="pt-1 border-t border-white/15 flex items-center justify-between gap-1 text-[9px] text-slate-200">
                <div className="leading-tight">
                  <span className="text-slate-400">Faibl:</span> {card.weakness}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-slate-400">
                    #{String(card.setNumber).padStart(3, '0')}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded font-bold border text-[9px] ${rarity.colorClass}`}
                  >
                    {rarity.shortBadge}
                  </span>
                </div>
              </div>

              {/* Flavor Text (shown on md and lg cards — full text readable) */}
              {size !== 'sm' && (
                <div
                  className={`italic text-amber-100/90 bg-black/40 rounded px-2 py-1 leading-snug border border-white/10 ${
                    size === 'md' ? 'text-[9.5px]' : 'text-[10.5px]'
                  }`}
                >
                  {card.flavorText}
                </div>
              )}
            </div>

            {/* ================= HOLOGRAPHIC SHADER OVERLAYS ================= */}
            {card.rarity === 'holo' && (
              <div
                className="absolute inset-0 pointer-events-none z-20 holo-foil-diagonal transition-opacity duration-300"
                style={{
                  opacity: tilt.active ? 0.55 : 0.25,
                  backgroundPosition: `${tilt.px * 2.5}% ${tilt.py * 2.5}%`,
                }}
              />
            )}

            {card.rarity === 'ultra' && (
              <>
                <div
                  className="absolute inset-0 pointer-events-none z-20 holo-cosmos transition-opacity duration-300"
                  style={{
                    opacity: tilt.active ? 0.65 : 0.35,
                    backgroundPosition: `${tilt.px}% ${tilt.py}%`,
                  }}
                />
                <div className="absolute inset-0 pointer-events-none z-20 holo-sparkles opacity-60" />
              </>
            )}

            {card.rarity === 'crown' && (
              <>
                <div
                  className="absolute inset-0 pointer-events-none z-20 holo-gold-crown transition-opacity duration-300"
                  style={{
                    opacity: tilt.active ? 0.72 : 0.42,
                    backgroundPosition: `${tilt.px * 2}% ${tilt.py * 2}%`,
                  }}
                />
                <div className="absolute inset-0 pointer-events-none z-20 holo-sparkles opacity-85" />
              </>
            )}

            {/* Dynamic Specular Glare following cursor/gyroscope */}
            <div
              className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-200"
              style={{
                opacity: tilt.active ? 0.7 : 0.15,
                background: `radial-gradient(circle at ${tilt.px}% ${tilt.py}%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.18) 28%, transparent 65%)`,
                mixBlendMode: 'overlay',
              }}
            />
          </div>
        </div>

        {/* ================= CARD BACK (When Flipped) ================= */}
        <div
          style={{ transform: 'rotateY(180deg)' }}
          className="w-full h-full rounded-[18px] p-[8px] bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 backface-hidden absolute inset-0 shadow-2xl"
        >
          <div className="w-full h-full rounded-[12px] bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 relative overflow-hidden flex flex-col items-center justify-center border border-amber-400/40">
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#fbbf24_1.5px,transparent_1.5px)] [background-size:18px_18px]" />
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400/20 to-purple-500/20 border-2 border-amber-400/60 flex items-center justify-center shadow-[0_0_40px_rgba(251,191,36,0.35)] relative">
              <Crown className="w-14 h-14 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
              <Sparkles className="w-6 h-6 text-pink-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className="mt-4 font-display font-black tracking-[0.15em] text-sm text-white">
              mil<span className="text-amber-400">TCG</span>
            </p>
            <p className="text-[10px] text-indigo-300/70 font-semibold tracking-widest mt-0.5">
              COLLECTOR EDITION
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
