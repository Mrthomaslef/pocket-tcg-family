import React, { useState } from 'react';
import { X, Smartphone, Share, PlusSquare, MoreVertical, Download, Sparkles, CheckCircle2 } from 'lucide-react';

interface InstallAppModalProps {
  onClose: () => void;
  deferredPrompt?: any;
  onTriggerNativeInstall?: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  onClose,
  deferredPrompt,
  onTriggerNativeInstall,
}) => {
  // Auto-detect iOS vs Android to highlight the right tab first
  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  const [selectedOS, setSelectedOS] = useState<'ios' | 'android'>(
    isIOS ? 'ios' : 'ios'
  );

  return (
    <div
      onClick={onClose}
      className="safe-modal-overlay fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center animate-fadeIn overflow-hidden"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-full rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950/95 to-slate-900 border border-amber-400/30 p-5 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with new milTCG Icon */}
        <div className="flex flex-col items-center text-center gap-2.5 mb-5">
          <img
            src="./icon-512.png"
            alt="milTCG App Icon"
            className="w-20 h-20 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.5)] border border-amber-400/50 object-cover"
          />
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3" /> Mode Application Plein Écran
            </div>
            <h2 className="font-display font-black text-xl text-white">
              Installer mil<span className="text-amber-400">TCG</span> sur le téléphone
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Ajoutez l’application sur votre écran d’accueil pour l’utiliser en plein écran comme un vrai jeu mobile !
            </p>
          </div>
        </div>

        {/* 1-Click Native Install Button if supported (Android Chrome / Desktop) */}
        {deferredPrompt && onTriggerNativeInstall && (
          <button
            onClick={onTriggerNativeInstall}
            className="w-full mb-4 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-display font-black text-sm shadow-[0_0_25px_rgba(52,211,153,0.4)] hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>📲 Installer l’application en 1 clic</span>
          </button>
        )}

        {/* iPhone / Android Selector Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-950/90 border border-white/10 mb-4">
          <button
            onClick={() => setSelectedOS('ios')}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
              selectedOS === 'ios'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>🍎 iPhone / iPad</span>
          </button>
          <button
            onClick={() => setSelectedOS('android')}
            className={`py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
              selectedOS === 'android'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>🤖 Android</span>
          </button>
        </div>

        {/* Step-by-Step Instructions */}
        {selectedOS === 'ios' ? (
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/65 border border-white/10">
              <div className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/50 text-amber-300 font-display font-black flex items-center justify-center shrink-0">
                1
              </div>
              <div className="flex-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span>Appuyez sur le bouton Partager</span>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-300">
                    <Share className="w-3.5 h-3.5" />
                  </span>
                </p>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                  Dans <strong>Safari</strong>, appuyez sur l’icône <strong>Partager</strong> (le carré avec une flèche vers le haut) située tout en bas de l’écran.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/65 border border-white/10">
              <div className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/50 text-amber-300 font-display font-black flex items-center justify-center shrink-0">
                2
              </div>
              <div className="flex-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span>Choisissez « Sur l’écran d’accueil »</span>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                    <PlusSquare className="w-3.5 h-3.5" />
                  </span>
                </p>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                  Faites défiler le menu vers le bas et appuyez sur <strong>« Sur l’écran d’accueil »</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/65 border border-white/10">
              <div className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/50 text-amber-300 font-display font-black flex items-center justify-center shrink-0">
                3
              </div>
              <div className="flex-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span>Appuyez sur « Ajouter »</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </p>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                  Validez en haut à droite : l’icône <strong>milTCG</strong> avec le visage d’Émile apparaît sur votre téléphone et s’ouvre d’un seul bloc sans barre de navigation !
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/65 border border-white/10">
              <div className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/50 text-amber-300 font-display font-black flex items-center justify-center shrink-0">
                1
              </div>
              <div className="flex-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span>Ouvrez le menu Chrome</span>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-300">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </span>
                </p>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                  Appuyez sur les <strong>3 petits points</strong> en haut à droite de votre navigateur Chrome.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/65 border border-white/10">
              <div className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/50 text-amber-300 font-display font-black flex items-center justify-center shrink-0">
                2
              </div>
              <div className="flex-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span>Appuyez sur « Installer l’application »</span>
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                    <Smartphone className="w-3.5 h-3.5" />
                  </span>
                </p>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                  Sélectionnez <strong>« Installer l’application »</strong> ou <strong>« Ajouter à l’écran d’accueil »</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/65 border border-white/10">
              <div className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/50 text-amber-300 font-display font-black flex items-center justify-center shrink-0">
                3
              </div>
              <div className="flex-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span>Lancez milTCG depuis votre écran d’accueil</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </p>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                  L’icône <strong>milTCG</strong> est installée et s’ouvre en plein écran !
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-display font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 transition"
        >
          J’ai compris !
        </button>
      </div>
    </div>
  );
};
