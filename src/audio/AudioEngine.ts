import { AudioBuses, BusType, SoundPriority } from './AudioBuses';
import { SpatialAudioListener } from './SpatialAudioListener';
import { RagaMusicGenerator, RagaType } from './RagaMusicGenerator';
import { MantraSynthesizer, MantraType } from './MantraSynthesizer';
import { FoleySynthesizer, MaterialType, ActionType, SurfaceType } from './FoleySynthesizer';
import { AmbientSoundscape, EnvironmentPreset } from './AmbientSoundscape';
import { Vector2D } from '../physics/Vector2D';

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

  public toggleMute(): boolean {
    const next = !this.isMuted();
    this.setMuted(next);
    return next;
  }

  public playConsecration(): void {
    this.playAltarResonate();
    this.playVictoryFanfare();
  }

  public playSfx(type: string): void {
    switch (type.toUpperCase()) {
      case 'DASH':
        this.playDash();
        break;
      case 'SHOOT':
        this.playShoot();
        break;
      case 'SLASH':
        this.playMeleeSlash();
        break;
      case 'HIT':
      case 'ENEMY_HIT':
        this.playEnemyHit();
        break;
      case 'PARRY':
        this.playParryFoley();
        break;
      case 'SHOCKWAVE':
        this.playShockwave();
        break;
      case 'HEAL':
        this.playHeal();
        break;
      case 'DEFEAT':
        this.playDefeat();
        break;
      case 'SHARD_COLLECT':
      case 'SHARD':
        this.playShardPickup();
        break;
      case 'ALTAR_CONSECRATE':
      case 'CONSECRATE':
      case 'RESONATE':
        this.playAltarResonate();
        break;
      case 'VICTORY':
        this.playVictoryFanfare();
        break;
      default:
        this.playFoleyImpact('GRANITE');
        break;
    }
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

  public fadeToRaga(raga: RagaType, tension = 0.2, fadeDuration = 1.5): void {
    if (!this.ensureRunning()) return;
    this.raga.fadeToRaga(raga, tension, fadeDuration);
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

  public crossfadeAmbience(env: EnvironmentPreset, fadeDuration = 1.5): void {
    if (!this.ensureRunning()) return;
    this.ambience.crossfadeEnvironment(env, fadeDuration);
  }

  public stopAmbience(): void {
    this.ambience.stop();
  }

  // --- Spatial 3D Audio Emitter Helpers ---

  /**
   * Plays a spatialized sound effect located at world coordinates with distance attenuation and stereo panning.
   */
  public playSpatialSfx(type: string, position: Vector2D, velocity?: Vector2D): void {
    if (!this.ensureRunning() || !this.ctx) return;
    const sfxGain = this.buses.getBusGain('sfx') ?? this.ctx.destination;

    const pipeline = this.spatial.createSpatialPipeline(this.ctx, sfxGain, position, velocity);
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    let duration = 0.25;
    if (type === 'SHOCKWAVE' || type === 'EXPLOSION') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      duration = 0.4;
    } else if (type === 'ALTAR_HUM' || type === 'RESONATE') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(216, now);
      osc.frequency.exponentialRampToValueAtTime(432, now + 0.6);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      duration = 0.7;
    } else if (type === 'BRAZIER') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      duration = 0.2;
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      duration = 0.22;
    }

    osc.connect(gain);
    gain.connect(pipeline.inputNode);
    osc.start(now);
    osc.stop(now + duration);

    osc.onended = () => {
      pipeline.disconnect();
    };
  }

  /**
   * Plays a spatialized material-foley impact located at world coordinates.
   */
  public playSpatialFoley(
    material: MaterialType,
    action: ActionType,
    position: Vector2D,
    velocity?: Vector2D
  ): void {
    if (!this.ensureRunning() || !this.ctx) return;
    const sfxGain = this.buses.getBusGain('sfx') ?? this.ctx.destination;

    const pipeline = this.spatial.createSpatialPipeline(this.ctx, sfxGain, position, velocity);
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const actionMult = action === 'PARRY' ? 1.35 : action === 'SLASH' ? 1.15 : 0.9;
    const baseFreq = (material === 'CELESTIAL_GOLD' ? 1450 : material === 'BRONZE' ? 580 : 120) * actionMult;
    osc.type = material === 'BRONZE' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.25);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(pipeline.inputNode);
    osc.start(now);
    osc.stop(now + 0.3);

    osc.onended = () => {
      pipeline.disconnect();
    };
  }

  /**
   * Plays the sacred Shankha divine war conch fanfare for epic boss intros and realm gateways.
   */
  public playShankhaFanfare(): void {
    if (!this.ensureRunning() || !this.ctx) return;
    this.buses.duckBuses(['music', 'ambience'], 0.2, 2.8);

    const sfxGain = this.buses.getBusGain('sfx') ?? this.ctx.destination;
    const now = this.ctx.currentTime;

    // Dual horn harmonics (fundamental 110Hz sliding to 196Hz + octave 220Hz)
    [110, 220].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq * 0.9, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.8);
      osc.frequency.setValueAtTime(freq * 1.5, now + 1.8);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.95, now + 2.5);

      const peakGain = (idx === 0 ? 0.32 : 0.18);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.3);
      gain.gain.setValueAtTime(peakGain, now + 1.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);

      osc.connect(gain);
      gain.connect(sfxGain);

      osc.start(now);
      osc.stop(now + 2.7);
    });
  }

  /**
   * Periodic spatial flame crackle at brazier coordinates.
   */
  public playBrazierSpatialCrackle(position: Vector2D): void {
    this.playSpatialSfx('BRAZIER', position);
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

  public playDialogueVoiceCue(cue?: string): void {
    if (!this.ensureRunning() || !this.ctx) return;
    const sfxGain = this.buses.getBusGain('sfx') ?? this.ctx.destination;
    const now = this.ctx.currentTime;

    if (cue === 'oracle_gentle') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.18);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.24);
    } else if (cue === 'guardian_firm') {
      [220, 330].forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now);
        osc.stop(now + 0.18);
      });
    } else if (cue === 'scout_chatter') {
      [660, 880].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.14, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.12);
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.14);
      });
    } else if (cue === 'titan_rumble') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, now);
      osc.frequency.exponentialRampToValueAtTime(38, now + 0.35);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.4);
    } else {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.07);
    }
  }
}
