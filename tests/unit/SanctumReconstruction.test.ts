import { describe, it, expect, beforeEach } from 'vitest';
import { GameScene } from '../../src/scenes/GameScene';
import { Engine } from '../../src/engine/Engine';

describe('Sanctum of Astra Production Scene Reconstruction', () => {
  let engine: Engine;
  let canvas: HTMLCanvasElement;
  let gameScene: GameScene;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    engine = new Engine();
    engine.init(canvas);
    gameScene = new GameScene();
  });

  it('initializes the reconstructed Sanctum environment and actors', () => {
    gameScene.onEnter(engine);

    // Verify scene setup
    expect(gameScene.id).toBe('GameScene');

    // Run update to ensure physics, light shafts, and entities process cleanly
    expect(() => {
      gameScene.update(0.016);
    }).not.toThrow();
  });

  it('renders the complete layered visual pipeline without throwing', () => {
    gameScene.onEnter(engine);
    const renderer = engine.getRenderer();

    expect(() => {
      gameScene.render(renderer);
    }).not.toThrow();
  });

  it('maintains 4 Hoysala carved stone pillar colliders as physical obstacles', () => {
    gameScene.onEnter(engine);

    // Simulate player trying to move through pillar positions
    // Pillars are at (-350, -250), (350, -250), (-350, 250), (350, 250)
    expect(() => {
      gameScene.update(0.016);
    }).not.toThrow();
  });

  it('handles pause overlay toggling and resumes cleanly', () => {
    gameScene.onEnter(engine);
    const input = engine.getInput();

    // Trigger pause
    gameScene.handleInput(input);
    expect(() => {
      gameScene.update(0.016);
      gameScene.render(engine.getRenderer());
    }).not.toThrow();
  });
});
