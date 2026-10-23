import { describe, it, expect, beforeEach } from 'vitest';
import { Engine } from '../../src/engine/Engine';
import { BhumiTempleScene } from '../../src/scenes/BhumiTempleScene';
import { CanvasRenderer } from '../../src/render/CanvasRenderer';
import { InputManager } from '../../src/input/InputManager';
import { NavMesh } from '../../src/environment/NavMesh';
import { AABB } from '../../src/physics/AABB';

describe('Stage 4 — World, Environment & Exploration Overhaul', () => {
  let engine: Engine;
  let canvas: HTMLCanvasElement;
  let scene: BhumiTempleScene;
  let renderer: CanvasRenderer;
  let input: InputManager;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    engine = new Engine();
    engine.init(canvas);
    renderer = engine.getRenderer() as CanvasRenderer;
    input = engine.getInput();

    scene = new BhumiTempleScene();
    scene.onEnter(engine);
  });

  describe('Bhumi Temple Environmental Architecture & Landmarks', () => {
    it('initializes dual bridges, exploration tablet, shunya shrine, and braziers', () => {
      expect(scene.bridges.length).toBe(2);
      expect(scene.bridges[0].minX).toBeLessThan(0); // West bridge
      expect(scene.bridges[1].minX).toBeGreaterThan(0); // East bridge

      expect(scene.inscriptionTablet).toBeDefined();
      expect(scene.inscriptionTablet.isRead).toBe(false);

      expect(scene.shunyaShrine).toBeDefined();
      expect(scene.shunyaShrine.isAttuned).toBe(false);

      expect(scene.braziers.length).toBe(4);
      expect(scene.staticColumns.length).toBe(2);
    });

    it('dynamically tracks zone names based on player elevation coordinates', () => {
      // South Portico
      scene.player.position.y = 350;
      scene.update(0.016);
      expect(scene.currentZoneName).toBe('The South Portico & Dvarapala Gate');

      // Outer Courtyard
      scene.player.position.y = 150;
      scene.update(0.016);
      expect(scene.currentZoneName).toBe('The Outer Courtyard of Surya-Kund');

      // Molten Chasm
      scene.player.position.y = -10;
      scene.update(0.016);
      expect(scene.currentZoneName).toBe('The Great Molten Chasm of Dandaka');

      // High Sanctorum
      scene.player.position.y = -300;
      scene.update(0.016);
      expect(scene.currentZoneName).toBe('The High Sanctorum of the Sun Altar');
    });
  });

  describe('Navigation & Lava Hazard Invariant', () => {
    it('protects player from lava damage when standing on stone bridges', () => {
      const initialHealth = scene.player.health;

      // Position on West Bridge (-250, -10)
      scene.player.position.set(-250, -10);
      expect(scene.lavaTrench.containsPoint(-250, -10)).toBe(true);
      expect(scene.bridges[0].containsPoint(-250, -10)).toBe(true);

      scene.update(0.1);
      expect(scene.player.health).toBe(initialHealth); // No damage taken on bridge!
    });

    it('inflicts lava hazard damage when stepping into molten lava off-bridge', () => {
      const initialHealth = scene.player.health;

      // Position directly in lava channel at center (0, -10) where no bridge exists
      scene.player.position.set(0, -10);
      expect(scene.lavaTrench.containsPoint(0, -10)).toBe(true);
      expect(scene.bridges.some((b) => b.containsPoint(0, -10))).toBe(false);

      scene.update(0.1);
      expect(scene.player.health).toBeLessThan(initialHealth); // Takes lava damage!
    });

    it('allows player to safely dash across molten lava without damage', () => {
      // Trigger dash
      scene.player.position.set(0, -10);
      scene.player.triggerDash();
      expect(scene.player.isDashing).toBe(true);

      const health = scene.player.health;
      scene.update(0.05);
      expect(scene.player.health).toBe(health); // Dash bypasses lava damage!
    });
  });

  describe('Exploration & Interactive Discoveries', () => {
    it('interacts with the Ancient Vedic Inscription Tablet upon pressing KeyF', () => {
      scene.player.position.set(scene.inscriptionTablet.x, scene.inscriptionTablet.y + 20);

      // Trigger KeyF interaction
      (input as any).keysJustPressed.add('KeyF');
      scene.handleInput(input);

      expect(scene.inscriptionTablet.isRead).toBe(true);
      expect(scene.discoveryToast).toContain('Ancient Tablet');
    });

    it('communes with the Shunya Shrine to receive Surya Radiance speed buff and prana', () => {
      scene.player.health = 60;
      scene.player.position.set(scene.shunyaShrine.x, scene.shunyaShrine.y + 20);

      // Trigger INTERACT action
      input.triggerVirtualAction('INTERACT');
      scene.handleInput(input);

      expect(scene.shunyaShrine.isAttuned).toBe(true);
      expect(scene.player.speed).toBeGreaterThan(220); // Buffed to 280
      expect(scene.player.health).toBe(85); // Restored 25 prana
      expect(scene.discoveryToast).toContain('Shunya Blessing');
    });
  });

  describe('Layered World Rendering', () => {
    it('executes full multi-layered rendering pass without throwing', () => {
      expect(() => scene.render(renderer)).not.toThrow();

      // Test rendering in various game states
      scene.showToast('Test Toast Notification');
      expect(() => scene.render(renderer)).not.toThrow();

      // Diagnostics colliders toggle
      engine.getDiagnostics().toggleColliders();
      expect(() => scene.render(renderer)).not.toThrow();
    });
  });

  describe('NavMesh & Obstacle Geometry', () => {
    it('builds a continuous traversable grid and resolves A* route queries', () => {
      const navMesh = new NavMesh(-500, -500, 500, 500, 50);
      expect(navMesh.cols).toBe(20);
      expect(navMesh.rows).toBe(20);

      // Mark obstacle in center
      navMesh.markObstacle(new AABB(-100, -100, 200, 200));

      expect(navMesh.isTraversable(0, 0)).toBe(false);
      expect(navMesh.isTraversable(-300, -300)).toBe(true);

      // Find path around obstacle
      const path = navMesh.findPath(-250, -250, 250, 250);
      expect(path.isValid).toBe(true);
      expect(path.points.length).toBeGreaterThan(2);
    });
  });
});
