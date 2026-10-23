import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';

export class VayuGliderMechanics {
  public isGliding = false;
  public gliderMaxFallSpeed = 45;
  public glideHorizontalSpeed = 190;

  public isDashing = false;
  public dashDuration = 0.22;
  public dashTimer = 0;
  public dashSpeed = 480;
  public dashCooldown = 1.2;
  public cooldownTimer = 0;
  public dashDirection = new Vector2D(1, 0);

  public stamina = 100;
  public maxStamina = 100;
  public staminaDrainRate = 12; // Stamina per sec while gliding

  public update(
    dt: number,
    velocity: Vector2D,
    inputDirection: Vector2D,
    jumpHeld: boolean
  ): { modifiedVelocity: Vector2D; isInvulnerable: boolean } {
    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;

    // Dash update
    if (this.isDashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
      return {
        modifiedVelocity: this.dashDirection.multiply(this.dashSpeed),
        isInvulnerable: true,
      };
    }

    // Glider logic: deploy if jump held and falling (positive Y in 2D top/down platformer context)
    if (jumpHeld && velocity.y > 0 && this.stamina > 5) {
      this.isGliding = true;
      this.stamina = Math.max(0, this.stamina - this.staminaDrainRate * dt);

      // Clamp vertical fall speed, preserve horizontal control
      const newVy = Math.min(velocity.y, this.gliderMaxFallSpeed);
      const newVx = inputDirection.x !== 0 ? inputDirection.x * this.glideHorizontalSpeed : velocity.x;

      return {
        modifiedVelocity: new Vector2D(newVx, newVy),
        isInvulnerable: false,
      };
    } else {
      this.isGliding = false;
      // Recover stamina when not gliding
      this.stamina = Math.min(this.maxStamina, this.stamina + 20 * dt);
      return {
        modifiedVelocity: velocity,
        isInvulnerable: false,
      };
    }
  }

  public triggerVayuGatiDash(direction: Vector2D): boolean {
    if (this.cooldownTimer > 0 || this.isDashing) return false;

    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.cooldownTimer = this.dashCooldown;
    this.dashDirection = direction.magnitudeSquared() > 0 ? direction.normalize() : new Vector2D(1, 0);
    this.isGliding = false;
    return true;
  }

  public render(renderer: IRenderer, playerPos: Vector2D): void {
    const ctx = renderer.getContext();

    if (this.isGliding) {
      // Golden / turquoise celestial glider wings
      ctx.save();
      ctx.strokeStyle = '#48cae4';
      ctx.fillStyle = 'rgba(72, 202, 228, 0.4)';
      ctx.lineWidth = 2;

      // Left wing
      ctx.beginPath();
      ctx.moveTo(playerPos.x, playerPos.y - 10);
      ctx.lineTo(playerPos.x - 36, playerPos.y - 24);
      ctx.lineTo(playerPos.x - 18, playerPos.y + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right wing
      ctx.beginPath();
      ctx.moveTo(playerPos.x, playerPos.y - 10);
      ctx.lineTo(playerPos.x + 36, playerPos.y - 24);
      ctx.lineTo(playerPos.x + 18, playerPos.y + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    } else if (this.isDashing) {
      // Sonic wind burst trail
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const trailEnd = playerPos.subtract(this.dashDirection.multiply(40));
      ctx.moveTo(trailEnd.x, trailEnd.y);
      ctx.lineTo(playerPos.x, playerPos.y);
      ctx.stroke();
      ctx.restore();
    }
  }
}
