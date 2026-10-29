import { CardRarity } from '../types/tcg';

class SoundFXEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private lastCrinkleTime: number = 0;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Plays a subtle metallic foil crinkle/tear grain as the user drags across the booster seam
   */
  public playTearStep(progress: number) {
    const now = performance.now();
    if (now - this.lastCrinkleTime < 38) return;
    this.lastCrinkleTime = now;

    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // White noise burst filtered for metallic wrapper crinkle
    const bufferSize = Math.floor(ctx.sampleRate * 0.045);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    // Pitch rises as tear progresses from 0 -> 1
    filter.frequency.setValueAtTime(1600 + progress * 2600, t);
    filter.Q.setValueAtTime(3.2, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.042);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);

    // Subtle rising tension tone
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320 + progress * 680, t);
    oscGain.gain.setValueAtTime(0.04, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  /**
   * Satisfying final rip + crystalline shimmer when the booster top tears off completely
   */
  public playPackBurst(hasHighRarity: boolean) {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // 1. Crisp tear noise swoosh
    const bufferSize = Math.floor(ctx.sampleRate * 0.28);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.4);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(4500, t + 0.25);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.28, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.27);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(t);

    // 2. Magical chord arpeggio
    const notes = hasHighRarity
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98] // C Major 9 sparkling
      : [440, 554.37, 659.25, 880]; // A Major

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const startTime = t + 0.06 + idx * 0.055;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.11, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, startTime + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.68);
    });
  }

  /**
   * Card swipe / slide sound when revealing the next card in the stack
   */
  public playCardSwipe() {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.11);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(2800, t + 0.1);
    filter.Q.setValueAtTime(2.0, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.11);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
  }

  /**
   * Plays a celebratory chord scaled to the revealed card's rarity
   */
  public playRarityReveal(rarity: CardRarity) {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    if (rarity === 'common') {
      this.playTone(587.33, t, 0.18, 'sine', 0.07);
      this.playTone(880, t + 0.06, 0.22, 'sine', 0.06);
      return;
    }

    if (rarity === 'rare') {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        this.playTone(f, t + i * 0.05, 0.35, 'triangle', 0.08);
      });
      return;
    }

    if (rarity === 'holo') {
      [587.33, 739.99, 880, 1174.66, 1479.98].forEach((f, i) => {
        this.playTone(f, t + i * 0.05, 0.5, 'triangle', 0.09);
      });
      return;
    }

    if (rarity === 'ultra' || rarity === 'crown') {
      // Sub-bass impact + heavenly fanfare
      this.playTone(110, t, 0.65, 'sine', 0.22);
      const chord = rarity === 'crown'
        ? [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51, 1567.98, 2093.0]
        : [440, 554.37, 659.25, 880, 1108.73, 1318.51];

      chord.forEach((f, i) => {
        this.playTone(f, t + i * 0.045, 0.9, 'triangle', 0.11);
        this.playTone(f * 1.5, t + 0.1 + i * 0.045, 0.7, 'sine', 0.04);
      });
    }
  }

  private playTone(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ) {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0005, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }
}

export const soundFX = new SoundFXEngine();
