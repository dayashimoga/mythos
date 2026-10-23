import { Entity } from '../entities/Entity';
import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';
import { Projectile } from '../entities/Projectile';

// ==========================================
// Archetype 1: Gandharva Wind Archer
// ==========================================
export class WindArcher extends Entity {
  public health = 55;
  public maxHealth = 55;
  public hoverTimer = 0;
  public attackCooldown = 2.0;
  public attackTimer = 0;
  public targetPos: Vector2D | null = null;
  public spawnedProjectiles: Projectile[] = [];

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 30, 36, 'enemy_wind_archer');
  }

  public update(dt: number): void {
    if (!this.isActive) return;

    this.hoverTimer += dt;
    this.attackTimer += dt;

    // Aerial bobbing motion
    this.position.y += Math.sin(this.hoverTimer * 3) * 0.4;

    if (this.targetPos && this.attackTimer >= this.attackCooldown) {
      this.attackTimer = 0;
      this.fireSquallArrow();
    }

    this.syncBounds();
  }

  public fireSquallArrow(): void {
    if (!this.targetPos) return;
    const dir = this.targetPos.subtract(this.position).normalize();
    const proj = new Projectile(
      `squall_arrow_${Date.now()}`,
      this.position.x,
      this.position.y,
      dir,
      320,
      'enemy_projectile'
    );
    proj.damage = 16;
    this.spawnedProjectiles.push(proj);
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
    // Wing flutters
    renderer.drawCircle(this.position.x - 14, this.position.y, 8, 'rgba(160, 230, 255, 0.5)', '#a0e6ff');
    renderer.drawCircle(this.position.x + 14, this.position.y, 8, 'rgba(160, 230, 255, 0.5)', '#a0e6ff');
    // Body
    renderer.drawRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, '#0a2233', '#48cae4');
  }
}

// ==========================================
// Archetype 2: Storm Sentry
// ==========================================
export class StormSentry extends Entity {
  public health = 110;
  public maxHealth = 110;
  public shieldActive = true;
  public shieldAngle = 0;
  public targetPos: Vector2D | null = null;
  public moveSpeed = 70;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 40, 48, 'enemy_storm_sentry');
  }

  public update(dt: number): void {
    if (!this.isActive) return;

    if (this.targetPos) {
      const dir = this.targetPos.subtract(this.position).normalize();
      this.shieldAngle = Math.atan2(dir.y, dir.x);
      this.velocity = dir.multiply(this.moveSpeed);
      this.position = this.position.add(this.velocity.multiply(dt));
    }

    this.syncBounds();
  }

  public checkShieldBlock(incomingAngle: number): boolean {
    if (!this.shieldActive) return false;
    const diff = Math.abs(incomingAngle - this.shieldAngle);
    // Block if incoming within front 120-degree arc
    return diff <= (Math.PI / 3);
  }

  public takeDamage(amount: number, incomingAngle = 0): boolean {
    if (this.checkShieldBlock(incomingAngle)) {
      return false; // Blocked completely by lightning shield
    }
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  public render(renderer: IRenderer): void {
    if (!this.isActive) return;

    // Body
    renderer.drawRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height, '#1b263b', '#e0e1dd');

    // Lightning Shield Arc
    if (this.shieldActive) {
      const ctx = renderer.getContext();
      ctx.save();
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, 32, this.shieldAngle - Math.PI / 3, this.shieldAngle + Math.PI / 3);
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ==========================================
// Archetype 3: Gale Falcon
// ==========================================
export class GaleFalcon extends Entity {
  public health = 45;
  public maxHealth = 45;
  public state: 'CIRCLING' | 'DIVING' | 'RECOVERING' = 'CIRCLING';
  public circleAngle = 0;
  public diveSpeed = 340;
  public targetPos: Vector2D | null = null;
  public diveTarget: Vector2D | null = null;
  public timer = 0;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 26, 26, 'enemy_gale_falcon');
  }

  public update(dt: number): void {
    if (!this.isActive) return;

    this.timer += dt;

    if (this.state === 'CIRCLING') {
      this.circleAngle += dt * 2.5;
      if (this.targetPos) {
        this.position.x = this.targetPos.x + Math.cos(this.circleAngle) * 160;
        this.position.y = this.targetPos.y - 120 + Math.sin(this.circleAngle) * 40;

        if (this.timer >= 2.5) {
          this.state = 'DIVING';
          this.diveTarget = new Vector2D(this.targetPos.x, this.targetPos.y);
          this.timer = 0;
        }
      }
    } else if (this.state === 'DIVING' && this.diveTarget) {
      const dir = this.diveTarget.subtract(this.position).normalize();
      this.velocity = dir.multiply(this.diveSpeed);
      this.position = this.position.add(this.velocity.multiply(dt));

      if (this.position.distanceTo(this.diveTarget) <= 20 || this.timer >= 1.2) {
        this.state = 'RECOVERING';
        this.timer = 0;
      }
    } else if (this.state === 'RECOVERING') {
      this.velocity.set(0, -180);
      this.position = this.position.add(this.velocity.multiply(dt));
      if (this.timer >= 0.8) {
        this.state = 'CIRCLING';
        this.timer = 0;
      }
    }

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
    const color = this.state === 'DIVING' ? '#ff3300' : '#ffd166';
    renderer.drawCircle(this.position.x, this.position.y, 12, color, '#06d6a0');
  }
}
