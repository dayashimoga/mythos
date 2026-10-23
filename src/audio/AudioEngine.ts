import { AudioBuses, BusType, SoundPriority } from './AudioBuses';
import { SpatialAudioListener } from './SpatialAudioListener';
import { RagaMusicGenerator, RagaType } from './RagaMusicGenerator';
import { MantraSynthesizer, MantraType } from './MantraSynthesizer';
import { FoleySynthesizer, MaterialType, ActionType, SurfaceType } from './FoleySynthesizer';
import { AmbientSoundscape, EnvironmentPreset } from './AmbientSoundscape';

export { SoundPriority };

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private isMutedState = false;
  private activeVoices = 0;

  // Subsystems
  public buses: AudioBuses;
  public spatial: SpatialAudioListener;
  public raga: RagaMusicGenerator;
  public mantra: MantraSynthesizer;
  public foley: FoleySynthesizer;
  public ambience: AmbientSoundscape;

  constructor() {
    this.buses = new AudioBuses(null);
    this.spatial = new SpatialAudioListener();
    this.raga = new RagaMusicGenerator(null);
    this.mantra = new MantraSynthesizer(null);
    this.foley = new FoleySynthesizer(null);
    this.ambience = new AmbientSoundscape(null);

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
        this.buses.setContext(this.ctx);

        const musicGain = this.buses.getBusGain('music');
        if (musicGain) this.raga.setOutput(musicGain);

        const voiceGain = this.buses.getBusGain('voice');
        if (voiceGain) this.mantra.setOutput(voiceGain);

        const sfxGain = this.buses.getBusGain('sfx');
        if (sfxGain) this.foley.setOutput(sfxGain);

        const ambGain = this.buses.getBusGain('ambience');
        if (ambGain) this.ambience.setOutput(ambGain);
      }
    } catch {
      this.ctx = null;
    }
  }

  public getContext(): AudioContext | null {
    this.initContext();
    return this.ctx;
  }

  private loadMutePreference(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('mythos_audio_muted');
        this.isMutedState = saved === 'true';
        this.buses.setMuted(this.isMutedState);
      }
    } catch {
      this.isMutedState = false;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMutedState = muted;
    this.buses.setMuted(muted);
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
    return this.activeVoices + this.buses.getActiveVoiceCount();
  }

  public update(dt: number): void {
    if (this.ensureRunning()) {
      this.raga.update(dt);
      this.ambience.update(dt);
    }
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

  public setBusVolume(bus: BusType, volume: number): void {
    this.buses.setVolume(bus, volume);
  }

  public getBusVolume(bus: BusType): number {
    return this.buses.getVolume(bus);
  }

  public playMantra(mantra: MantraType, onEnded?: () => void): void {
    if (!this.ensureRunning()) {
      if (onEnded) onEnded();
      return;
    }
    this.buses.duckBuses(['music', 'ambience'], 0.3, 1.8);
    this.mantra.playMantra(mantra, onEnded);
  }

  public playFoleyImpact(material: MaterialType, action: ActionType = 'IMPACT', velocity = 1.0): void {
    if (!this.ensureRunning()) return;
    this.foley.playImpact(material, action, velocity);
  }

  public playParryFoley(): void {
    if (!this.ensureRunning()) return;
    this.foley.playParry();
  }

  public playShieldBlockFoley(): void {
    if (!this.ensureRunning()) return;
    this.foley.playShieldBlock();
  }

  public playShieldBreakFoley(): void {
    if (!this.ensureRunning()) return;
    this.foley.playShieldBreak();
  }

  public playFootstep(surface: SurfaceType = 'STONE'): void {
    if (!this.ensureRunning()) return;
    this.foley.playFootstep(surface);
  }

  public startMusic(raga: RagaType = 'BHAIRAV', tension = 0.0): void {
    if (!this.ensureRunning()) return;
    this.raga.setRaga(raga);
    this.raga.setTension(tension);
    this.raga.start();
  }

  public stopMusic(): void {
    this.raga.stop();
  }

  public setCombatTension(tension: number): void {
    this.raga.setTension(tension);
  }

  public startAmbience(env: EnvironmentPreset = 'SANCTUM_DAWN'): void {
    if (!this.ensureRunning()) return;
    this.ambience.setEnvironment(env);
    this.ambience.start();
  }

  public stopAmbience(): void {
    this.ambience.stop();
  }

  // --- Legacy and Action Sound Effects (routed through SFX / Voice buses) ---

  public playDash(): void {
    if (!this.ensureRunning() || !this.ctx) return;

    const sfxGain = this.buses.getBusGain('sfx') ?? this.ctx.destination;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(sfxGain);

    this.activeVoices++;
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
    osc.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    };
  }

  public playShoot(): void {
    if (!this.ensureRunning() || !this.ctx) return;

    const sfxGain = this.buses.getBusGain('sfx') ?? this.ctx.destination;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(sfxGain);

    this.activeVoices++;
    osc.start();
    osc.stop(this.ctx.currentTime + 0.21);
    osc.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    };
  }

  public playShardPickup(): void {
    if (!this.ensureRunning() || !this.ctx) return;

    const ctx = this.ctx;
    const sfxGain = this.buses.getBusGain('sfx') ?? ctx.destination;
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5 major triad

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

      osc.connect(gain);
      gain.connect(sfxGain);

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

    const sfxGain = this.buses.getBusGain('sfx') ?? this.ctx.destination;
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
    gain.connect(sfxGain);

    this.activeVoices++;
    osc.start(now);
    osc.stop(now + 1.25);
    osc.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    };
  }

  public playVictoryFanfare(): void {
    if (!this.ensureRunning() || !this.ctx) return;

    const ctx = this.ctx;
    const musicGain = this.buses.getBusGain('music') ?? ctx.destination;
    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);

      gain.gain.setValueAtTime(0.2, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(musicGain);

      this.activeVoices++;
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.62);
      osc.onended = () => {
        this.activeVoices = Math.max(0, this.activeVoices - 1);
      };
    });
  }

  public playMeleeSlash(): void {
    if (!this.ensureRunning() || !this.ctx) return;
    const sfxGain = this.buses.getBusGain('sfx') ?? this.ctx.destination;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(sfxGain);

    this.activeVoices++;
    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
    osc.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    };
  }

  public playEnemyHit(): void {
    if (!this.ensureRunning() || !this.ctx) return;
    const sfxGain = this.buses.getBusGain('sfx') ?? this.ctx.destination;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(sfxGain);

    this.activeVoices++;
    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
    osc.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    };
  }

  public playShockwave(): void {
    if (!this.ensureRunning() || !this.ctx) return;
    const sfxGain = this.buses.getBusGain('sfx') ?? this.ctx.destination;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(sfxGain);

    this.activeVoices++;
    osc.start();
    osc.stop(this.ctx.currentTime + 0.42);
    osc.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    };
  }

  public playHeal(): void {
    if (!this.ensureRunning() || !this.ctx) return;
    const ctx = this.ctx;
    const sfxGain = this.buses.getBusGain('sfx') ?? ctx.destination;
    const now = ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.18, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(sfxGain);

      this.activeVoices++;
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.32);
      osc.onended = () => {
        this.activeVoices = Math.max(0, this.activeVoices - 1);
      };
    });
  }

  public playDefeat(): void {
    if (!this.ensureRunning() || !this.ctx) return;
    const ctx = this.ctx;
    const musicGain = this.buses.getBusGain('music') ?? ctx.destination;
    const now = ctx.currentTime;
    [329.63, 293.66, 261.63, 220].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);
      gain.gain.setValueAtTime(0.2, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.5);

      osc.connect(gain);
      gain.connect(musicGain);

      this.activeVoices++;
      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.52);
      osc.onended = () => {
        this.activeVoices = Math.max(0, this.activeVoices - 1);
      };
    });
  }

  public playPillarHarmonic(): void {
    if (!this.ensureRunning() || !this.ctx) return;
    const ctx = this.ctx;
    const sfxGain = this.buses.getBusGain('sfx') ?? ctx.destination;
    const now = ctx.currentTime;
    [523.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.22, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.6);

      osc.connect(gain);
      gain.connect(sfxGain);

      this.activeVoices++;
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.62);
      osc.onended = () => {
        this.activeVoices = Math.max(0, this.activeVoices - 1);
      };
    });
  }

  public playForgeUpgrade(): void {
    if (!this.ensureRunning() || !this.ctx) return;
    const sfxGain = this.buses.getBusGain('sfx') ?? this.ctx.destination;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.5);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(sfxGain);

    this.activeVoices++;
    osc.start(now);
    osc.stop(now + 0.52);
    osc.onended = () => {
      this.activeVoices = Math.max(0, this.activeVoices - 1);
    };
  }
}
