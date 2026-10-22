import { Vector2D } from './Vector2D';

export class AABB {
  public x: number;
  public y: number;
  public width: number;
  public height: number;

  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  public get minX(): number {
    return this.x;
  }
  public get maxX(): number {
    return this.x + this.width;
  }
  public get minY(): number {
    return this.y;
  }
  public get maxY(): number {
    return this.y + this.height;
  }
  public get centerX(): number {
    return this.x + this.width / 2;
  }
  public get centerY(): number {
    return this.y + this.height / 2;
  }

  public setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  public overlaps(other: AABB): boolean {
    return (
      this.minX < other.maxX &&
      this.maxX > other.minX &&
      this.minY < other.maxY &&
      this.maxY > other.minY
    );
  }

  public intersects(other: AABB): boolean {
    return this.overlaps(other);
  }

  public containsPoint(px: number, py: number): boolean {
    return (
      px >= this.minX &&
      px <= this.maxX &&
      py >= this.minY &&
      py <= this.maxY
    );
  }

  public getOverlap(other: AABB): Vector2D | null {
    if (!this.overlaps(other)) return null;

    const dx1 = other.maxX - this.minX;
    const dx2 = this.maxX - other.minX;
    const dy1 = other.maxY - this.minY;
    const dy2 = this.maxY - other.minY;

    const ox = dx1 < dx2 ? dx1 : -dx2;
    const oy = dy1 < dy2 ? dy1 : -dy2;

    if (Math.abs(ox) < Math.abs(oy)) {
      return new Vector2D(ox, 0);
    } else {
      return new Vector2D(0, oy);
    }
  }

  public clone(): AABB {
    return new AABB(this.x, this.y, this.width, this.height);
  }
}
