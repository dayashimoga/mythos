import { describe, it, expect, beforeEach } from 'vitest';
import { NavMesh } from '../../src/environment/NavMesh';
import { EnvironmentManager } from '../../src/environment/EnvironmentManager';
import { EnvironmentProbes } from '../../src/environment/EnvironmentProbes';
import { CollisionSystem } from '../../src/physics/CollisionSystem';
import { Camera } from '../../src/render/Camera';
import { AABB } from '../../src/physics/AABB';

describe('Environment Navigation, World Assembly & Automated Probes', () => {
  describe('NavMesh 2D Navigation Grid & A* Pathfinding', () => {
    let navMesh: NavMesh;

    beforeEach(() => {
      navMesh = new NavMesh(-1000, -1000, 1000, 1000, 40);
    });

    it('creates navigation grid spanning the specified area', () => {
      expect(navMesh.cols).toBe(50);
      expect(navMesh.rows).toBe(50);
      expect(navMesh.isTraversable(0, 0)).toBe(true);
      expect(navMesh.isTraversable(3000, 3000)).toBe(false);
    });

    it('marks solid obstacles as non-traversable with Infinity cost', () => {
      const obstacle = new AABB(-80, -80, 160, 160);
      navMesh.markObstacle(obstacle);

      expect(navMesh.isTraversable(0, 0)).toBe(false);
      expect(navMesh.getCostAt(0, 0)).toBe(Infinity);
      expect(navMesh.isTraversable(200, 200)).toBe(true);
    });

    it('marks custom pathways with reduced movement traversal cost', () => {
      const road = new AABB(100, 100, 200, 40);
      navMesh.markPathway(road, 1.0);

      expect(navMesh.getCostAt(150, 120)).toBe(1.0);
    });

    it('computes valid A* path avoiding stamped obstacles', () => {
      // Place an obstacle wall between start (-200, 0) and goal (200, 0)
      const wall = new AABB(-20, -100, 40, 200);
      navMesh.markObstacle(wall);

      const path = navMesh.findPath(-200, 0, 200, 0);
      expect(path.isValid).toBe(true);
      expect(path.points.length).toBeGreaterThan(1);

      // Verify no path points lie inside the solid obstacle
      for (const pt of path.points) {
        expect(wall.containsPoint(pt.x, pt.y)).toBe(false);
      }
    });

    it('returns invalid path when destination is blocked or unreachable', () => {
      // Enclose destination inside a solid box
      const box = new AABB(300, 300, 80, 80);
      navMesh.markObstacle(box);

      const path = navMesh.findPath(0, 0, 340, 340);
      expect(path.isValid).toBe(false);
      expect(path.points.length).toBe(0);
    });

    it('smooths paths using line-of-sight shortcutting', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { x: 80, y: 0 },
        { x: 120, y: 0 },
      ];
      const smoothed = navMesh.smoothPath(points);
      expect(smoothed.length).toBe(2);
      expect(smoothed[0]).toEqual({ x: 0, y: 0 });
      expect(smoothed[1]).toEqual({ x: 120, y: 0 });
    });

    it('renders debug navmesh and active path without throwing', () => {
      const camera = new Camera(1280, 720);
      camera.position.set(0, 0);

      const ctx = {
        save: () => {},
        restore: () => {},
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        fillRect: () => {},
        strokeRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        stroke: () => {},
        arc: () => {},
        fill: () => {},
      } as unknown as CanvasRenderingContext2D;

      const path = navMesh.findPath(-100, -100, 100, 100);
      expect(() => {
        navMesh.renderDebugNavMesh(ctx, camera, path);
      }).not.toThrow();
    });
  });

  describe('EnvironmentManager & Automated Probes', () => {
    let collisionSystem: CollisionSystem;
    let env: EnvironmentManager;

    beforeEach(() => {
      collisionSystem = new CollisionSystem(128);
      env = new EnvironmentManager(collisionSystem);
    });

    it('assembles the 5 environmental zones with correct landmarks', () => {
      expect(env.landmarks.length).toBe(8);
      expect(env.chunkManager.totalObjectsCount).toBeGreaterThan(15);
      expect(collisionSystem.getColliderCount()).toBeGreaterThan(15);
    });

    it('classifies player coordinates into corresponding zone names', () => {
      expect(env.getZoneAt({ x: 0, y: 0 })).toContain('Causeway');
      expect(env.getZoneAt({ x: -1200, y: -200 })).toContain('Dandaka');
      expect(env.getZoneAt({ x: 1200, y: 100 })).toContain('Citadel');
      expect(env.getZoneAt({ x: 0, y: 1100 })).toContain('Patala');
    });

    it('discovers landmarks when player enters vicinity', () => {
      const banyan = env.landmarks.find(l => l.id === 'landmark_banyan')!;
      expect(banyan.discovered).toBe(false);

      const camera = new Camera(1280, 720);
      camera.position.set(banyan.x, banyan.y);

      // Player near banyan
      env.update(0.016, camera, { x: banyan.x, y: banyan.y });
      expect(banyan.discovered).toBe(true);
    });

    it('queries and triggers interactive props (braziers and prayer wheels)', () => {
      // Near a brazier in Citadel
      const brazierPos = { x: 1050, y: 50 };
      const prop = env.getNearbyInteractive(brazierPos, 50);
      expect(prop).not.toBeNull();
      expect(prop?.id).toBe('brazier_1');
      expect(prop?.isLit).toBe(true);

      // Interact with brazier (toggles off)
      const interacted = env.interact(brazierPos);
      expect(interacted).toBe(true);
      expect(prop?.isLit).toBe(false);

      // Far away returns null
      expect(env.getNearbyInteractive({ x: -1900, y: -1500 }, 20)).toBeNull();
    });

    it('passes automated collision audit with zero invalid geometries', () => {
      const result = EnvironmentProbes.runCollisionAudit(env);
      expect(result.passed).toBe(true);
      expect(result.failedChecks).toBe(0);
      expect(result.totalChecks).toBeGreaterThan(20);
    });

    it('passes automated navigability audit between all major landmark pairs', () => {
      const result = EnvironmentProbes.runNavigabilityAudit(env);
      expect(result.passed).toBe(true);
      expect(result.failedChecks).toBe(0);
      expect(result.totalChecks).toBe(5);
    });

    it('passes frustum culling audit, achieving >=70% culled chunks', () => {
      const camera = new Camera(1280, 720);
      const result = EnvironmentProbes.runCullingAudit(env, camera);
      expect(result.passed).toBe(true);
      expect(result.failedChecks).toBe(0);
    });

    it('passes asset completeness audit across all environment objects', () => {
      const result = EnvironmentProbes.runAssetCompletenessAudit(env);
      expect(result.passed).toBe(true);
      expect(result.failedChecks).toBe(0);
    });
  });
});
