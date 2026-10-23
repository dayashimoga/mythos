import { Entity } from './Entity';
import { IRenderer } from '../render/CanvasRenderer';
import { SacredGeometry } from '../render/SacredGeometry';
import { AssetManager } from '../assets/AssetManager';

export type AltarState = 'dormant' | 'attuning' | 'consecrated';

export class Altar extends Entity {
  public state: AltarState = 'dormant';
  public shardsDeposited = 0;
  public totalRequired = 3;
  private rotationAngle = 0;
  private bloomRadius = 0;
  private pulseTime = 0;

  constructor(id: string, x: number, y: number) {
    super(id, x, y, 96, 96, 'altar');
  }

  public depositShard(): boolean {
    if (this.shardsDeposited < this.totalRequired) {
      this.shardsDeposited++;
      if (this.shardsDeposited >= this.totalRequired) {
        this.state = 'consecrated';
      } else {
        this.state = 'attuning';
      }
      return true;
    }
    return false;
  }

  public update(dt: number): void {
    this.pulseTime += dt;
    if (this.state === 'attuning') {
      this.rotationAngle += dt * 0.8;
    } else if (this.state === 'consecrated') {
      this.rotationAngle += dt * 2.2;
      this.bloomRadius = Math.min(140, this.bloomRadius + dt * 100);
    }
  }

  public render(renderer: IRenderer): void {
    const ctx = renderer.getContext();
    ctx.save();
    ctx.translate(this.position.x, this.position.y);

    // 1. Soft Contact Shadow on ground
    if (renderer.drawContactShadow) {
      renderer.drawContactShadow(0, 30, 64, 28, 0.7);
    } else {
      ctx.fillStyle = 'rgba(4, 6, 12, 0.6)';
      ctx.beginPath();
      ctx.ellipse(0, 30, 64, 28, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Render Illustrated Sun Altar Sprite
    const altarTex = AssetManager.getInstance().getTexture('TEX_SANCTUM_ALTAR');
    if (altarTex) {
      ctx.save();
      const pulseScale = 1.0 + Math.sin(this.pulseTime * 2) * 0.02;
      ctx.scale(pulseScale, pulseScale);
      try {
        ctx.beginPath();
        ctx.arc(0, 0, 64, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(altarTex as CanvasImageSource, -70, -70, 140, 140);
      } catch (e) {
        this.renderProceduralBase(ctx);
      }
      ctx.restore();
    } else {
      this.renderProceduralBase(ctx);
    }

    // 3. Dynamic Rotating Sacred Mandala Rings
    const ringColor =
      this.state === 'consecrated' ? '#FFB703' : this.state === 'attuning' ? '#00E5FF' : 'rgba(255, 183, 3, 0.4)';

    SacredGeometry.drawMandala(ctx, 0, 0, 48, 8, this.rotationAngle, ringColor, 1.8);

    if (this.state === 'consecrated') {
      SacredGeometry.drawMandala(ctx, 0, 0, 32, 6, -this.rotationAngle * 1.5, '#FFD166', 2.2);

      // Expanding consecrated radiant aura
      ctx.strokeStyle = 'rgba(255, 183, 3, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.bloomRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Light beams
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const beamCount = 8;
      for (let b = 0; b < beamCount; b++) {
        const bAngle = this.rotationAngle + (b * Math.PI * 2) / beamCount;
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(bAngle) * 90, Math.sin(bAngle) * 90);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Shard Socket Nodes
    for (let i = 0; i < this.totalRequired; i++) {
      const angle = (i * Math.PI * 2) / this.totalRequired - Math.PI / 2;
      const nx = Math.cos(angle) * 38;
      const ny = Math.sin(angle) * 38;

      ctx.beginPath();
      ctx.arc(nx, ny, 7, 0, Math.PI * 2);
      if (i < this.shardsDeposited) {
        ctx.fillStyle = '#00E5FF';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = 10;
      } else {
        ctx.fillStyle = '#0B101D';
        ctx.fill();
        ctx.strokeStyle = '#FFB703';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 5. Center Core Gem
    ctx.fillStyle = this.state === 'consecrated' ? '#FFFFFF' : ringColor;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderProceduralBase(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#121824';
    ctx.strokeStyle = '#FFB703';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
