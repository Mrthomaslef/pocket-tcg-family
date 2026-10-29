import React, { useState, useRef } from 'react';
import { AppSettings, TCGCard } from '../types/tcg';
import { launchGooglePhotosPickerFlow } from '../services/googlePhotosPicker';
import {
  blobToCompressedDataUrl,
  parseHugePackFileStreaming,
  recompressDataUrl,
} from '../utils/db';
import { createCardFromPhoto } from '../utils/cardGenerator';
import {
  X,
  Images,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  HelpCircle,
  Trash2,
  Loader2,
  User,
  Dices,
} from 'lucide-react';

interface PhotoManagerModalProps {
  settings: AppSettings;
  customCards: TCGCard[];
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onAddCustomCards: (newCards: TCGCard[]) => Promise<void>;
  onClearCustomCards: () => Promise<void>;
  onClose: () => void;
}

export const PhotoManagerModal: React.FC<PhotoManagerModalProps> = ({
  settings,
  customCards,
  onUpdateSettings,
  onAddCustomCards,
  onClearCustomCards,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'picker' | 'direct'>('picker');
  const [childNameInput, setChildNameInput] = useState(settings.childName);
  const [clientIdInput, setClientIdInput] = useState(
    settings.googleClientId ||
      '817822977351-5m288vfdn4arbv5o35rd8skt2le8ektu.apps.googleusercontent.com'
  );
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  // Random sample size when user Shift+Clicks a huge range of photos (0 = keep all)
  const [randomSampleCount, setRandomSampleCount] = useState<number>(25);

  // Picker / Import status
  const [isBusy, setIsBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [activePickerUri, setActivePickerUri] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const packImportInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [exportMaxCards, setExportMaxCards] = useState<number>(60);

  const handleExportFamilyPack = async () => {
    if (customCards.length === 0 || isBusy) return;
    setErrorMessage(null);
    setIsBusy(true);

    try {
      // Pick random subset if user chose e.g. 60 or 120 cards so the file is only ~2-5 MB for WhatsApp/AirDrop!
      let cardsToExport = [...customCards];
      if (exportMaxCards > 0 && cardsToExport.length > exportMaxCards) {
        cardsToExport = cardsToExport.sort(() => Math.random() - 0.5).slice(0, exportMaxCards);
      }

      const compressedCards: TCGCard[] = [];
      for (let i = 0; i < cardsToExport.length; i++) {
        setStatusMessage(
          `Compression ultra-légère de la carte ${i + 1} sur ${cardsToExport.length}...`
        );
        setProgress({ current: i + 1, total: cardsToExport.length });
        const c = cardsToExport[i];
        const lightUrl = await recompressDataUrl(c.imageUrl, 560, 0.7);
        compressedCards.push({ ...c, setNumber: i + 1, imageUrl: lightUrl });
      }

      const childNameVal = childNameInput.trim() || settings.childName || 'Mon Fils';
      // Build Blob in chunks so we NEVER hit V8's max string length even on huge packs
      const blobParts: BlobPart[] = [
        `{"version":1,"childName":${JSON.stringify(
          childNameVal
        )},"exportedAt":${JSON.stringify(new Date().toISOString())},"cards":[`,
      ];
      for (let i = 0; i < compressedCards.length; i++) {
        if (i > 0) blobParts.push(',');
        blobParts.push(JSON.stringify(compressedCards[i]));
      }
      blobParts.push(']}');

      const blob = new Blob(blobParts, { type: 'application/json' });
      const sizeMb = (blob.size / (1024 * 1024)).toFixed(1);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = (childNameVal || 'famille').toLowerCase().replace(/[^a-z0-9]/g, '-');
      a.href = url;
      a.download = `pack-cartes-${safeName}-${compressedCards.length}cartes.json`;
      a.click();
      URL.revokeObjectURL(url);

      setStatusMessage(
        `🎁 Pack léger exporté (${compressedCards.length} cartes • seulement ${sizeMb} Mo) ! Prêt à envoyer à votre femme.`
      );
    } catch (e) {
      setErrorMessage(
        e instanceof Error ? e.message : 'Erreur lors de la création du pack.'
      );
    } finally {
      setIsBusy(false);
      setProgress(null);
    }
  };

  const handleImportFamilyPack = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setErrorMessage(null);
    setIsBusy(true);
    const sizeMb = Math.round(file.size / (1024 * 1024));
    setStatusMessage(
      `Lecture en streaming et compression du fichier (${sizeMb} Mo)... Patientez quelques secondes.`
    );

    try {
      const parsed = await parseHugePackFileStreaming(file, (count, pct) => {
        setStatusMessage(
          `Importation & compression en cours : ${count} cartes extraites (${pct}%)...`
        );
      });

      if (!parsed.cards || parsed.cards.length === 0) {
        throw new Error('Aucune carte trouvée dans ce fichier.');
      }

      if (parsed.childName) {
        setChildNameInput(parsed.childName);
        onUpdateSettings({ childName: parsed.childName });
      }

      await onAddCustomCards(parsed.cards);
      setStatusMessage(
        `🎉 ${parsed.cards.length} cartes importées et compressées avec succès ! Allez ouvrir vos boosters !`
      );
    } catch (e) {
      setErrorMessage(
        e instanceof Error ? e.message : 'Impossible de lire ce fichier de pack.'
      );
    } finally {
      setIsBusy(false);
      setProgress(null);
    }
  };

  const handleSaveChildName = () => {
    const trimmed = childNameInput.trim() || 'Mon Fils';
    onUpdateSettings({ childName: trimmed });
  };

  // Launch Official Google Photos Picker API with Random Sampling
  const handleLaunchGooglePicker = async () => {
    setErrorMessage(null);
    setStatusMessage(null);

    const trimmedClientId = clientIdInput.trim();
    if (!trimmedClientId) {
      setErrorMessage(
        'Veuillez renseigner votre Client ID Google OAuth (ou utilisez l’onglet "Import Direct Sans Config" juste à côté !).'
      );
      setShowSetupGuide(true);
      return;
    }

    onUpdateSettings({
      googleClientId: trimmedClientId,
      childName: childNameInput.trim() || 'Mon Fils',
    });

    setIsBusy(true);
    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    try {
      const existingMediaIds = new Set(
        customCards.map((c) => c.googleMediaId).filter((id): id is string => Boolean(id))
      );

      const pickedPhotos = await launchGooglePhotosPickerFlow(
        trimmedClientId,
        (st) => {
          setStatusMessage(st.message);
          if (st.progress) setProgress(st.progress);
          if (st.pickerUri) setActivePickerUri(st.pickerUri);
        },
        abortCtrl.signal,
        {
          randomSampleCount,
          excludeMediaIds: existingMediaIds,
        }
      );

      const startSetNum = customCards.length + 1;
      const cleanName = childNameInput.trim() || 'Mon Fils';

      const newCards: TCGCard[] = pickedPhotos.map((p, idx) => {
        const formattedDate = p.createTime
          ? new Date(p.createTime).toLocaleDateString('fr-FR', {
              month: 'short',
              year: 'numeric',
            })
          : undefined;

        return createCardFromPhoto({
          setNumber: startSetNum + idx,
          imageUrl: p.dataUrl,
          childName: cleanName,
          dateLabel: formattedDate,
          seedString: `${p.googleMediaId}-${idx}-${ Math.random() }`,
          googleMediaId: p.googleMediaId,
        });
      });

      await onAddCustomCards(newCards);
      onUpdateSettings({
        lastGoogleSync: new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
      setStatusMessage(
        `🎲 ${newCards.length} nouvelles cartes tirées au hasard depuis Google Photos ! Allez ouvrir un booster !`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la sélection Google Photos.';
      setErrorMessage(msg);
    } finally {
      setIsBusy(false);
      setProgress(null);
      setActivePickerUri(null);
    }
  };

  // Handle Direct Local / Drag & Drop / Mobile Photo Library Import (also supports random sampling!)
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);
    setIsBusy(true);

    let imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setErrorMessage('Aucun fichier image détecté.');
      setIsBusy(false);
      return;
    }

    // Shuffle local files too!
    imageFiles = imageFiles.sort(() => Math.random() - 0.5);
    if (randomSampleCount > 0 && imageFiles.length > randomSampleCount) {
      imageFiles = imageFiles.slice(0, randomSampleCount);
    }

    const cleanName = childNameInput.trim() || 'Mon Fils';
    onUpdateSettings({ childName: cleanName });

    const startSetNum = customCards.length + 1;
    const createdCards: TCGCard[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      setStatusMessage(`Création de la carte surprise ${i + 1} sur ${imageFiles.length}...`);
      setProgress({ current: i + 1, total: imageFiles.length });

      try {
        const dataUrl = await blobToCompressedDataUrl(file, 900);
        const dateStr = file.lastModified
          ? new Date(file.lastModified).toLocaleDateString('fr-FR', {
              month: 'short',
              year: 'numeric',
            })
          : undefined;

        const card = createCardFromPhoto({
          setNumber: startSetNum + i,
          imageUrl: dataUrl,
          childName: cleanName,
          dateLabel: dateStr,
          seedString: `${file.name}-${file.size}-${i}`,
        });
        createdCards.push(card);
      } catch (e) {
        console.warn('Erreur lecture image:', e);
      }
    }

    await onAddCustomCards(createdCards);
    setIsBusy(false);
    setProgress(null);
    setStatusMessage(
      `✨ ${createdCards.length} photo(s) tirée(s) au sort et transformée(s) en cartes TCG !`
    );
  };

  return (
    <div
      onClick={() => {
        abortControllerRef.current?.abort();
        onClose();
      }}
      className="safe-modal-overlay fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center overflow-hidden"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-full overflow-y-auto rounded-3xl bg-slate-900 border border-white/15 p-4 sm:p-7 shadow-2xl"
      >
        {/* Modal Header with prominent Close button */}
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-2xl bg-gradient-to-br from-amber-400 to-pink-500 text-slate-950 flex items-center justify-center shadow-lg">
              <Images className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-black text-base sm:text-2xl text-white truncate">
                Studio Photos & Pack
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Importez vos photos ou partagez votre pack famille
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              abortControllerRef.current?.abort();
              onClose();
            }}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-black text-xs flex items-center gap-1 shadow-md transition"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            <span>Fermer</span>
          </button>
        </div>

        {/* Child First Name & Random Sample Count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400 shrink-0" />
              <label className="text-xs font-bold text-white">Prénom de votre fils</label>
            </div>
            <input
              type="text"
              value={childNameInput}
              onChange={(e) => setChildNameInput(e.target.value)}
              onBlur={handleSaveChildName}
              placeholder="Ex: Léo..."
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/15 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400 w-32"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-amber-400/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Dices className="w-4 h-4 text-amber-400 shrink-0" />
              <label className="text-xs font-bold text-amber-200">Tirage au sort</label>
            </div>
            <select
              value={randomSampleCount}
              onChange={(e) => setRandomSampleCount(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-amber-400/40 text-xs font-extrabold text-amber-300 focus:outline-none"
            >
              <option value={15}>🎲 15 au hasard</option>
              <option value={25}>🎲 25 au hasard</option>
              <option value={50}>🎲 50 au hasard</option>
              <option value={100}>🎲 100 au hasard</option>
              <option value={0}>Toutes les photos</option>
            </select>
          </div>
        </div>

        {/* Mode Tabs: Google Photos Picker API vs Direct Import */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950 border border-white/10 mb-5">
          <button
            onClick={() => setActiveTab('picker')}
            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 ${
              activeTab === 'picker'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Images className="w-4 h-4" />
            Google Photos Picker API
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 ${
              activeTab === 'direct'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            Import Dossier / Fichiers
          </button>
        </div>

        {/* ==================== TAB 1: GOOGLE PHOTOS PICKER API ==================== */}
        {activeTab === 'picker' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-indigo-950/40 border border-indigo-400/30 p-4 text-xs space-y-3">
              {/* Highlighted Shift+Click Trick for Bulk Random Selection */}
              <div className="p-3.5 rounded-xl bg-amber-400/15 border border-amber-400/40 space-y-1.5">
                <p className="font-extrabold text-amber-300 text-xs flex items-center gap-1.5">
                  <Dices className="w-4 h-4" />
                  Comment prendre 300 photos au hasard en 2 secondes dans Google Photos :
                </p>
                <ol className="list-decimal list-inside text-[11px] text-amber-100/95 space-y-1 leading-relaxed">
                  <li>
                    Dans la fenêtre Google Photos, tapez le prénom de votre fils (ou cliquez sur la
                    bulle de son visage dans la barre de recherche).
                  </li>
                  <li>
                    Cliquez sur la <strong>toute 1re photo</strong> en haut, puis faites défiler
                    vers le bas sans regarder.
                  </li>
                  <li>
                    Maintenez la touche <kbd className="px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 font-mono font-bold border border-amber-400/40">MAJ (Shift)</kbd> enfoncée et cliquez sur une photo tout en bas :{' '}
                    <strong>toutes les photos entre les deux (ex: 300 photos) sont sélectionnées d’un seul coup !</strong>
                  </li>
                  <li>
                    Cliquez sur <strong>Done / Terminé</strong> : le jeu tirera automatiquement{' '}
                    <strong>
                      {randomSampleCount > 0 ? `${randomSampleCount} photos au hasard` : 'toutes les photos mélangées'}
                    </strong>{' '}
                    parmi votre bloc pour garder 100% de surprise à l’ouverture des boosters !
                  </li>
                </ol>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  ID Client Google OAuth 2.0
                </label>
                <button
                  onClick={() => setShowSetupGuide(!showSetupGuide)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-amber-300 font-bold text-[11px] shrink-0 flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  {showSetupGuide ? 'Masquer aide' : 'Aide configuration Google'}
                </button>
              </div>

              {showSetupGuide && (
                <div className="p-4 rounded-xl bg-slate-950/95 border border-amber-400/30 text-xs text-slate-200 space-y-3">
                  <div className="space-y-2.5">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-amber-300">Étape 1 :</span> Activer l’API{' '}
                        <strong>Google Photos Picker API</strong>.
                      </div>
                      <a
                        href="https://console.cloud.google.com/apis/library/photospicker.googleapis.com"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 font-bold text-[11px] shrink-0 inline-flex items-center gap-1"
                      >
                        1. Activer l’API <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-amber-300">Étape 2 :</span> Ajouter votre
                        Gmail dans <strong>Test users</strong>.
                      </div>
                      <a
                        href="https://console.cloud.google.com/auth/audience"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 font-bold text-[11px] shrink-0 inline-flex items-center gap-1"
                      >
                        2. Ajouter Gmail test <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-white/10 space-y-2">
                      <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-white/10">
                        <code className="text-amber-300 font-mono text-xs flex-1 select-all">
                          {window.location.origin}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.origin);
                            setCopiedOrigin(true);
                            setTimeout(() => setCopiedOrigin(false), 2000);
                          }}
                          className="px-2.5 py-1 rounded bg-amber-400 text-slate-950 font-extrabold text-[11px]"
                        >
                          {copiedOrigin ? '✓ Copié !' : 'Copier l’URL'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <input
                type="text"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="1234567890-abcdefg.apps.googleusercontent.com"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 font-mono"
              />

              <button
                onClick={handleLaunchGooglePicker}
                disabled={isBusy}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-950 font-display font-black text-sm shadow-lg hover:brightness-110 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Tirage au sort & Import Google Photos en cours...
                  </>
                ) : (
                  <>
                    <Dices className="w-5 h-5" />
                    Ouvrir Google Photos & Tirer{' '}
                    {randomSampleCount > 0 ? `${randomSampleCount} Photos au Hasard` : 'les Photos'}
                  </>
                )}
              </button>

              {activePickerUri && (
                <div className="p-4 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-center space-y-2 animate-pulse">
                  <p className="text-xs font-bold text-emerald-200">
                    ✅ Connexion Google réussie ! Si la fenêtre de sélection a été bloquée par votre navigateur :
                  </p>
                  <a
                    href={`${activePickerUri}/autoclose`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-display font-black text-sm shadow-lg inline-flex items-center gap-2 transition"
                  >
                    👉 Ouvrir ma galerie Google Photos maintenant{' '}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: DIRECT MULTI-PHOTO IMPORT ==================== */}
        {activeTab === 'direct' && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFilesSelected(e.dataTransfer.files);
              }}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-amber-400/50 hover:border-amber-400 bg-slate-950/70 hover:bg-slate-950 p-8 text-center transition flex flex-col items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <div className="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="font-display font-bold text-base text-white">
                  Glissez tout un dossier ou des centaines de photos ici
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Le jeu tirera automatiquement{' '}
                  <strong className="text-amber-300">
                    {randomSampleCount > 0 ? `${randomSampleCount} photos au hasard` : 'toutes les photos'}
                  </strong>{' '}
                  sans vous montrer lesquelles avant l’ouverture des boosters !
                </p>
              </div>
              <span className="mt-1 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-xs">
                Sélectionner des photos en bloc
              </span>
            </div>
          </div>
        )}

        {/* Progress / Status / Error Feedback */}
        {statusMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {isBusy ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-300 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="font-semibold">{statusMessage}</span>
            </div>
            {progress && (
              <span className="font-mono font-bold text-emerald-300 shrink-0">
                {progress.current}/{progress.total}
              </span>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-red-500/15 border border-red-400/40 text-red-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Family Pack Share Section (Export / Import for Wife / Family) */}
        <div className="mt-5 p-3.5 rounded-2xl bg-slate-950/90 border border-pink-400/30 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs">
              <p className="font-bold text-pink-300">
                🎁 Partager ce jeu de cartes avec votre femme (Format Ultra-Léger)
              </p>
              <p className="text-[11px] text-slate-400">
                Compresse automatiquement les cartes en WebP (~2 à 5 Mo au lieu de 300 Mo) et lit aussi les gros fichiers de 300 Mo+ en streaming !
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <input
              ref={packImportInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => handleImportFamilyPack(e.target.files)}
            />
            {customCards.length > 0 && (
              <>
                <select
                  value={exportMaxCards}
                  onChange={(e) => setExportMaxCards(Number(e.target.value))}
                  disabled={isBusy}
                  className="px-2.5 py-2 rounded-xl bg-slate-900 border border-pink-400/40 text-xs font-bold text-pink-200 focus:outline-none"
                >
                  <option value={50}>Pack 50 cartes (~2 Mo - WhatsApp)</option>
                  <option value={100}>Pack 100 cartes (~4 Mo)</option>
                  <option value={200}>Pack 200 cartes (~8 Mo)</option>
                  <option value={0}>Toutes ({customCards.length} cartes compressées)</option>
                </select>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={handleExportFamilyPack}
                  className="px-3.5 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/50 text-pink-200 text-xs font-extrabold transition disabled:opacity-50"
                >
                  📤 Exporter Pack Léger
                </button>
              </>
            )}
            <button
              type="button"
              disabled={isBusy}
              onClick={() => packImportInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-extrabold transition disabled:opacity-50"
            >
              📥 Importer un Pack (même 300 Mo)
            </button>
          </div>
        </div>

        {/* Current Custom Photo Pool Summary */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-300">
            <span className="font-bold text-white">{customCards.length}</span> carte(s) secrète(s)
            prête(s) dans vos boosters
          </div>

          <div className="flex items-center gap-2">
            {customCards.length > 0 && (
              <button
                onClick={async () => {
                  if (
                    window.confirm(
                      'Voulez-vous vraiment vider toutes les photos importées et recommencer un nouveau tirage ?'
                    )
                  ) {
                    await onClearCustomCards();
                    setStatusMessage('Toutes les photos ont été réinitialisées.');
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Tout effacer
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold transition"
            >
              Fermer & Jouer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
