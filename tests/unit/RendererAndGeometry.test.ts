import { describe, it, expect } from 'vitest';
import { CanvasRenderer } from '../../src/render/CanvasRenderer';
import { SacredGeometry } from '../../src/render/SacredGeometry';
import { AABB } from '../../src/physics/AABB';

describe('Renderer & Sacred Geometry Procedural Graphics', () => {
  it('executes CanvasRenderer drawing primitives', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const renderer = new CanvasRenderer(canvas);

    expect(() => {
      renderer.clear('#080C14');
      renderer.save();
      renderer.translate(10, 20);
      renderer.scale(1.2, 1.2);
      renderer.rotate(0.5);
      renderer.drawRect(0, 0, 100, 100, '#FFB703', '#FFFFFF');
      renderer.drawCircle(50, 50, 25, '#FB8500', '#00E5FF');
      renderer.drawText('Test Glyph', 50, 50, '16px serif', '#FFD166', 'center');
      renderer.drawAABB(new AABB(10, 10, 50, 50), '#00FF00');
      renderer.drawMandala(0, 0, 60, 8, 0.2, '#FFB703');
      renderer.beginWorldPass();
      renderer.endWorldPass();
      renderer.restore();
    }).not.toThrow();

    expect(renderer.getContext()).toBeDefined();
    expect(renderer.getCamera()).toBeDefined();
    expect(renderer.getViewport().width).toBe(1280);
  });

  it('generates procedural sacred geometry without errors', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    expect(() => {
      SacredGeometry.drawMandala(ctx, 100, 100, 80, 16, 0.4, '#FFB703', 2);
      SacredGeometry.drawSriYantraCentral(ctx, 100, 100, 50, '#FFD166', 0.8);
      SacredGeometry.drawRuneInscription(ctx, 'OM ASTRAAYA NAMAH', 100, 100);
    }).not.toThrow();
  });
});
