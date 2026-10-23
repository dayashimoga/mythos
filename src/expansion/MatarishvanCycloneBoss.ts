import { Entity } from '../entities/Entity';
import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';
import { Projectile } from '../entities/Projectile';

export type CyclonePhase = 'PHASE_1_TWISTERS' | 'PHASE_2_GALE_BLADES' | 'PHASE_3_EYE_OF_STORM';

export interface MiniTornado {
  position: Vector2D;
  velocity: Vector2D;
  life: number;
}

export class MatarishvanCycloneBoss extends Entity {
  public maxHealth = 850;
  public health = 850;
  public maxPoise = 200;
  public poise = 200;
  public isStaggered = false;
  public staggerTimer = 0;

  public phase: CyclonePhase = 'PHASE_1_TWISTERS';
  public targetPos: Vector2D | null = null;
  public attackTimer = 0;
  public attackCooldown = 2.2;

  public tornados: MiniTornado[] = [];
  public spawnedProjectiles: Projectile[] = [];
  public eyeRadius = 90;
  public stormRadius = 380;
  public rotationAngle = 0;

  constructor(id = 'boss_matarishvan', x = 450, y = 300) {
    super(id, x, y, 70, 70, 'boss_matarishvan_cyclone');
  }

  public update(dt: number): void {
    if (!this.isActive) return;

    this.rotationAngle += dt * 4;

    if (this.isStaggered) {
      this.staggerTimer -= dt;
      if (this.staggerTimer <= 0) {
        this.isStaggered = false;
        this.poise = this.maxPoise;
      }
      return;
    }

    const hpRatio = this.health / this.maxHealth;
    if (hpRatio <= 0.33 && this.phase !== 'PHASE_3_EYE_OF_STORM') {
      this.phase = 'PHASE_3_EYE_OF_STORM';
      this.attackCooldown = 1.6;
    } else if (hpRatio <= 0.66 && this.phase === 'PHASE_1_TWISTERS') {
      this.phase = 'PHASE_2_GALE_BLADES';
      this.attackCooldown = 1.9;
    }

    this.attackTimer += dt;

    // Update active mini-tornados
    for (let i = this.tornados.length - 1; i >= 0; i--) {
      const t = this.tornados[i];
      t.position = t.position.add(t.velocity.multiply(dt));
      t.life -= dt;
      if (t.life <= 0) {
        this.tornados.splice(i, 1);
      }
    }

    if (this.phase === 'PHASE_1_TWISTERS') {
      this.updatePhase1();
    } else if (this.phase === 'PHASE_2_GALE_BLADES') {
      this.updatePhase2();
    } else if (this.phase === 'PHASE_3_EYE_OF_STORM') {
      this.updatePhase3();
    }

    this.syncBounds();
  }

  private updatePhase1(): void {
    if (!this.targetPos) return;

    if (this.attackTimer >= this.attackCooldown) {
      this.attackTimer = 0;
      // Spawn 2 roaming tornados
      for (let i = 0; i < 2; i++) {
        const angle = Math.random() * Math.PI * 2;
        this.tornados.push({
          position: new Vector2D(this.position.x, this.position.y),
          velocity: new Vector2D(Math.cos(angle) * 120, Math.sin(angle) * 120),
          life: 4.5,
        });
      }
    }
  }

  private updatePhase2(): void {
    if (!this.targetPos) return;

    if (this.attackTimer >= this.attackCooldown) {
      this.attackTimer = 0;
      // Fire 4 crescent gale blades
      const baseDir = this.targetPos.subtract(this.position).normalize();
      const baseAngle = Math.atan2(baseDir.y, baseDir.x);
      for (let i = -1; i <= 2; i++) {
        const a = baseAngle + i * 0.3;
        const d = new Vector2D(Math.cos(a), Math.sin(a));
        const p = new Projectile(`gale_blade_${Date.now()}_${i}`, this.position.x, this.position.y, d, 310, 'enemy_projectile');
        p.damage = 20;
        this.spawnedProjectiles.push(p);
      }
    }
  }

  private updatePhase3(): void {
    if (!this.targetPos) return;

    // Check if player is outside eye of the storm
    const distToCenter = this.targetPos.distanceTo(this.position);
    if (distToCenter > this.eyeRadius && distToCenter <= this.stormRadius) {
      // Wind pressure / peripheral storm hazard
      if (this.attackTimer >= this.attackCooldown) {
        this.attackTimer = 0;
        // Lightning bolt strike at player's peripheral position
        const p = new Projectile(`lightning_${Date.now()}`, this.targetPos.x, this.targetPos.y - 120, new Vector2D(0, 1), 400, 'enemy_projectile');
        p.damage = 30;
        this.spawnedProjectiles.push(p);
      }
    }
  }

  public takeDamage(amount: number, poiseDmg = 20): boolean {
    this.health = Math.max(0, this.health - amount);
    this.poise = Math.max(0, this.poise - poiseDmg);

    if (this.poise <= 0 && !this.isStaggered) {
      this.isStaggered = true;
      this.staggerTimer = 2.0;
    }

    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  public render(renderer: IRenderer): void {
    if (!this.isActive) return;

    const ctx = renderer.getContext();

    // Phase 3 Eye of the Storm zone
    if (this.phase === 'PHASE_3_EYE_OF_STORM') {
      ctx.save();
      // Violent outer hurricane
      ctx.strokeStyle = 'rgba(72, 202, 228, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.stormRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Calm safe Eye zone
      renderer.drawCircle(this.position.x, this.position.y, this.eyeRadius, 'rgba(255, 255, 255, 0.08)', '#00f5d4');
      ctx.restore();
    }

    // Mini Tornados
    for (const t of this.tornados) {
      renderer.drawCircle(t.position.x, t.position.y, 18, 'rgba(180, 240, 255, 0.4)', '#90e0ef');
    }

    // Boss Vortex Core
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotationAngle);

    // Spiraling wind arms
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.strokeStyle = this.isStaggered ? '#ffaa00' : '#48cae4';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI / 3);
      ctx.stroke();
    }
    ctx.restore();

    // Core Eye
    renderer.drawCircle(this.position.x, this.position.y, 22, '#03045e', '#00b4d8');

    // Boss Bar
    const barWidth = 100;
    const barHeight = 8;
    const barX = this.position.x - barWidth / 2;
    const barY = this.position.y - 48;

    renderer.drawRect(barX, barY, barWidth, barHeight, '#111111', '#000000');
    const hpW = (this.health / this.maxHealth) * barWidth;
    renderer.drawRect(barX, barY, hpW, barHeight, '#00b4d8');
    const poiseW = (this.poise / this.maxPoise) * barWidth;
    renderer.drawRect(barX, barY + barHeight + 2, poiseW, 3, '#ffcc00');
  }
}
