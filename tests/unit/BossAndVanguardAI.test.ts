import { describe, it, expect, beforeEach } from 'vitest';
import { AsuraEliteVanguard } from '../../src/entities/AsuraEliteVanguard';
import { MahishasuraBoss } from '../../src/entities/MahishasuraBoss';
import { BossEncounterScene } from '../../src/scenes/BossEncounterScene';
import { Engine } from '../../src/engine/Engine';
import { Vector2D } from '../../src/physics/Vector2D';
import { Shockwave } from '../../src/entities/Shockwave';
import { Projectile } from '../../src/entities/Projectile';
import { IRenderer } from '../../src/render/CanvasRenderer';

class MockRenderer implements IRenderer {
  private ctx: any;
  private camera: any;

  constructor() {
    this.ctx = {
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      beginPath: () => {},
      closePath: () => {},
      stroke: () => {},
      fill: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      arc: () => {},
      ellipse: () => {},
      moveTo: () => {},
      lineTo: () => {},
      quadraticCurveTo: () => {},
      setLineDash: () => {},
      createRadialGradient: () => ({ addColorStop: () => {} }),
      createLinearGradient: () => ({ addColorStop: () => {} }),
      roundRect: () => {},
    };
    this.camera = {
      position: new Vector2D(0, 0),
      viewportWidth: 1280,
      viewportHeight: 720,
      triggerShake: () => {},
      setTarget: () => {},
    };
  }

  save() {}
  restore() {}
  translate() {}
  scale() {}
  rotate() {}

  getContext() {
    return this.ctx;
  }
  getCamera() {
    return this.camera;
  }
  getViewport() {
    return { x: 0, y: 0, width: 1280, height: 720 };
  }
  clear() {}
  drawRect() {}
  strokeRect() {}
  drawCircle() {}
  strokeCircle() {}
  drawLine() {}
  drawText() {}
  drawImage() {}
  drawAABB() {}
  drawMandala() {}
  drawSriYantraCentral() {}
  beginWorldPass() {}
  endWorldPass() {}
}

describe('Stage 4: Asura Elite Vanguard Squad AI', () => {
  it('initializes with tower shield guard, high poise, and role', () => {
    const alpha = new AsuraEliteVanguard('v_alpha', -100, 0, 'Alpha_Left');
    expect(alpha.role).toBe('Alpha_Left');
    expect(alpha.isGuarding).toBe(true);
    expect(alpha.poise.current).toBe(60);
    expect(alpha.health).toBe(180);
  });

  it('adjusts flanking trajectory based on cooperative squad role', () => {
    const alpha = new AsuraEliteVanguard('v_alpha', 0, 100, 'Alpha_Left');
    const beta = new AsuraEliteVanguard('v_beta', 0, 100, 'Beta_Right');
    const playerPos = new Vector2D(0, 0);

    alpha.updateAI(playerPos, 0.05);
    beta.updateAI(playerPos, 0.05);

    // Alpha flanks to left (negative x offset), Beta flanks to right (positive x offset)
    expect(alpha.position.x).not.toBe(beta.position.x);
    expect(alpha.facing.magnitudeSquared()).toBeGreaterThan(0);
  });

  it('triggers leap attack when player is at medium range (160 to 320 px)', () => {
    const v = new AsuraEliteVanguard('v1', 0, 200, 'Solo');
    v.leapCooldownTimer = 0;
    const playerPos = new Vector2D(0, 0);

    v.updateAI(playerPos, 0.016);
    expect(v.isLeaping).toBe(true);
    expect(v.leapTarget.x).toBe(0);
    expect(v.leapTarget.y).toBe(0);

    // Update through leap duration to landing
    v.updateAI(playerPos, 0.6);
    expect(v.isLeaping).toBe(false);
  });

  it('renders correctly with canvas context across states', () => {
    const v = new AsuraEliteVanguard('v1', 0, 0, 'Alpha_Left');
    const mock = new MockRenderer();
    expect(() => v.render(mock)).not.toThrow();

    // Render while staggered
    v.poise.isStaggered = true;
    expect(() => v.render(mock)).not.toThrow();
  });
});

describe('Stage 4: Mahishasura Titan Boss', () => {
  let boss: MahishasuraBoss;

  beforeEach(() => {
    boss = new MahishasuraBoss('boss', 0, 0);
  });

  it('initializes in Phase 1 with 1000 HP and 250 Poise', () => {
    expect(boss.health).toBe(1000);
    expect(boss.maxHealth).toBe(1000);
    expect(boss.poise.max).toBe(250);
    expect(boss.getPhase()).toBe(1);
  });

  it('triggers Buffalo Horn Charge with windup telegraph at range', () => {
    boss.chargeCooldownTimer = 0;
    const playerPos = new Vector2D(300, 0);

    boss.updateAI(playerPos, 0.016);
    expect(boss.isCharging).toBe(true);
    expect(boss.chargeWindupTimer).toBeGreaterThan(0);

    // Advance past windup into sprint
    boss.updateAI(playerPos, 0.6);
    expect(boss.chargeWindupTimer).toBeLessThanOrEqual(0);
    expect(boss.position.x).toBeGreaterThan(0); // moved in charge direction
  });

  it('triggers Seismic Hammer Slam and generates Shockwave in melee range', () => {
    boss.slamCooldownTimer = 0;
    const playerPos = new Vector2D(40, 0); // close melee distance

    boss.updateAI(playerPos, 0.016);
    expect(boss.isHammerSlamming).toBe(true);
    expect(boss.slamWindupTimer).toBeGreaterThan(0);

    // Advance past slam windup to impact
    boss.updateAI(playerPos, 0.5);
    expect(boss.isHammerSlamming).toBe(false);

    // Should have pending Shockwave event
    expect(boss.pendingEvents.length).toBeGreaterThan(0);
    const slamEvent = boss.pendingEvents.find((e) => e.type === 'SHOCKWAVE');
    expect(slamEvent).toBeDefined();
    expect(slamEvent!.shockwaves!.length).toBe(1);
    expect(slamEvent!.shockwaves![0].damage).toBe(45);
  });

  it('transitions to Phase 2 at <= 70% HP and summons vanguard reinforcements', () => {
    boss.takeDamage(350); // HP: 650 <= 700 (70%)
    expect(boss.getPhase()).toBe(2);
    expect(boss.hasSummonedPhase2Squad).toBe(true);

    const summonEvent = boss.pendingEvents.find((e) => e.type === 'SUMMON_MINIONS');
    expect(summonEvent).toBeDefined();
    expect(summonEvent!.minions!.length).toBe(2);
    expect(summonEvent!.minions![0].role).toBe('Alpha_Left');
    expect(summonEvent!.minions![1].role).toBe('Beta_Right');
  });

  it('transitions to Phase 3 Eclipse Berserk at <= 30% HP with higher speed and poise', () => {
    boss.takeDamage(750); // HP: 250 <= 300 (30%)
    expect(boss.getPhase()).toBe(3);
    expect(boss.speed).toBe(180);
    expect(boss.poise.max).toBe(300);
  });

  it('executes Eclipse Cataclysm Leap with radial 8-directional magma bursts in Phase 3', () => {
    boss.takeDamage(750); // Phase 3
    boss.leapCooldownTimer = 0;
    const playerPos = new Vector2D(100, 100);

    boss.updateAI(playerPos, 0.016);
    expect(boss.isLeaping).toBe(true);

    // Advance through airtime to crater impact
    boss.updateAI(playerPos, 1.15);
    expect(boss.isLeaping).toBe(false);

    const burstEvent = boss.pendingEvents.find((e) => e.type === 'PROJECTILE_BURST');
    expect(burstEvent).toBeDefined();
    expect(burstEvent!.projectiles!.length).toBe(8); // 8-way radial burst
    expect(burstEvent!.shockwaves!.length).toBe(1);
  });

  it('renders correctly with canvas across all 3 phases and states', () => {
    const mock = new MockRenderer();
    expect(() => boss.render(mock)).not.toThrow();

    boss.isCharging = true;
    boss.chargeWindupTimer = 0.3;
    expect(() => boss.render(mock)).not.toThrow();

    boss.isHammerSlamming = true;
    expect(() => boss.render(mock)).not.toThrow();

    boss.phase = 3;
    expect(() => boss.render(mock)).not.toThrow();
  });
});

describe('Stage 4: BossEncounterScene Integration', () => {
  let engine: Engine;
  let canvas: HTMLCanvasElement;
  let scene: BossEncounterScene;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    engine = new Engine();
    engine.init(canvas);
    engine.getSceneManager().switchTo('BossEncounterScene');
    scene = engine.getSceneManager().getCurrentScene() as BossEncounterScene;
  });

  it('initializes arena, player, boss, flankers, and gateway checkpoint', () => {
    expect(scene.id).toBe('BossEncounterScene');
    expect(scene.player).toBeDefined();
    expect(scene.boss).toBeDefined();
    expect(scene.vanguards.length).toBe(2);
    expect(scene.checkpointManager.getActiveCheckpoint()?.id).toBe('cp_throne_sanctum');
    expect(scene.isGameOver).toBe(false);
    expect(scene.isVictory).toBe(false);
  });

  it('handles weapon swap [KeyQ] and guard [KeyC]', () => {
    const input = engine.getInput();

    // Weapon Swap [Q]
    expect(scene.player.equipmentManager.getActiveWeapon()).toBe('AGNI_CHAKRAM');
    (input as any).keysJustPressed.add('KeyQ');
    scene.handleInput(input);
    expect(scene.player.equipmentManager.getActiveWeapon()).toBe('PRANA_GLAIVE');

    // Guard [C]
    expect(scene.player.isGuarding).toBe(false);
    (input as any).keysHeld.add('KeyC');
    scene.handleInput(input);
    expect(scene.player.isGuarding).toBe(true);
    expect(scene.player.parryWindowTimer).toBeGreaterThan(0);
  });

  it('executes 3-hit combo attack against Boss and registers damage', () => {
    const initialBossHp = scene.boss.health;
    scene.player.position.set(scene.boss.position.x, scene.boss.position.y + 40);

    const input = engine.getInput();
    (input as any).keysJustPressed.add('KeyJ'); // ATTACK action
    scene.handleInput(input);

    expect(scene.boss.health).toBeLessThan(initialBossHp);
    expect(scene.player.score).toBeGreaterThan(0);
    expect(scene.player.comboIndex).toBe(1); // Chaining to hit 2
  });

  it('handles player defeat and instant checkpoint retry [KeyR]', () => {
    scene.player.health = 0;
    scene.update(0.016);
    // Simulate direct hit causing defeat
    (scene as any).resolveBossDirectHit(150, 50, new Vector2D(0, 1));
    expect(scene.isGameOver).toBe(true);

    // Press [R] to retry
    const input = engine.getInput();
    (input as any).keysJustPressed.add('KeyR');
    scene.handleInput(input);

    expect(scene.isGameOver).toBe(false);
    expect(scene.player.health).toBe(scene.player.maxHealth);
    expect(scene.boss.health).toBe(scene.boss.maxHealth);
  });

  it('handles boss victory when Boss health drops to 0', () => {
    scene.boss.health = 10;
    scene.player.position.set(scene.boss.position.x, scene.boss.position.y + 40);

    const input = engine.getInput();
    (input as any).keysJustPressed.add('KeyJ');
    scene.handleInput(input);

    expect(scene.boss.health).toBe(0);
    expect(scene.isVictory).toBe(true);
    expect(scene.player.equipmentManager.essence).toBeGreaterThanOrEqual(500);
  });

  it('handles projectile hits against Boss and Vanguards', () => {
    // 1. Player projectile hits Boss
    const p1 = scene.player.shoot(scene.boss.position);
    expect(p1).not.toBeNull();
    p1!.position.set(scene.boss.position.x, scene.boss.position.y);
    p1!.syncBounds();
    scene.playerProjectiles.push(p1!);

    const initialBossHp = scene.boss.health;
    scene.update(0.016);
    expect(scene.boss.health).toBeLessThan(initialBossHp);

    // 2. Player projectile hits Vanguard
    const vanguard = scene.vanguards[0];
    const initialVanguardHp = vanguard.health;
    scene.player.shootCooldownTimer = 0;
    scene.player.energy = 100;
    const p2 = scene.player.shoot(vanguard.position);
    expect(p2).not.toBeNull();
    p2!.position.set(vanguard.position.x, vanguard.position.y);
    p2!.syncBounds();
    scene.playerProjectiles.push(p2!);

    scene.update(0.016);
    expect(vanguard.health).toBeLessThan(initialVanguardHp);
  });

  it('handles enemy projectile and shockwave impacts on player', () => {
    // 1. Shockwave impact
    const sw = new Shockwave('test_sw', scene.player.position.x, scene.player.position.y, 100, 20);
    sw.radius = 20; // within perimeter
    scene.shockwaves.push(sw);

    const initialHp = scene.player.health;
    scene.update(0.016);
    expect(scene.player.health).toBeLessThanOrEqual(initialHp);

    // 2. Enemy projectile impact
    const ep = new Projectile(
      'ep',
      scene.player.position.x,
      scene.player.position.y,
      new Vector2D(0, 1),
      200,
      'enemy_proj'
    );
    scene.enemyProjectiles.push(ep);
    scene.update(0.016);
    expect(scene.damageTakenTotal).toBeGreaterThan(0);
  });

  it('handles Vanguard attacks and Boss charge collisions in scene update', () => {
    const v = scene.vanguards[0];
    v.position.set(scene.player.position.x + 30, scene.player.position.y);
    v.isAttacking = true;
    v.attackWindupTimer = 0.03;
    scene.update(0.016);

    v.isLeaping = true;
    v.leapTimer = 0.03;
    scene.update(0.016);
    expect(scene.shockwaves.length).toBeGreaterThan(0);

    // Boss Charge directly hitting player
    scene.boss.position.set(scene.player.position.x, scene.player.position.y);
    scene.boss.syncBounds();
    scene.boss.isCharging = true;
    scene.boss.chargeWindupTimer = 0;
    scene.update(0.016);
    expect(scene.damageTakenTotal).toBeGreaterThan(0);
  });

  it('handles pause toggle and menu navigation shortcuts', () => {
    const input = engine.getInput();

    // Toggle Pause on
    (input as any).virtualActionJustPressed.add('PAUSE');
    scene.handleInput(input);
    expect(scene.isPaused).toBe(true);

    // Toggle Pause off
    (input as any).virtualActionJustPressed.add('PAUSE');
    scene.handleInput(input);
    expect(scene.isPaused).toBe(false);

    // Pause again and press KeyM to return to menu
    scene.isPaused = true;
    (input as any).keysJustPressed.add('KeyM');
    scene.handleInput(input);
    expect(engine.getSceneManager().getCurrentScene()?.id).toBe('SplashScene');

    // Return to BossEncounterScene and test defeat navigation to Splash
    engine.getSceneManager().switchTo('BossEncounterScene');
    const newScene = engine.getSceneManager().getCurrentScene() as BossEncounterScene;
    newScene.isGameOver = true;
    (input as any).keysJustPressed.add('KeyM');
    newScene.handleInput(input);
    expect(engine.getSceneManager().getCurrentScene()?.id).toBe('SplashScene');
  });

  it('handles player ranged solar burst input [MELEE_ATTACK action]', () => {
    const input = engine.getInput();
    (input as any).virtualActionJustPressed.add('MELEE_ATTACK');
    scene.handleInput(input);
    expect(scene.playerProjectiles.length).toBeGreaterThan(0);
  });

  it('executes perfect parry when hit while parry frames are active', () => {
    scene.player.startGuard();
    expect(scene.player.parryWindowTimer).toBeGreaterThan(0);

    const prevParries = scene.parriesPerformed;
    (scene as any).resolveBossDirectHit(40, 20, new Vector2D(-1, 0));
    expect(scene.parriesPerformed).toBe(prevParries + 1);
  });

  it('renders complete arena, checkpoint pillar, boss HUD, and overlays without error', () => {
    const mock = new MockRenderer();
    expect(() => scene.render(mock)).not.toThrow();

    // Render with victory overlay
    scene.isVictory = true;
    expect(() => scene.render(mock)).not.toThrow();

    // Render with defeat overlay
    scene.isVictory = false;
    scene.isGameOver = true;
    expect(() => scene.render(mock)).not.toThrow();

    // Render with pause overlay
    scene.isGameOver = false;
    scene.isPaused = true;
    expect(() => scene.render(mock)).not.toThrow();
  });
});
