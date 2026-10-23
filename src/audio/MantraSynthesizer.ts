export type MantraType = 'OM' | 'HRIM' | 'KRIM' | 'PHAT';

export interface FormantConfig {
  f0: number; // Fundamental frequency in Hz
  f1: number; // First formant
  f2: number; // Second formant
  q1: number;
  q2: number;
  duration: number;
  peakGain: number;
}

export class MantraSynthesizer {
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

  /**
   * Synthesizes and plays a sacred Sanskrit mantra phoneme.
   */
  public playMantra(mantra: MantraType, onEnded?: () => void): void {
    if (!this.ctx || !this.outputNode) {
      if (onEnded) onEnded();
      return;
    }

    try {
      switch (mantra) {
        case 'OM':
          this.synthesizeOm(onEnded);
          break;
        case 'HRIM':
          this.synthesizeHrim(onEnded);
          break;
        case 'KRIM':
          this.synthesizeKrim(onEnded);
          break;
        case 'PHAT':
          this.synthesizePhat(onEnded);
          break;
      }
    } catch {
      if (onEnded) onEnded();
    }
  }

  private synthesizeOm(onEnded?: () => void): void {
    if (!this.ctx || !this.outputNode) return;
    const now = this.ctx.currentTime;
    const duration = 2.4;

    const carrier = this.ctx.createOscillator();
    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(108, now);
    carrier.frequency.linearRampToValueAtTime(106, now + duration);

    // Formant 1 bandpass filter
    let f1Filter: BiquadFilterNode | null = null;
    let f2Filter: BiquadFilterNode | null = null;
    try {
      if (typeof this.ctx.createBiquadFilter === 'function') {
        f1Filter = this.ctx.createBiquadFilter();
        f1Filter.type = 'bandpass';
        f1Filter.Q.setValueAtTime(4.0, now);
        // Transition: [A] 800Hz -> [U] 350Hz -> [M] 250Hz
        f1Filter.frequency.setValueAtTime(800, now);
        f1Filter.frequency.exponentialRampToValueAtTime(350, now + 1.0);
        f1Filter.frequency.exponentialRampToValueAtTime(250, now + duration);

        f2Filter = this.ctx.createBiquadFilter();
        f2Filter.type = 'bandpass';
        f2Filter.Q.setValueAtTime(5.0, now);
        // Transition: [A] 1200Hz -> [U] 800Hz -> [M] 500Hz
        f2Filter.frequency.setValueAtTime(1200, now);
        f2Filter.frequency.exponentialRampToValueAtTime(800, now + 1.0);
        f2Filter.frequency.exponentialRampToValueAtTime(500, now + duration);
      }
    } catch {
      // Filter creation fallback
    }

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.35 * this.volume, now + 0.5);
    gainNode.gain.setValueAtTime(0.35 * this.volume, now + 1.4);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Routing
    if (f1Filter && f2Filter) {
      carrier.connect(f1Filter);
      carrier.connect(f2Filter);
      f1Filter.connect(gainNode);
      f2Filter.connect(gainNode);
    } else {
      carrier.connect(gainNode);
    }
    gainNode.connect(this.outputNode);

    carrier.start(now);
    carrier.stop(now + duration + 0.1);
    carrier.onended = () => {
      if (onEnded) onEnded();
    };
  }

  private synthesizeHrim(onEnded?: () => void): void {
    if (!this.ctx || !this.outputNode) return;
    const now = this.ctx.currentTime;
    const duration = 1.1;

    const carrier = this.ctx.createOscillator();
    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(216, now);
    carrier.frequency.exponentialRampToValueAtTime(162, now + duration);

    let filter: BiquadFilterNode | null = null;
    try {
      if (typeof this.ctx.createBiquadFilter === 'function') {
        filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(6.0, now);
        filter.frequency.setValueAtTime(2400, now);
        filter.frequency.exponentialRampToValueAtTime(450, now + duration);
      }
    } catch {
      // Fallback
    }

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3 * this.volume, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    if (filter) {
      carrier.connect(filter);
      filter.connect(gainNode);
    } else {
      carrier.connect(gainNode);
    }
    gainNode.connect(this.outputNode);

    carrier.start(now);
    carrier.stop(now + duration + 0.05);
    carrier.onended = () => {
      if (onEnded) onEnded();
    };
  }

  private synthesizeKrim(onEnded?: () => void): void {
    if (!this.ctx || !this.outputNode) return;
    const now = this.ctx.currentTime;
    const duration = 0.9;

    const carrier = this.ctx.createOscillator();
    carrier.type = 'triangle';
    carrier.frequency.setValueAtTime(144, now);
    carrier.frequency.linearRampToValueAtTime(108, now + duration);

    let filter: BiquadFilterNode | null = null;
    try {
      if (typeof this.ctx.createBiquadFilter === 'function') {
        filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(4.5, now);
        filter.frequency.setValueAtTime(1900, now);
        filter.frequency.exponentialRampToValueAtTime(320, now + duration);
      }
    } catch {
      // Fallback
    }

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.32 * this.volume, now + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    if (filter) {
      carrier.connect(filter);
      filter.connect(gainNode);
    } else {
      carrier.connect(gainNode);
    }
    gainNode.connect(this.outputNode);

    carrier.start(now);
    carrier.stop(now + duration + 0.05);
    carrier.onended = () => {
      if (onEnded) onEnded();
    };
  }

  private synthesizePhat(onEnded?: () => void): void {
    if (!this.ctx || !this.outputNode) return;
    const now = this.ctx.currentTime;
    const duration = 0.25;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + duration);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.4 * this.volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gainNode);
    gainNode.connect(this.outputNode);

    osc.start(now);
    osc.stop(now + duration + 0.02);
    osc.onended = () => {
      if (onEnded) onEnded();
    };
  }
}
