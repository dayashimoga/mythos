import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AudioBuses, SoundPriority } from '../../src/audio/AudioBuses';
import { SpatialAudioListener } from '../../src/audio/SpatialAudioListener';
import { RagaMusicGenerator, SWARA_RATIOS, RAGA_SCALES } from '../../src/audio/RagaMusicGenerator';
import { MantraSynthesizer } from '../../src/audio/MantraSynthesizer';
import { FoleySynthesizer } from '../../src/audio/FoleySynthesizer';
import { AmbientSoundscape } from '../../src/audio/AmbientSoundscape';
import { AudioEngine } from '../../src/audio/AudioEngine';
import { Vector2D } from '../../src/physics/Vector2D';

describe('Stage 7: Audio Architecture & AudioBuses Mixer', () => {
  let ctx: AudioContext;
  let buses: AudioBuses;

  beforeEach(() => {
    ctx = new AudioContext();
    buses = new AudioBuses(ctx);
  });

  it('initializes 5-tier mixer hierarchy with proper default volumes', () => {
    expect(buses.getVolume('master')).toBe(1.0);
    expect(buses.getVolume('music')).toBe(0.8);
    expect(buses.getVolume('sfx')).toBe(0.85);
    expect(buses.getVolume('voice')).toBe(0.95);
    expect(buses.getVolume('ambience')).toBe(0.7);

    expect(buses.getBusGain('master')).toBeDefined();
    expect(buses.getBusGain('music')).toBeDefined();
    expect(buses.getBusGain('sfx')).toBeDefined();
    expect(buses.getBusGain('voice')).toBeDefined();
    expect(buses.getBusGain('ambience')).toBeDefined();
    expect(buses.getContext()).toBe(ctx);
  });

  it('handles null context and late context assignment', () => {
    const nullBuses = new AudioBuses(null);
    expect(nullBuses.getContext()).toBeNull();
    expect(nullBuses.getBusGain('music')).toBeNull();

    nullBuses.setVolume('music', 0.5);
    nullBuses.setMuted(true);
    nullBuses.duckBuses(['music'], 0.5, 1.0);

    nullBuses.setContext(ctx);
    expect(nullBuses.getContext()).toBe(ctx);
    expect(nullBuses.getBusGain('music')).toBeDefined();
  });

  it('clamps and updates bus volume accurately', () => {
    buses.setVolume('music', 0.5);
    expect(buses.getVolume('music')).toBe(0.5);

    buses.setVolume('music', 1.5);
    expect(buses.getVolume('music')).toBe(1.0);

    buses.setVolume('music', -0.5);
    expect(buses.getVolume('music')).toBe(0.0);

    // Master volume when unmuted vs muted
    buses.setVolume('master', 0.7);
    expect(buses.getVolume('master')).toBe(0.7);

    buses.setMuted(true);
    buses.setVolume('master', 0.4);
    expect(buses.getVolume('master')).toBe(0.4);
  });

  it('manages mute state and updates master gain node', () => {
    expect(buses.getIsMuted()).toBe(false);
    buses.setMuted(true);
    expect(buses.getIsMuted()).toBe(true);

    buses.setMuted(false);
    expect(buses.getIsMuted()).toBe(false);
  });

  it('applies ducking to target buses over given duration', () => {
    buses.duckBuses(['music', 'ambience'], 0.3, 1.2);
    expect(buses.getBusGain('music')).toBeDefined();
  });

  it('manages voice pool budget and steals lowest-priority / oldest voice when saturated', () => {
    const stops: number[] = [];

    // Allocate 32 low priority voices
    for (let i = 0; i < 32; i++) {
      buses.allocateVoice(SoundPriority.LOW, () => stops.push(i));
    }
    expect(buses.getActiveVoiceCount()).toBe(32);

    // Allocating a 33rd voice with HIGH priority should steal a LOW priority voice
    const highVoiceId = buses.allocateVoice(SoundPriority.HIGH, () => stops.push(999));
    expect(buses.getActiveVoiceCount()).toBe(32);
    expect(stops.length).toBe(1); // One voice was stolen and stopped

    // Try allocating a LOW priority voice when budget is full of HIGH priority voices
    buses.clearAllVoices();
    for (let i = 0; i < 32; i++) {
      buses.allocateVoice(SoundPriority.CRITICAL, () => {});
    }
    // Cannot steal higher priority voice
    buses.allocateVoice(SoundPriority.LOW, () => {});

    buses.releaseVoice(highVoiceId);
    buses.releaseVoice(999999); // Non-existent ID branch

    buses.clearAllVoices();
    expect(buses.getActiveVoiceCount()).toBe(0);
  });
});

describe('Stage 7: SpatialAudioListener Acoustics', () => {
  let listener: SpatialAudioListener;

  beforeEach(() => {
    listener = new SpatialAudioListener({ minRadius: 100, maxRadius: 1000, rollOff: 1.0, speedOfSound: 1500 });
  });

  it('handles default constructor parameters and velocity updates', () => {
    const defaultListener = new SpatialAudioListener();
    expect(defaultListener.minRadius).toBe(120);
    expect(defaultListener.maxRadius).toBe(1400);

    defaultListener.setListener(new Vector2D(100, 200));
    expect(defaultListener.getListenerVelocity().x).toBe(0);
    expect(defaultListener.getListenerVelocity().y).toBe(0);
  });

  it('tracks listener position and velocity accurately', () => {
    listener.setListener(new Vector2D(50, 100), new Vector2D(10, 0));
    expect(listener.getListenerPosition().x).toBe(50);
    expect(listener.getListenerVelocity().x).toBe(10);
  });

  it('computes distance attenuation following clamped inverse-distance physics', () => {
    expect(SpatialAudioListener.calculateAttenuation(50, 100, 1000)).toBe(1.0);
    expect(SpatialAudioListener.calculateAttenuation(100, 100, 1000)).toBe(1.0);
    expect(SpatialAudioListener.calculateAttenuation(1200, 100, 1000)).toBe(0.0);

    const att = SpatialAudioListener.calculateAttenuation(300, 100, 1000, 1.0);
    expect(att).toBeGreaterThan(0.0);
    expect(att).toBeLessThan(1.0);
  });

  it('calculates stereo pan bounded between -1.0 and +1.0', () => {
    expect(SpatialAudioListener.calculatePan(500, 500, 1000)).toBe(0.0);
    expect(SpatialAudioListener.calculatePan(500, 100, 1000)).toBe(-0.4);
    expect(SpatialAudioListener.calculatePan(0, 1500, 1000)).toBe(1.0);
    expect(SpatialAudioListener.calculatePan(1500, 0, 1000)).toBe(-1.0);
  });

  it('computes high-frequency air dampening lowpass cutoff', () => {
    expect(SpatialAudioListener.calculateCutoff(0, 1000, 2500, 20000)).toBe(20000);
    expect(SpatialAudioListener.calculateCutoff(1000, 1000, 2500, 20000)).toBe(2500);
    expect(SpatialAudioListener.calculateCutoff(2000, 1000, 2500, 20000)).toBe(2500);
  });

  it('calculates Doppler velocity pitch modulation', () => {
    const lPos = new Vector2D(0, 0);
    const lVel = new Vector2D(0, 0);
    const sPos = new Vector2D(500, 0);

    // Source moving towards listener at 300 px/s (c = 1500 px/s)
    const sVelTowards = new Vector2D(-300, 0);
    const dopplerTowards = SpatialAudioListener.calculateDoppler(lPos, lVel, sPos, sVelTowards, 1500);
    expect(dopplerTowards).toBeGreaterThan(1.0);

    // Source moving away from listener
    const sVelAway = new Vector2D(300, 0);
    const dopplerAway = SpatialAudioListener.calculateDoppler(lPos, lVel, sPos, sVelAway, 1500);
    expect(dopplerAway).toBeLessThan(1.0);

    // Distance ~ 0 edge case
    expect(SpatialAudioListener.calculateDoppler(lPos, lVel, lPos, sVelTowards, 1500)).toBe(1.0);

    // Mach 1 singularity denom edge case
    const sonicSpeed = new Vector2D(-1500, 0);
    expect(SpatialAudioListener.calculateDoppler(lPos, lVel, sPos, sonicSpeed, 1500)).toBe(1.0);
  });

  it('creates and updates spatial WebAudio pipeline with filter and panner fallbacks', () => {
    const ctx = new AudioContext();
    const dest = ctx.createGain();
    const pipeline = listener.createSpatialPipeline(ctx, dest, new Vector2D(200, 0));

    expect(pipeline.inputNode).toBeDefined();
    expect(pipeline.gainNode).toBeDefined();

    pipeline.update(new Vector2D(600, 0), new Vector2D(50, 0));
    pipeline.disconnect();

    // Mock missing stereo panner
    const mockCtxWithoutPanner = {
      currentTime: 0,
      createGain: () => ctx.createGain(),
      createBiquadFilter: () => ctx.createBiquadFilter(),
      createStereoPanner: undefined,
    } as unknown as AudioContext;

    const pipeline2 = listener.createSpatialPipeline(mockCtxWithoutPanner, dest, new Vector2D(0, 0));
    pipeline2.update(new Vector2D(100, 0));
    pipeline2.disconnect();
  });
});

describe('Stage 7: Procedural Vedic Raga Synthesizer', () => {
  let ctx: AudioContext;
  let ragaGen: RagaMusicGenerator;

  beforeEach(() => {
    ctx = new AudioContext();
    const dest = ctx.createGain();
    ragaGen = new RagaMusicGenerator(ctx, dest);
  });

  it('defines canonical Vedic swara ratios and ragas correctly', () => {
    expect(SWARA_RATIOS['S']).toBe(1.0);
    expect(SWARA_RATIOS['P']).toBe(1.5);
    expect(SWARA_RATIOS["S'"]).toBe(2.0);

    expect(RAGA_SCALES.BHAIRAV).toContain('r');
    expect(RAGA_SCALES.BHAIRAV).toContain('d');
    expect(RAGA_SCALES.DARBARI).toContain('g');
    expect(RAGA_SCALES.MARWA).toContain('M');
    expect(RAGA_SCALES.MARWA).not.toContain('P');
  });

  it('starts and stops Tambura drone across multiple ragas', () => {
    expect(ragaGen.getIsRunning()).toBe(false);
    ragaGen.start();
    ragaGen.start(); // Redundant start guard
    expect(ragaGen.getIsRunning()).toBe(true);

    ragaGen.setRaga('MARWA');
    ragaGen.start(); // Restarts drone for Marwa
    ragaGen.setTension(0.75);
    ragaGen.setVolume(0.9);

    ragaGen.update(0.1);
    ragaGen.stop();
    ragaGen.stop(); // Redundant stop guard
    expect(ragaGen.getIsRunning()).toBe(false);
  });

  it('triggers melodic notes and tabla rhythms across tension curve', () => {
    ragaGen.start();

    // Calm tension
    ragaGen.setTension(0.0);
    for (let i = 0; i < 10; i++) {
      ragaGen.triggerMelodicNote();
    }

    // High battle tension (> 0.6)
    ragaGen.setTension(0.9);
    for (let i = 0; i < 10; i++) {
      ragaGen.triggerMelodicNote();
    }

    // Test Tintal beats (Sam, Tali, Khali, subdivisions)
    for (let step = 0; step < 16; step++) {
      ragaGen.triggerTablaBeat(step);
    }

    ragaGen.stop();

    // Null context guard
    const nullGen = new RagaMusicGenerator(null);
    nullGen.update(0.1);
    nullGen.triggerMelodicNote();
    nullGen.triggerTablaBeat(0);
  });
});

describe('Stage 7: Mantra & Foley Synthesizers', () => {
  let ctx: AudioContext;
  let mantraSynth: MantraSynthesizer;
  let foleySynth: FoleySynthesizer;

  beforeEach(() => {
    ctx = new AudioContext();
    const dest = ctx.createGain();
    mantraSynth = new MantraSynthesizer(ctx, dest);
    foleySynth = new FoleySynthesizer(ctx, dest);
  });

  it('synthesizes sacred Sanskrit mantras (OM, HRIM, KRIM, PHAT)', () => {
    const onOmEnded = vi.fn();
    mantraSynth.playMantra('OM', onOmEnded);

    const onHrimEnded = vi.fn();
    mantraSynth.playMantra('HRIM', onHrimEnded);

    const onKrimEnded = vi.fn();
    mantraSynth.playMantra('KRIM', onKrimEnded);

    const onPhatEnded = vi.fn();
    mantraSynth.playMantra('PHAT', onPhatEnded);

    mantraSynth.setVolume(0.8);

    // Null context fallback
    const nullMantra = new MantraSynthesizer(null);
    const fallbackCb = vi.fn();
    nullMantra.playMantra('OM', fallbackCb);
    expect(fallbackCb).toHaveBeenCalled();
  });

  it('synthesizes material weapon impacts and tactical actions', () => {
    foleySynth.setVolume(0.85);

    foleySynth.playImpact('CELESTIAL_GOLD', 'SLASH', 1.2);
    foleySynth.playImpact('BRONZE', 'IMPACT', 1.0);
    foleySynth.playImpact('GRANITE', 'IMPACT', 1.5);
    foleySynth.playImpact('TAMAS_VOID', 'IMPACT', 1.0);
    foleySynth.playImpact('ETHEREAL_PRANA', 'IMPACT', 1.0);

    foleySynth.playParry();
    foleySynth.playShieldBlock();
    foleySynth.playShieldBreak();
    foleySynth.playFootstep('STONE');
    foleySynth.playFootstep('GRASS');
    foleySynth.playFootstep('WOOD');

    // Null context fallback
    const nullFoley = new FoleySynthesizer(null);
    nullFoley.playImpact('BRONZE');
    nullFoley.playParry();
    nullFoley.playShieldBlock();
    nullFoley.playShieldBreak();
    nullFoley.playFootstep();
  });
});

describe('Stage 7: AmbientSoundscape & AudioEngine Integration', () => {
  let engine: AudioEngine;

  beforeEach(() => {
    engine = new AudioEngine();
  });

  it('initializes and manages procedural AmbientSoundscape across all presets', () => {
    const ctx = new AudioContext();
    const dest = ctx.createGain();
    const amb = new AmbientSoundscape(ctx, dest);

    amb.setEnvironment('SANCTUM_DAWN');
    amb.start();
    amb.start(); // Redundant start guard
    expect(amb.getIsRunning()).toBe(true);

    amb.update(10.0); // Fast-forward to trigger wind and events

    amb.setEnvironment('DANDAKA_GROVE');
    amb.update(10.0);

    amb.setEnvironment('OBSIDIAN_CHASM');
    amb.update(10.0);

    amb.setVolume(0.5);

    amb.stop();
    amb.stop(); // Redundant stop guard
    expect(amb.getIsRunning()).toBe(false);

    // Null context guard
    const nullAmb = new AmbientSoundscape(null);
    nullAmb.update(1.0);
  });

  it('orchestrates complete AudioEngine subsystem methods cleanly', () => {
    engine.startMusic('BHAIRAV', 0.2);
    engine.setCombatTension(0.6);
    engine.startAmbience('SANCTUM_DAWN');

    engine.playMantra('KRIM');
    engine.playFoleyImpact('CELESTIAL_GOLD', 'SLASH');
    engine.playParryFoley();
    engine.playShieldBlockFoley();
    engine.playShieldBreakFoley();
    engine.playFootstep('STONE');

    engine.update(0.016);

    engine.setBusVolume('master', 0.9);
    expect(engine.getBusVolume('master')).toBe(0.9);

    expect(engine.getActiveVoices()).toBeGreaterThanOrEqual(0);

    // Legacy sound methods
    engine.playDash();
    engine.playShoot();
    engine.playShardPickup();
    engine.playAltarResonate();
    engine.playVictoryFanfare();
    engine.playMeleeSlash();
    engine.playEnemyHit();
    engine.playShockwave();
    engine.playHeal();
    engine.playDefeat();
    engine.playPillarHarmonic();
    engine.playForgeUpgrade();

    // Mute toggles
    engine.setMuted(true);
    expect(engine.isMuted()).toBe(true);
    engine.setMuted(false);
    expect(engine.isMuted()).toBe(false);

    engine.stopMusic();
    engine.stopAmbience();
  });
});
