import { describe, it, expect, beforeEach } from 'vitest';
import { LayeredRenderer } from '../../src/render/LayeredRenderer';
import { RenderLayer, GraphicsQuality } from '../../src/render/RenderLayers';

describe('LayeredRenderer Architecture & Depth Sorting', () => {
  beforeEach(() => {
    LayeredRenderer.getInstance().clear();
    LayeredRenderer.getInstance().setQuality(GraphicsQuality.HIGH);
  });

  it('enqueues render tasks into discrete depth layers and executes in order', () => {
    const renderer = LayeredRenderer.getInstance();
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d')!;

    const executionLog: string[] = [];

    renderer.enqueue(RenderLayer.UI, 0, () => executionLog.push('UI'));
    renderer.enqueue(RenderLayer.BACKGROUND, 0, () => executionLog.push('BACKGROUND'));
    renderer.enqueue(RenderLayer.TERRAIN, 0, () => executionLog.push('TERRAIN'));
    renderer.enqueue(RenderLayer.ACTORS, 100, () => executionLog.push('ACTORS_100'));
    renderer.enqueue(RenderLayer.SHADOWS, 0, () => executionLog.push('SHADOWS'));

    renderer.flush(ctx);

    expect(executionLog).toEqual([
      'BACKGROUND',
      'TERRAIN',
      'SHADOWS',
      'ACTORS_100',
      'UI',
    ]);
  });

  it('performs automated Y-sorting within ACTORS and ARCHITECTURE layers', () => {
    const renderer = LayeredRenderer.getInstance();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const order: number[] = [];

    // Enqueue out-of-order Y positions
    renderer.enqueue(RenderLayer.ACTORS, 450, () => order.push(450));
    renderer.enqueue(RenderLayer.ACTORS, 120, () => order.push(120));
    renderer.enqueue(RenderLayer.ACTORS, 300, () => order.push(300));
    renderer.enqueue(RenderLayer.ACTORS, 80, () => order.push(80));

    renderer.flush(ctx);

    expect(order).toEqual([80, 120, 300, 450]);
  });

  it('manages dynamic point lights and executes lighting pass', () => {
    const renderer = LayeredRenderer.getInstance();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    renderer.addLight({
      id: 'brazier_1',
      x: 200,
      y: 300,
      radius: 150,
      color: '#FFB703',
      intensity: 0.8,
      flicker: true,
    });

    renderer.addLight({
      id: 'shard_light',
      x: 400,
      y: 400,
      radius: 100,
      color: '#00E5FF',
      intensity: 0.6,
      flicker: false,
    });

    expect(() => {
      renderer.flush(ctx);
    }).not.toThrow();

    const metrics = renderer.getMetrics();
    expect(metrics.flushTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('configures and respects graphics quality presets', () => {
    const renderer = LayeredRenderer.getInstance();

    renderer.setQuality(GraphicsQuality.LOW);
    expect(renderer.getQuality()).toBe(GraphicsQuality.LOW);
    expect(renderer.getProfile().shadows).toBe(false);
    expect(renderer.getProfile().lightShafts).toBe(false);
    expect(renderer.getProfile().maxDynamicLights).toBe(0);

    renderer.setQuality(GraphicsQuality.MEDIUM);
    expect(renderer.getProfile().shadows).toBe(true);
    expect(renderer.getProfile().lightShafts).toBe(false);

    renderer.setQuality(GraphicsQuality.HIGH);
    expect(renderer.getProfile().shadows).toBe(true);
    expect(renderer.getProfile().lightShafts).toBe(true);
    expect(renderer.getProfile().maxDynamicLights).toBe(8);

    renderer.setQuality(GraphicsQuality.ULTRA);
    expect(renderer.getProfile().maxDynamicLights).toBe(24);
  });

  it('correctly calculates frustum containment for culling', () => {
    const renderer = LayeredRenderer.getInstance();
    const camX = 500;
    const camY = 400;
    const vpW = 800;
    const vpH = 600;

    // Inside view
    expect(renderer.isInsideFrustum(500, 400, 50, camX, camY, vpW, vpH)).toBe(true);
    expect(renderer.isInsideFrustum(150, 200, 50, camX, camY, vpW, vpH)).toBe(true);

    // Far outside view
    expect(renderer.isInsideFrustum(1500, 400, 50, camX, camY, vpW, vpH)).toBe(false);
    expect(renderer.isInsideFrustum(500, -500, 50, camX, camY, vpW, vpH)).toBe(false);
  });

  it('renders decorative visual elements without throwing', () => {
    const renderer = LayeredRenderer.getInstance();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    expect(() => {
      renderer.drawContactShadow(ctx, 300, 300, 40, 20, 0.5);
      renderer.drawParallaxBackground(ctx, 'TEX_SANCTUM_SKY', 0, 0, 800, 600);
      renderer.drawLightShafts(ctx, 1.0, 400, 300, 800, 600);
      renderer.drawSprite(ctx, 'TEX_SANCTUM_ALTAR', 400, 300, 100, 100, 0.2, 0.9);
    }).not.toThrow();
  });
});
