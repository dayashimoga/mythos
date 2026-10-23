import { describe, it, expect, vi } from 'vitest';
import { AudioBuses, SoundPriority } from '../../src/audio/AudioBuses';
import { SpatialAudioListener } from '../../src/audio/SpatialAudioListener';
import { RagaMusicGenerator } from '../../src/audio/RagaMusicGenerator';
import { MantraSynthesizer } from '../../src/audio/MantraSynthesizer';
import { AmbientSoundscape } from '../../src/audio/AmbientSoundscape';
import { AudioEngine } from '../../src/audio/AudioEngine';
import { Vector2D } from '../../src/physics/Vector2D';

describe('Stage 7: Dedicated Audio Branch Coverage', () => {
  it('covers AudioBuses voice stealing edge cases and branch permutations', () => {
    const ctx = new AudioContext();
    const buses = new AudioBuses(ctx);

    // 1. Two voices with same priority but different start times
    const voice1 = buses.allocateVoice(SoundPriority.LOW, () => {});
    const voice2 = buses.allocateVoice(SoundPriority.LOW, () => {});
    expect(voice1).toBeDefined();
    expect(voice2).toBeDefined();
    expect(buses.getActiveVoiceCount()).toBe(2);

    // 2. Fill to 32 voices
    for (let i = 0; i < 30; i++) {
      buses.allocateVoice(SoundPriority.LOW, () => {});
    }
    expect(buses.getActiveVoiceCount()).toBe(32);

    // 3. Steal when equal priority and older time
    buses.allocateVoice(SoundPriority.LOW, () => {});
    expect(buses.getActiveVoiceCount()).toBe(32);

    // 4. Steal with thrown error in stop callback
    buses.allocateVoice(SoundPriority.HIGH, () => {
      throw new Error('Stop crash');
    });

    // 5. getBusGain branches
    expect(buses.getBusGain('master')).toBeDefined();
    expect(buses.getBusGain('music')).toBeDefined();

    // 6. setVolume branches
    buses.setMuted(false);
    buses.setVolume('master', 0.8);
    buses.setMuted(true);
    buses.setVolume('master', 0.6);

    // 7. duckBuses with non-existent bus
    buses.duckBuses(['master', 'music'], 0.5, 0.5);

    // 8. release non-existent voice
    buses.releaseVoice(-999);
  });

  it('covers SpatialAudioListener pipeline permutations and error branches', () => {
    const ctx = new AudioContext();
    const dest = ctx.createGain();
    const listener = new SpatialAudioListener();

    // 1. Pipeline with filter only (no panner)
    const mockCtxNoPanner = {
      currentTime: 0,
      createGain: () => ctx.createGain(),
      createBiquadFilter: () => ctx.createBiquadFilter(),
      createStereoPanner: undefined,
    } as unknown as AudioContext;

    const p1 = listener.createSpatialPipeline(mockCtxNoPanner, dest, new Vector2D(100, 0));
    p1.update(new Vector2D(200, 0));
    p1.disconnect();

    // 2. Pipeline with panner only (no filter)
    const mockCtxNoFilter = {
      currentTime: 0,
      createGain: () => ctx.createGain(),
      createBiquadFilter: undefined,
      createStereoPanner: () => ctx.createStereoPanner(),
    } as unknown as AudioContext;

    const p2 = listener.createSpatialPipeline(mockCtxNoFilter, dest, new Vector2D(100, 0));
    p2.update(new Vector2D(200, 0));
    p2.disconnect();

    // 3. Pipeline with neither filter nor panner
    const mockCtxGainOnly = {
      currentTime: 0,
      createGain: () => ctx.createGain(),
      createBiquadFilter: undefined,
      createStereoPanner: undefined,
    } as unknown as AudioContext;

    const p3 = listener.createSpatialPipeline(mockCtxGainOnly, dest, new Vector2D(100, 0));
    p3.update(new Vector2D(200, 0));
    p3.disconnect();
  });

  it('covers RagaMusicGenerator melodic turns and tabla beat combinations', () => {
    const ctx = new AudioContext();
    const dest = ctx.createGain();
    const raga = new RagaMusicGenerator(ctx, dest);

    raga.start();

    // Test stepChoice branches: < 0.5, < 0.8, >= 0.8
    const origRandom = Math.random;

    Math.random = () => 0.2; // stepChoice < 0.5
    raga.triggerMelodicNote();

    Math.random = () => 0.65; // stepChoice < 0.8
    raga.triggerMelodicNote();

    Math.random = () => 0.95; // stepChoice >= 0.8
    raga.triggerMelodicNote();

    Math.random = origRandom;

    // Test triggerTablaBeat branch permutations
    // 1. Step 0 (Sam)
    raga.setTension(0.3);
    raga.triggerTablaBeat(0);

    // 2. Step 4 (Tali)
    raga.triggerTablaBeat(4);

    // 3. Step 8 (Khali) at tension 0.3 (no Dayan)
    raga.triggerTablaBeat(8);

    // 4. Step 8 (Khali) at tension 0.8 (Dayan plays because tension > 0.7)
    raga.setTension(0.85);
    raga.triggerTablaBeat(8);

    // 5. Even step 2 at tension 0.6 (Bayan triggers)
    raga.setTension(0.6);
    raga.triggerTablaBeat(2);

    // 6. Odd step 3 at tension 0.3 (neither Sam, Tali, nor even tension -> no Bayan)
    raga.setTension(0.3);
    raga.triggerTablaBeat(3);

    raga.stop();
  });

  it('covers MantraSynthesizer filter-less fallback branches', () => {
    const ctx = new AudioContext();
    const dest = ctx.createGain();

    const mockCtxNoFilters = {
      currentTime: 0,
      createGain: () => ctx.createGain(),
      createOscillator: () => ctx.createOscillator(),
      createBiquadFilter: undefined,
    } as unknown as AudioContext;

    const synth = new MantraSynthesizer(mockCtxNoFilters, dest);

    const onOm = vi.fn();
    synth.playMantra('OM', onOm);

    const onHrim = vi.fn();
    synth.playMantra('HRIM', onHrim);

    const onKrim = vi.fn();
    synth.playMantra('KRIM', onKrim);

    const onPhat = vi.fn();
    synth.playMantra('PHAT', onPhat);
  });

  it('covers AmbientSoundscape environment transitions and events', () => {
    const ctx = new AudioContext();
    const dest = ctx.createGain();
    const amb = new AmbientSoundscape(ctx, dest);

    amb.start();

    // Trigger configureDroneForEnvironment across all 3
    amb.setEnvironment('OBSIDIAN_CHASM');
    amb.setEnvironment('DANDAKA_GROVE');
    amb.setEnvironment('SANCTUM_DAWN');

    // Trigger wind gust
    amb.update(15.0);

    // Switch environments and trigger events
    amb.setEnvironment('DANDAKA_GROVE');
    amb.update(15.0);

    amb.setEnvironment('OBSIDIAN_CHASM');
    amb.update(15.0);

    amb.stop();
  });

  it('covers AudioEngine suspended context resume and muted state early returns', () => {
    const engine = new AudioEngine();
    const ctx = engine.getContext();
    expect(ctx).toBeDefined();

    // 1. Context suspended state
    (ctx as any).state = 'suspended';
    engine.playDash();
    expect(ctx?.resume).toHaveBeenCalled();

    // 2. Muted state early returns for all methods
    engine.setMuted(true);
    expect(engine.isMuted()).toBe(true);

    engine.playMantra('OM');
    engine.playFoleyImpact('CELESTIAL_GOLD', 'SLASH');
    engine.playParryFoley();
    engine.playShieldBlockFoley();
    engine.playShieldBreakFoley();
    engine.playFootstep('STONE');
    engine.startMusic('BHAIRAV');
    engine.startAmbience('SANCTUM_DAWN');
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

    engine.setMuted(false);
  });
});
