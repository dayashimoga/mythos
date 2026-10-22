import { AABB } from './AABB';

export interface SpatialItem {
  id: string;
  bounds: AABB;
}

export class SpatialHashGrid<T extends SpatialItem> {
  private cellSize: number;
  private grid: Map<string, Set<T>> = new Map();

  constructor(cellSize = 128) {
    this.cellSize = cellSize;
  }

  public clear(): void {
    this.grid.clear();
  }

  private hash(cellX: number, cellY: number): string {
    return `${cellX}:${cellY}`;
  }

  private getCellsForAABB(bounds: AABB): string[] {
    const minCellX = Math.floor(bounds.minX / this.cellSize);
    const maxCellX = Math.floor(bounds.maxX / this.cellSize);
    const minCellY = Math.floor(bounds.minY / this.cellSize);
    const maxCellY = Math.floor(bounds.maxY / this.cellSize);

    const keys: string[] = [];
    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        keys.push(this.hash(cx, cy));
      }
    }
    return keys;
  }

  public insert(item: T): void {
    const cells = this.getCellsForAABB(item.bounds);
    for (const key of cells) {
      if (!this.grid.has(key)) {
        this.grid.set(key, new Set());
      }
      this.grid.get(key)!.add(item);
    }
  }

  public retrieveNearby(item: T): T[] {
    const nearby = new Set<T>();
    const cells = this.getCellsForAABB(item.bounds);

    for (const key of cells) {
      const itemsInCell = this.grid.get(key);
      if (itemsInCell) {
        for (const other of itemsInCell) {
          if (other.id !== item.id) {
            nearby.add(other);
          }
        }
      }
    }

    return Array.from(nearby);
  }

  public getCellCount(): number {
    return this.grid.size;
  }
}
