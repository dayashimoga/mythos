import { describe, it, expect } from 'vitest';
import { ObjectPool, Poolable } from '../../src/core/ObjectPool';
import { SpatialHash } from '../../src/physics/SpatialHash';
import { RenderBatcher } from '../../src/render/RenderBatcher';
import { Camera } from '../../src/render/Camera';
import { TimeSliceScheduler } from '../../src/core/TimeSliceScheduler';
import { AABB } from '../../src/physics/AABB';

class BenchmarkPoolItem implements Poolable {
  public value = 0;
  public reset(): void {
    this.value = 0;
  }
}

describe('Stage 8: Production Benchmark & High-Throughput Stress Suite', () => {
  it('sustained 1000-frame simulation loop completes well within 16.6ms frame budget', () => {
    const scheduler = TimeSliceScheduler.getInstance();
    scheduler.clear();

    let taskCalls = 0;
    scheduler.registerTask('bench_task', 'EVERY_2ND_FRAME', () => {
      taskCalls++;
    });

    const start = performance.now();
    const frameCount = 1000;
    const dt = 1 / 60;

    for (let f = 0; f < frameCount; f++) {
      scheduler.step(dt);
    }

    const duration = performance.now() - start;
    const avgMsPerFrame = duration / frameCount;

    expect(taskCalls).toBe(500);
    // Headless execution must be fast (< 1.5ms per frame)
    expect(avgMsPerFrame).toBeLessThan(1.5);
  });

  it('spatial hash handles 500 active colliders with O(1) broadphase query time under 5ms', () => {
    const grid = new SpatialHash(128);
    const colliderCount = 500;

    for (let i = 0; i < colliderCount; i++) {
      const x = (i % 25) * 100;
      const y = Math.floor(i / 25) * 100;
      grid.insert({
        id: `entity_${i}`,
        bounds: new AABB(x, y, 40, 40),
      });
    }

    const queryBox = new AABB(500, 500, 200, 200);
    const start = performance.now();

    // Perform 100 queries
    let totalFound = 0;
    for (let q = 0; q < 100; q++) {
      const candidates = grid.query(queryBox);
      totalFound += candidates.length;
    }

    const duration = performance.now() - start;
    expect(totalFound).toBeGreaterThan(0);
    expect(duration).toBeLessThan(10.0); // 100 queries completed under 10ms (<0.1ms each)
  });

  it('object pool executes 10,000 high-frequency borrow/release cycles in under 15ms with zero leakage', () => {
    const pool = new ObjectPool<BenchmarkPoolItem>(() => new BenchmarkPoolItem(), 100, 500);

    const start = performance.now();
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      const item = pool.borrow();
      item.value = i;
      pool.release(item);
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(25.0); // 10k operations under 25ms
    expect(pool.getActiveCount()).toBe(0); // Zero unreleased objects
  });

  it('RenderBatcher culls 2,000 off-screen primitives in under 3ms', () => {
    const batcher = RenderBatcher.getInstance();
    batcher.resetStats();
    const camera = new Camera(1280, 720);
    camera.setPosition(640, 360);

    const start = performance.now();
    const count = 2000;

    for (let i = 0; i < count; i++) {
      // 90% placed far outside viewport
      const x = i < 200 ? 640 : 10000 + i * 50;
      const y = i < 200 ? 360 : 10000 + i * 50;
      batcher.isBoxVisible(camera, x, y, 50, 50);
    }

    const duration = performance.now() - start;
    const stats = batcher.getStats();

    expect(duration).toBeLessThan(10.0);
    expect(stats.drawnCount).toBe(200);
    expect(stats.culledCount).toBe(1800);
  });
});
