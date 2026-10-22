import { AABB } from './AABB';
import { SpatialHashGrid } from './SpatialHash';

export type ColliderType = 'solid' | 'trigger';

export interface Collider {
  id: string;
  bounds: AABB;
  type: ColliderType;
  tag: string;
  isStatic: boolean;
  onCollide?: (other: Collider) => void;
}

export class CollisionSystem {
  private colliders: Map<string, Collider> = new Map();
  private spatialGrid: SpatialHashGrid<Collider>;
  private checkCount = 0;

  constructor(cellSize = 128) {
    this.spatialGrid = new SpatialHashGrid<Collider>(cellSize);
  }

  public register(collider: Collider): void {
    this.colliders.set(collider.id, collider);
  }

  public unregister(id: string): void {
    this.colliders.delete(id);
  }

  public clear(): void {
    this.colliders.clear();
    this.spatialGrid.clear();
  }

  public update(): number {
    this.checkCount = 0;
    this.spatialGrid.clear();

    for (const collider of this.colliders.values()) {
      this.spatialGrid.insert(collider);
    }

    const checkedPairs = new Set<string>();

    for (const a of this.colliders.values()) {
      const candidates = this.spatialGrid.retrieveNearby(a);

      for (const b of candidates) {
        this.checkCount++;
        const pairKey = a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`;
        if (checkedPairs.has(pairKey)) continue;
        checkedPairs.add(pairKey);

        if (a.bounds.overlaps(b.bounds)) {
          if (a.onCollide) a.onCollide(b);
          if (b.onCollide) b.onCollide(a);

          // Resolve collision if one is dynamic solid and other is solid
          if (a.type === 'solid' && b.type === 'solid') {
            this.resolveSolidCollision(a, b);
          }
        }
      }
    }

    return this.checkCount;
  }

  private resolveSolidCollision(a: Collider, b: Collider): void {
    if (a.isStatic && b.isStatic) return;

    const overlap = a.bounds.getOverlap(b.bounds);
    if (!overlap) return;

    if (!a.isStatic && b.isStatic) {
      a.bounds.x += overlap.x;
      a.bounds.y += overlap.y;
    } else if (a.isStatic && !b.isStatic) {
      b.bounds.x -= overlap.x;
      b.bounds.y -= overlap.y;
    } else {
      // Both dynamic
      a.bounds.x += overlap.x * 0.5;
      a.bounds.y += overlap.y * 0.5;
      b.bounds.x -= overlap.x * 0.5;
      b.bounds.y -= overlap.y * 0.5;
    }
  }

  public getCheckCount(): number {
    return this.checkCount;
  }

  public getColliderCount(): number {
    return this.colliders.size;
  }
}
