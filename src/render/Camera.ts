import { Vector2D } from '../physics/Vector2D';

export interface ViewportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Camera {
  public position: Vector2D;
  public target: Vector2D | null = null;
  public lerpSpeed = 5.0;
  public zoom = 1.0;

  // Viewport bounds
  public viewportWidth: number;
  public viewportHeight: number;

  // World bounds for clamping
  public worldMinX = -2000;
  public worldMaxX = 2000;
  public worldMinY = -2000;
  public worldMaxY = 2000;

  // Screen shake
  private shakeIntensity = 0;
  private shakeDuration = 0;
  private shakeTimer = 0;
  public shakeOffset: Vector2D = new Vector2D(0, 0);

  constructor(viewportWidth = 1280, viewportHeight = 720) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.position = new Vector2D(viewportWidth / 2, viewportHeight / 2);
  }

  public setTarget(target: Vector2D | null): void {
    this.target = target;
  }

  public setZoom(zoom: number): void {
    this.zoom = zoom;
  }

  public setWorldBounds(minX: number, minY: number, maxX: number, maxY: number): void {
    this.worldMinX = minX;
    this.worldMinY = minY;
    this.worldMaxX = maxX;
    this.worldMaxY = maxY;
  }

  public triggerShake(intensity: number, durationSeconds: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = durationSeconds;
    this.shakeTimer = durationSeconds;
  }

  public update(dt: number): void {
    // Follow target
    if (this.target) {
      const targetX = this.target.x;
      const targetY = this.target.y;

      const factor = 1 - Math.exp(-this.lerpSpeed * dt);
      this.position.x += (targetX - this.position.x) * factor;
      this.position.y += (targetY - this.position.y) * factor;
    }

    // Handle screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const progress = Math.max(0, this.shakeTimer / this.shakeDuration);
      const currentIntensity = this.shakeIntensity * progress;
      const angle = Math.random() * Math.PI * 2;
      this.shakeOffset.x = Math.cos(angle) * currentIntensity;
      this.shakeOffset.y = Math.sin(angle) * currentIntensity;
    } else {
      this.shakeOffset.set(0, 0);
      this.shakeIntensity = 0;
    }
  }

  public worldToScreen(worldPos: Vector2D): Vector2D {
    const screenX = (worldPos.x - this.position.x) * this.zoom + this.viewportWidth / 2 + this.shakeOffset.x;
    const screenY = (worldPos.y - this.position.y) * this.zoom + this.viewportHeight / 2 + this.shakeOffset.y;
    return new Vector2D(screenX, screenY);
  }

  public screenToWorld(screenPos: Vector2D): Vector2D {
    const worldX = (screenPos.x - this.viewportWidth / 2 - this.shakeOffset.x) / this.zoom + this.position.x;
    const worldY = (screenPos.y - this.viewportHeight / 2 - this.shakeOffset.y) / this.zoom + this.position.y;
    return new Vector2D(worldX, worldY);
  }

  public getVisibleBounds(): ViewportBounds {
    const halfW = (this.viewportWidth / 2) / this.zoom;
    const halfH = (this.viewportHeight / 2) / this.zoom;
    return {
      x: this.position.x - halfW,
      y: this.position.y - halfH,
      width: halfW * 2,
      height: halfH * 2,
    };
  }
}
