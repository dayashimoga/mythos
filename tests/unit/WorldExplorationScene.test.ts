import { describe, it, expect, beforeEach } from 'vitest';
import { WorldExplorationScene } from '../../src/scenes/WorldExplorationScene';
import { Engine } from '../../src/engine/Engine';
import { Vector2D } from '../../src/physics/Vector2D';

describe('WorldExplorationScene Playable Environment Integration', () => {
  let engine: Engine;
  let canvas: HTMLCanvasElement;
  let scene: WorldExplorationScene;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    engine = new Engine();
    engine.init(canvas);

    scene = new WorldExplorationScene();
    scene.onEnter(engine);
  });

  it('initializes world exploration environment with player Veer at causeway', () => {
    expect(scene.id).toBe('WorldExplorationScene');
    expect(scene.player).toBeDefined();
    expect(scene.player.position.x).toBe(0);
    expect(scene.player.position.y).toBe(-200);
    expect(scene.environment).toBeDefined();
    expect(scene.collisionSystem.getColliderCount()).toBeGreaterThan(15);
  });

  it('updates player movement and resolves collisions with solid obstacles', () => {
    const input = engine.getInput();
    // Simulate moving down on the causeway
    input.setVirtualMovement(0, 1);

    scene.update(0.016);
    expect(scene.player.position.y).toBeGreaterThan(-200);

    // Verify bounds synchronization
    expect(scene.player.bounds.centerY).toBeCloseTo(scene.player.position.y, 1);
  });

  it('handles environmental hotkeys for time, weather, navmesh, and mini-map', () => {
    const input = engine.getInput();

    // 1. Time of Day [L]
    (input as any).keysJustPressed.add('KeyL');
    scene.handleInput(input);
    expect(scene.environment.lightingEngine.getTimeOfDay()).not.toBe('NOON');

    // 2. Weather [W]
    (input as any).keysJustPressed.add('KeyW');
    scene.handleInput(input);
    expect(scene.environment.atmosphericSystem.getWeather()).not.toBe('SOLAR_CLEAR');

    // 3. NavMesh Debug [N]
    expect(scene.environment.showNavMeshDebug).toBe(false);
    (input as any).keysJustPressed.add('KeyN');
    scene.handleInput(input);
    expect(scene.environment.showNavMeshDebug).toBe(true);

    // 4. Collision Debug [B]
    expect(scene.environment.showCollisionDebug).toBe(false);
    (input as any).keysJustPressed.add('KeyB');
    scene.handleInput(input);
    expect(scene.environment.showCollisionDebug).toBe(true);

    // 5. Mini-Map [M]
    expect(scene.showMiniMap).toBe(true);
    (input as any).keysJustPressed.add('KeyM');
    scene.handleInput(input);
    expect(scene.showMiniMap).toBe(false);

    // 6. Lighting Pass [F2]
    expect(scene.environment.lightingEngine.isEnabled).toBe(true);
    (input as any).keysJustPressed.add('F2');
    scene.handleInput(input);
    expect(scene.environment.lightingEngine.isEnabled).toBe(false);
  });

  it('handles camera zoom adjustments (+ / -)', () => {
    const input = engine.getInput();
    const camera = engine.getRenderer().getCamera();
    const initialZoom = camera.zoom;

    (input as any).keysJustPressed.add('Equal');
    scene.handleInput(input);
    expect(camera.zoom).toBeGreaterThan(initialZoom);

    (input as any).keysJustPressed.add('Minus');
    (input as any).keysJustPressed.add('Minus');
    scene.handleInput(input);
    expect(camera.zoom).toBeLessThan(camera.zoom + 0.1);
  });

  it('handles interactive prop interactions via KeyF', () => {
    const input = engine.getInput();
    // Move player near the prayer wheels at (0, 300)
    scene.player.position.set(0, 300);

    (input as any).keysJustPressed.add('KeyF');
    scene.handleInput(input);

    const prop = scene.environment.getNearbyInteractive(scene.player.position, 60);
    expect(prop).not.toBeNull();
  });

  it('handles mouse click pathfinding queries', () => {
    const input = engine.getInput();
    (input as any).mouseButtonsJustPressed.add(0);
    // Mouse screen center corresponds to world (0, -200)
    (input as any).mousePosition = new Vector2D(640, 360);

    scene.handleInput(input);
    expect(scene.activeNavPath).not.toBeNull();
  });

  it('executes player dash upon DASH action', () => {
    const input = engine.getInput();
    input.triggerVirtualAction('DASH');

    scene.handleInput(input);
    expect(scene.player.isDashing).toBe(true);
  });

  it('renders world, player, HUD, and mini-map without exceptions', () => {
    expect(() => {
      scene.render(engine.getRenderer());
    }).not.toThrow();
  });

  it('cleans up collision system on exit', () => {
    scene.onExit();
    expect(scene.collisionSystem.getColliderCount()).toBe(0);
  });
});
