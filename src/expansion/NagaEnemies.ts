import { Entity } from '../entities/Entity';
import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';
import { Projectile } from '../entities/Projectile';
import { AABB } from '../physics/AABB';

// ==========================================
// Archetype 1: Naga Venom-Spitter
// ==========================================
export class NagaVenomSpitter extends Entity {
  public health = 65;
  public maxHealth = 65;
  public attackCooldown = 2.2;
  public attackTimer = 0;
  public attackRange = 280;
  public targetPos: Vector2D | null = null;
  public spawnedProjectiles: Projectile[] = [];
  public venomPuddles: AABB[] = [];

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 32, 40, 'enemy_naga_spitter');
  }

  public update(dt: number): void {
    if (!this.isActive) return;

    this.attackTimer += dt;
    if (this.targetPos) {
      const dist = this.position.distanceTo(this.targetPos);
      if (dist <= this.attackRange && this.attackTimer >= this.attackCooldown) {
        this.attackTimer = 0;
        this.spitVenom();
      }
    }

    this.syncBounds();
  }

  public spitVenom(): void {
    if (!this.targetPos) return;
    const dir = this.targetPos.subtract(this.position).normalize();
    const proj = new Projectile(
      `venom_glob_${Date.now()}`,
      this.position.x,
      this.position.y,
      dir,
      220,
      'enemy_projectile'
    );
    proj.damage = 18;
    this.spawnedProjectiles.push(proj);

    // Create venom puddle hazard at target location
    if (this.venomPuddles.length < 5) {
      this.venomPuddles.push(new AABB(this.targetPos.x - 20, this.targetPos.y - 20, 40, 40));
    }
  }

  public takeDamage(amount: number): boolean {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  public render(renderer: IRenderer): void {
    if (!this.isActive) return;
    // Puddles
    for (const p of this.venomPuddles) {
      renderer.drawRect(p.x, p.y, p.width, p.height, 'rgba(0, 255, 100, 0.3)', '#00ff66');
    }
    // Body (Cobra hood)
    renderer.drawRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, '#0a3318', '#00ff77');
    renderer.drawCircle(this.position.x, this.position.y - 10, 10, '#105528', '#33ff99');
  }
}

// ==========================================
// Archetype 2: Serpentine Constrictor
// ==========================================
export class SerpentineConstrictor extends Entity {
  public health = 95;
  public maxHealth = 95;
  public moveSpeed = 130;
  public lungeSpeed = 240;
  public isLunging = false;
  public lungeTimer = 0;
  public lungeCooldown = 3.0;
  public cooldownTimer = 0;
  public isConstricting = false;
  public constrictDuration = 1.5;
  public constrictTimer = 0;
  public targetPos: Vector2D | null = null;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 36, 44, 'enemy_naga_constrictor');
  }

  public update(dt: number): void {
    if (!this.isActive) return;

    if (this.cooldownTimer > 0) this.cooldownTimer -= dt;

    if (this.isConstricting) {
      this.constrictTimer -= dt;
      this.velocity.set(0, 0);
      if (this.constrictTimer <= 0) {
        this.isConstricting = false;
        this.cooldownTimer = this.lungeCooldown;
      }
      return;
    }

    if (this.isLunging) {
      this.lungeTimer -= dt;
      if (this.lungeTimer <= 0) {
        this.isLunging = false;
      }
    } else if (this.targetPos) {
      const dist = this.position.distanceTo(this.targetPos);
      const dir = this.targetPos.subtract(this.position).normalize();

      if (dist <= 120 && this.cooldownTimer <= 0) {
        // Trigger lunge
        this.isLunging = true;
        this.lungeTimer = 0.4;
        this.velocity = dir.multiply(this.lungeSpeed);
      } else if (dist <= 35) {
        // Trigger constrict hold
        this.isConstricting = true;
        this.constrictTimer = this.constrictDuration;
      } else {
        this.velocity = dir.multiply(this.moveSpeed);
      }
    }

    this.position = this.position.add(this.velocity.multiply(dt));
    this.syncBounds();
  }

  public takeDamage(amount: number): boolean {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  public render(renderer: IRenderer): void {
    if (!this.isActive) return;
    const color = this.isConstricting ? '#880022' : '#223311';
    const border = this.isLunging ? '#ff3300' : '#88cc44';
    renderer.drawRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, color, border);
  }
}

// ==========================================
// Archetype 3: Shadow Illusionist
// ==========================================
export class ShadowIllusionist extends Entity {
  public health = 60;
  public maxHealth = 60;
  public cloakTimer = 0;
  public isCloaked = false;
  public decoyPositions: Vector2D[] = [];
  public castTimer = 0;
  public castCooldown = 3.5;
  public targetPos: Vector2D | null = null;
  public fissureHazards: AABB[] = [];

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 30, 42, 'enemy_naga_illusionist');
  }

  public update(dt: number): void {
    if (!this.isActive) return;

    this.castTimer += dt;
    if (this.cloakTimer > 0) {
      this.cloakTimer -= dt;
      if (this.cloakTimer <= 0) this.isCloaked = false;
    }

    if (this.castTimer >= this.castCooldown && this.targetPos) {
      this.castTimer = 0;
      this.castShadowFissure();
      this.createIllusions();
    }

    this.syncBounds();
  }

  public createIllusions(): void {
    this.isCloaked = true;
    this.cloakTimer = 2.0;
    this.decoyPositions = [
      new Vector2D(this.position.x - 70, this.position.y + 40),
      new Vector2D(this.position.x + 70, this.position.y - 40),
    ];
  }

  public castShadowFissure(): void {
    if (!this.targetPos) return;
    // Ground eruption hazard
    this.fissureHazards.push(new AABB(this.targetPos.x - 25, this.targetPos.y - 25, 50, 50));
    if (this.fissureHazards.length > 3) this.fissureHazards.shift();
  }

  public takeDamage(amount: number): boolean {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  public render(renderer: IRenderer): void {
    if (!this.isActive) return;

    // Fissure hazards
    for (const f of this.fissureHazards) {
      renderer.drawRect(f.x, f.y, f.width, f.height, 'rgba(80, 0, 100, 0.4)', '#9d4edd');
    }

    // Decoys
    if (this.isCloaked) {
      for (const d of this.decoyPositions) {
        renderer.drawCircle(d.x, d.y, 14, 'rgba(100, 50, 150, 0.4)', '#cc88ff');
      }
    }

    // Body
    const alpha = this.isCloaked ? 0.35 : 1.0;
    const ctx = renderer.getContext();
    ctx.save();
    ctx.globalAlpha = alpha;
    renderer.drawRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, '#190033', '#7b2cbf');
    ctx.restore();
  }
}
