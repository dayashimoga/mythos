export type EnvironmentPreset = 'SANCTUM_DAWN' | 'DANDAKA_GROVE' | 'OBSIDIAN_CHASM';

export class AmbientSoundscape {
  private ctx: AudioContext | null = null;
  private outputNode: AudioNode | null = null;

  public activeEnvironment: EnvironmentPreset = 'SANCTUM_DAWN';
  private isRunning = false;
  private volume = 0.7;

  private windTimer = 0;
  private eventTimer = 0;

  // Background Wind Drone
  private windOsc: OscillatorNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  constructor(ctx: AudioContext | null, outputNode?: AudioNode) {
    this.ctx = ctx;
    this.outputNode = outputNode ?? null;
  }

  public setOutput(outputNode: AudioNode): void {
    this.outputNode = outputNode;
  }

  public setEnvironment(preset: EnvironmentPreset): void {
    this.activeEnvironment = preset;
    if (this.isRunning) {
      this.configureDroneForEnvironment();
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.windGain && this.ctx) {
      const droneBase = this.activeEnvironment === 'OBSIDIAN_CHASM' ? 0.2 : 0.12;
      this.windGain.gain.setValueAtTime(this.volume * droneBase, this.ctx.currentTime);
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.windTimer = 1.0;
    this.eventTimer = 2.0;
    this.startDrone();
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.stopDrone();
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public update(dt: number): void {
    if (!this.isRunning || !this.ctx || !this.outputNode) return;

    // Periodic wind gust modulation
    this.windTimer -= dt;
    if (this.windTimer <= 0) {
      this.triggerWindGust();
      this.windTimer = 4.0 + Math.random() * 4.0;
    }

    // Environmental micro-events (chimes, cricket, crackle)
    this.eventTimer -= dt;
    if (this.eventTimer <= 0) {
      this.triggerEnvironmentEvent();
      this.eventTimer = 2.5 + Math.random() * 3.5;
    }
  }

  private startDrone(): void {
    if (!this.ctx || !this.outputNode) return;
    this.stopDrone();

    try {
      this.windGain = this.ctx.createGain();
      const droneBase = this.activeEnvironment === 'OBSIDIAN_CHASM' ? 0.2 : 0.12;
      this.windGain.gain.setValueAtTime(this.volume * droneBase, this.ctx.currentTime);

      this.windOsc = this.ctx.createOscillator();
      this.windOsc.type = this.activeEnvironment === 'OBSIDIAN_CHASM' ? 'sawtooth' : 'triangle';
      
      const pitch = this.activeEnvironment === 'OBSIDIAN_CHASM' ? 45 : 75;
      this.windOsc.frequency.setValueAtTime(pitch, this.ctx.currentTime);

      if (typeof this.ctx.createBiquadFilter === 'function') {
        this.windFilter = this.ctx.createBiquadFilter();
        this.windFilter.type = 'lowpass';
        this.windFilter.frequency.setValueAtTime(350, this.ctx.currentTime);
        this.windOsc.connect(this.windFilter);
        this.windFilter.connect(this.windGain);
      } else {
        this.windOsc.connect(this.windGain);
      }

      this.windGain.connect(this.outputNode);
      this.windOsc.start();
    } catch {
      // Safe fallback
    }
  }

  private configureDroneForEnvironment(): void {
    if (!this.ctx || !this.windOsc || !this.windFilter) return;
    const now = this.ctx.currentTime;
    try {
      if (this.activeEnvironment === 'OBSIDIAN_CHASM') {
        this.windOsc.frequency.linearRampToValueAtTime(45, now + 1.0);
        this.windFilter.frequency.linearRampToValueAtTime(220, now + 1.0);
      } else if (this.activeEnvironment === 'DANDAKA_GROVE') {
        this.windOsc.frequency.linearRampToValueAtTime(80, now + 1.0);
        this.windFilter.frequency.linearRampToValueAtTime(450, now + 1.0);
      } else {
        // SANCTUM_DAWN
        this.windOsc.frequency.linearRampToValueAtTime(65, now + 1.0);
        this.windFilter.frequency.linearRampToValueAtTime(320, now + 1.0);
      }
    } catch {
      // Safe fallback
    }
  }

  private stopDrone(): void {
    if (this.windOsc) {
      try {
        this.windOsc.stop();
        this.windOsc.disconnect();
      } catch {
        // Safe disconnect
      }
      this.windOsc = null;
    }
    if (this.windFilter) {
      try {
        this.windFilter.disconnect();
      } catch {
        // Safe disconnect
      }
      this.windFilter = null;
    }
    if (this.windGain) {
      try {
        this.windGain.disconnect();
      } catch {
        // Safe disconnect
      }
      this.windGain = null;
    }
  }

  private triggerWindGust(): void {
    if (!this.ctx || !this.windFilter || !this.windGain) return;
    const now = this.ctx.currentTime;
    try {
      const targetCutoff = 600 + Math.random() * 400;
      this.windFilter.frequency.setValueAtTime(this.windFilter.frequency.value, now);
      this.windFilter.frequency.linearRampToValueAtTime(targetCutoff, now + 1.5);
      this.windFilter.frequency.linearRampToValueAtTime(350, now + 3.5);
    } catch {
      // Safe fallback
    }
  }

  private triggerEnvironmentEvent(): void {
    if (!this.ctx || !this.outputNode) return;
    const now = this.ctx.currentTime;

    try {
      if (this.activeEnvironment === 'SANCTUM_DAWN') {
        // Astral temple chime (random harmonic between 800Hz - 1600Hz)
        const chimeFreq = 880 + Math.floor(Math.random() * 4) * 220;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(chimeFreq, now);

        gain.gain.setValueAtTime(0.09 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(this.outputNode);

        osc.start(now);
        osc.stop(now + 1.25);
      } else if (this.activeEnvironment === 'DANDAKA_GROVE') {
        // Forest cicada or nocturnal cricket chirp pulse
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(3400 + Math.random() * 600, now);

        gain.gain.setValueAtTime(0.05 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.outputNode);

        osc.start(now);
        osc.stop(now + 0.14);
      } else {
        // OBSIDIAN_CHASM: Volcanic ember pop / crackle
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(120 + Math.random() * 80, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);

        gain.gain.setValueAtTime(0.12 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.outputNode);

        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch {
      // Safe fallback
    }
  }
}
