import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CelestialVFX } from '../../src/render/CelestialVFX';
import { CinematicDirector, CinematicShot } from '../../src/cinematics/CinematicDirector';
import { Vector2D } from '../../src/physics/Vector2D';
import { Camera } from '../../src/render/Camera';
import { IRenderer } from '../../src/render/CanvasRenderer';
import { DialogueTree } from '../../src/narrative/DialogueTree';
import { AccessibilityManager } from '../../src/ui/accessibility/AccessibilityManager';

const createMockRenderer = (): IRenderer => {
  const camera = new Camera(1280, 720);
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  return {
    getContext: () => ctx,
    getViewport: () => ({ width: 1280, height: 720 }),
    getCamera: () => camera,
    clear: vi.fn(),
    render: vi.fn(),
  } as unknown as IRenderer;
};

describe('Stage 7: CelestialVFX Visual Effects Subsystem', () => {
  let vfx: CelestialVFX;
  let renderer: IRenderer;

  beforeEach(() => {
    vfx = CelestialVFX.getInstance();
    vfx.clear();
    renderer = createMockRenderer();
    AccessibilityManager.getInstance().updateSettings({
      reducedMotion: false,
      screenShakeFactor: 1.0,
    });
  });

  it('emits and updates Brahmastra shockwaves with radial expansion', () => {
    vfx.emitShockwave(new Vector2D(100, 200), 200, '#FFB703', '#00E5FF');
    expect(vfx.getActiveCount().shockwaves).toBe(1);

    vfx.update(0.1);
    expect(vfx.getActiveCount().shockwaves).toBe(1);

    vfx.render(renderer);

    vfx.update(1.0);
    expect(vfx.getActiveCount().shockwaves).toBe(0);
  });

  it('respects reduced motion settings for shockwaves, runes, debris, and distortion', () => {
    AccessibilityManager.getInstance().updateSettings({
      reducedMotion: true,
      screenShakeFactor: 0.0,
    });

    vfx.emitShockwave(new Vector2D(0, 0), 100);
    vfx.emitSanskritRunes(new Vector2D(0, 0), 8);
    vfx.emitMaterialDebris(new Vector2D(0, 0), new Vector2D(1, 0), 10);
    vfx.triggerRadialDistortion(new Vector2D(0, 0), 1.0);

    expect(vfx.getActiveCount().shockwaves).toBe(1);
    expect(vfx.getActiveCount().runes).toBeLessThanOrEqual(3);
    expect(vfx.getActiveCount().debris).toBeLessThanOrEqual(4);

    vfx.update(0.05);
    vfx.render(renderer);
  });

  it('emits weapon slash trails and renders quad strip arcs', () => {
    vfx.emitSlashTrail(new Vector2D(50, 50), 0, '#FFB703', '#FFD166');
    expect(vfx.getActiveCount().trails).toBe(1);

    vfx.update(0.05);
    vfx.render(renderer);

    vfx.update(0.3);
    expect(vfx.getActiveCount().trails).toBe(0);
  });

  it('emits material debris and handles gravitational fall', () => {
    vfx.emitMaterialDebris(new Vector2D(0, 0), new Vector2D(1, 0), 6, '#D97706');
    expect(vfx.getActiveCount().debris).toBe(6);

    vfx.update(0.1);
    vfx.render(renderer);

    vfx.update(1.0);
    expect(vfx.getActiveCount().debris).toBe(0);
  });

  it('triggers radial distortion pulses scaled by accessibility settings', () => {
    vfx.triggerRadialDistortion(new Vector2D(100, 100), 1.0);
    vfx.update(0.05);
    vfx.render(renderer);

    // Intensity <= 0.05 guard
    vfx.triggerRadialDistortion(new Vector2D(100, 100), 0.02);
  });

  it('clears all active visual effects completely', () => {
    vfx.emitShockwave(new Vector2D(0, 0));
    vfx.emitSanskritRunes(new Vector2D(0, 0));
    vfx.emitSlashTrail(new Vector2D(0, 0), 0);
    vfx.emitMaterialDebris(new Vector2D(0, 0), new Vector2D(0, 1));

    vfx.clear();
    const counts = vfx.getActiveCount();
    expect(counts.shockwaves).toBe(0);
    expect(counts.runes).toBe(0);
    expect(counts.trails).toBe(0);
    expect(counts.debris).toBe(0);
  });
});

describe('Stage 7: Advanced CinematicDirector Choreography', () => {
  let director: CinematicDirector;
  let camera: Camera;
  let renderer: IRenderer;
  let dialogueTree: DialogueTree;

  beforeEach(() => {
    camera = new Camera(1280, 720);
    dialogueTree = new DialogueTree();
    director = new CinematicDirector(camera, dialogueTree);
    renderer = createMockRenderer();
  });

  it('handles empty shot lists and redundant skip gracefully', () => {
    director.playSequence([]);
    expect(director.isPlaying()).toBe(false);

    director.skip();
    expect(director.isPlaying()).toBe(false);
  });

  it('executes smooth camera orbit and title card presentation', () => {
    const orbitCenter = new Vector2D(500, 500);
    const shots: CinematicShot[] = [
      {
        duration: 2.0,
        orbitCenter,
        orbitRadius: 100,
        orbitSpeed: 1.0,
        letterboxHeight: 64,
        titleCard: {
          title: 'DIVINE ORBIT',
          subtitle: 'The Sacred Temple Focus',
        },
      },
    ];

    director.playSequence(shots);
    expect(director.isPlaying()).toBe(true);

    director.update(0.5);
    director.render(renderer);

    expect(camera.target?.x).not.toBe(0);
  });

  it('supports dyslexia font option in title card rendering', () => {
    AccessibilityManager.getInstance().updateSettings({ dyslexiaFont: true });

    const shots: CinematicShot[] = [
      {
        duration: 2.0,
        titleCard: {
          title: 'DYSLEXIA TITLE',
        },
      },
    ];

    director.playSequence(shots);
    director.render(renderer);
    director.finishSequence();

    AccessibilityManager.getInstance().updateSettings({ dyslexiaFont: false });
  });

  it('interpolates dolly zoom smoothly over shot duration', () => {
    const shots: CinematicShot[] = [
      {
        duration: 2.0,
        dollyZoom: {
          startZoom: 1.0,
          endZoom: 1.8,
        },
      },
    ];

    director.playSequence(shots);
    director.update(1.0);
    expect(camera.zoom).toBeCloseTo(1.4, 1);
  });

  it('creates and executes Sanctum Awakening canonical sequence', () => {
    const onAwaken = vi.fn();
    const onComplete = vi.fn();

    const sequence = CinematicDirector.createSanctumAwakeningSequence(
      new Vector2D(0, -200),
      new Vector2D(0, 0),
      { onAwaken, onComplete }
    );

    expect(sequence.length).toBe(3);
    director.playSequence(sequence);
    director.skip();

    expect(director.isPlaying()).toBe(false);
  });

  it('creates and executes Mahishasura Awakening canonical sequence', () => {
    const onRoar = vi.fn();
    const onComplete = vi.fn();

    const sequence = CinematicDirector.createMahishasuraAwakeningSequence(
      new Vector2D(0, -1350),
      new Vector2D(0, 0),
      { onRoar, onComplete }
    );

    expect(sequence.length).toBe(3);
    director.playSequence(sequence);
    director.update(0.1);
    director.render(renderer);
    director.finishSequence();

    expect(director.isPlaying()).toBe(false);
  });
});
