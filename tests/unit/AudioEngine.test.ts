import { describe, it, expect, beforeEach } from 'vitest';
import { AudioEngine } from '../../src/audio/AudioEngine';

describe('AudioEngine Procedural Synthesizer', () => {
  let audio: AudioEngine;

  beforeEach(() => {
    audio = new AudioEngine();
    audio.setMuted(false);
  });

  it('toggles mute status and persists state', () => {
    expect(audio.isMuted()).toBe(false);

    audio.setMuted(true);
    expect(audio.isMuted()).toBe(true);

    audio.setMuted(false);
    expect(audio.isMuted()).toBe(false);
  });

  it('triggers sound synthesis without exceptions when active', () => {
    expect(() => {
      audio.playDash();
      audio.playShoot();
      audio.playShardPickup();
      audio.playAltarResonate();
      audio.playVictoryFanfare();
      audio.playMeleeSlash();
      audio.playEnemyHit();
      audio.playShockwave();
      audio.playHeal();
      audio.playDefeat();
      audio.playPillarHarmonic();
      audio.playForgeUpgrade();
    }).not.toThrow();
  });

  it('skips synthesis when muted', () => {
    audio.setMuted(true);
    const initialVoices = audio.getActiveVoices();
    audio.playDash();
    expect(audio.getActiveVoices()).toBe(initialVoices);
  });
});
