import { Entity } from './Entity';
import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';
import { AssetManager } from '../assets/AssetManager';

export class EnemySentinel extends Entity {
  public health = 50;
  public maxHealth = 50;
  private patrolOrigin: Vector2D;
  private patrolRadius = 80;
  private patrolAngle = 0;
  private patrolSpeed = 1.2;
  private hitFlashTimer = 0;
  private hoverTime = 0;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 40, 40, 'enemy');
    this.patrolOrigin = new Vector2D(x, y);
  }

  public takeDamage(amount: number): boolean {
    this.health -= amount;
    this.hitFlashTimer = 0.12;
    if (this.health <= 0) {
      this.destroy();
      return true; // was killed
    }
    return false;
  }

  public update(dt: number): void {
    if (!this.isActive) return;

    this.hoverTime += dt;
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    this.patrolAngle += dt * this.patrolSpeed;
    this.position.x = this.patrolOrigin.x + Math.cos(this.patrolAngle) * this.patrolRadius;
    this.position.y = this.patrolOrigin.y + Math.sin(this.patrolAngle) * this.patrolRadius;
    this.syncBounds();
  }

  public render(renderer: IRenderer): void {
    if (!this.isActive) return;
    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    const isFlashing = this.hitFlashTimer > 0;
    const hoverY = Math.sin(this.hoverTime * 3) * 4;

    // 1. Soft Contact Shadow on ground
    if (renderer.drawContactShadow) {
      renderer.drawContactShadow(0, 24, 22, 10, 0.5);
    } else {
      ctx.fillStyle = 'rgba(4, 6, 12, 0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 24, 22, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Render Illustrated Sentinel Sprite
    const sentinelTex = AssetManager.getInstance().getTexture('TEX_SANCTUM_SENTINEL');
    if (sentinelTex) {
      ctx.save();
      ctx.translate(0, hoverY);
      if (isFlashing) {
        ctx.filter = 'brightness(2.0)';
      }
      try {
        const spriteSize = 64;
        ctx.beginPath();
        ctx.arc(0, 0, spriteSize / 2 - 4, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(sentinelTex as CanvasImageSource, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
      } catch (e) {
        this.renderProceduralSentinel(ctx, isFlashing);
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(0, hoverY);
      this.renderProceduralSentinel(ctx, isFlashing);
      ctx.restore();
    }

    // 3. Menacing Crimson Core Optic Flare
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const flareGrad = ctx.createRadialGradient(0, hoverY - 4, 0, 0, hoverY - 4, 18);
    flareGrad.addColorStop(0, 'rgba(255, 60, 60, 0.85)');
    flareGrad.addColorStop(0.5, 'rgba(220, 38, 38, 0.4)');
    flareGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
    ctx.fillStyle = flareGrad;
    ctx.beginPath();
    ctx.arc(0, hoverY - 4, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Overhead Mini Health Bar
    if (this.health < this.maxHealth) {
      const barW = 32;
      const barH = 4;
      const pct = Math.max(0, this.health / this.maxHealth);

      ctx.fillStyle = 'rgba(10, 10, 15, 0.8)';
      ctx.fillRect(-barW / 2, -28, barW, barH);

      ctx.fillStyle = '#EF476F';
      ctx.fillRect(-barW / 2, -28, barW * pct, barH);
    }

    ctx.restore();
  }

  private renderProceduralSentinel(ctx: CanvasRenderingContext2D, isFlashing: boolean): void {
    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#1F1A24';
    ctx.strokeStyle = '#EF476F';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(18, 0);
    ctx.lineTo(0, 18);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#EF476F';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}
