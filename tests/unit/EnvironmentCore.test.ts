import { describe, it, expect, beforeEach } from 'vitest';
import { ChunkManager } from '../../src/environment/ChunkManager';
import { LightingEngine, TIME_PRESETS } from '../../src/environment/LightingEngine';
import { AtmosphericSystem } from '../../src/environment/AtmosphericSystem';
import { EnvironmentAssets } from '../../src/environment/EnvironmentAssets';
import { Camera } from '../../src/render/Camera';
import { AABB } from '../../src/physics/AABB';
import { CollisionLayer, LODLevel } from '../../src/environment/EnvironmentTypes';

describe('Environment Core: ChunkManager, LightingEngine & AtmosphericSystem', () => {
  describe('ChunkManager Spatial Partitioning & Culling', () => {
    let chunkManager: ChunkManager;

    beforeEach(() => {
      chunkManager = new ChunkManager(-2000, -1600, 2000, 1600, 500);
    });

    it('initializes grid chunks spanning the entire world bounds', () => {
      expect(chunkManager.cols).toBe(8);
      expect(chunkManager.rows).toBe(7);
      expect(chunkManager.totalChunksCount).toBe(56);
      expect(chunkManager.getChunkList().length).toBe(56);
    });

    it('retrieves correct chunk by position or returns null if out of bounds', () => {
      const centerChunk = chunkManager.getChunkAtPosition(0, 0);
      expect(centerChunk).not.toBeNull();
      expect(centerChunk?.bounds.containsPoint(0, 0)).toBe(true);

      const outChunk = chunkManager.getChunkAtPosition(5000, 5000);
      expect(outChunk).toBeNull();
    });

    it('adds and removes environment objects into intersecting chunks', () => {
      const prop = {
        id: 'test_shrine',
        layer: CollisionLayer.TERRAIN_SOLID,
        bounds: new AABB(-50, -50, 100, 100),
        zoneId: 'Center',
        render: () => {},
      };

      chunkManager.addObject(prop);
      expect(chunkManager.totalObjectsCount).toBe(1);

      const queried = chunkManager.getObjectsInAABB(new AABB(-100, -100, 200, 200));
      expect(queried.length).toBe(1);
      expect(queried[0].id).toBe('test_shrine');

      chunkManager.removeObject('test_shrine');
      expect(chunkManager.totalObjectsCount).toBe(0);
      expect(chunkManager.getObjectsInAABB(new AABB(-100, -100, 200, 200)).length).toBe(0);
    });

    it('updates frustum culling and assigns appropriate LOD based on distance', () => {
      const prop1 = {
        id: 'near_prop',
        layer: CollisionLayer.TERRAIN_SOLID,
        bounds: new AABB(0, 0, 40, 40),
        zoneId: 'Center',
        render: () => {},
      };
      const prop2 = {
        id: 'far_prop',
        layer: CollisionLayer.TERRAIN_SOLID,
        bounds: new AABB(1800, 1400, 40, 40),
        zoneId: 'Edge',
        render: () => {},
      };

      chunkManager.addObject(prop1);
      chunkManager.addObject(prop2);

      const camera = new Camera(1280, 720);
      camera.position.set(0, 0);

      const visibleChunks = chunkManager.updateCullingAndLOD(camera);

      // Frustum culling must only keep chunks overlapping the expanded camera viewport
      expect(visibleChunks.length).toBeGreaterThan(0);
      expect(visibleChunks.length).toBeLessThan(chunkManager.totalChunksCount);
      expect(chunkManager.culledObjectsCount).toBe(1);
      expect(chunkManager.renderedObjectsCount).toBe(1);

      // Close chunk has LOD0
      const centerChunk = chunkManager.getChunkAtPosition(0, 0);
      expect(centerChunk?.lodLevel).toBe(LODLevel.LOD0_DETAILED);
    });

    it('handles instanced grass and cobble additions and rendering batches', () => {
      chunkManager.addInstancedGrass(100, 100, 14);
      chunkManager.addInstancedCobble(100, 100, 6, '#334455');

      const camera = new Camera(1280, 720);
      camera.position.set(100, 100);
      const visible = chunkManager.updateCullingAndLOD(camera);

      const ctx = {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        moveTo: () => {},
        quadraticCurveTo: () => {},
      } as unknown as CanvasRenderingContext2D;

      expect(() => {
        chunkManager.renderInstancedDecorations(ctx, visible, 1.0);
      }).not.toThrow();
    });
  });

  describe('LightingEngine Multi-Source 2D Shading', () => {
    let lighting: LightingEngine;

    beforeEach(() => {
      lighting = new LightingEngine();
    });

    it('manages 5 distinct time-of-day presets with ambient illumination factors', () => {
      expect(lighting.getTimeOfDay()).toBe('NOON');
      expect(lighting.getAmbientConfig().lightFactor).toBe(0.85);

      const next = lighting.cycleTimeOfDay();
      expect(next).toBe('SUNSET');
      expect(lighting.getAmbientConfig().skyColor).toBe('#FF5533');

      lighting.setTimeOfDay('NIGHT');
      expect(lighting.getAmbientConfig().lightFactor).toBe(0.15);
      expect(TIME_PRESETS.NIGHT.label).toContain('Night');
    });

    it('registers, queries, and clears dynamic point lights', () => {
      lighting.addLight({
        id: 'brazier_alpha',
        x: 100,
        y: 200,
        radius: 180,
        color: '#FFA500',
        intensity: 0.9,
        flickerSpeed: 6,
      });

      expect(lighting.getLight('brazier_alpha')).toBeDefined();
      expect(lighting.getAllLights().length).toBe(1);

      lighting.removeLight('brazier_alpha');
      expect(lighting.getLight('brazier_alpha')).toBeUndefined();

      lighting.addLight({ id: 'l1', x: 0, y: 0, radius: 50, color: '#FFF', intensity: 1 });
      lighting.clearLights();
      expect(lighting.getAllLights().length).toBe(0);
    });

    it('computes organic multi-frequency flame flicker scale', () => {
      const light = {
        id: 'flicker_light',
        x: 0,
        y: 0,
        radius: 100,
        color: '#FF8800',
        intensity: 1,
        flickerSpeed: 8,
        flickerAmount: 0.1,
      };

      const scale1 = lighting.getFlickerScale(light, 0.5);
      const scale2 = lighting.getFlickerScale(light, 1.5);

      expect(scale1).toBeGreaterThan(0.8);
      expect(scale1).toBeLessThan(1.2);
      expect(scale1).not.toBe(scale2);

      // Light with no flicker speed returns constant 1.0
      expect(lighting.getFlickerScale({ id: 'static', x: 0, y: 0, radius: 50, color: '#FFF', intensity: 1 }, 2)).toBe(1.0);
    });

    it('executes lighting render pass with radial cutouts and additive glow', () => {
      lighting.addLight({
        id: 'test_light',
        x: 0,
        y: 0,
        radius: 200,
        color: '#FFD700',
        intensity: 0.8,
        flickerSpeed: 5,
      });

      const camera = new Camera(1280, 720);
      camera.position.set(0, 0);

      const fakeGrad = {
        addColorStop: () => {},
      };

      const ctx = {
        save: () => {},
        restore: () => {},
        fillStyle: '',
        globalCompositeOperation: '',
        fillRect: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        createRadialGradient: () => fakeGrad,
      } as unknown as CanvasRenderingContext2D;

      expect(() => {
        lighting.renderLightingPass(ctx, camera, 0.5);
      }).not.toThrow();

      // Disabled lighting pass bypasses execution
      lighting.isEnabled = false;
      expect(() => {
        lighting.renderLightingPass(ctx, camera, 0.5);
      }).not.toThrow();
    });
  });

  describe('AtmosphericSystem Weather & Particles', () => {
    let atmospheric: AtmosphericSystem;

    beforeEach(() => {
      atmospheric = new AtmosphericSystem();
    });

    it('cycles between weather presets and reconfigures particle dynamics', () => {
      expect(atmospheric.getWeather()).toBe('SOLAR_CLEAR');

      const next1 = atmospheric.cycleWeather();
      expect(next1).toBe('MONSOON_MIST');

      const next2 = atmospheric.cycleWeather();
      expect(next2).toBe('CHASM_EMBERS');

      const next3 = atmospheric.cycleWeather();
      expect(next3).toBe('VALLEY_WIND');

      const next4 = atmospheric.cycleWeather();
      expect(next4).toBe('SOLAR_CLEAR');
    });

    it('updates particle positions and wraps around viewport', () => {
      const camera = new Camera(1280, 720);
      camera.position.set(0, 0);

      expect(() => {
        atmospheric.update(0.016, camera);
      }).not.toThrow();
    });

    it('renders weather overlays for all presets without exceptions', () => {
      const camera = new Camera(1280, 720);
      camera.position.set(0, 0);

      const ctx = {
        save: () => {},
        restore: () => {},
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        globalAlpha: 1,
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        closePath: () => {},
        fill: () => {},
        stroke: () => {},
        arc: () => {},
        ellipse: () => {},
      } as unknown as CanvasRenderingContext2D;

      const presets = ['SOLAR_CLEAR', 'MONSOON_MIST', 'CHASM_EMBERS', 'VALLEY_WIND'] as const;
      for (const p of presets) {
        atmospheric.setWeather(p);
        expect(() => {
          atmospheric.render(ctx, camera, 1.0);
        }).not.toThrow();
      }

      // Disabled weather
      atmospheric.isEnabled = false;
      expect(() => {
        atmospheric.render(ctx, camera, 1.0);
      }).not.toThrow();
    });
  });

  describe('EnvironmentAssets Procedural Geometry & Parallax Backdrops', () => {
    const fakeGrad = { addColorStop: () => {} };
    const ctx = {
      save: () => {},
      restore: () => {},
      translate: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      quadraticCurveTo: () => {},
      arc: () => {},
      ellipse: () => {},
      roundRect: () => {},
      fill: () => {},
      stroke: () => {},
      fillRect: () => {},
      strokeRect: () => {},
      fillText: () => {},
      createLinearGradient: () => fakeGrad,
      createRadialGradient: () => fakeGrad,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: '',
    } as unknown as CanvasRenderingContext2D;

    it('renders all architectural and natural procedural assets across LODs', () => {
      // 1. Torana Gate
      expect(() => {
        EnvironmentAssets.drawToranaGate(ctx, 0, 0, 240, 180, LODLevel.LOD0_DETAILED);
        EnvironmentAssets.drawToranaGate(ctx, 0, 0, 240, 180, LODLevel.LOD2_FAR);
      }).not.toThrow();

      // 2. Banyan Tree
      expect(() => {
        EnvironmentAssets.drawBanyanTree(ctx, 0, 0, 140, 1.0, LODLevel.LOD0_DETAILED);
        EnvironmentAssets.drawBanyanTree(ctx, 0, 0, 140, 1.0, LODLevel.LOD2_FAR);
      }).not.toThrow();

      // 3. Kalyani Stepped Ghat
      expect(() => {
        EnvironmentAssets.drawKalyaniGhat(ctx, 0, 0, 360, 240, 1.0, LODLevel.LOD0_DETAILED);
        EnvironmentAssets.drawKalyaniGhat(ctx, 0, 0, 360, 240, 1.0, LODLevel.LOD2_FAR);
      }).not.toThrow();

      // 4. Shikhara Temple
      expect(() => {
        EnvironmentAssets.drawShikharaTemple(ctx, 0, 0, 280, 340, LODLevel.LOD0_DETAILED);
      }).not.toThrow();

      // 5. Ashoka Pillar
      expect(() => {
        EnvironmentAssets.drawAshokaPillar(ctx, 0, 0, 160, LODLevel.LOD0_DETAILED);
        EnvironmentAssets.drawAshokaPillar(ctx, 0, 0, 160, LODLevel.LOD2_FAR);
      }).not.toThrow();

      // 6. Brass Brazier (lit and unlit)
      expect(() => {
        EnvironmentAssets.drawBrazier(ctx, 0, 0, true, 1.0, LODLevel.LOD0_DETAILED);
        EnvironmentAssets.drawBrazier(ctx, 0, 0, false, 1.0, LODLevel.LOD0_DETAILED);
      }).not.toThrow();

      // 7. Suspension Bridge
      expect(() => {
        EnvironmentAssets.drawSuspensionBridge(ctx, 0, 0, 220, 70, LODLevel.LOD0_DETAILED);
      }).not.toThrow();

      // 8. Basalt Chasm
      expect(() => {
        EnvironmentAssets.drawBasaltChasm(ctx, 0, 0, 400, 90, 1.0, LODLevel.LOD0_DETAILED);
      }).not.toThrow();

      // 9. Prayer Wheel
      expect(() => {
        EnvironmentAssets.drawPrayerWheel(ctx, 0, 0, 0.5, LODLevel.LOD0_DETAILED);
      }).not.toThrow();
    });

    it('renders multi-layer parallax horizons for all time of day presets', () => {
      const camera = new Camera(1280, 720);
      camera.position.set(0, 0);

      const presets = ['DAWN', 'NOON', 'SUNSET', 'NIGHT', 'ECLIPSE'] as const;
      for (const timeOfDay of presets) {
        expect(() => {
          EnvironmentAssets.drawParallaxBackdrop(ctx, camera, timeOfDay, 1.0);
        }).not.toThrow();
      }
    });
  });
});

