import React, { useState } from 'react';
import { CardRarity, ElementType, TCGCard } from '../types/tcg';
import { ELEMENT_CONFIG, RARITY_CONFIG, rerollCardTraits } from '../utils/cardGenerator';
import { HoloCard } from './HoloCard';
import { X, RotateCw, Dices, Edit3, Check, Trash2 } from 'lucide-react';

interface CardInspectModalProps {
  card: TCGCard;
  childName: string;
  countOwned: number;
  onClose: () => void;
  onUpdateCard: (updated: TCGCard) => void;
  onDeleteCard?: (cardId: string) => void;
}

export const CardInspectModal: React.FC<CardInspectModalProps> = ({
  card,
  childName,
  countOwned,
  onClose,
  onUpdateCard,
  onDeleteCard,
}) => {
  const [flipped, setFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Editable form state
  const [title, setTitle] = useState(card.title);
  const [subtitle, setSubtitle] = useState(card.subtitle);
  const [hp, setHp] = useState(card.hp);
  const [rarity, setRarity] = useState<CardRarity>(card.rarity);
  const [element, setElement] = useState<ElementType>(card.element);
  const [atk1Name, setAtk1Name] = useState(card.attacks[0].name);
  const [atk1Dmg, setAtk1Dmg] = useState(card.attacks[0].damage);
  const [atk1Desc, setAtk1Desc] = useState(card.attacks[0].description);
  const [atk2Name, setAtk2Name] = useState(card.attacks[1].name);
  const [atk2Dmg, setAtk2Dmg] = useState(card.attacks[1].damage);
  const [atk2Desc, setAtk2Desc] = useState(card.attacks[1].description);
  const [flavorText, setFlavorText] = useState(card.flavorText);

  const handleReroll = () => {
    const rerolled = rerollCardTraits(card, childName);
    setTitle(rerolled.title);
    setSubtitle(rerolled.subtitle);
    setHp(rerolled.hp);
    setRarity(rerolled.rarity);
    setElement(rerolled.element);
    setAtk1Name(rerolled.attacks[0].name);
    setAtk1Dmg(rerolled.attacks[0].damage);
    setAtk1Desc(rerolled.attacks[0].description);
    setAtk2Name(rerolled.attacks[1].name);
    setAtk2Dmg(rerolled.attacks[1].damage);
    setAtk2Desc(rerolled.attacks[1].description);
    setFlavorText(rerolled.flavorText);
    onUpdateCard(rerolled);
  };

  const handleSaveManualEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const elemCfg = ELEMENT_CONFIG[element];
    const updated: TCGCard = {
      ...card,
      title,
      subtitle,
      hp: Number(hp) || 100,
      rarity,
      element,
      weakness: elemCfg.weakness,
      resistance: elemCfg.resistance,
      attacks: [
        { ...card.attacks[0], name: atk1Name, damage: Number(atk1Dmg) || 30, description: atk1Desc },
        { ...card.attacks[1], name: atk2Name, damage: Number(atk2Dmg) || 100, description: atk2Desc },
      ],
      flavorText,
    };
    onUpdateCard(updated);
    setIsEditing(false);
  };

  // Live preview card reflecting edits
  const previewCard: TCGCard = {
    ...card,
    title,
    subtitle,
    hp: Number(hp) || 100,
    rarity,
    element,
    attacks: [
      { ...card.attacks[0], name: atk1Name, damage: Number(atk1Dmg) || 30, description: atk1Desc },
      { ...card.attacks[1], name: atk2Name, damage: Number(atk2Dmg) || 100, description: atk2Desc },
    ],
    flavorText,
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 overflow-hidden"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[94dvh] rounded-3xl bg-slate-900/95 border border-white/15 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Pinned Top Bar so the Close / Back button is ALWAYS 100% visible on any phone */}
        <div className="shrink-0 z-50 flex items-center justify-between gap-2 px-4 py-3 bg-slate-950/90 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-extrabold border ${
                RARITY_CONFIG[previewCard.rarity].colorClass
              }`}
            >
              {RARITY_CONFIG[previewCard.rarity].stars}
            </span>
            <h3 className="font-display font-black text-sm sm:text-base text-white truncate">
              {previewCard.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer l'aperçu"
            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-display font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(251,191,36,0.5)] transition"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>Fermer</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
          {/* Left: 3D Interactive Card Showcase */}
          <div className="flex flex-col items-center gap-4 shrink-0">
            <HoloCard
              card={previewCard}
              size="lg"
              interactive={true}
              flipped={flipped}
              countBadge={countOwned}
            />

            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setFlipped(!flipped)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/15 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition"
              >
                <RotateCw className="w-4 h-4 text-amber-400" />
                {flipped ? 'Voir Face Avant' : 'Voir Dos de Carte'}
              </button>

              <button
                onClick={handleReroll}
                className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/50 text-xs font-bold text-indigo-200 flex items-center gap-1.5 transition"
              >
                <Dices className="w-4 h-4 text-indigo-300" />
                Régénérer textes aléatoires
              </button>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                  isEditing
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-800 hover:bg-slate-700 border-white/15 text-slate-200'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                {isEditing ? 'Masquer l’éditeur' : 'Personnaliser la carte'}
              </button>
            </div>
          </div>

          {/* Right: Card Details OR Custom Editor */}
          <div className="flex-1 w-full">
            {!isEditing ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                        RARITY_CONFIG[previewCard.rarity].colorClass
                      }`}
                    >
                      {RARITY_CONFIG[previewCard.rarity].stars}{' '}
                      {RARITY_CONFIG[previewCard.rarity].label}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      Carte #{String(previewCard.setNumber).padStart(3, '0')}
                    </span>
                    {countOwned > 0 && (
                      <span className="text-xs font-bold text-emerald-400">
                        • Possédée x{countOwned}
                      </span>
                    )}
                  </div>
                  <h2 className="font-display font-black text-2xl sm:text-3xl text-white">
                    {previewCard.title}
                  </h2>
                  <p className="text-sm text-amber-300 font-semibold">{previewCard.subtitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-950/70 rounded-2xl p-3.5 border border-white/10 text-xs">
                  <div>
                    <span className="text-slate-400 block">Élément</span>
                    <span className="font-bold text-white text-sm">
                      {ELEMENT_CONFIG[previewCard.element].emoji}{' '}
                      {ELEMENT_CONFIG[previewCard.element].label}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Points de Vie (PV)</span>
                    <span className="font-bold text-amber-300 text-sm">{previewCard.hp} PV</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Faiblesse</span>
                    <span className="font-semibold text-slate-200">{previewCard.weakness}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Résistance</span>
                    <span className="font-semibold text-slate-200">{previewCard.resistance}</span>
                  </div>
                </div>

                {/* Attacks Detail */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Attaques Spéciales
                  </h4>
                  {previewCard.attacks.map((atk, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-slate-950/80 border border-white/10 p-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">
                          {ELEMENT_CONFIG[previewCard.element].emoji} {atk.name}
                        </span>
                        <span className="font-display font-black text-amber-400 text-base">
                          {atk.damage} DGT
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{atk.description}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-amber-400/10 border border-amber-400/25 p-3.5 text-xs italic text-amber-100">
                  {previewCard.flavorText}
                </div>

                {card.isCustomPhoto && onDeleteCard && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        onDeleteCard(card.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Supprimer cette photo du jeu
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Custom Card Form */
              <form onSubmit={handleSaveManualEdit} className="space-y-3 text-xs">
                <h3 className="font-display font-bold text-lg text-white mb-2">
                  Personnaliser la Carte
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Titre de la carte</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Sous-titre</label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Rareté & Effet</label>
                    <select
                      value={rarity}
                      onChange={(e) => setRarity(e.target.value as CardRarity)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-white"
                    >
                      {(['common', 'rare', 'holo', 'ultra', 'crown'] as CardRarity[]).map((r) => (
                        <option key={r} value={r}>
                          {RARITY_CONFIG[r].stars} {RARITY_CONFIG[r].label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Type / Élément</label>
                    <select
                      value={element}
                      onChange={(e) => setElement(e.target.value as ElementType)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-white"
                    >
                      {(Object.keys(ELEMENT_CONFIG) as ElementType[]).map((el) => (
                        <option key={el} value={el}>
                          {ELEMENT_CONFIG[el].emoji} {ELEMENT_CONFIG[el].label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">PV</label>
                    <input
                      type="number"
                      step={10}
                      min={30}
                      max={300}
                      value={hp}
                      onChange={(e) => setHp(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-slate-400 mb-1">Attaque 1</label>
                      <input
                        type="text"
                        value={atk1Name}
                        onChange={(e) => setAtk1Name(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Dégâts</label>
                      <input
                        type="number"
                        step={10}
                        value={atk1Dmg}
                        onChange={(e) => setAtk1Dmg(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-white"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={atk1Desc}
                    onChange={(e) => setAtk1Desc(e.target.value)}
                    placeholder="Description de l'attaque 1"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-slate-200"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-slate-400 mb-1">Attaque 2 (Ultime)</label>
                      <input
                        type="text"
                        value={atk2Name}
                        onChange={(e) => setAtk2Name(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Dégâts</label>
                      <input
                        type="number"
                        step={10}
                        value={atk2Dmg}
                        onChange={(e) => setAtk2Dmg(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-white"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={atk2Desc}
                    onChange={(e) => setAtk2Desc(e.target.value)}
                    placeholder="Description de l'attaque 2"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Citation / Description Pokédex
                  </label>
                  <textarea
                    rows={2}
                    value={flavorText}
                    onChange={(e) => setFlavorText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-extrabold flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Enregistrer la carte
                  </button>
                </div>
              </form>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
