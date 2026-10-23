import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GraphicsQualityManager } from '../../src/render/GraphicsQualityManager';
import { RenderBatcher } from '../../src/render/RenderBatcher';
import { Camera } from '../../src/render/Camera';
import { ObjectPool, Poolable } from '../../src/core/ObjectPool';
import { MemoryProfiler } from '../../src/core/MemoryProfiler';
import { TimeSliceScheduler } from '../../src/core/TimeSliceScheduler';
import { PlatformBridge } from '../../src/platform/PlatformBridge';

class MockPoolItem implements Poolable {
  public id = 0;
  public isActive = true;

  public reset(): void {
    this.isActive = false;
  }
}

describe('Stage 8: Performance Architecture & Cross-Platform Subsystems', () => {
  describe('GraphicsQualityManager', () => {
    let qm: GraphicsQualityManager;

    beforeEach(() => {
      qm = GraphicsQualityManager.getInstance();
      qm.setTier('HIGH');
      qm.setThermalThrottled(false);
      qm.resetMetrics();
    });

    it('returns authoritative settings for LOW, MEDIUM, HIGH, and ULTRA presets', () => {
      qm.setTier('LOW');
      expect(qm.getTier()).toBe('LOW');
      let s = qm.getSettings();
      expect(s.particleBudget).toBe(300);
      expect(s.resolutionScale).toBe(0.75);
      expect(s.enableGlow).toBe(false);
      expect(s.targetFps).toBe(60);

      qm.setTier('MEDIUM');
      s = qm.getSettings();
      expect(s.particleBudget).toBe(700);
      expect(s.resolutionScale).toBe(0.85);
      expect(s.enableChromaticAberration).toBe(true);

      qm.setTier('HIGH');
      s = qm.getSettings();
      expect(s.particleBudget).toBe(1200);
      expect(s.resolutionScale).toBe(1.0);
      expect(s.enableShadows).toBe(true);

      qm.setTier('ULTRA');
      s = qm.getSettings();
      expect(s.particleBudget).toBe(2000);
      expect(s.resolutionScale).toBe(1.25);
      expect(s.targetFps).toBe(120);
    });

    it('handles thermal throttling by capping target FPS and stepping down ULTRA', () => {
      qm.setTier('ULTRA');
      qm.setThermalThrottled(true);
      expect(qm.isThermalThrottled()).toBe(true);
      expect(qm.getTier()).toBe('MEDIUM');
      expect(qm.getSettings().targetFps).toBe(30);
    });

    it('dynamically adapts resolution scale under sustained high and low frame times', () => {
      qm.setTier('ADAPTIVE');
      expect(qm.getTier()).toBe('ADAPTIVE');

      // Simulate 35 heavy frames (> 18ms)
      for (let i = 0; i < 35; i++) {
        qm.reportFrameTime(22.0);
      }
      expect(qm.getAdaptiveScale()).toBeLessThan(1.0);
      const scaledDown = qm.getAdaptiveScale();

      // Simulate 35 lightweight frames (< 13ms)
      for (let i = 0; i < 35; i++) {
        qm.reportFrameTime(9.0);
      }
      expect(qm.getAdaptiveScale()).toBeGreaterThan(scaledDown);

      const settings = qm.getSettings();
      expect(settings.tier).toBe('ADAPTIVE');
      expect(settings.cullingMargin).toBe(120);
    });
  });

  describe('RenderBatcher & Spatial Viewport Culling', () => {
    let batcher: RenderBatcher;
    let camera: Camera;

    beforeEach(() => {
      batcher = RenderBatcher.getInstance();
      batcher.resetStats();
      camera = new Camera(1280, 720);
      camera.setPosition(640, 360);
    });

    it('accurately tests box visibility within camera frustum and updates stats', () => {
      // Box in center of camera
      const inside = batcher.isBoxVisible(camera, 600, 300, 50, 50);
      expect(inside).toBe(true);

      // Box far outside viewport
      const outside = batcher.isBoxVisible(camera, 5000, 5000, 100, 100);
      expect(outside).toBe(false);

      const stats = batcher.getStats();
      expect(stats.drawnCount).toBe(1);
      expect(stats.culledCount).toBe(1);
    });

    it('accurately tests point visibility within camera frustum', () => {
      expect(batcher.isPointVisible(camera, 640, 360)).toBe(true);
      expect(batcher.isPointVisible(camera, -2000, -2000)).toBe(false);
    });

    it('batches particles by fill style without canvas errors', () => {
      const mockCtx: any = {
        fillStyle: '',
        globalAlpha: 1.0,
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
      };

      const particles = [
        { x: 10, y: 10, radius: 4, color: '#FFB703', alpha: 0.8 },
        { x: 20, y: 20, radius: 5, color: '#FFB703', alpha: 0.6 },
        { x: 30, y: 30, radius: 6, color: '#00E5FF', alpha: 0.9 },
        { x: 40, y: 40, radius: 7, color: '#00E5FF', alpha: 0.005 }, // Culled due to alpha <= 0.01
      ];

      batcher.batchDrawParticles(mockCtx, particles);
      expect(mockCtx.beginPath).toHaveBeenCalledTimes(3);
      expect(mockCtx.fill).toHaveBeenCalledTimes(3);
      expect(mockCtx.globalAlpha).toBe(1.0);

      // Test empty array edge case
      batcher.batchDrawParticles(mockCtx, []);
    });
  });

  describe('ObjectPool Generic Container', () => {
    it('manages pre-allocation, borrow, release, and high watermark', () => {
      let created = 0;
      const pool = new ObjectPool<MockPoolItem>(() => {
        const item = new MockPoolItem();
        item.id = ++created;
        return item;
      }, 10, 50);

      expect(pool.getAvailableCount()).toBe(10);
      expect(pool.getActiveCount()).toBe(0);

      const item1 = pool.borrow();
      expect(item1.id).toBeGreaterThan(0);
      expect(pool.getActiveCount()).toBe(1);
      expect(pool.getAvailableCount()).toBe(9);
      expect(pool.getHighWaterMark()).toBe(1);

      const item2 = pool.borrow();
      expect(pool.getActiveCount()).toBe(2);
      expect(pool.getHighWaterMark()).toBe(2);

      pool.release(item1);
      expect(item1.isActive).toBe(false); // Verified reset() was called
      expect(pool.getActiveCount()).toBe(1);
      expect(pool.getAvailableCount()).toBe(9);

      pool.release(item2);
      expect(pool.getActiveCount()).toBe(0);

      // Borrow more than preallocated to test dynamic creation
      const items: MockPoolItem[] = [];
      for (let i = 0; i < 20; i++) {
        items.push(pool.borrow());
      }
      expect(pool.getActiveCount()).toBe(20);
      expect(pool.getHighWaterMark()).toBe(20);

      pool.releaseAll(items);
      expect(pool.getActiveCount()).toBe(0);

      pool.clear();
      expect(pool.getAvailableCount()).toBe(0);
    });
  });

  describe('MemoryProfiler & Leak Detection', () => {
    let profiler: MemoryProfiler;

    beforeEach(() => {
      profiler = MemoryProfiler.getInstance();
      profiler.reset();
    });

    it('records memory samples and generates comprehensive report', () => {
      const sample = profiler.recordSample(15, 120, 4);
      expect(sample.activeEntities).toBe(15);
      expect(sample.activeParticles).toBe(120);
      expect(sample.activeVoices).toBe(4);
      expect(sample.usedHeapMb).toBeGreaterThan(0);

      const report = profiler.generateReport();
      expect(report.sampleCount).toBe(1);
      expect(report.currentHeapMb).toBe(sample.usedHeapMb);
      expect(report.peakHeapMb).toBe(sample.usedHeapMb);
      expect(report.isLeakingSuspected).toBe(false);
    });

    it('detects continuous monotonic heap growth and triggers leak warning heuristic', () => {
      // Mock performance.memory
      const originalPerf = globalThis.performance;
      let currentHeap = 30 * 1024 * 1024;

      (globalThis as any).performance = {
        ...originalPerf,
        now: () => Date.now(),
        memory: {
          usedJSHeapSize: currentHeap,
          totalJSHeapSize: 100 * 1024 * 1024,
        },
      };

      try {
        for (let i = 0; i < 12; i++) {
          currentHeap += 2.5 * 1024 * 1024; // +2.5MB per tick (>15MB total)
          (globalThis as any).performance.memory.usedJSHeapSize = currentHeap;
          profiler.recordSample(10, 10, 2);
        }

        const report = profiler.generateReport();
        expect(report.isLeakingSuspected).toBe(true);
        expect(report.leakWarningMessage).toContain('Heap inflated continuously');
      } finally {
        globalThis.performance = originalPerf;
      }
    });

    it('handles empty report gracefully', () => {
      profiler.reset();
      const report = profiler.generateReport();
      expect(report.sampleCount).toBe(0);
      expect(report.currentHeapMb).toBe(0);
    });
  });

  describe('TimeSliceScheduler', () => {
    let scheduler: TimeSliceScheduler;

    beforeEach(() => {
      scheduler = TimeSliceScheduler.getInstance();
      scheduler.clear();
    });

    it('interleaves tasks according to cadences: EVERY_FRAME, EVERY_2ND_FRAME, EVERY_4TH_FRAME, EVERY_8TH_FRAME', () => {
      let countFrame = 0;
      let count2nd = 0;
      let count4th = 0;
      let count8th = 0;

      scheduler.registerTask('task_1', 'EVERY_FRAME', () => countFrame++);
      scheduler.registerTask('task_2', 'EVERY_2ND_FRAME', () => count2nd++);
      scheduler.registerTask('task_4', 'EVERY_4TH_FRAME', () => count4th++);
      scheduler.registerTask('task_8', 'EVERY_8TH_FRAME', () => count8th++);

      expect(scheduler.getTaskCount()).toBe(4);

      // Step 8 frames
      for (let i = 0; i < 8; i++) {
        scheduler.step(0.016);
      }

      expect(countFrame).toBe(8);
      expect(count2nd).toBe(4);
      expect(count4th).toBe(2);
      expect(count8th).toBe(1);

      expect(scheduler.getFrameIndex()).toBe(8);

      // Unregister
      expect(scheduler.unregisterTask('task_1')).toBe(true);
      expect(scheduler.getTaskCount()).toBe(3);
    });
  });

  describe('Enhanced PlatformBridge', () => {
    let bridge: PlatformBridge;

    beforeEach(() => {
      bridge = PlatformBridge.getInstance();
    });

    it('provides multi-platform capabilities with safe area insets and device types', () => {
      const caps = bridge.getCapabilities();
      expect(caps.platform).toBeDefined();
      expect(caps.deviceType).toBeDefined();
      expect(caps.safeArea).toBeDefined();
      expect(caps.battery).toBeDefined();
      expect(typeof caps.isOnline).toBe('boolean');
    });

    it('handles lifecycle state transitions and notifies subscribers', () => {
      let observedState = '';
      const unsubscribe = bridge.onLifecycleChange((state) => {
        observedState = state;
      });

      bridge.setLifecycleState('hidden');
      expect(bridge.getLifecycleState()).toBe('hidden');
      expect(observedState).toBe('hidden');

      bridge.setLifecycleState('active');
      expect(bridge.getLifecycleState()).toBe('active');
      expect(observedState).toBe('active');

      unsubscribe();
      bridge.setLifecycleState('suspended');
      expect(observedState).toBe('active'); // No longer updated
    });

    it('triggers haptic feedback gracefully if supported', () => {
      const result = bridge.triggerHaptic(50);
      expect(typeof result).toBe('boolean');
    });

    it('handles toggleFullscreen gracefully in headless environment', async () => {
      const result = await bridge.toggleFullscreen();
      expect(result).toBe(false);
    });
  });
});
