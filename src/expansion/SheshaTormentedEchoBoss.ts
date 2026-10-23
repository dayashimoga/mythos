import { Entity } from '../entities/Entity';
import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';
import { Projectile } from '../entities/Projectile';
import { AABB } from '../physics/AABB';

export type SheshaPhase = 'PHASE_1_BURROW' | 'PHASE_2_TSUNAMI' | 'PHASE_3_MAELSTROM';

export interface SerpentSegment {
  position: Vector2D;
  radius: number;
}

export class SheshaTormentedEchoBoss extends Entity {
  public maxHealth = 900;
  public health = 900;
  public maxPoise = 220;
  public poise = 220;
  public isStaggered = false;
  public staggerTimer = 0;

  public phase: SheshaPhase = 'PHASE_1_BURROW';
  public segments: SerpentSegment[] = [];
  public targetPos: Vector2D | null = null;
  public attackTimer = 0;
  public attackCooldown = 2.4;

  public isBurrowed = false;
  public burrowTimer = 0;
  public spawnedProjectiles: Projectile[] = [];
  public toxicPools: AABB[] = [];

  constructor(id = 'boss_shesha', x = 500, y = 350) {
    super(id, x, y, 64, 64, 'boss_sheshas_echo');
    this.initSegments(6);
  }

  private initSegments(count: number): void {
    this.segments = [];
    for (let i = 0; i < count; i++) {
      this.segments.push({
        position: new Vector2D(this.position.x - (i + 1) * 36, this.position.y),
        radius: Math.max(16, 32 - i * 3),
      });
    }
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

    const hpRatio = this.health / this.maxHealth;
    if (hpRatio <= 0.35 && this.phase !== 'PHASE_3_MAELSTROM') {
      this.phase = 'PHASE_3_MAELSTROM';
      this.attackCooldown = 1.8;
    } else if (hpRatio <= 0.7 && this.phase === 'PHASE_1_BURROW') {
      this.phase = 'PHASE_2_TSUNAMI';
      this.attackCooldown = 2.0;
    }

    this.attackTimer += dt;

    if (this.isBurrowed) {
      this.burrowTimer -= dt;
      if (this.burrowTimer <= 0) {
        this.emergeFromBurrow();
      }
    } else {
      if (this.phase === 'PHASE_1_BURROW') {
        this.updatePhase1();
      } else if (this.phase === 'PHASE_2_TSUNAMI') {
        this.updatePhase2();
      } else if (this.phase === 'PHASE_3_MAELSTROM') {
        this.updatePhase3();
      }
    }

    // Update body segments to follow head with distance constraint
    let prevPos = this.position;
    for (const seg of this.segments) {
      const dir = seg.position.subtract(prevPos);
      const dist = dir.length();
      const targetDist = 34;
      if (dist > targetDist) {
        const factor = (dist - targetDist) / dist;
        seg.position = seg.position.subtract(dir.multiply(factor * 0.4));
      }
      prevPos = seg.position;
    }

    this.position = this.position.add(this.velocity.multiply(dt));
    this.syncBounds();
  }

  private updatePhase1(): void {
    if (!this.targetPos) return;

    if (this.attackTimer >= this.attackCooldown) {
      this.attackTimer = 0;
      // Start burrow strike
      this.isBurrowed = true;
      this.burrowTimer = 1.5;
      this.velocity.set(0, 0);
    } else {
      // Slither around target
      const dir = this.targetPos.subtract(this.position).normalize();
      const perp = new Vector2D(-dir.y, dir.x);
      this.velocity = dir.multiply(80).add(perp.multiply(90));
    }
  }

  private emergeFromBurrow(): void {
    this.isBurrowed = false;
    if (this.targetPos) {
      this.position = new Vector2D(this.targetPos.x, this.targetPos.y);
      this.syncBounds();
      // Stone rubble hazard pool
      this.toxicPools.push(new AABB(this.position.x - 35, this.position.y - 35, 70, 70));
      if (this.toxicPools.length > 4) this.toxicPools.shift();
    }
  }

  private updatePhase2(): void {
    if (!this.targetPos) return;

    if (this.attackTimer >= this.attackCooldown) {
      this.attackTimer = 0;
      // Launch 5-projectile venom fan wave
      const baseDir = this.targetPos.subtract(this.position).normalize();
      const baseAngle = Math.atan2(baseDir.y, baseDir.x);
      for (let i = -2; i <= 2; i++) {
        const a = baseAngle + i * 0.22;
        const d = new Vector2D(Math.cos(a), Math.sin(a));
        const p = new Projectile(`venom_wave_${Date.now()}_${i}`, this.position.x, this.position.y, d, 230, 'enemy_projectile');
        p.damage = 22;
        this.spawnedProjectiles.push(p);
      }
    } else {
      const dir = this.targetPos.subtract(this.position).normalize();
      this.velocity = dir.multiply(70);
    }
  }

  private updatePhase3(): void {
    if (!this.targetPos) return;

    if (this.attackTimer >= this.attackCooldown) {
      this.attackTimer = 0;
      // 8-directional venom maelstrom
      for (let i = 0; i < 8; i++) {
        const theta = (i / 8) * Math.PI * 2;
        const d = new Vector2D(Math.cos(theta), Math.sin(theta));
        const p = new Projectile(`maelstrom_${Date.now()}_${i}`, this.position.x, this.position.y, d, 260, 'enemy_projectile');
        p.damage = 28;
        this.spawnedProjectiles.push(p);
      }
    }
    // High-speed coiling chase
    const dir = this.targetPos.subtract(this.position).normalize();
    this.velocity = dir.multiply(110);
  }

  public takeDamage(amount: number, poiseDmg = 25): boolean {
    if (this.isBurrowed) return false; // Invulnerable while underground

    this.health = Math.max(0, this.health - amount);
    this.poise = Math.max(0, this.poise - poiseDmg);

    if (this.poise <= 0 && !this.isStaggered) {
      this.isStaggered = true;
      this.staggerTimer = 2.2;
    }

    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  public render(renderer: IRenderer): void {
    if (!this.isActive) return;

    // Toxic pools
    for (const pool of this.toxicPools) {
      renderer.drawRect(pool.x, pool.y, pool.width, pool.height, 'rgba(0, 180, 80, 0.4)', '#00ff88');
    }

    if (this.isBurrowed) {
      // Subterranean dirt tremor ring
      renderer.drawCircle(this.position.x, this.position.y, 40, 'rgba(60, 30, 10, 0.5)', '#aa5500');
      return;
    }

    // Render serpent body segments
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const seg = this.segments[i];
      renderer.drawCircle(seg.position.x, seg.position.y, seg.radius, '#003322', '#00ff88');
      renderer.drawCircle(seg.position.x, seg.position.y, seg.radius * 0.4, '#006644');
    }

    // Head
    const headColor = this.isStaggered ? '#ffaa00' : '#002211';
    renderer.drawCircle(this.position.x, this.position.y, 34, headColor, '#33ffaa');
    // Eyes
    renderer.drawCircle(this.position.x - 10, this.position.y - 10, 5, '#ff0033');
    renderer.drawCircle(this.position.x + 10, this.position.y - 10, 5, '#ff0033');

    // Boss Bar
    const barWidth = 110;
    const barHeight = 8;
    const barX = this.position.x - barWidth / 2;
    const barY = this.position.y - 50;

    renderer.drawRect(barX, barY, barWidth, barHeight, '#111111', '#000000');
    const hpW = (this.health / this.maxHealth) * barWidth;
    renderer.drawRect(barX, barY, hpW, barHeight, '#00ff88');
    const poiseW = (this.poise / this.maxPoise) * barWidth;
    renderer.drawRect(barX, barY + barHeight + 2, poiseW, 3, '#00d4ff');
  }
}
