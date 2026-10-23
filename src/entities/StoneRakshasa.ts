import { Entity } from './Entity';
import { Vector2D } from '../physics/Vector2D';
import { Shockwave } from './Shockwave';
import { IRenderer } from '../render/CanvasRenderer';
import { CharacterDefinitions } from '../animation/CharacterDefinitions';
import { CharacterRig } from '../animation/CharacterRig';
import { PoiseData } from '../gameplay/CombatSystem';

export class StoneRakshasa extends Entity {
  public health = 140;
  public maxHealth = 140;
  public speed = 80;

  public poise: PoiseData = {
    current: 80,
    max: 80,
    isStaggered: false,
    staggerTimer: 0,
    staggerDuration: 1.5,
  };

  public rig: CharacterRig = CharacterDefinitions.createRakshasaRig();
  private attackCooldown = 3.2;
  private attackTimer = 1.5;
  public isWindingUp = false;
  private windupTimer = 0;
  private hitFlashTimer = 0;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 48, 48, 'enemy_rakshasa');
  }

  public takeDamage(amount: number, poiseDmg = 20): boolean {
    this.health -= amount;
    this.hitFlashTimer = 0.12;

    this.poise.current = Math.max(0, this.poise.current - poiseDmg);
    if (this.poise.current <= 0 && !this.poise.isStaggered) {
      this.poise.isStaggered = true;
      this.poise.staggerTimer = this.poise.staggerDuration;
      this.isWindingUp = false; // Windup cancelled by poise break
    }

    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  public updateAI(targetPos: Vector2D, dt: number): Shockwave | null {
    if (!this.isActive) return null;

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    const dist = this.position.distanceTo(targetPos);

    // Handle Poise Stagger
    if (this.poise.isStaggered) {
      this.poise.staggerTimer -= dt;
      if (this.poise.staggerTimer <= 0) {
        this.poise.isStaggered = false;
        this.poise.current = this.poise.max;
      }
      this.rig.position.set(this.position.x, this.position.y);
      this.rig.expression = 'hurt';
      this.rig.stateMachine.setTrigger('trigger_stagger');
      this.rig.update(dt);
      return null;
    } else if (this.poise.current < this.poise.max) {
      this.poise.current = Math.min(this.poise.max, this.poise.current + 20 * dt);
    }

    // Windup Slam State
    if (this.isWindingUp) {
      this.windupTimer -= dt;
      if (this.windupTimer <= 0) {
        this.isWindingUp = false;
        this.attackTimer = this.attackCooldown;

        // Produce Ground Slam Shockwave!
        return new Shockwave(
          `shock_${Date.now()}`,
          this.position.x,
          this.position.y,
          180,
          35
        );
      }
      return null;
    }

    // Approach Veer
    if (dist > 75) {
      const dir = Vector2D.sub(targetPos, this.position).normalize();
      this.position.x += dir.x * this.speed * dt;
      this.position.y += dir.y * this.speed * dt;
      this.syncBounds();
    }

    // Trigger Windup if within attack range
    this.attackTimer -= dt;
    if (dist <= 110 && this.attackTimer <= 0) {
      this.isWindingUp = true;
      this.windupTimer = 1.0;
    }

    // Sync Skeletal Rig
    this.rig.position.set(this.position.x, this.position.y);
    this.rig.facing = targetPos.x >= this.position.x ? 1 : -1;
    this.rig.stateMachine.setFloat('speed', dist > 75 && !this.isWindingUp ? 0.6 : 0.0);
    if (this.isWindingUp) {
      this.rig.stateMachine.setTrigger('trigger_slam');
    }
    this.rig.expression = this.hitFlashTimer > 0 ? 'hurt' : 'combat';
    this.rig.update(dt);

    return null;
  }

  public update(dt: number): void {
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }
    this.rig.position.set(this.position.x, this.position.y);
    this.rig.update(dt);
  }

  public render(renderer: IRenderer): void {
    if (!this.isActive) return;
    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    // Staggered aura
    if (this.poise.isStaggered) {
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Ground Slam Telegraph Ring
    if (this.isWindingUp) {
      const progress = 1 - this.windupTimer / 1.0;
      ctx.strokeStyle = '#EF476F';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 110 * progress, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(239, 71, 111, 0.15)';
      ctx.fill();
    }

    ctx.restore();

    // Render Skeletal Character Rig (Basalt Juggernaut Production Asset)
    this.rig.render(renderer);

    // Health & Poise Bars
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    if (this.health < this.maxHealth || this.poise.current < this.poise.max) {
      // Health Bar
      ctx.fillStyle = '#080C14';
      ctx.fillRect(-22, -44, 44, 5);
      ctx.fillStyle = '#EF476F';
      ctx.fillRect(-22, -44, (44 * this.health) / this.maxHealth, 5);

      // Poise Bar
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(-22, -38, 44, 3);
      ctx.fillStyle = this.poise.isStaggered ? '#EF4444' : '#F59E0B';
      ctx.fillRect(-22, -38, (44 * this.poise.current) / this.poise.max, 3);
    }
    ctx.restore();
  }
}
