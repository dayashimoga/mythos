import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Vector2D } from '../../src/physics/Vector2D';
import { AudioBuses } from '../../src/audio/AudioBuses';
import { RagaMusicGenerator } from '../../src/audio/RagaMusicGenerator';
import { AmbientSoundscape } from '../../src/audio/AmbientSoundscape';
import { AudioEngine } from '../../src/audio/AudioEngine';
import { CinematicDirector } from '../../src/cinematics/CinematicDirector';
import { CelestialVFX } from '../../src/render/CelestialVFX';
import { AccessibilityManager } from '../../src/ui/accessibility/AccessibilityManager';

describe('Stage 8 — Cinematic, Audio & Visual Experience Polish', () => {
  let mockCtx: any;

  beforeEach(() => {
    // Mock WebAudio AudioContext graph
    const createGainMock = () => {
      const g = {
        gain: {
          value: 1.0,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      return g;
    };

    const createOscMock = () => {
      const osc = {
        type: 'sine',
        frequency: {
          value: 440,
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null as any,
      };
      return osc;
    };

    const createFilterMock = () => {
      const f = {
        type: 'lowpass',
        frequency: {
          value: 1000,
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      return f;
    };

    const createCompressorMock = () => {
      const c = {
        threshold: { setValueAtTime: vi.fn() },
        knee: { setValueAtTime: vi.fn() },
        ratio: { setValueAtTime: vi.fn() },
        attack: { setValueAtTime: vi.fn() },
        release: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      return c;
    };

    const createPannerMock = () => {
      const p = {
        pan: {
          value: 0,
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      return p;
    };

    mockCtx = {
      state: 'running',
      currentTime: 10.0,
      destination: {},
      createGain: vi.fn(createGainMock),
      createOscillator: vi.fn(createOscMock),
      createBiquadFilter: vi.fn(createFilterMock),
      createDynamicsCompressor: vi.fn(createCompressorMock),
      createStereoPanner: vi.fn(createPannerMock),
      resume: vi.fn().mockResolvedValue(undefined),
    };

    // Reset Accessibility settings
    AccessibilityManager.getInstance().updateSettings({ reducedMotion: false });
  });

  describe('8.1 & 8.3 — Audio Buses, Master Limiter & Spatial Mixing', () => {
    it('initializes master bus with DynamicsCompressor limiter and sub-buses', () => {
      const buses = new AudioBuses(mockCtx);

      expect(mockCtx.createDynamicsCompressor).toHaveBeenCalled();
      const masterGain = buses.getBusGain('master');
      const musicGain = buses.getBusGain('music');
      const sfxGain = buses.getBusGain('sfx');
      const ambienceGain = buses.getBusGain('ambience');

      expect(masterGain).toBeDefined();
      expect(musicGain).toBeDefined();
      expect(sfxGain).toBeDefined();
      expect(ambienceGain).toBeDefined();
    });

    it('modulates bus volumes and handles ducking without clipping', () => {
      const buses = new AudioBuses(mockCtx);
      buses.setBusVolume('sfx', 0.8);
      expect(buses.getBusVolume('sfx')).toBe(0.8);

      buses.duckBus('music', 0.2, 0.5);
      expect(mockCtx.createGain).toHaveBeenCalled();

      buses.restoreBus('music', 0.5);
      expect(buses.getBusGain('music')).toBeDefined();
    });
  });

  describe('8.2 — Procedural Raga Crossfading & Ambient Soundscapes', () => {
    it('initializes Raga generator and supports seamless crossfading between ragas', () => {
      const ragaGen = new RagaMusicGenerator(mockCtx);
      ragaGen.setRaga('BHAIRAV');
      ragaGen.start();
      expect(ragaGen.isPlaying()).toBe(true);

      // Smooth crossfade to Darbari
      ragaGen.fadeToRaga('DARBARI', 0.4, 2.0);
      ragaGen.update(1.0);
      expect(ragaGen.isPlaying()).toBe(true);

      // Advance past transition duration
      ragaGen.update(1.5);
      expect(ragaGen.getCurrentRaga()).toBe('DARBARI');
      ragaGen.stop();
      expect(ragaGen.isPlaying()).toBe(false);
    });

    it('crossfades ambient soundscape presets across realm boundaries', () => {
      const ambience = new AmbientSoundscape(mockCtx);
      ambience.start('SANCTUM_DAWN');
      expect(ambience.isPlaying()).toBe(true);

      ambience.crossfadeEnvironment('DANDAKA_GROVE', 1.5);
      ambience.update(0.75);
      expect(ambience.isPlaying()).toBe(true);

      ambience.update(1.0);
      expect(ambience.getCurrentPreset()).toBe('DANDAKA_GROVE');
      ambience.stop();
      expect(ambience.isPlaying()).toBe(false);
    });
  });

  describe('8.3 — Spatial Audio Emitters & War Conch Fanfare', () => {
    it('creates spatialized SFX and foley pipelines for 3D positional audio', () => {
      const engine = new AudioEngine();
      (engine as any).ctx = mockCtx;
      (engine as any).spatial = {
        setListener: vi.fn(),
        createSpatialPipeline: vi.fn().mockReturnValue({
          inputNode: mockCtx.createGain(),
          disconnect: vi.fn(),
        }),
      };

      // Spatial altar hum
      engine.playSpatialSfx('ALTAR_HUM', new Vector2D(120, 250));
      expect((engine as any).spatial.createSpatialPipeline).toHaveBeenCalled();

      // Spatial foley strikes
      engine.playSpatialFoley('CELESTIAL_GOLD', 'SLASH', new Vector2D(50, 50));
      engine.playSpatialFoley('BRONZE', 'PARRY', new Vector2D(-100, 80));
      expect(mockCtx.createOscillator).toHaveBeenCalled();
    });

    it('synthesizes multi-harmonic Shankha war conch fanfare with ducking', () => {
      const engine = new AudioEngine();
      (engine as any).ctx = mockCtx;

      expect(() => engine.playShankhaFanfare()).not.toThrow();
      expect(mockCtx.createOscillator).toHaveBeenCalled();
    });
  });

  describe('8.4 — Cinematic Director Camera, Fades & Canonical Sequences', () => {
    it('executes cinematic screen shakes, fades, and title cards', () => {
      const director = new CinematicDirector();
      const mockCamera = {
        triggerShake: vi.fn(),
        setTarget: vi.fn(),
        setPosition: vi.fn(),
        reset: vi.fn(),
      };
      director.setCamera(mockCamera as any);

      director.playSequence([
        {
          duration: 2.0,
          cameraTarget: new Vector2D(200, 100),
          screenShake: { intensity: 10, duration: 0.8 },
          fade: { startAlpha: 1.0, endAlpha: 0.0, color: '#000000' },
          titleCard: { title: 'AWAKENING', subtitle: 'The Light Returns' },
        },
      ]);

      expect(director.isPlaying()).toBe(true);
      expect(mockCamera.triggerShake).toHaveBeenCalledWith(10, 0.8);

      director.update(1.0);
      expect(director.getFadeAlpha()).toBeCloseTo(0.5, 1);
      expect(director.getTitleCard()?.title).toBe('AWAKENING');

      director.update(1.5);
      expect(director.isPlaying()).toBe(false);
      expect(director.getFadeAlpha()).toBe(0.0);
    });

    it('constructs all 5 canonical narrative sequences with reactive callbacks', () => {
      const sanctumSeq = CinematicDirector.createSanctumAwakeningSequence(new Vector2D(0, -100), new Vector2D(0, 0));
      expect(sanctumSeq.length).toBe(3);
      expect(sanctumSeq[0].titleCard?.title).toBe('SANCTUM OF ASTRA');
      expect(sanctumSeq[0].titleCard?.subtitle).toContain('Awakening');

      const toranaSeq = CinematicDirector.createToranaUnsealingSequence(new Vector2D(0, -320), new Vector2D(0, -200));
      expect(toranaSeq.length).toBe(3);

      let roarTriggered = false;
      const sthulaSeq = CinematicDirector.createSthulaStandoffSequence(
        new Vector2D(0, -680),
        new Vector2D(0, -600),
        { onRoar: () => { roarTriggered = true; } }
      );
      expect(sthulaSeq.length).toBe(2);
      sthulaSeq[0].onShotStart?.();
      expect(roarTriggered).toBe(true);

      let bossRoarTriggered = false;
      const mahishaSeq = CinematicDirector.createMahishasuraAwakeningSequence(
        new Vector2D(0, -1350),
        new Vector2D(0, -1200),
        { onRoar: () => { bossRoarTriggered = true; } }
      );
      expect(mahishaSeq.length).toBe(3);
      mahishaSeq[0].onShotStart?.();
      expect(bossRoarTriggered).toBe(true);

      let sunriseTriggered = false;
      const dawnSeq = CinematicDirector.createDawnRestorationSequence(
        new Vector2D(0, 0),
        { onSunrise: () => { sunriseTriggered = true; } }
      );
      expect(dawnSeq.length).toBe(3);
      dawnSeq[0].onShotStart?.();
      expect(sunriseTriggered).toBe(true);
    });
  });

  describe('8.5 — Premium Elemental VFX & Accessibility Motion Scaling', () => {
    it('emits Surya solar flares, Consecration light pillars, and Agni embers', () => {
      const vfx = CelestialVFX.getInstance();
      vfx.clear();

      vfx.emitSuryaSolarFlare(new Vector2D(0, 0), 12);
      vfx.emitConsecrationLightPillar(new Vector2D(0, 0), 600, 3.0);
      vfx.emitAgniEmbers(new Vector2D(0, 0), 10);
      vfx.emitFlamingChakramTrail(new Vector2D(50, 50), Math.PI / 4);

      // Update particle lifespans
      vfx.update(0.16);

      const mockRenderer = {
        getContext: () => ({
          save: vi.fn(),
          restore: vi.fn(),
          beginPath: vi.fn(),
          closePath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn(),
          stroke: vi.fn(),
          fillRect: vi.fn(),
          strokeRect: vi.fn(),
          createLinearGradient: vi.fn().mockReturnValue({
            addColorStop: vi.fn(),
          }),
          createRadialGradient: vi.fn().mockReturnValue({
            addColorStop: vi.fn(),
          }),
        }),
      };

      expect(() => vfx.render(mockRenderer as any)).not.toThrow();
    });

    it('emits Prana gale vortices, Tamas void tendrils, and atmospheric scintillation', () => {
      const vfx = CelestialVFX.getInstance();
      vfx.clear();

      vfx.emitPranaWindVortex(new Vector2D(100, 100), 50);
      vfx.emitPranaShieldSpark(new Vector2D(100, 100), new Vector2D(1, 0));
      vfx.emitTamasTendrils(new Vector2D(-50, -50), 8);
      vfx.emitVoidMiasmaCloud(new Vector2D(-50, -50), 30);
      vfx.emitAtmosphericScintillation({ x: -200, y: -200, width: 400, height: 400 }, 8, 'TEMPLE_DUST');

      expect(() => vfx.update(0.2)).not.toThrow();
    });

    it('respects reduced-motion accessibility preference by clamping particle counts', () => {
      const vfx = CelestialVFX.getInstance();
      vfx.clear();

      // Normal mode
      AccessibilityManager.getInstance().updateSettings({ reducedMotion: false });
      vfx.emitAgniEmbers(new Vector2D(0, 0), 20);
      const normalCount = (vfx as any).elementalParticles.length;

      vfx.clear();
      // Reduced motion mode
      AccessibilityManager.getInstance().updateSettings({ reducedMotion: true });
      vfx.emitAgniEmbers(new Vector2D(0, 0), 20);
      const reducedCount = (vfx as any).elementalParticles.length;

      expect(reducedCount).toBeLessThan(normalCount);
    });
  });
});
