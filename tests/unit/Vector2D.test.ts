import { describe, it, expect } from 'vitest';
import { Vector2D } from '../../src/physics/Vector2D';

describe('Vector2D Math Library', () => {
  it('initializes with default and specific coordinates', () => {
    const v1 = new Vector2D();
    expect(v1.x).toBe(0);
    expect(v1.y).toBe(0);

    const v2 = new Vector2D(3, 4);
    expect(v2.x).toBe(3);
    expect(v2.y).toBe(4);
  });

  it('performs addition and subtraction with chaining', () => {
    const v = new Vector2D(10, 20);
    v.add(new Vector2D(5, -5));
    expect(v.x).toBe(15);
    expect(v.y).toBe(15);

    v.sub(new Vector2D(5, 5));
    expect(v.x).toBe(10);
    expect(v.y).toBe(10);
  });

  it('calculates magnitude and normalizes correctly', () => {
    const v = new Vector2D(3, 4);
    expect(v.magnitude()).toBe(5);
    expect(v.magnitudeSquared()).toBe(25);

    v.normalize();
    expect(v.x).toBeCloseTo(0.6);
    expect(v.y).toBeCloseTo(0.8);
    expect(v.magnitude()).toBeCloseTo(1);
  });

  it('handles zero vector normalization without NaN', () => {
    const v = new Vector2D(0, 0);
    v.normalize();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('performs dot product and scaling', () => {
    const a = new Vector2D(2, 3);
    const b = new Vector2D(4, 5);
    expect(a.dot(b)).toBe(2 * 4 + 3 * 5);

    a.scale(2);
    expect(a.x).toBe(4);
    expect(a.y).toBe(6);
  });

  it('calculates euclidean distance between vectors', () => {
    const a = new Vector2D(0, 0);
    const b = new Vector2D(6, 8);
    expect(a.distanceTo(b)).toBe(10);
    expect(a.distanceSquaredTo(b)).toBe(100);
    expect(Vector2D.distance(a, b)).toBe(10);
  });

  it('performs linear interpolation (lerp)', () => {
    const start = new Vector2D(0, 0);
    const target = new Vector2D(100, 200);
    start.lerp(target, 0.5);
    expect(start.x).toBe(50);
    expect(start.y).toBe(100);
  });

  it('supports static add and sub operations', () => {
    const a = new Vector2D(10, 20);
    const b = new Vector2D(5, 15);
    const sum = Vector2D.add(a, b);
    expect(sum.x).toBe(15);
    expect(sum.y).toBe(35);

    const diff = Vector2D.sub(a, b);
    expect(diff.x).toBe(5);
    expect(diff.y).toBe(5);
  });
});
