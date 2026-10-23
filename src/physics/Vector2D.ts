export class Vector2D {
  public x: number;
  public y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  public set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  public clone(): Vector2D {
    return new Vector2D(this.x, this.y);
  }

  public add(other: Vector2D): this {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  public sub(other: Vector2D): this {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  public scale(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  public dot(other: Vector2D): number {
    return this.x * other.x + this.y * other.y;
  }

  public magnitudeSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  public magnitude(): number {
    return Math.sqrt(this.magnitudeSquared());
  }

  public length(): number {
    return this.magnitude();
  }

  public subtract(other: Vector2D): Vector2D {
    return new Vector2D(this.x - other.x, this.y - other.y);
  }

  public multiply(scalar: number): Vector2D {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  public normalize(): this {
    const mag = this.magnitude();
    if (mag > 0.00001) {
      this.x /= mag;
      this.y /= mag;
    } else {
      this.x = 0;
      this.y = 0;
    }
    return this;
  }

  public distanceTo(other: Vector2D): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public distanceSquaredTo(other: Vector2D): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return dx * dx + dy * dy;
  }

  public lerp(target: Vector2D, t: number): this {
    this.x += (target.x - this.x) * t;
    this.y += (target.y - this.y) * t;
    return this;
  }

  public static add(a: Vector2D, b: Vector2D): Vector2D {
    return new Vector2D(a.x + b.x, a.y + b.y);
  }

  public static sub(a: Vector2D, b: Vector2D): Vector2D {
    return new Vector2D(a.x - b.x, a.y - b.y);
  }

  public static distance(a: Vector2D, b: Vector2D): number {
    return a.distanceTo(b);
  }

  public static lerp(a: Vector2D, b: Vector2D, t: number): Vector2D {
    return new Vector2D(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  }
}
