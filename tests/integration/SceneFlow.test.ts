import { describe, it, expect, beforeEach } from 'vitest';
import { Engine } from '../../src/engine/Engine';

describe('Scene Lifecycle & Navigation Flow', () => {
  let engine: Engine;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    engine = new Engine();
    engine.init(canvas);
  });

  it('boots into SplashScene upon engine start', () => {
    engine.start();
    const current = engine.getSceneManager().getCurrentScene();
    expect(current).not.toBeNull();
    expect(current!.id).toBe('SplashScene');
  });

  it('transitions between SplashScene, StoryScene, GameScene, and SettingsScene', () => {
    engine.start();

    engine.getSceneManager().switchTo('StoryScene');
    expect(engine.getSceneManager().getCurrentScene()!.id).toBe('StoryScene');

    engine.getSceneManager().switchTo('GameScene');
    expect(engine.getSceneManager().getCurrentScene()!.id).toBe('GameScene');

    engine.getSceneManager().switchTo('SettingsScene');
    expect(engine.getSceneManager().getCurrentScene()!.id).toBe('SettingsScene');
  });

  it('handles pause and resume without runtime errors', () => {
    engine.start();
    expect(() => {
      engine.pause();
      engine.resume();
      engine.stop();
    }).not.toThrow();
  });
});
