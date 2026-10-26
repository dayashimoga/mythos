import { describe, it, expect } from 'vitest';
import { Engine } from '../../src/engine/Engine';
import { GameLoop } from '../../src/engine/GameLoop';
import { AudioEngine } from '../../src/audio/AudioEngine';
import { InputManager } from '../../src/input/InputManager';
import { DialogueBox } from '../../src/ui/DialogueBox';
import { CanvasRenderer } from '../../src/render/CanvasRenderer';
import { CollisionSystem } from '../../src/physics/CollisionSystem';
import { AABB } from '../../src/physics/AABB';
import { DialogueTree } from '../../src/narrative/DialogueTree';
import { SaveGameManager } from '../../src/state/SaveGameManager';
import { StorageAdapter } from '../../src/state/StorageAdapter';
import { SceneManager } from '../../src/scenes/SceneManager';

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

  it('exercises CollisionSystem resolution branches (static vs dynamic, dynamic vs dynamic)', () => {
    const cs = new CollisionSystem();

    const staticCol = { id: 's1', bounds: new AABB(0, 0, 10, 10), isStatic: true, isTrigger: false };
    const dynCol1 = { id: 'd1', bounds: new AABB(5, 5, 10, 10), isStatic: false, isTrigger: false };
    const dynCol2 = { id: 'd2', bounds: new AABB(6, 6, 10, 10), isStatic: false, isTrigger: false };

    // Static A vs Dynamic B
    (cs as any).resolveSolidCollision(staticCol, dynCol1);
    expect(dynCol1.bounds.x).toBeDefined();

    // Dynamic A vs Dynamic B
    (cs as any).resolveSolidCollision(dynCol1, dynCol2);
    expect(dynCol1.bounds.x).toBeDefined();
    expect(dynCol2.bounds.x).toBeDefined();
    expect(cs.getCheckCount()).toBeDefined();
  });

  it('exercises InputManager extended queries and mouse action release', () => {
    const input = new InputManager();
    const div = document.createElement('div');
    const canvas = document.createElement('canvas');
    input.attach(div);
    input.setCanvas(canvas);
    expect(input.getCanvas()).toBe(canvas);

    // Mouse button releases
    div.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
    div.dispatchEvent(new MouseEvent('mouseup', { button: 0 }));
    expect(input.isActionJustReleased('ATTACK')).toBe(true);
    expect(input.isMouseButtonJustReleased(0)).toBe(true);

    div.dispatchEvent(new MouseEvent('mousedown', { button: 2 }));
    div.dispatchEvent(new MouseEvent('mouseup', { button: 2 }));
    expect(input.isActionJustReleased('MELEE')).toBe(true);
    expect(input.isMouseButtonJustReleased(2)).toBe(true);

    div.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
    expect(input.isKeyHeld('KeyE')).toBe(true);
    expect(input.isKeyJustPressed('KeyE')).toBe(true);

    div.dispatchEvent(new MouseEvent('mousedown', { button: 1 }));
    expect(input.isMouseButtonHeld(1)).toBe(true);
    expect(input.isMouseButtonJustPressed(1)).toBe(true);

    input.detach(div);
  });

  it('exercises DialogueTree branching, choices, and rendering branches', () => {
    const dt = new DialogueTree();

    expect(dt.start('nonexistent')).toBe(false);

    dt.registerNodes([
      {
        id: 'node1',
        speaker: 'Veer',
        speakerRole: 'Solar Guardian',
        portraitColor: '#FF9933',
        text: 'First line of dialogue that will be typed character by character across multiple words to test line wrap.',
        voiceCue: 'guardian_firm',
        choices: [
          { id: 'c1', text: 'Choice A', targetNodeId: 'node2' },
          { id: 'c2', text: 'Choice B', targetNodeId: 'node3' },
        ],
      },
      {
        id: 'node2',
        speaker: 'Tara',
        speakerRole: 'Devi',
        portraitColor: '#00FFFF',
        text: 'Second line.',
      },
    ]);

    let voiceCuePlayed = '';
    dt.onPlayVoiceCue = (cue?: string) => { voiceCuePlayed = cue || ''; };
    expect(dt.start('node1')).toBe(true);
    expect(voiceCuePlayed).toBe('guardian_firm');

    // Advance while typing (completes line)
    expect(dt.advance()).toBe(true);
    expect(dt.getIsAwaitingChoice()).toBe(true);

    // Mock Canvas and Renderer
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d')!;
    const mockRenderer = {
      getContext: () => ctx,
      getWidth: () => 1280,
      getHeight: () => 720,
      getViewport: () => ({ x: 0, y: 0, width: 1280, height: 720 }),
    };

    expect(() => dt.render(mockRenderer as any)).not.toThrow();

    // Select choices
    expect(dt.selectChoice(-1)).toBe(false);
    expect(dt.selectChoice(5)).toBe(false);
    expect(dt.selectChoice(0)).toBe(true);

    // Advance past end
    dt.advance(); // finish node 2
    expect(dt.advance()).toBe(false); // end of dialogue
  });

  it('exercises SaveGameManager checksum mismatch and parse error handling', () => {
    const storage = StorageAdapter.getStorage();

    // Checksum mismatch
    storage.setItem('mythos_save_data_v1', JSON.stringify({
      version: '1.0.0',
      timestamp: Date.now(),
      highScore: 100,
      checksum: 'bad_checksum',
    }));
    const loadedBad = SaveGameManager.load();
    expect(loadedBad.highScore).toBe(0);

    // Corrupted non-JSON
    storage.setItem('mythos_save_data_v1', '{corrupt json...');
    const loadedCorrupt = SaveGameManager.load();
    expect(loadedCorrupt.highScore).toBe(0);

    // Save with failing storage
    StorageAdapter.setCustomStorage({
      getItem: () => null,
      setItem: () => { throw new Error('Storage write failed'); },
      removeItem: () => {},
      clear: () => {},
    });
    expect(SaveGameManager.save({ highScore: 999 } as any)).toBe(false);
    StorageAdapter.setCustomStorage(null as any);

    SaveGameManager.reset();
  });

  it('exercises SceneManager history, fallback navigation, and dispose lifecycle', () => {
    const engine = new Engine();
    const sm = new SceneManager(engine);

    expect(sm.getPreviousScene()).toBeNull();
    expect(sm.navigateBack()).toBe(false);

    let disposedA = false;
    let disposedB = false;
    const sceneA = {
      id: 'A',
      onEnter: () => {},
      onExit: () => {},
      update: () => {},
      render: () => {},
      handleInput: () => {},
      onPause: () => {},
      onResume: () => { throw new Error('Resume error'); },
      onDispose: () => { disposedA = true; },
    };
    const sceneB = {
      id: 'B',
      onEnter: () => {},
      onExit: () => {},
      update: () => {},
      render: () => { throw new Error('Render error'); },
      handleInput: () => {},
      onPause: () => {},
      onResume: () => {},
      onDispose: () => { disposedB = true; },
    };

    sm.register(sceneA as any);
    sm.register(sceneB as any);

    sm.switchTo('A', true);
    sm.switchTo('B', true);
    expect(sm.getPreviousScene()?.id).toBe('A');

    // Render with error catch
    const mockRenderer = {
      getContext: () => ({
        setTransform: () => {},
        globalAlpha: 1.0,
        globalCompositeOperation: 'source-over',
      }),
    };
    expect(() => sm.render(mockRenderer as any)).not.toThrow();

    // Navigate back to A (triggers onResume error catch)
    expect(sm.navigateBack()).toBe(true);

    // Fallback navigation when stack is empty
    sm.clearHistory();
    expect(sm.navigateBack('B')).toBe(true);
    expect(sm.getCurrentScene()?.id).toBe('B');

    // Dispose
    sm.dispose();
    expect(disposedA).toBe(true);
    expect(disposedB).toBe(true);
    expect(sm.getCurrentScene()).toBeNull();
  });
});
