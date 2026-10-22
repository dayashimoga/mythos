import { describe, it, expect, beforeEach } from 'vitest';
import { Engine } from '../../src/engine/Engine';
import { CanvasRenderer } from '../../src/render/CanvasRenderer';
import { SplashScene } from '../../src/scenes/SplashScene';
import { StoryScene } from '../../src/scenes/StoryScene';
import { GameScene } from '../../src/scenes/GameScene';
import { SettingsScene } from '../../src/scenes/SettingsScene';
import { InputManager } from '../../src/input/InputManager';
import { Player } from '../../src/entities/Player';
import { Altar } from '../../src/entities/Altar';
import { AstraShard } from '../../src/entities/AstraShard';
import { EnemySentinel } from '../../src/entities/EnemySentinel';
import { Projectile } from '../../src/entities/Projectile';
import { Vector2D } from '../../src/physics/Vector2D';

describe('Scene & Entity Rendering and Interaction Coverage', () => {
  let engine: Engine;
  let renderer: CanvasRenderer;
  let input: InputManager;

  beforeEach(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    engine = new Engine();
    engine.init(canvas);
    renderer = engine.getRenderer() as CanvasRenderer;
    input = engine.getInput();
  });

  describe('SplashScene', () => {
    it('updates, renders, and handles navigation input', () => {
      const splash = new SplashScene();
      splash.onEnter(engine);
      splash.update(0.1);
      expect(() => splash.render(renderer)).not.toThrow();

      // Input trigger
      input.triggerVirtualAction('DASH');
      splash.handleInput(input);
      expect(engine.getSceneManager().getCurrentScene()?.id).toBe('StoryScene');

      // Clear previous action and test settings transition
      input.postUpdate();
      input.triggerVirtualAction('PAUSE');
      splash.handleInput(input);
      expect(engine.getSceneManager().getCurrentScene()?.id).toBe('SettingsScene');
    });
  });

  describe('StoryScene', () => {
    it('updates, renders, and advances story dialogue', () => {
      const story = new StoryScene();
      story.onEnter(engine);
      story.update(0.5);
      expect(() => story.render(renderer)).not.toThrow();

      // Advance dialogue
      input.triggerVirtualAction('ATTACK');
      story.handleInput(input);
    });
  });

  describe('SettingsScene', () => {
    it('updates, renders, and toggles audio & data reset', () => {
      const settings = new SettingsScene();
      settings.onEnter(engine);
      settings.update(0.1);
      expect(() => settings.render(renderer)).not.toThrow();

      // Toggle sound
      input.triggerVirtualAction('TOGGLE_COLLIDERS');
      settings.handleInput(input);

      // Reset data
      input.triggerVirtualAction('INTERACT');
      settings.handleInput(input);

      // Return to title
      input.triggerVirtualAction('PAUSE');
      settings.handleInput(input);
      expect(engine.getSceneManager().getCurrentScene()?.id).toBe('SplashScene');
    });
  });

  describe('GameScene Render Passes & Overlays', () => {
    it('renders normal gameplay, pause modal, and victory overlay', () => {
      engine.start();
      engine.getSceneManager().switchTo('GameScene');
      const game = engine.getSceneManager().getCurrentScene() as GameScene;
      game.update(0.016);

      // Render normal world and HUD
      expect(() => game.render(renderer)).not.toThrow();

      // Trigger Dash & Shoot in input
      input.triggerVirtualAction('DASH');
      game.handleInput(input);
      input.postUpdate();
      input.triggerVirtualAction('ATTACK');
      game.handleInput(input);
      input.postUpdate();

      // Pause toggle
      input.triggerVirtualAction('PAUSE');
      game.handleInput(input);
      expect(() => game.render(renderer)).not.toThrow(); // Renders pause modal
      input.postUpdate();

      // Resume
      input.triggerVirtualAction('PAUSE');
      game.handleInput(input);
      input.postUpdate();

      // Victory overlay render
      game.player.shardsCollected = 3;
      game.handleAltarInteraction();
      game.update(0.5);
      expect(() => game.render(renderer)).not.toThrow(); // Renders victory overlay

      // Victory exit input (DASH advances to Stage 1 BhumiTempleScene)
      input.triggerVirtualAction('DASH');
      game.handleInput(input);
      expect(engine.getSceneManager().getCurrentScene()?.id).toBe('BhumiTempleScene');
    });
  });

  describe('Entity Visual Render Passes', () => {
    it('renders all entity states without exceptions', () => {
      const p = new Player('p', 0, 0);
      p.isDashing = true;
      expect(() => p.render(renderer)).not.toThrow();

      const altar = new Altar('altar', 0, 0);
      altar.depositShard();
      altar.depositShard();
      altar.depositShard(); // consecrated
      altar.update(0.5);
      expect(() => altar.render(renderer)).not.toThrow();

      const shard = new AstraShard('s', 0, 0);
      shard.update(0.5);
      expect(() => shard.render(renderer)).not.toThrow();

      const sentinel = new EnemySentinel('sen', 0, 0);
      sentinel.takeDamage(10); // hit flashing
      expect(() => sentinel.render(renderer)).not.toThrow();

      const proj = new Projectile('pr', 0, 0, new Vector2D(1, 0));
      expect(() => proj.render(renderer)).not.toThrow();
    });
  });
});
