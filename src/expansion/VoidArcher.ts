import { Entity } from '../entities/Entity';
import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';
import { Projectile } from '../entities/Projectile';

export type VoidArcherState = 'IDLE' | 'CHASE' | 'AIMING' | 'SHOOTING' | 'TELEPORT_REPOSITION';

export class VoidArcher extends Entity {
  public maxHealth = 70;
  public health = 70;
  public moveSpeed = 95;
  public state: VoidArcherState = 'IDLE';

  public attackRange = 320;
  public retreatRange = 110;
  public aimTime = 0.9;
  public aimTimer = 0;
  public cooldown = 1.4;
  public cooldownTimer = 0;
  public teleportCooldown = 4.0;
  public teleportTimer = 0;

  public targetPos: Vector2D | null = null;
  public spawnedProjectiles: Projectile[] = [];

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 28, 38, 'enemy_void_archer');
  }

  public update(dt: number): void {
    if (!this.isActive) return;

    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;
    if (this.teleportTimer > 0) this.teleportTimer -= dt;

    if (!this.targetPos) {
      this.state = 'IDLE';
      this.velocity.set(0, 0);
      return;
    }

    const dist = this.position.distanceTo(this.targetPos);

    // Kiting / Repositioning logic
    if (dist < this.retreatRange && this.teleportTimer <= 0) {
      this.executeTeleport();
      return;
    }

    switch (this.state) {
      case 'IDLE':
      case 'CHASE': {
        if (dist <= this.attackRange && this.cooldownTimer <= 0) {
          this.state = 'AIMING';
          this.aimTimer = this.aimTime;
          this.velocity.set(0, 0);
        } else if (dist > this.attackRange) {
          // Approach target
          const dir = this.targetPos.subtract(this.position).normalize();
          this.velocity = dir.multiply(this.moveSpeed);
          this.state = 'CHASE';
        } else {
          // In range but on cooldown, maintain distance
          this.velocity.set(0, 0);
        }
        break;
      }

      case 'AIMING': {
        this.velocity.set(0, 0);
        this.aimTimer -= dt;
        if (this.aimTimer <= 0) {
          this.shootArrow();
          this.state = 'IDLE';
          this.cooldownTimer = this.cooldown;
        }
        break;
      }

      case 'TELEPORT_REPOSITION': {
        this.velocity.set(0, 0);
        break;
      }
    }

    this.position = this.position.add(this.velocity.multiply(dt));
    this.syncBounds();
  }

  public executeTeleport(): void {
    if (!this.targetPos) return;
    const awayDir = this.position.subtract(this.targetPos).normalize();
    const teleportDist = 200;
    // Offset by angle to avoid wall locking
    const angle = Math.atan2(awayDir.y, awayDir.x) + (Math.random() - 0.5) * 0.8;
    this.position.x += Math.cos(angle) * teleportDist;
    this.position.y += Math.sin(angle) * teleportDist;
    this.teleportTimer = this.teleportCooldown;
    this.syncBounds();
  }

  public shootArrow(): void {
    if (!this.targetPos) return;
    const dir = this.targetPos.subtract(this.position).normalize();
    const proj = new Projectile(
      `void_arrow_${Date.now()}_${Math.random()}`,
      this.position.x,
      this.position.y,
      dir,
      280,
      'enemy_projectile'
    );
    proj.damage = 22;
    this.spawnedProjectiles.push(proj);
  }

  public takeDamage(amount: number): boolean {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    // Attempt panic blink if hit by heavy damage
    if (amount >= 25 && this.teleportTimer <= 1.0) {
      this.executeTeleport();
    }
    return false;
  }

  public render(renderer: IRenderer): void {
    if (!this.isActive) return;

    // Body
    renderer.drawRect(
      this.bounds.x,
      this.bounds.y,
      this.bounds.width,
      this.bounds.height,
      '#1a0933',
      '#9d4edd'
    );

    // Void cowl
    renderer.drawCircle(this.position.x, this.position.y - 14, 8, '#3c096c', '#e0aaff');

    // Aiming laser / indicator
    if (this.state === 'AIMING' && this.targetPos) {
      const dir = this.targetPos.subtract(this.position).normalize();
      const aimEnd = this.position.add(dir.multiply(this.attackRange));
      const ctx = renderer.getContext();
      ctx.save();
      ctx.strokeStyle = 'rgba(157, 78, 221, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(this.position.x, this.position.y);
      ctx.lineTo(aimEnd.x, aimEnd.y);
      ctx.stroke();
      ctx.restore();
    }
  }
}
