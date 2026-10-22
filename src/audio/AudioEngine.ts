export class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMutedState = false;
  private activeVoices = 0;

  constructor() {
    this.loadMutePreference();
  }

  private initContext(): void {
    if (this.ctx) return;
    try {
      const AudioCtxClass =
        (typeof window !== 'undefined' &&
          (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)) ||
        null;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    } catch {
      this.ctx = null;
    }
  }

  private loadMutePreference(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('mythos_audio_muted');
        this.isMutedState = saved === 'true';
      }
    } catch {
      this.isMutedState = false;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMutedState = muted;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mythos_audio_muted', String(muted));
      }
    } catch {
      // Ignored in strict sandbox
    }
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  public getActiveVoices(): number {
    return this.activeVoices;
  }

  private ensureRunning(): boolean {
    if (this.isMutedState) return false;
    this.initContext();
    if (!this.ctx) return false;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return true;
  }

  public playDash(): void {
    if (!this.ensureRunning() || !this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    this.activeVoices++;
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
    osc.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    };
  }

  public playShoot(): void {
    if (!this.ensureRunning() || !this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    this.activeVoices++;
    osc.start();
    osc.stop(this.ctx.currentTime + 0.21);
    osc.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    };
  }

  public playShardPickup(): void {
    if (!this.ensureRunning() || !this.ctx) return;

    // Dual-tone harmonic arpeggio
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5 major triad

    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      this.activeVoices++;
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.26);
      osc.onended = () => {
        this.activeVoices = Math.max(0, this.activeVoices - 1);
      };
    });
  }

  public playAltarResonate(): void {
    if (!this.ensureRunning() || !this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(108, now); // Sacred 108 Hz drone
    osc.frequency.linearRampToValueAtTime(216, now + 1.2);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    this.activeVoices++;
    osc.start(now);
    osc.stop(now + 1.25);
    osc.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    };
  }

  public playVictoryFanfare(): void {
    if (!this.ensureRunning() || !this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5

    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);

      gain.gain.setValueAtTime(0.2, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      this.activeVoices++;
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.62);
      osc.onended = () => {
        this.activeVoices = Math.max(0, this.activeVoices - 1);
      };
    });
  }
}
