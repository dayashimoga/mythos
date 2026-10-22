import { describe, it, expect, beforeEach } from 'vitest';
import { Engine } from '../../src/engine/Engine';
import { CanvasRenderer } from '../../src/render/CanvasRenderer';
import { BhumiTempleScene } from '../../src/scenes/BhumiTempleScene';
import { InputManager } from '../../src/input/InputManager';
import { Projectile } from '../../src/entities/Projectile';
import { Vector2D } from '../../src/physics/Vector2D';

describe('BhumiTempleScene Comprehensive Render & Branch Coverage', () => {
  let engine: Engine;
  let renderer: CanvasRenderer;
  let input: InputManager;
  let scene: BhumiTempleScene;

  beforeEach(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    engine = new Engine();
    engine.init(canvas);
    renderer = engine.getRenderer() as CanvasRenderer;
    input = engine.getInput();
    scene = new BhumiTempleScene();
    scene.onEnter(engine);
  });

  it('renders normal gameplay, active combat, and diagnostics pass', () => {
    // Normal render
    expect(() => scene.render(renderer)).not.toThrow();

    // Trigger melee slash to test renderMeleeArc
    scene.player.performMeleeSlash();
    expect(scene.player.isMeleeSlashing).toBe(true);
    expect(() => scene.render(renderer)).not.toThrow();

    // Spawn floating damage numbers
    scene.damageNumbers.spawn(100, 100, '-25 HP', '#FF4D4D', 1.0);
    expect(() => scene.render(renderer)).not.toThrow();

    // Trigger Rakshasa telegraph slam
    scene.rakshasa.isWindingUp = true;
    expect(() => scene.render(renderer)).not.toThrow();
  });

  it('renders pause modal and responds to pause toggle', () => {
    input.triggerVirtualAction('PAUSE');
    scene.handleInput(input);
    input.postUpdate();
    expect(scene.isPaused).toBe(true);

    // Render in paused state
    expect(() => scene.render(renderer)).not.toThrow();

    // Unpause
    input.triggerVirtualAction('PAUSE');
    scene.handleInput(input);
    input.postUpdate();
    expect(scene.isPaused).toBe(false);
  });

  it('renders defeat overlay and handles instant restart via RESTART / DASH', () => {
    scene.player.health = 0;
    scene.update(0.1);
    expect(scene.isGameOver).toBe(true);

    // Render game over screen
    expect(() => scene.render(renderer)).not.toThrow();

    // Press RESTART
    input.triggerVirtualAction('RESTART');
    scene.handleInput(input);
    input.postUpdate();
    expect(scene.isGameOver).toBe(false);
    expect(scene.player.health).toBe(100);
  });

  it('renders victory overlay with various rank outcomes (S, A, B)', () => {
    scene.isVictory = true;
    scene.gameTime = 40; // Under 90s -> Rank S
    scene.player.score = 5000;
    expect(() => scene.render(renderer)).not.toThrow();

    scene.gameTime = 110; // Under 150s -> Rank A
    expect(() => scene.render(renderer)).not.toThrow();

    scene.gameTime = 200; // >= 150s -> Rank B
    expect(() => scene.render(renderer)).not.toThrow();

    // Victory exit DASH navigates to SplashScene
    input.triggerVirtualAction('DASH');
    scene.handleInput(input);
    expect(engine.getSceneManager().getCurrentScene()?.id).toBe('SplashScene');
  });

  it('handles player movement, dash, and projectile firing', () => {
    // Movement
    input.setVirtualMovement(1, 0);
    scene.handleInput(input);
    input.postUpdate();

    // Dash
    input.triggerVirtualAction('DASH');
    scene.handleInput(input);
    input.postUpdate();
    expect(scene.player.isDashing).toBe(true);

    // Attack
    input.triggerVirtualAction('ATTACK');
    scene.handleInput(input);
    input.postUpdate();
    expect(scene.playerProjectiles.length).toBeGreaterThan(0);
  });

  it('simulates melee projectile deflection and scout damage in update loop', () => {
    // Spawn enemy projectile aimed at player
    const ep = new Projectile('enemy_proj_1', scene.player.position.x + 30, scene.player.position.y, new Vector2D(-100, 0), 10, 'enemy');
    scene.enemyProjectiles.push(ep);

    // Player slashes melee via input
    input.triggerVirtualAction('MELEE_ATTACK');
    scene.handleInput(input);
    input.postUpdate();

    // Expect projectile to be destroyed/deflected
    expect(ep.isActive).toBe(false);

    // Scout hit by player projectile
    const scout = scene.scouts[0];
    const pp = new Projectile('player_proj_hit', scout.position.x, scout.position.y, new Vector2D(0, 0), 25, 'player');
    scene.playerProjectiles.push(pp);
    scene.update(0.016);
    expect(scout.health).toBeLessThan(scout.maxHealth);

    // Kill scout
    scout.takeDamage(100);
    expect(scout.isActive).toBe(false);
    scene.update(0.016);
  });

  it('handles lava hazard damage and player damage numbers', () => {
    // Position player inside lava trench
    scene.player.position.set(0, 0); // Lava trench is [-400, -35, 800, 70]
    scene.player.isDashing = false;
    const initialHp = scene.player.health;
    scene.update(0.1);
    expect(scene.player.health).toBeLessThan(initialHp);
  });

  it('handles altar interaction edge cases and prompt rendering', () => {
    // Not enough shards
    scene.player.shardsCollected = 1;
    scene.handleAltarConsecration();
    expect(scene.isVictory).toBe(false);

    // 3 shards and spire destroyed
    scene.player.shardsCollected = 3;
    scene.spire.destroy();
    scene.handleAltarConsecration();
    expect(scene.isVictory).toBe(true);
  });

  it('handles melee strikes on Rakshasa and Pillars', () => {
    // Position player next to Rakshasa
    scene.player.position.set(scene.rakshasa.position.x + 30, scene.rakshasa.position.y);
    input.triggerVirtualAction('MELEE_ATTACK');
    scene.handleInput(input);
    input.postUpdate();
    expect(scene.rakshasa.health).toBeLessThan(scene.rakshasa.maxHealth);

    // Lethal melee strike on Rakshasa (after cooldown)
    scene.player.meleeCooldownTimer = 0;
    scene.player.energy = 100;
    scene.rakshasa.health = 10;
    input.triggerVirtualAction('MELEE_ATTACK');
    scene.handleInput(input);
    input.postUpdate();
    expect(scene.rakshasa.isActive).toBe(false);

    // Melee strike on Pillar
    scene.player.meleeCooldownTimer = 0;
    scene.player.energy = 100;
    const pillar = scene.pillars[0];
    scene.player.position.set(pillar.position.x + 20, pillar.position.y);
    input.triggerVirtualAction('MELEE_ATTACK');
    scene.handleInput(input);
    input.postUpdate();
    expect(pillar.state).toBe('attuned');
  });

  it('handles prop interactions for forge and font', () => {
    // Consecrate forge
    scene.player.position.set(scene.forge.position.x, scene.forge.position.y);
    input.triggerVirtualAction('INTERACT');
    scene.handleInput(input);
    input.postUpdate();
    expect(scene.forge.isConsecrated).toBe(true);

    // Drink from font
    scene.player.health = 50;
    scene.player.position.set(scene.font.position.x, scene.font.position.y);
    input.triggerVirtualAction('INTERACT');
    scene.handleInput(input);
    input.postUpdate();
    expect(scene.player.health).toBeGreaterThan(50);
  });
});
