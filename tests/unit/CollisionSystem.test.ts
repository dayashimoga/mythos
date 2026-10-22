import { describe, it, expect, vi } from 'vitest';
import { CollisionSystem, Collider } from '../../src/physics/CollisionSystem';
import { AABB } from '../../src/physics/AABB';

describe('CollisionSystem', () => {
  it('registers and unregisters colliders', () => {
    const sys = new CollisionSystem(128);
    const col: Collider = {
      id: 'c1',
      bounds: new AABB(0, 0, 30, 30),
      type: 'solid',
      tag: 'player',
      isStatic: false,
    };

    sys.register(col);
    expect(sys.getColliderCount()).toBe(1);

    sys.unregister('c1');
    expect(sys.getColliderCount()).toBe(0);
  });

  it('triggers collision callbacks on overlap', () => {
    const sys = new CollisionSystem(128);
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    const col1: Collider = {
      id: 'c1',
      bounds: new AABB(0, 0, 50, 50),
      type: 'trigger',
      tag: 'player',
      isStatic: false,
      onCollide: cb1,
    };
    const col2: Collider = {
      id: 'c2',
      bounds: new AABB(25, 25, 50, 50),
      type: 'trigger',
      tag: 'shard',
      isStatic: true,
      onCollide: cb2,
    };

    sys.register(col1);
    sys.register(col2);

    const checks = sys.update();
    expect(checks).toBeGreaterThan(0);
    expect(cb1).toHaveBeenCalledWith(col2);
    expect(cb2).toHaveBeenCalledWith(col1);
  });

  it('resolves penetration between dynamic solid and static solid', () => {
    const sys = new CollisionSystem(128);
    const dynamicPlayer: Collider = {
      id: 'player',
      bounds: new AABB(40, 10, 50, 50),
      type: 'solid',
      tag: 'player',
      isStatic: false,
    };
    const staticWall: Collider = {
      id: 'wall',
      bounds: new AABB(0, 0, 50, 50),
      type: 'solid',
      tag: 'wall',
      isStatic: true,
    };

    sys.register(dynamicPlayer);
    sys.register(staticWall);

    sys.update();

    // Wall is static at (0, 0, 50, 50), player is pushed out
    expect(dynamicPlayer.bounds.overlaps(staticWall.bounds)).toBe(false);
    expect(staticWall.bounds.x).toBe(0);
  });
});
