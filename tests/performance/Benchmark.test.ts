import { describe, it, expect } from 'vitest';
import { ParticleSystem } from '../../src/render/ParticleSystem';
import { CollisionSystem, Collider } from '../../src/physics/CollisionSystem';
import { AABB } from '../../src/physics/AABB';

describe('Performance & Frame Budget Benchmarks', () => {
  it('updates 800 active particles within <= 3.0ms budget', () => {
    const ps = new ParticleSystem(800);
    ps.emitBurst(0, 0, 750, '#FFB703');

    const t0 = performance.now();
    for (let frame = 0; frame < 10; frame++) {
      ps.update(1 / 60);
    }
    const totalTimeMs = performance.now() - t0;
    const avgPerFrameMs = totalTimeMs / 10;

    // Budget: 3.0ms per frame
    expect(avgPerFrameMs).toBeLessThan(3.0);
  });

  it('performs spatial partitioning collision checks within <= 2.5ms budget', () => {
    const sys = new CollisionSystem(64);

    // Register 60 colliders across grid
    for (let i = 0; i < 60; i++) {
      const col: Collider = {
        id: `c_${i}`,
        bounds: new AABB((i % 10) * 50, Math.floor(i / 10) * 50, 40, 40),
        type: 'solid',
        tag: 'entity',
        isStatic: i % 2 === 0,
      };
      sys.register(col);
    }

    const t0 = performance.now();
    for (let step = 0; step < 10; step++) {
      sys.update();
    }
    const totalTimeMs = performance.now() - t0;
    const avgStepMs = totalTimeMs / 10;

    // Budget: 2.5ms per update step
    expect(avgStepMs).toBeLessThan(2.5);
  });
});
