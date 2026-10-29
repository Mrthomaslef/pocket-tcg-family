import { CardRarity } from '../types/tcg';

class SoundFXEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private lastCrinkleTime: number = 0;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public vibrate(pattern: number | number[]) {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch {}
  }

  /**
   * Subtle metallic notch grab sound when starting the tear
   */
  public playNotchGrab() {
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.vibrate(12);
    this.playTone(880, t, 0.06, 'triangle', 0.08);
    this.playTone(1320, t + 0.02, 0.08, 'sine', 0.06);
  }

  /**
   * Plays a realistic metallic foil crinkle + rising musical tension as the user slices the booster
   */
  public playTearStep(progress: number) {
    const now = performance.now();
    if (now - this.lastCrinkleTime < 32) return;
    this.lastCrinkleTime = now;

    this.vibrate(6);

    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;

    // 1. Crisp metallic foil tear grain
    const bufferSize = Math.floor(ctx.sampleRate * 0.05);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400 + progress * 3400, t);
    filter.Q.setValueAtTime(3.8, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.048);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);

    // 2. Rising crystalline harmonic tension (pitch climbs exponentially as you reach 90%)
    const baseFreq = 260 + Math.pow(progress, 1.5) * 920;
    this.playTone(baseFreq, t, 0.07, 'triangle', 0.055);
    this.playTone(baseFreq * 1.5, t, 0.06, 'sine', 0.03);
  }

  /**
   * Satisfying final rip + sub-bass boom + heavenly chord burst when the booster tears open
   */
  public playPackBurst(hasHighRarity: boolean) {
    this.vibrate([25, 30, 60]);
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // 1. Sub-bass punch impact
    this.playTone(95, t, 0.45, 'sine', 0.28);
    this.playTone(65, t + 0.04, 0.55, 'sine', 0.25);

    // 2. Crisp final tear noise swoosh
    const bufferSize = Math.floor(ctx.sampleRate * 0.32);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.3);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(5200, t + 0.28);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.32, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(t);

    // 3. Shimmering arpeggio
    const notes = hasHighRarity
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093.0]
      : [440, 554.37, 659.25, 880, 1108.73];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const startTime = t + 0.05 + idx * 0.05;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, startTime + 0.75);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.78);
    });
  }

  /**
   * Card swipe / slide sound when flinging the top card off the stack
   */
  public playCardSwipe() {
    this.vibrate(10);
    const ctx = this.getContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const bufferSize = Math.floor(ctx.sampleRate * 0.12);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, t);
    filter.frequency.exponentialRampToValueAtTime(3200, t + 0.11);
    filter.Q.setValueAtTime(2.2, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + 0.12);

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
      this.vibrate(18);
      [587.33, 739.99, 880, 1174.66, 1479.98].forEach((f, i) => {
        this.playTone(f, t + i * 0.05, 0.5, 'triangle', 0.09);
      });
      return;
    }

    if (rarity === 'ultra' || rarity === 'crown') {
      this.vibrate([20, 40, 50]);
      // Sub-bass impact + heavenly fanfare
      this.playTone(110, t, 0.7, 'sine', 0.25);
      const chord =
        rarity === 'crown'
          ? [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51, 1567.98, 2093.0]
          : [440, 554.37, 659.25, 880, 1108.73, 1318.51];

      chord.forEach((f, i) => {
        this.playTone(f, t + i * 0.045, 0.95, 'triangle', 0.12);
        this.playTone(f * 1.5, t + 0.1 + i * 0.045, 0.75, 'sine', 0.05);
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
