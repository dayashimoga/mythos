import { describe, it, expect, beforeEach } from 'vitest';
import { Camera } from '../../src/render/Camera';
import { CanvasRenderer } from '../../src/render/CanvasRenderer';
import { Engine } from '../../src/engine/Engine';
import { InputManager } from '../../src/input/InputManager';
import { SceneManager } from '../../src/scenes/SceneManager';
import { CharacterShowcaseScene } from '../../src/scenes/CharacterShowcaseScene';
import { BhumiTempleScene } from '../../src/scenes/BhumiTempleScene';
import { GameScene } from '../../src/scenes/GameScene';
import { IScene } from '../../src/scenes/SceneManager';

describe('Stage 0 Critical Runtime Repair & Branch Coverage', () => {
  let engine: Engine;
  let canvas: HTMLCanvasElement;
  let renderer: CanvasRenderer;
  let input: InputManager;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    // Mock getBoundingClientRect
    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 1280,
      bottom: 720,
      width: 1280,
      height: 720,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    engine = new Engine();
    engine.init(canvas);
    renderer = engine.getRenderer() as CanvasRenderer;
    input = engine.getInput();
  });

  describe('Camera viewport & bounds utilities', () => {
    it('resets camera position and zoom', () => {
      const cam = new Camera(1280, 720);
      cam.position.set(500, 300);
      cam.zoom = 2.5;
      cam.reset(100, 200, 1.2);
      expect(cam.position.x).toBe(100);
      expect(cam.position.y).toBe(200);
      expect(cam.zoom).toBe(1.2);
      expect(cam.target).toBeNull();

      cam.reset();
      expect(cam.position.x).toBe(0);
      expect(cam.position.y).toBe(0);
      expect(cam.zoom).toBe(1.0);
    });

    it('sets viewport and fits to bounding box', () => {
      const cam = new Camera(1280, 720);
      cam.setViewport(1920, 1080);
      expect(cam.viewportWidth).toBe(1920);
      expect(cam.viewportHeight).toBe(1080);

      cam.fitToBounds(-500, -300, 500, 300, 50);
      expect(cam.position.x).toBe(0);
      expect(cam.position.y).toBe(0);
      expect(cam.zoom).toBeGreaterThan(0);
      expect(cam.zoom).toBeLessThanOrEqual(2.5);
    });
  });

  describe('CanvasRenderer resize and context clearing', () => {
    it('resizes canvas buffer and handles clear gracefully', () => {
      renderer.resize(1920, 1080);
      expect(canvas.width).toBe(1920);
      expect(canvas.height).toBe(1080);

      expect(() => renderer.clear('#05070D')).not.toThrow();
    });
  });

  describe('InputManager canvas mapping and scaling', () => {
    it('scales client coordinates through bounding rect', () => {
      input.setCanvas(canvas);
      // Dispatch mousemove on window (where input listeners are attached)
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 640, clientY: 360 }));
      const mousePos = input.getMousePosition();
      expect(mousePos.x).toBe(640);
      expect(mousePos.y).toBe(360);
    });
  });

  describe('SceneManager navigation stack & lifecycle', () => {
    class DummyScene implements IScene {
      public id = 'DummyScene';
      public entered = false;
      public exited = false;
      public suspended = false;
      public resumed = false;
      public disposed = false;

      onEnter() { this.entered = true; }
      onExit() { this.exited = true; }
      onSuspend() { this.suspended = true; }
      onResume() { this.resumed = true; }
      onDispose() { this.disposed = true; }
      update() {}
      render() {}
      handleInput() {}
    }

    class SimpleScene implements IScene {
      public id = 'SimpleScene';
      onEnter() {}
      onExit() {}
      update() {}
      render() {}
      handleInput() {}
    }

    it('manages pushScene, popScene, navigateBack, and previousScene history', () => {
      const sm = new SceneManager(engine);
      const dummy = new DummyScene();
      const simple = new SimpleScene();

      sm.register(dummy);
      sm.register(simple);

      sm.pushScene('DummyScene');
      expect(sm.getCurrentScene()?.id).toBe('DummyScene');
      expect(dummy.entered).toBe(true);

      sm.pushScene('SimpleScene');
      expect(dummy.suspended).toBe(true);
      expect(sm.getCurrentScene()?.id).toBe('SimpleScene');
      expect(sm.getPreviousScene()?.id).toBe('DummyScene');

      const popped = sm.popScene();
      expect(popped).toBe(true);
      expect(dummy.resumed).toBe(true);
      expect(sm.getCurrentScene()?.id).toBe('DummyScene');

      // Pop last scene
      expect(sm.popScene()).toBe(false);

      // Navigate back with history
      sm.switchTo('SimpleScene');
      sm.pushScene('DummyScene');
      expect(sm.navigateBack()).toBe(true);
      expect(sm.getCurrentScene()?.id).toBe('SimpleScene');

      // Clear history and assert navigateBack returns false
      sm.clearHistory();
      expect(sm.navigateBack()).toBe(false);

      // Dispose
      sm.dispose();
      expect(dummy.disposed).toBe(true);
    });
  });

  describe('CharacterShowcaseScene controls & diagnostic bone rendering', () => {
    it('handles all character switching, combat triggers, time scale, and bones toggle', () => {
      engine.start();
      const sm = engine.getSceneManager();
      sm.switchTo('CharacterShowcaseScene');
      const showcase = sm.getCurrentScene() as CharacterShowcaseScene;
      showcase.update(0.016);

      const tapKey = (code: string, key?: string) => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code, key: key || code }));
        showcase.handleInput(input);
        input.postUpdate();
        window.dispatchEvent(new KeyboardEvent('keyup', { code, key: key || code }));
      };

      // Test hotkey switches 1-4
      tapKey('Digit2', '2');
      tapKey('Digit3', '3');
      tapKey('Digit4', '4');
      tapKey('Digit1', '1');

      // Test actions: B (bones), I (IK), P (pause), -, =, G, M, H, K, Space
      tapKey('KeyB', 'b');
      tapKey('KeyI', 'i');
      tapKey('KeyP', 'p');
      tapKey('Minus', '-');
      tapKey('Equal', '=');
      tapKey('KeyG', 'g');
      tapKey('KeyM', 'm');
      tapKey('KeyH', 'h');
      tapKey('KeyK', 'k');
      tapKey('Space', ' ');

      // Render with bones/debug enabled
      expect(() => showcase.render(renderer)).not.toThrow();

      // Escape navigation to title
      tapKey('Escape', 'Escape');
      expect(engine.getSceneManager().getCurrentScene()?.id).toBe('SplashScene');

      showcase.onExit();
    });
  });

  describe('BhumiTempleScene pause modal & game over handling', () => {
    it('toggles pause, renders pause modal, handles resume/restart/quit', () => {
      engine.start();
      const sm = engine.getSceneManager();
      sm.switchTo('BhumiTempleScene');
      const bhumi = sm.getCurrentScene() as BhumiTempleScene;
      bhumi.update(0.016);

      const tapKey = (code: string, key?: string) => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code, key: key || code }));
        bhumi.handleInput(input);
        input.postUpdate();
        window.dispatchEvent(new KeyboardEvent('keyup', { code, key: key || code }));
      };

      const tapMouse = (x: number, y: number) => {
        window.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: x, clientY: y }));
        bhumi.handleInput(input);
        input.postUpdate();
        window.dispatchEvent(new MouseEvent('mouseup', { button: 0, clientX: x, clientY: y }));
      };

      // Pause via Escape
      tapKey('Escape', 'Escape');
      expect(() => bhumi.render(renderer)).not.toThrow();

      // Resume via P
      tapKey('KeyP', 'p');

      // Re-pause and toggle mute via M
      tapKey('Escape', 'Escape');
      tapKey('KeyM', 'm');

      // Restart via R
      tapKey('KeyR', 'r');

      // Pause and quit via Q
      tapKey('Escape', 'Escape');
      tapKey('KeyQ', 'q');
      expect(engine.getSceneManager().getCurrentScene()?.id).toBe('SplashScene');

      // Test click on pause buttons
      sm.switchTo('BhumiTempleScene');
      tapKey('Escape', 'Escape');

      // Click Resume (y: 280)
      tapMouse(640, 290);

      // Re-pause and click Restart (y: 350)
      tapKey('Escape', 'Escape');
      tapMouse(640, 360);

      // Re-pause and click Audio (y: 420)
      tapKey('Escape', 'Escape');
      tapMouse(640, 430);

      // Click Quit (y: 490)
      tapMouse(640, 500);
      expect(engine.getSceneManager().getCurrentScene()?.id).toBe('SplashScene');

      // Game over handling
      sm.switchTo('BhumiTempleScene');
      (bhumi as any).isGameOver = true;
      expect(() => bhumi.render(renderer)).not.toThrow();

      // Click retry
      tapMouse(640, 420);
      expect((bhumi as any).isGameOver).toBe(false);

      // Game over quit with Q
      (bhumi as any).isGameOver = true;
      tapKey('KeyQ', 'q');
      expect(engine.getSceneManager().getCurrentScene()?.id).toBe('SplashScene');

      bhumi.onExit();
    });
  });

  describe('GameScene pause modal and victory inputs', () => {
    it('handles pause hotkeys R, M, Q and click options', () => {
      engine.start();
      engine.getSceneManager().switchTo('GameScene');
      const game = engine.getSceneManager().getCurrentScene() as GameScene;

      const tapKey = (code: string, key?: string) => {
        window.dispatchEvent(new KeyboardEvent('keydown', { code, key: key || code }));
        game.handleInput(input);
        input.postUpdate();
        window.dispatchEvent(new KeyboardEvent('keyup', { code, key: key || code }));
      };

      const tapMouse = (x: number, y: number) => {
        window.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: x, clientY: y }));
        game.handleInput(input);
        input.postUpdate();
        window.dispatchEvent(new MouseEvent('mouseup', { button: 0, clientX: x, clientY: y }));
      };

      // Pause via PAUSE virtual action
      input.triggerVirtualAction('PAUSE');
      game.handleInput(input);
      input.postUpdate();
      expect((game as any).isPaused).toBe(true);

      // Press M to mute
      tapKey('KeyM', 'm');

      // Press R to restart
      tapKey('KeyR', 'r');

      // Pause again and click resume (y: 340)
      input.triggerVirtualAction('PAUSE');
      game.handleInput(input);
      input.postUpdate();
      tapMouse(640, 340);
      expect((game as any).isPaused).toBe(false);

      // Pause and click sound toggle (y: 410)
      input.triggerVirtualAction('PAUSE');
      game.handleInput(input);
      input.postUpdate();
      tapMouse(640, 410);

      // Pause and quit via Q
      tapKey('KeyQ', 'q');
      expect(engine.getSceneManager().getCurrentScene()?.id).toBe('SplashScene');

      // Re-enter and test click Quit (y: 445)
      engine.getSceneManager().switchTo('GameScene');
      input.triggerVirtualAction('PAUSE');
      game.handleInput(input);
      input.postUpdate();
      tapMouse(640, 445);
      expect(engine.getSceneManager().getCurrentScene()?.id).toBe('SplashScene');
    });
  });
});
