import { describe, it, expect } from 'vitest';
import { AABB } from '../../src/physics/AABB';

describe('AABB Bounding Box', () => {
  it('correctly calculates boundaries and centers', () => {
    const box = new AABB(10, 20, 30, 40);
    expect(box.minX).toBe(10);
    expect(box.maxX).toBe(40);
    expect(box.minY).toBe(20);
    expect(box.maxY).toBe(60);
    expect(box.centerX).toBe(25);
    expect(box.centerY).toBe(40);
  });

  it('detects point containment', () => {
    const box = new AABB(0, 0, 100, 100);
    expect(box.containsPoint(50, 50)).toBe(true);
    expect(box.containsPoint(0, 0)).toBe(true);
    expect(box.containsPoint(100, 100)).toBe(true);
    expect(box.containsPoint(101, 50)).toBe(false);
    expect(box.containsPoint(-1, 50)).toBe(false);
  });

  it('detects bounding box overlaps', () => {
    const a = new AABB(0, 0, 50, 50);
    const b = new AABB(25, 25, 50, 50);
    const c = new AABB(100, 100, 50, 50);

    expect(a.overlaps(b)).toBe(true);
    expect(b.overlaps(a)).toBe(true);
    expect(a.overlaps(c)).toBe(false);
  });

  it('calculates minimum translation vector (overlap)', () => {
    const a = new AABB(0, 0, 50, 50);
    const b = new AABB(40, 10, 50, 50);

    const overlap = a.getOverlap(b);
    expect(overlap).not.toBeNull();
    // Overlap on X is 10, on Y is 40 -> separation vector on X
    expect(overlap!.x).toBe(-10);
    expect(overlap!.y).toBe(0);
  });

  it('returns null overlap when boxes do not intersect', () => {
    const a = new AABB(0, 0, 20, 20);
    const b = new AABB(50, 50, 20, 20);
    expect(a.getOverlap(b)).toBeNull();
  });

  it('sets position and clones properly', () => {
    const box = new AABB(0, 0, 40, 40);
    box.setPosition(100, 200);
    expect(box.x).toBe(100);
    expect(box.y).toBe(200);

    const clone = box.clone();
    expect(clone.x).toBe(100);
    expect(clone.width).toBe(40);
  });
});
