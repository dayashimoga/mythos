import { describe, it, expect } from 'vitest';
import { SpatialHashGrid } from '../../src/physics/SpatialHash';
import { AABB } from '../../src/physics/AABB';

describe('SpatialHashGrid Partitioning', () => {
  it('inserts and retrieves items across spatial cells', () => {
    const grid = new SpatialHashGrid(100);
    const item1 = { id: 'item1', bounds: new AABB(10, 10, 20, 20) };
    const item2 = { id: 'item2', bounds: new AABB(50, 50, 20, 20) };
    const distantItem = { id: 'distant', bounds: new AABB(500, 500, 20, 20) };

    grid.insert(item1);
    grid.insert(item2);
    grid.insert(distantItem);

    const nearby = grid.retrieveNearby(item1);
    expect(nearby).toContainEqual(item2);
    expect(nearby).not.toContainEqual(distantItem);
  });

  it('handles items spanning multiple grid boundaries', () => {
    const grid = new SpatialHashGrid(100);
    // Item spanning cell (0,0), (1,0), (0,1), (1,1)
    const largeItem = { id: 'large', bounds: new AABB(80, 80, 60, 60) };
    const cornerItem = { id: 'corner', bounds: new AABB(110, 110, 10, 10) };

    grid.insert(largeItem);
    grid.insert(cornerItem);

    const nearby = grid.retrieveNearby(largeItem);
    expect(nearby).toContainEqual(cornerItem);
  });

  it('clears all items cleanly', () => {
    const grid = new SpatialHashGrid(100);
    grid.insert({ id: 'item1', bounds: new AABB(0, 0, 10, 10) });
    expect(grid.getCellCount()).toBeGreaterThan(0);

    grid.clear();
    expect(grid.getCellCount()).toBe(0);
  });
});
