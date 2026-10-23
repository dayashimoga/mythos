import { Entity } from './Entity';
import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';
import { AssetManager } from '../assets/AssetManager';
import { SpriteAtlas } from '../assets/SpriteAtlas';

export class AstraShard extends Entity {
  public basePositionY: number;
  private floatTime = 0;
  public isCollected = false;
  private glowColor = '#00E5FF';
  private magneticRadius = 140;
  private magneticSpeed = 280;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 24, 24, 'shard');
    this.basePositionY = y;
  }

  public update(dt: number): void {
    if (!this.isActive || this.isCollected) return;

    this.floatTime += dt;
    this.position.y = this.basePositionY + Math.sin(this.floatTime * 4) * 6;
    this.syncBounds();
  }

  public collect(): void {
    this.isCollected = true;
    this.isActive = false;
  }

  public attractTowards(target: Vector2D, dt: number): void {
    if (this.isCollected) return;

    const dist = this.position.distanceTo(target);
    if (dist < this.magneticRadius && dist > 5) {
      const dir = Vector2D.sub(target, this.position).normalize();
      this.position.x += dir.x * this.magneticSpeed * dt;
      this.position.y += dir.y * this.magneticSpeed * dt;
      this.basePositionY = this.position.y;
      this.syncBounds();
    }
  }

  public render(renderer: IRenderer): void {
    if (!this.isActive || this.isCollected) return;

    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    // 1. Soft Contact Shadow on ground (remains at ground level as shard bobs)
    const bobOffset = this.position.y - this.basePositionY;
    const shadowY = 18 - bobOffset;
    if (renderer.drawContactShadow) {
      renderer.drawContactShadow(0, shadowY, 14, 6, 0.45);
    } else {
      ctx.fillStyle = 'rgba(4, 6, 12, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, shadowY, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Render Illustrated Astra Shard Sprite
    const atlas = SpriteAtlas.getInstance();
    if (atlas.getFrame('SANCTUM_SHARD')) {
      atlas.drawSprite(ctx, 'SANCTUM_SHARD', 0, 0, { scale: 0.08 });
    } else {
      const shardTex = AssetManager.getInstance().getTexture('TEX_SANCTUM_SHARD');
      if (shardTex) {
        try {
          const shardSize = 38;
          ctx.save();
          ctx.beginPath();
          ctx.arc(0, 0, shardSize / 2 - 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(shardTex as CanvasImageSource, -shardSize / 2, -shardSize / 2, shardSize, shardSize);
          ctx.restore();
        } catch {
          this.renderProceduralShard(ctx);
        }
      } else {
        this.renderProceduralShard(ctx);
      }
    }

    // 3. Floating Crystalline Aura & Orbiting Rings
    const pulse = 14 + Math.sin(this.floatTime * 6) * 3;
    ctx.strokeStyle = this.glowColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Central Core Glow
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 16);
    coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    coreGrad.addColorStop(0.4, 'rgba(0, 229, 255, 0.5)');
    coreGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  private renderProceduralShard(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
