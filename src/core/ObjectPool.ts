export interface Poolable {
  reset(): void;
}

export class ObjectPool<T extends Poolable> {
  private factory: () => T;
  private pool: T[] = [];
  private activeCount = 0;
  private highWaterMark = 0;
  private maxCapacity: number;

  constructor(factory: () => T, initialSize = 32, maxCapacity = 2048) {
    this.factory = factory;
    this.maxCapacity = maxCapacity;
    this.preallocate(initialSize);
  }

  public preallocate(count: number): void {
    const toCreate = Math.min(count, this.maxCapacity - this.pool.length);
    for (let i = 0; i < toCreate; i++) {
      this.pool.push(this.factory());
    }
  }

  public borrow(): T {
    let item: T;
    if (this.pool.length > 0) {
      item = this.pool.pop()!;
    } else {
      item = this.factory();
    }

    this.activeCount++;
    if (this.activeCount > this.highWaterMark) {
      this.highWaterMark = this.activeCount;
    }

    return item;
  }

  public release(item: T): void {
    if (this.pool.length < this.maxCapacity) {
      item.reset();
      this.pool.push(item);
    }
    if (this.activeCount > 0) {
      this.activeCount--;
    }
  }

  public releaseAll(items: T[]): void {
    for (let i = 0; i < items.length; i++) {
      this.release(items[i]);
    }
  }

  public getActiveCount(): number {
    return this.activeCount;
  }

  public getAvailableCount(): number {
    return this.pool.length;
  }

  public getHighWaterMark(): number {
    return this.highWaterMark;
  }

  public clear(): void {
    this.pool = [];
    this.activeCount = 0;
  }
}
