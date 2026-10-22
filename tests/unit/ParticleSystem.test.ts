import { describe, it, expect } from 'vitest';
import { ParticleSystem } from '../../src/render/ParticleSystem';
import { Vector2D } from '../../src/physics/Vector2D';

describe('ParticleSystem Pooled Engine', () => {
  it('emits particles and increments active counter', () => {
    const ps = new ParticleSystem(100);
    expect(ps.getActiveCount()).toBe(0);

    ps.emit(0, 0, 10, 10, '#FFB703', 4, 1.0);
    expect(ps.getActiveCount()).toBe(1);

    ps.emitBurst(0, 0, 20, '#FB8500');
    expect(ps.getActiveCount()).toBe(21);
  });

  it('updates position, applies drag, and expires particles', () => {
    const ps = new ParticleSystem(50);
    ps.emit(0, 0, 100, 0, '#FFF', 2, 0.1);

    ps.update(0.05);
    expect(ps.getActiveCount()).toBe(1);

    // After 0.1s life expires
    ps.update(0.06);
    expect(ps.getActiveCount()).toBe(0);
  });

  it('renders active particles with canvas context', () => {
    const ps = new ParticleSystem(50);
    ps.emit(10, 20, 0, 0, '#FFD166', 3, 1.0);

    const mockCtx = {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      globalAlpha: 1,
      fillStyle: '',
    } as unknown as CanvasRenderingContext2D;

    ps.render(mockCtx, new Vector2D(0, 0));
    expect(ps.getActiveCount()).toBe(1);
  });

  it('clears all active particles', () => {
    const ps = new ParticleSystem(50);
    ps.emitBurst(0, 0, 15, '#FFF');
    expect(ps.getActiveCount()).toBe(15);

    ps.clear();
    expect(ps.getActiveCount()).toBe(0);
  });
});
