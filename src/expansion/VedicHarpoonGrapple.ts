import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';

export type GrappleState = 'IDLE' | 'FIRING' | 'ATTACHED' | 'RETRACTING';

export interface GrappleAnchorPoint {
  id: string;
  position: Vector2D;
  radius: number;
}

export class VedicHarpoonGrapple {
  public state: GrappleState = 'IDLE';
  public maxRange = 360;
  public projectileSpeed = 850;
  public reelSpeed = 260;

  public origin: Vector2D = new Vector2D(0, 0);
  public tipPosition: Vector2D = new Vector2D(0, 0);
  public fireDirection: Vector2D = new Vector2D(1, 0);
  public currentLength = 0;
  public attachedAnchor: GrappleAnchorPoint | null = null;
  public restLength = 0;
  public stiffness = 320;
  public damping = 0.88;

  public anchorPoints: GrappleAnchorPoint[] = [];

  constructor(maxRange = 360) {
    this.maxRange = maxRange;
  }

  public registerAnchor(id: string, x: number, y: number, radius = 16): void {
    this.anchorPoints.push({ id, position: new Vector2D(x, y), radius });
  }

  public fire(origin: Vector2D, target: Vector2D): boolean {
    if (this.state !== 'IDLE') return false;

    this.origin = new Vector2D(origin.x, origin.y);
    this.tipPosition = new Vector2D(origin.x, origin.y);
    this.fireDirection = target.subtract(origin).normalize();
    this.currentLength = 0;
    this.state = 'FIRING';
    return true;
  }

  public release(): Vector2D {
    this.state = 'IDLE';
    this.attachedAnchor = null;
    return this.fireDirection.multiply(this.reelSpeed);
  }

  public update(dt: number, playerPos: Vector2D): { pullForce: Vector2D; isAttached: boolean } {
    this.origin = new Vector2D(playerPos.x, playerPos.y);

    if (this.state === 'FIRING') {
      this.currentLength += this.projectileSpeed * dt;
      const offset = this.fireDirection.multiply(this.currentLength);
      this.tipPosition = new Vector2D(this.origin.x + offset.x, this.origin.y + offset.y);

      // Check collision with registered anchor points using swept ray projection
      for (const anchor of this.anchorPoints) {
        const toAnchor = anchor.position.subtract(this.origin);
        const proj = toAnchor.dot(this.fireDirection);
        const perpDistSq = toAnchor.magnitudeSquared() - proj * proj;
        const thresh = anchor.radius + 12;

        if (proj >= 0 && proj <= this.currentLength && perpDistSq <= thresh * thresh) {
          this.state = 'ATTACHED';
          this.attachedAnchor = anchor;
          this.tipPosition = new Vector2D(anchor.position.x, anchor.position.y);
          this.restLength = this.origin.distanceTo(this.tipPosition);
          break;
        }
      }

      if (this.currentLength >= this.maxRange && this.state === 'FIRING') {
        this.state = 'RETRACTING';
      }
    } else if (this.state === 'RETRACTING') {
      this.currentLength -= this.projectileSpeed * 1.5 * dt;
      if (this.currentLength <= 0) {
        this.state = 'IDLE';
      } else {
        const offset = this.fireDirection.multiply(this.currentLength);
        this.tipPosition = new Vector2D(this.origin.x + offset.x, this.origin.y + offset.y);
      }
    } else if (this.state === 'ATTACHED' && this.attachedAnchor) {
      this.tipPosition = new Vector2D(this.attachedAnchor.position.x, this.attachedAnchor.position.y);
      const currentDist = this.origin.distanceTo(this.tipPosition);

      // Reel in actively
      this.restLength = Math.max(40, this.restLength - this.reelSpeed * dt);

      const delta = currentDist - this.restLength;
      if (delta > 0) {
        const pullDir = this.tipPosition.subtract(this.origin).normalize();
        const forceMagnitude = delta * this.stiffness * this.damping;
        return { pullForce: pullDir.multiply(forceMagnitude * dt), isAttached: true };
      }
      return { pullForce: new Vector2D(0, 0), isAttached: true };
    }

    return { pullForce: new Vector2D(0, 0), isAttached: false };
  }

  public render(renderer: IRenderer): void {
    // Draw anchor points
    for (const a of this.anchorPoints) {
      renderer.drawCircle(a.position.x, a.position.y, a.radius, '#2c3e50', '#f39c12');
      renderer.drawCircle(a.position.x, a.position.y, 4, '#f1c40f');
    }

    if (this.state === 'IDLE') return;

    // Draw Harpoon cable
    const ctx = renderer.getContext();
    ctx.save();
    ctx.strokeStyle = this.state === 'ATTACHED' ? '#ffd700' : '#d4af37';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(this.origin.x, this.origin.y);
    ctx.lineTo(this.tipPosition.x, this.tipPosition.y);
    ctx.stroke();

    // Harpoon golden head
    renderer.drawCircle(this.tipPosition.x, this.tipPosition.y, 6, '#ffcc00', '#ffffff');
    ctx.restore();
  }
}
