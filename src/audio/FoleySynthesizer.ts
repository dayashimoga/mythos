export type MaterialType = 'CELESTIAL_GOLD' | 'BRONZE' | 'GRANITE' | 'TAMAS_VOID' | 'ETHEREAL_PRANA';
export type ActionType = 'SLASH' | 'IMPACT' | 'BLOCK' | 'PARRY' | 'BREAK';
export type SurfaceType = 'STONE' | 'GRASS' | 'WOOD';

export class FoleySynthesizer {
  private ctx: AudioContext | null = null;
  private outputNode: AudioNode | null = null;
  private volume = 1.0;

  constructor(ctx: AudioContext | null, outputNode?: AudioNode) {
    this.ctx = ctx;
    this.outputNode = outputNode ?? null;
  }

  public setOutput(outputNode: AudioNode): void {
    this.outputNode = outputNode;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public playImpact(material: MaterialType, action: ActionType = 'IMPACT', velocityScale = 1.0): void {
    if (!this.ctx || !this.outputNode) return;
    const ctx = this.ctx;
    const out = this.outputNode;
    const now = ctx.currentTime;
    const intensity = Math.max(0.1, Math.min(2.0, velocityScale));
    const actionPitchMul = action === 'SLASH' ? 1.15 : action === 'PARRY' ? 1.4 : action === 'BREAK' ? 0.8 : 1.0;

    try {
      switch (material) {
        case 'CELESTIAL_GOLD': {
          // Dual crystal bell resonance (1450Hz & 3200Hz)
          [1450 * actionPitchMul, 3200 * actionPitchMul].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            const dur = 0.35 + idx * 0.15;
            gain.gain.setValueAtTime(0.22 * intensity * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

            osc.connect(gain);
            gain.connect(out);

            osc.start(now);
            osc.stop(now + dur + 0.05);
          });
          break;
        }

        case 'BRONZE': {
          // Metallic clank (580Hz & 920Hz)
          [580, 920].forEach((freq) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.15);

            gain.gain.setValueAtTime(0.25 * intensity * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            osc.connect(gain);
            gain.connect(out);

            osc.start(now);
            osc.stop(now + 0.17);
          });
          break;
        }

        case 'GRANITE': {
          // Low-frequency impact thud + stone rubble
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(110, now);
          osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

          gain.gain.setValueAtTime(0.3 * intensity * this.volume, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

          osc.connect(gain);
          gain.connect(out);

          osc.start(now);
          osc.stop(now + 0.16);
          break;
        }

        case 'TAMAS_VOID': {
          // Dissonant low frequency rumble
          [55, 77].forEach((freq) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.linearRampToValueAtTime(30, now + 0.3);

            gain.gain.setValueAtTime(0.28 * intensity * this.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc.connect(gain);
            gain.connect(out);

            osc.start(now);
            osc.stop(now + 0.32);
          });
          break;
        }

        case 'ETHEREAL_PRANA': {
          // Harmonic shimmer arpeggio
          [523.25, 783.99, 1046.5].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.04);

            gain.gain.setValueAtTime(0.18 * intensity * this.volume, now + idx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);

            osc.connect(gain);
            gain.connect(out);

            osc.start(now + idx * 0.04);
            osc.stop(now + idx * 0.04 + 0.27);
          });
          break;
        }

        default:
          break;
      }
    } catch {
      // Safe fallback
    }
  }

  public playParry(): void {
    if (!this.ctx || !this.outputNode) return;
    const ctx = this.ctx;
    const out = this.outputNode;
    const now = ctx.currentTime;

    try {
      // High-energy golden parry chime (1800Hz + 2400Hz + 3600Hz)
      [1800, 2400, 3600].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const dur = 0.4 + idx * 0.1;
        gain.gain.setValueAtTime(0.25 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.connect(gain);
        gain.connect(out);

        osc.start(now);
        osc.stop(now + dur + 0.02);
      });
    } catch {
      // Safe fallback
    }
  }

  public playShieldBlock(): void {
    if (!this.ctx || !this.outputNode) return;
    const now = this.ctx.currentTime;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.1);

      gain.gain.setValueAtTime(0.3 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.outputNode);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // Safe fallback
    }
  }

  public playShieldBreak(): void {
    if (!this.ctx || !this.outputNode) return;
    const ctx = this.ctx;
    const out = this.outputNode;
    const now = ctx.currentTime;

    try {
      // Cracking metal + low shatter
      [420, 180, 80].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.03);
        osc.frequency.exponentialRampToValueAtTime(40, now + idx * 0.03 + 0.25);

        gain.gain.setValueAtTime(0.32 * this.volume, now + idx * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.28);

        osc.connect(gain);
        gain.connect(out);

        osc.start(now + idx * 0.03);
        osc.stop(now + idx * 0.03 + 0.3);
      });
    } catch {
      // Safe fallback
    }
  }

  public playFootstep(surface: SurfaceType = 'STONE'): void {
    if (!this.ctx || !this.outputNode) return;
    const now = this.ctx.currentTime;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = surface === 'STONE' ? 'triangle' : 'sine';
      const baseFreq = surface === 'STONE' ? 140 : (surface === 'WOOD' ? 95 : 180);
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.05);

      gain.gain.setValueAtTime(0.08 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.outputNode);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // Safe fallback
    }
  }
}
