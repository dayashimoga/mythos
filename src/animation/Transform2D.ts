import { Vector2D } from '../physics/Vector2D';

export class Transform2D {
  public position: Vector2D;
  public rotation: number; // in radians
  public scale: Vector2D;

  constructor(x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1) {
    this.position = new Vector2D(x, y);
    this.rotation = rotation;
    this.scale = new Vector2D(scaleX, scaleY);
  }

  public clone(): Transform2D {
    return new Transform2D(
      this.position.x,
      this.position.y,
      this.rotation,
      this.scale.x,
      this.scale.y
    );
  }

  public copyFrom(other: Transform2D): this {
    this.position.x = other.position.x;
    this.position.y = other.position.y;
    this.rotation = other.rotation;
    this.scale.x = other.scale.x;
    this.scale.y = other.scale.y;
    return this;
  }

  public set(x: number, y: number, rotation = 0, scaleX = 1, scaleY = 1): this {
    this.position.x = x;
    this.position.y = y;
    this.rotation = rotation;
    this.scale.x = scaleX;
    this.scale.y = scaleY;
    return this;
  }

  public lerp(target: Transform2D, t: number): Transform2D {
    const clampedT = Math.max(0, Math.min(1, t));
    // Shortest-arc angle interpolation
    let diff = (target.rotation - this.rotation) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;

    return new Transform2D(
      this.position.x + (target.position.x - this.position.x) * clampedT,
      this.position.y + (target.position.y - this.position.y) * clampedT,
      this.rotation + diff * clampedT,
      this.scale.x + (target.scale.x - this.scale.x) * clampedT,
      this.scale.y + (target.scale.y - this.scale.y) * clampedT
    );
  }

  /**
   * Transforms a local point into the space defined by this transform.
   */
  public transformPoint(localPoint: Vector2D): Vector2D {
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    const scaledX = localPoint.x * this.scale.x;
    const scaledY = localPoint.y * this.scale.y;

    const rotatedX = scaledX * cos - scaledY * sin;
    const rotatedY = scaledX * sin + scaledY * cos;

    return new Vector2D(
      rotatedX + this.position.x,
      rotatedY + this.position.y
    );
  }

  /**
   * Inverses a point from parent/world space into this local space.
   */
  public inverseTransformPoint(worldPoint: Vector2D): Vector2D {
    const dx = worldPoint.x - this.position.x;
    const dy = worldPoint.y - this.position.y;
    const cos = Math.cos(-this.rotation);
    const sin = Math.sin(-this.rotation);

    const rotX = dx * cos - dy * sin;
    const rotY = dx * sin + dy * cos;

    const safeScaleX = this.scale.x !== 0 ? this.scale.x : 1;
    const safeScaleY = this.scale.y !== 0 ? this.scale.y : 1;

    return new Vector2D(rotX / safeScaleX, rotY / safeScaleY);
  }

  /**
   * Multiplies parent world transform by child local transform to obtain child world transform.
   */
  public static combine(parent: Transform2D, child: Transform2D): Transform2D {
    const pWorld = parent.transformPoint(child.position);
    const rotWorld = parent.rotation + child.rotation;
    const scaleWorld = new Vector2D(
      parent.scale.x * child.scale.x,
      parent.scale.y * child.scale.y
    );

    return new Transform2D(pWorld.x, pWorld.y, rotWorld, scaleWorld.x, scaleWorld.y);
  }
}
