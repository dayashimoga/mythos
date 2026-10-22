import { describe, it, expect } from 'vitest';
import { Engine } from '../../src/engine/Engine';
import { GameLoop } from '../../src/engine/GameLoop';
import { AudioEngine } from '../../src/audio/AudioEngine';
import { InputManager } from '../../src/input/InputManager';
import { DialogueBox } from '../../src/ui/DialogueBox';
import { CanvasRenderer } from '../../src/render/CanvasRenderer';
import { PlatformBridge } from '../../src/platform/PlatformBridge';

describe('Targeted Branch Coverage', () => {
  it('exercises AudioEngine branches with localStorage and muted states', () => {
    localStorage.setItem('mythos_audio_muted', 'true');
    const audio = new AudioEngine();
    expect(audio.isMuted()).toBe(true);

    // Play while muted
    audio.playDash();
    audio.playShoot();
    audio.playShardPickup();
    audio.playAltarResonate();
    audio.playVictoryFanfare();

    // Unmute
    audio.setMuted(false);
    expect(audio.isMuted()).toBe(false);
    audio.playDash();
    audio.playShoot();
    audio.playShardPickup();
    audio.playAltarResonate();
    audio.playVictoryFanfare();
  });

  it('exercises GameLoop fixed accumulator loop and pause states', () => {
    let updateCount = 0;
    let renderCount = 0;

    const loop = new GameLoop(
      () => {
        updateCount++;
      },
      () => {
        renderCount++;
      },
      60
    );

    loop.start();
    expect(loop.getIsRunning()).toBe(true);
    expect(loop.getIsPaused()).toBe(false);

    loop.pause();
    expect(loop.getIsPaused()).toBe(true);

    loop.resume();
    expect(loop.getIsPaused()).toBe(false);

    loop.stepManual(0.016);
    expect(updateCount).toBe(1);
    expect(renderCount).toBe(1);

    loop.stop();
    expect(loop.getIsRunning()).toBe(false);
  });

  it('exercises InputManager mouse buttons and diagonal movement', () => {
    const input = new InputManager();
    const target = document.createElement('div');
    input.attach(target);

    // Mouse down
    target.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
    expect(input.isActionHeld('ATTACK')).toBe(true);
    expect(input.isActionJustPressed('ATTACK')).toBe(true);

    // Diagonal movement
    target.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
    target.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
    const move = input.getMovementVector();
    expect(move.x).toBeGreaterThan(0);
    expect(move.y).toBeLessThan(0);
    expect(move.magnitude()).toBeCloseTo(1);

    // Virtual stick axis
    input.setVirtualMovement(0.5, 0.5);
    const virtualMove = input.getMovementVector();
    expect(virtualMove.magnitude()).toBeGreaterThan(0);

    // Mouse up
    target.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
    expect(input.isActionHeld('ATTACK')).toBe(false);

    input.clear();
    input.detach(target);
  });

  it('exercises DialogueBox text wrapping with multiple lines and words', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const renderer = new CanvasRenderer(canvas);

    const box = new DialogueBox();
    box.start([
      {
        speaker: 'Tara',
        speakerRole: 'Oracle',
        portraitColor: '#00E5FF',
        text: 'This is a long sentence intended to trigger the word wrapping logic inside the dialogue box rendering system when measured by canvas context.',
      },
    ]);

    box.update(5.0); // complete line
    expect(() => box.render(renderer)).not.toThrow();
  });

  it('exercises Engine update and render cycles with diagnostics toggle', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const engine = new Engine();
    engine.init(canvas);
    engine.start();

    // Toggle diagnostics hotkey
    engine.getInput().triggerVirtualAction('TOGGLE_DIAGNOSTICS');
    engine.getInput().triggerVirtualAction('TOGGLE_COLLIDERS');

    // Simulate 2 engine loop ticks
    (engine as any).update(0.016);
    (engine as any).render(1.0);

    expect(engine.getDiagnostics().getIsVisible()).toBe(true);
    expect(engine.getDiagnostics().getShowColliders()).toBe(true);

    engine.stop();
  });
});
