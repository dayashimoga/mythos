import { Entity } from '../entities/Entity';
import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';
import { Projectile } from '../entities/Projectile';

export type KalanemiPhase = 'PHASE_1_MIRAGE' | 'PHASE_2_REAPER' | 'PHASE_3_SINGULARITY';

export interface KalanemiDecoy {
  position: Vector2D;
  health: number;
}

export class KalanemisShadowBoss extends Entity {
  public maxHealth = 600;
  public health = 600;
  public maxPoise = 150;
  public poise = 150;
  public isStaggered = false;
  public staggerTimer = 0;

  public phase: KalanemiPhase = 'PHASE_1_MIRAGE';
  public targetPos: Vector2D | null = null;
  public attackTimer = 0;
  public attackCooldown = 2.0;

  public decoys: KalanemiDecoy[] = [];
  public spawnedProjectiles: Projectile[] = [];
  public vortexCenter: Vector2D | null = null;
  public vortexRadius = 240;
  public vortexActive = false;
  public vortexDuration = 0;

  constructor(id = 'boss_kalanemi', x = 400, y = 300) {
    super(id, x, y, 54, 72, 'boss_kalanemis_shadow');
  }

  public update(dt: number): void {
    if (!this.isActive) return;

    if (this.isStaggered) {
      this.staggerTimer -= dt;
      if (this.staggerTimer <= 0) {
        this.isStaggered = false;
        this.poise = this.maxPoise;
      }
      return;
    }

    // Phase evaluation based on health percentage
    const hpRatio = this.health / this.maxHealth;
    if (hpRatio <= 0.33 && this.phase !== 'PHASE_3_SINGULARITY') {
      this.transitionToPhase('PHASE_3_SINGULARITY');
    } else if (hpRatio <= 0.66 && this.phase === 'PHASE_1_MIRAGE') {
      this.transitionToPhase('PHASE_2_REAPER');
    }

    this.attackTimer += dt;

    if (this.phase === 'PHASE_1_MIRAGE') {
      this.updatePhase1();
    } else if (this.phase === 'PHASE_2_REAPER') {
      this.updatePhase2();
    } else if (this.phase === 'PHASE_3_SINGULARITY') {
      this.updatePhase3(dt);
    }

    this.position = this.position.add(this.velocity.multiply(dt));
    this.syncBounds();
  }

  private transitionToPhase(newPhase: KalanemiPhase): void {
    this.phase = newPhase;
    this.attackTimer = 0;
    this.decoys = [];
    if (newPhase === 'PHASE_2_REAPER') {
      this.attackCooldown = 1.5;
    } else if (newPhase === 'PHASE_3_SINGULARITY') {
      this.attackCooldown = 2.5;
    }
  }

  private updatePhase1(): void {
    if (!this.targetPos) return;

    // Maintain 2 decoys
    if (this.decoys.length === 0) {
      this.decoys.push(
        { position: new Vector2D(this.position.x - 80, this.position.y - 40), health: 25 },
        { position: new Vector2D(this.position.x + 80, this.position.y - 40), health: 25 }
      );
    }

    if (this.attackTimer >= this.attackCooldown) {
      this.attackTimer = 0;
      // Fire homing shadow daggers
      const dir = this.targetPos.subtract(this.position).normalize();
      const p = new Projectile(`dagger_${Date.now()}_1`, this.position.x, this.position.y, dir, 260, 'enemy_projectile');
      p.damage = 18;
      this.spawnedProjectiles.push(p);
    }
  }

  private updatePhase2(): void {
    if (!this.targetPos) return;

    if (this.attackTimer >= this.attackCooldown) {
      this.attackTimer = 0;
      // Teleport behind target and prepare scythe sweep
      const behindDir = this.targetPos.subtract(this.position).normalize();
      this.position = this.targetPos.add(behindDir.multiply(90));
      this.syncBounds();

      // Spawn 4-directional scythe projectiles
      const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      for (const a of angles) {
        const d = new Vector2D(Math.cos(a), Math.sin(a));
        const p = new Projectile(`scythe_${Date.now()}_${a}`, this.position.x, this.position.y, d, 240, 'enemy_projectile');
        p.damage = 24;
        this.spawnedProjectiles.push(p);
      }
    }
  }

  private updatePhase3(dt: number): void {
    if (this.vortexActive) {
      this.vortexDuration -= dt;
      if (this.vortexDuration <= 0) {
        this.vortexActive = false;
        this.vortexCenter = null;
      }
    }

    if (this.attackTimer >= this.attackCooldown) {
      this.attackTimer = 0;
      // Activate Abyssal Singularity
      this.vortexCenter = new Vector2D(this.position.x, this.position.y);
      this.vortexActive = true;
      this.vortexDuration = 3.5;

      // Radial meteor ring
      const count = 8;
      for (let i = 0; i < count; i++) {
        const theta = (i / count) * Math.PI * 2;
        const d = new Vector2D(Math.cos(theta), Math.sin(theta));
        const p = new Projectile(`meteor_${Date.now()}_${i}`, this.position.x, this.position.y, d, 200, 'enemy_projectile');
        p.damage = 30;
        this.spawnedProjectiles.push(p);
      }
    }
  }

  public takeDamage(amount: number, poiseDamage = 20): boolean {
    this.health = Math.max(0, this.health - amount);
    this.poise = Math.max(0, this.poise - poiseDamage);

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

    // Singularity vortex rendering
    if (this.vortexActive && this.vortexCenter) {
      renderer.drawCircle(
        this.vortexCenter.x,
        this.vortexCenter.y,
        this.vortexRadius,
        'rgba(40, 0, 80, 0.25)',
        '#7b2cbf'
      );
    }

    // Decoys
    for (const d of this.decoys) {
      renderer.drawCircle(d.position.x, d.position.y, 16, 'rgba(80, 20, 120, 0.4)', '#9d4edd');
    }

    // Main Boss Body
    const color = this.isStaggered ? '#ffaa00' : '#120024';
    const border = this.phase === 'PHASE_3_SINGULARITY' ? '#ff0055' : '#a000ff';
    renderer.drawRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, color, border);

    // Horns / Crown
    renderer.drawCircle(this.position.x - 12, this.position.y - 28, 8, '#3c096c', border);
    renderer.drawCircle(this.position.x + 12, this.position.y - 28, 8, '#3c096c', border);

    // Health / Poise Bar Overhead
    const barWidth = 90;
    const barHeight = 8;
    const barX = this.position.x - barWidth / 2;
    const barY = this.bounds.y - 20;

    // Background
    renderer.drawRect(barX, barY, barWidth, barHeight, '#222222', '#000000');
    // Health
    const hpW = (this.health / this.maxHealth) * barWidth;
    renderer.drawRect(barX, barY, hpW, barHeight, '#ff0055');
    // Poise
    const poiseW = (this.poise / this.maxPoise) * barWidth;
    renderer.drawRect(barX, barY + barHeight + 2, poiseW, 3, '#00d4ff');
  }
}
