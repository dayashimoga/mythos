export type BusType = 'master' | 'music' | 'sfx' | 'voice' | 'ambience' | 'ui';

export enum SoundPriority {
  CRITICAL = 1, // Dialogue, Mantras, Boss Stingers
  HIGH = 2,     // Weapon Impacts, Parries, Dashes
  MEDIUM = 3,   // Minion hits, Projectile hums
  LOW = 4,      // Braziers, ambient debris
}

export interface ActiveVoice {
  id: number;
  priority: SoundPriority;
  startTime: number;
  stop: () => void;
}

export class AudioBuses {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterLimiter: DynamicsCompressorNode | null = null;
  private busGains: Map<BusType, GainNode> = new Map();

  private volumes: Map<BusType, number> = new Map([
    ['master', 1.0],
    ['music', 0.8],
    ['sfx', 0.85],
    ['voice', 0.95],
    ['ambience', 0.7],
    ['ui', 0.8],
  ]);

  private isMuted = false;
  private nextVoiceId = 1;
  private maxVoices = 32;
  private activeVoices: ActiveVoice[] = [];

  constructor(ctx: AudioContext | null) {
    this.ctx = ctx;
    if (this.ctx) {
      this.initBuses();
    }
  }

  public setContext(ctx: AudioContext): void {
    this.ctx = ctx;
    this.initBuses();
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  private initBuses(): void {
    if (!this.ctx) return;

    try {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : (this.volumes.get('master') ?? 1.0), this.ctx.currentTime);

      // Master Anti-Clipping Dynamics Compressor (Limiter)
      if (typeof this.ctx.createDynamicsCompressor === 'function') {
        this.masterLimiter = this.ctx.createDynamicsCompressor();
        this.masterLimiter.threshold.setValueAtTime(-3, this.ctx.currentTime);
        this.masterLimiter.knee.setValueAtTime(6, this.ctx.currentTime);
        this.masterLimiter.ratio.setValueAtTime(16, this.ctx.currentTime);
        this.masterLimiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.masterLimiter.release.setValueAtTime(0.12, this.ctx.currentTime);
        this.masterGain.connect(this.masterLimiter);
        this.masterLimiter.connect(this.ctx.destination);
      } else {
        this.masterGain.connect(this.ctx.destination);
      }

      const busTypes: BusType[] = ['music', 'sfx', 'voice', 'ambience', 'ui'];
      for (const bus of busTypes) {
        const gainNode = this.ctx.createGain();
        const vol = this.volumes.get(bus) ?? 1.0;
        gainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
        gainNode.connect(this.masterGain);
        this.busGains.set(bus, gainNode);
      }
    } catch {
      // Graceful fallback for mock/unsupported environments
    }
  }

  public getBusGain(bus: BusType): GainNode | null {
    if (bus === 'master') return this.masterGain;
    return this.busGains.get(bus) ?? null;
  }

  public setVolume(bus: BusType, volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.volumes.set(bus, clamped);

    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (bus === 'master' && this.masterGain) {
        if (!this.isMuted) {
          this.masterGain.gain.setValueAtTime(clamped, now);
        }
      } else {
        const node = this.busGains.get(bus);
        if (node) {
          node.gain.setValueAtTime(clamped, now);
        }
      }
    }
  }

  public getVolume(bus: BusType): number {
    return this.volumes.get(bus) ?? 1.0;
  }

  public setBusVolume(bus: BusType, volume: number): void {
    this.setVolume(bus, volume);
  }

  public getBusVolume(bus: BusType): number {
    return this.getVolume(bus);
  }

  public duckBus(bus: BusType, multiplier = 0.35, duration = 1.5): void {
    this.duckBuses([bus], multiplier, duration);
  }

  public restoreBus(bus: BusType, duration = 0.5): void {
    const node = this.busGains.get(bus);
    if (node && this.ctx) {
      const target = this.volumes.get(bus) ?? 1.0;
      node.gain.linearRampToValueAtTime(target, this.ctx.currentTime + duration);
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      const target = muted ? 0 : (this.volumes.get('master') ?? 1.0);
      this.masterGain.gain.setValueAtTime(target, now);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Ducks specified buses down to a reduced gain for a given duration.
   */
  public duckBuses(buses: BusType[], duckMultiplier = 0.35, durationSec = 1.5): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    for (const bus of buses) {
      const node = this.busGains.get(bus);
      const originalVol = this.volumes.get(bus) ?? 1.0;
      if (node) {
        try {
          node.gain.setValueAtTime(node.gain.value, now);
          node.gain.linearRampToValueAtTime(originalVol * duckMultiplier, now + 0.1);
          node.gain.setValueAtTime(originalVol * duckMultiplier, now + durationSec);
          node.gain.linearRampToValueAtTime(originalVol, now + durationSec + 0.4);
        } catch {
          // In case audio params are mocked or saturated
        }
      }
    }
  }

  /**
   * Allocates a voice slot under strict voice budget limits.
   * If budget is full, reclaims the lowest-priority / oldest voice.
   */
  public allocateVoice(priority: SoundPriority, stopCallback: () => void): number {
    const now = this.ctx ? this.ctx.currentTime : Date.now() / 1000;
    const voiceId = this.nextVoiceId++;

    if (this.activeVoices.length >= this.maxVoices) {
      // Find candidate to steal: lowest priority (largest enum value) and oldest
      let candidateIdx = -1;
      let lowestPriority = -1;
      let oldestTime = Infinity;

      for (let i = 0; i < this.activeVoices.length; i++) {
        const v = this.activeVoices[i];
        if (v.priority > lowestPriority || (v.priority === lowestPriority && v.startTime < oldestTime)) {
          lowestPriority = v.priority;
          oldestTime = v.startTime;
          candidateIdx = i;
        }
      }

      if (candidateIdx >= 0 && lowestPriority >= priority) {
        const stolen = this.activeVoices.splice(candidateIdx, 1)[0];
        try {
          stolen.stop();
        } catch {
          // Safe stop catch
        }
      }
    }

    this.activeVoices.push({
      id: voiceId,
      priority,
      startTime: now,
      stop: stopCallback,
    });

    return voiceId;
  }

  public releaseVoice(voiceId: number): void {
    const idx = this.activeVoices.findIndex(v => v.id === voiceId);
    if (idx >= 0) {
      this.activeVoices.splice(idx, 1);
    }
  }

  public getActiveVoiceCount(): number {
    return this.activeVoices.length;
  }

  public clearAllVoices(): void {
    for (const voice of this.activeVoices) {
      try {
        voice.stop();
      } catch {
        // Safe stop
      }
    }
    this.activeVoices = [];
  }
}
