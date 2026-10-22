import { Camera } from '../render/Camera';
import { EnvironmentManager } from './EnvironmentManager';
import { CollisionLayer } from './EnvironmentTypes';

export interface ProbeResult {
  suiteName: string;
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  details: string[];
}

export class EnvironmentProbes {
  /**
   * Probes collision boundaries, obstacle blocking, and collision dimensions
   */
  public static runCollisionAudit(env: EnvironmentManager): ProbeResult {
    const details: string[] = [];
    let total = 0;
    let passed = 0;

    const objects = env.chunkManager.getAllObjects();

    // Check 1: Non-zero valid dimensions on all environment objects
    for (const obj of objects) {
      total++;
      if (obj.bounds.width > 0 && obj.bounds.height > 0) {
        passed++;
      } else {
        details.push(`Object ${obj.id} has invalid dimensions (${obj.bounds.width}x${obj.bounds.height})`);
      }
    }

    // Check 2: Verify solid obstacles block navigation
    const obstacles = objects.filter(o => (o.layer & (CollisionLayer.TERRAIN_SOLID | CollisionLayer.CHASM_ABYSS)) !== 0);
    for (const obs of obstacles) {
      total++;
      const centerX = obs.bounds.x + obs.bounds.width / 2;
      const centerY = obs.bounds.y + obs.bounds.height / 2;
      const cost = env.navMesh.getCostAt(centerX, centerY);

      // Solid objects must have Infinity cost or non-traversable
      if (!env.navMesh.isTraversable(centerX, centerY) || cost > 1.0) {
        passed++;
      } else {
        details.push(`Obstacle ${obs.id} at (${centerX}, ${centerY}) failed to block or mark high cost in NavMesh`);
      }
    }

    return {
      suiteName: 'Collision and Geometry Audit',
      passed: passed === total,
      totalChecks: total,
      passedChecks: passed,
      failedChecks: total - passed,
      details,
    };
  }

  /**
   * Probes A* pathfinding reachability between all landmark pairings
   */
  public static runNavigabilityAudit(env: EnvironmentManager): ProbeResult {
    const details: string[] = [];
    let total = 0;
    let passed = 0;

    const landmarks = env.landmarks;
    // Test pairwise connectivity between adjacent major landmarks
    const testPairs = [
      { from: 'landmark_torana', to: 'landmark_prayer_wheels' },
      { from: 'landmark_torana', to: 'landmark_kalyani' },
      { from: 'landmark_torana', to: 'landmark_banyan' },
      { from: 'landmark_kalyani', to: 'landmark_shikhara' },
      { from: 'landmark_prayer_wheels', to: 'landmark_bridge' },
    ];

    for (const pair of testPairs) {
      total++;
      const lmFrom = landmarks.find(l => l.id === pair.from);
      const lmTo = landmarks.find(l => l.id === pair.to);

      if (!lmFrom || !lmTo) {
        details.push(`Landmark pair ${pair.from} -> ${pair.to} not found`);
        continue;
      }

      // Check pathfinding
      const path = env.navMesh.findPath(lmFrom.x, lmFrom.y, lmTo.x, lmTo.y);
      if (path.isValid && path.points.length > 0) {
        passed++;
      } else {
        details.push(`No navigable path found between ${lmFrom.name} and ${lmTo.name}`);
      }
    }

    return {
      suiteName: 'NavMesh and Landmark Reachability Audit',
      passed: passed === total,
      totalChecks: total,
      passedChecks: passed,
      failedChecks: total - passed,
      details,
    };
  }

  /**
   * Probes frustum culling efficiency and draw-call reduction
   */
  public static runCullingAudit(env: EnvironmentManager, camera: Camera): ProbeResult {
    const details: string[] = [];
    let total = 0;
    let passed = 0;

    // Position camera at central highway (0, 0) with standard 1280x720 viewport
    camera.position.set(0, 0);
    camera.zoom = 1.0;
    const visibleChunks = env.chunkManager.updateCullingAndLOD(camera);

    total++;
    const totalChunks = env.chunkManager.totalChunksCount;
    const culledRatio = (totalChunks - visibleChunks.length) / totalChunks;

    if (culledRatio >= 0.70) {
      passed++;
    } else {
      details.push(`Culling ratio ${(culledRatio * 100).toFixed(1)}% fell below target 70% threshold`);
    }

    total++;
    if (env.chunkManager.renderedObjectsCount < env.chunkManager.totalObjectsCount) {
      passed++;
    } else {
      details.push('No environment objects were culled by ChunkManager');
    }

    return {
      suiteName: 'Frustum Culling and Performance Budget Audit',
      passed: passed === total,
      totalChecks: total,
      passedChecks: passed,
      failedChecks: total - passed,
      details,
    };
  }

  /**
   * Probes asset completeness across all registered environment entities
   */
  public static runAssetCompletenessAudit(env: EnvironmentManager): ProbeResult {
    const details: string[] = [];
    let total = 0;
    let passed = 0;

    const objects = env.chunkManager.getAllObjects();
    for (const obj of objects) {
      total++;
      if (typeof obj.render === 'function' && obj.zoneId && obj.id) {
        passed++;
      } else {
        details.push(`Object ${obj.id} missing mandatory attributes`);
      }
    }

    return {
      suiteName: 'Asset Completeness and Registry Audit',
      passed: passed === total,
      totalChecks: total,
      passedChecks: passed,
      failedChecks: total - passed,
      details,
    };
  }
}
