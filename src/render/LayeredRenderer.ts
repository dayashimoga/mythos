import { RenderLayer, RenderItem, PointLight, GraphicsQuality, QualityProfile } from './RenderLayers';
import { AssetManager } from '../assets/AssetManager';

const QUALITY_PROFILES: Record<GraphicsQuality, QualityProfile> = {
  [GraphicsQuality.LOW]: {
    quality: GraphicsQuality.LOW,
    shadows: false,
    lightShafts: false,
    maxDynamicLights: 0,
    particlesScale: 0.25,
    parallax: false,
  },
  [GraphicsQuality.MEDIUM]: {
    quality: GraphicsQuality.MEDIUM,
    shadows: true,
    lightShafts: false,
    maxDynamicLights: 3,
    particlesScale: 0.6,
    parallax: true,
  },
  [GraphicsQuality.HIGH]: {
    quality: GraphicsQuality.HIGH,
    shadows: true,
    lightShafts: true,
    maxDynamicLights: 8,
    particlesScale: 1.0,
    parallax: true,
  },
  [GraphicsQuality.ULTRA]: {
    quality: GraphicsQuality.ULTRA,
    shadows: true,
    lightShafts: true,
    maxDynamicLights: 24,
    particlesScale: 1.5,
    parallax: true,
  },
};

export class LayeredRenderer {
  private static instance: LayeredRenderer | null = null;
  private queues: Map<RenderLayer, RenderItem[]> = new Map();
  private lights: PointLight[] = [];
  private quality: GraphicsQuality = GraphicsQuality.HIGH;
  private lastFlushTimeMs = 0;
  private lastItemCount = 0;
  private culledCount = 0;

  private constructor() {
    this.clear();
  }

  public static getInstance(): LayeredRenderer {
    if (!LayeredRenderer.instance) {
      LayeredRenderer.instance = new LayeredRenderer();
    }
    return LayeredRenderer.instance;
  }

  public setQuality(quality: GraphicsQuality): void {
    this.quality = quality;
  }

  public getQuality(): GraphicsQuality {
    return this.quality;
  }

  public getProfile(): QualityProfile {
    return QUALITY_PROFILES[this.quality];
  }

  public getMetrics(): { flushTimeMs: number; itemCount: number; culledCount: number; lightCount: number } {
    return {
      flushTimeMs: this.lastFlushTimeMs,
      itemCount: this.lastItemCount,
      culledCount: this.culledCount,
      lightCount: this.lights.length,
    };
  }

  public isInsideFrustum(
    x: number,
    y: number,
    radius: number,
    camX: number,
    camY: number,
    vpW: number,
    vpH: number,
    margin = 80
  ): boolean {
    const left = camX - vpW / 2 - margin;
    const right = camX + vpW / 2 + margin;
    const top = camY - vpH / 2 - margin;
    const bottom = camY + vpH / 2 + margin;

    return (
      x + radius >= left &&
      x - radius <= right &&
      y + radius >= top &&
      y - radius <= bottom
    );
  }

  public clear(): void {
    this.queues.clear();
    for (let l = RenderLayer.BACKGROUND; l <= RenderLayer.UI; l++) {
      this.queues.set(l, []);
    }
    this.lights = [];
  }

  public enqueue(layer: RenderLayer, sortY: number, renderFn: (ctx: CanvasRenderingContext2D) => void): void {
    const list = this.queues.get(layer);
    if (list) {
      list.push({ layer, sortY, render: renderFn });
    }
  }

  public addLight(light: PointLight): void {
    const profile = this.getProfile();
    if (profile.maxDynamicLights > 0 && this.lights.length < profile.maxDynamicLights) {
      this.lights.push(light);
    }
  }

  public flush(ctx: CanvasRenderingContext2D): void {
    const t0 = performance.now();
    let totalItems = 0;

    for (let l = RenderLayer.BACKGROUND; l <= RenderLayer.UI; l++) {
      const items = this.queues.get(l);
      if (!items || items.length === 0) continue;

      totalItems += items.length;

      // Depth sort for Architecture, Actors, and Props based on base sortY
      if (l === RenderLayer.ARCHITECTURE || l === RenderLayer.ACTORS) {
        items.sort((a, b) => a.sortY - b.sortY);
      }

      for (let i = 0; i < items.length; i++) {
        items[i].render(ctx);
      }
    }

    // Render Dynamic Lighting Pass if lights exist and profile allows
    if (this.lights.length > 0 && this.getProfile().maxDynamicLights > 0) {
      this.renderLightingPass(ctx);
    }

    this.lastFlushTimeMs = performance.now() - t0;
    this.lastItemCount = totalItems;
    this.clear();
  }

  private renderLightingPass(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const light of this.lights) {
      const flickerMod = light.flicker ? (0.9 + Math.sin(Date.now() * 0.01 + light.x) * 0.1) : 1.0;
      const currentRadius = light.radius * flickerMod;
      const currentIntensity = light.intensity * flickerMod;

      const gradient = ctx.createRadialGradient(
        light.x, light.y, 0,
        light.x, light.y, currentRadius
      );

      // Light color with intensity falloff
      gradient.addColorStop(0, light.color);
      gradient.addColorStop(0.5, this.fadeColor(light.color, currentIntensity * 0.5));
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(light.x, light.y, currentRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private fadeColor(color: string, alphaFactor: number): string {
    if (color.startsWith('#')) {
      // Hex color to rgba
      const r = parseInt(color.slice(1, 3), 16) || 255;
      const g = parseInt(color.slice(3, 5), 16) || 183;
      const b = parseInt(color.slice(5, 7), 16) || 3;
      return `rgba(${r}, ${g}, ${b}, ${alphaFactor})`;
    }
    return color;
  }

  /**
   * Draws a texture sprite with center anchor, optional rotation, and opacity.
   */
  public drawSprite(
    ctx: CanvasRenderingContext2D,
    textureId: string,
    x: number,
    y: number,
    width: number,
    height: number,
    rotation = 0,
    opacity = 1.0
  ): void {
    const tex = AssetManager.getInstance().getTexture(textureId);
    if (!tex) return;

    ctx.save();
    ctx.translate(x, y);
    if (rotation !== 0) {
      ctx.rotate(rotation);
    }
    if (opacity < 1.0) {
      ctx.globalAlpha *= opacity;
    }

    try {
      ctx.drawImage(tex as CanvasImageSource, -width / 2, -height / 2, width, height);
    } catch (e) {
      // Fallback if image draw throws (e.g. in broken mock context)
      ctx.fillStyle = '#FFB703';
      ctx.fillRect(-width / 2, -height / 2, width, height);
    }

    ctx.restore();
  }

  /**
   * Draws a soft directional contact shadow under an entity.
   */
  public drawContactShadow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    alpha = 0.55
  ): void {
    if (!this.getProfile().shadows) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, radiusY / radiusX);

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
    grad.addColorStop(0, `rgba(4, 6, 12, ${alpha})`);
    grad.addColorStop(0.6, `rgba(4, 6, 12, ${alpha * 0.4})`);
    grad.addColorStop(1, 'rgba(4, 6, 12, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radiusX, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draws celestial parallax background.
   */
  public drawParallaxBackground(
    ctx: CanvasRenderingContext2D,
    textureId: string,
    camX: number,
    camY: number,
    vpW: number,
    vpH: number,
    factor = 0.15
  ): void {
    const tex = AssetManager.getInstance().getTexture(textureId);
    if (!tex) return;

    ctx.save();
    // Parallax displacement (disabled in LOW profile)
    const effectiveFactor = this.getProfile().parallax ? factor : 0;
    const offsetX = -camX * effectiveFactor;
    const offsetY = -camY * effectiveFactor;

    // Draw background centered in view with subtle parallax shift
    const bgW = vpW * 1.5;
    const bgH = vpH * 1.5;

    try {
      ctx.drawImage(
        tex as CanvasImageSource,
        camX - bgW / 2 + offsetX,
        camY - bgH / 2 + offsetY,
        bgW,
        bgH
      );
    } catch (e) {
      // Ignore in headless
    }

    ctx.restore();
  }

  /**
   * Draws atmospheric crepuscular light shafts (god rays).
   */
  public drawLightShafts(
    ctx: CanvasRenderingContext2D,
    time: number,
    cx: number,
    cy: number,
    _w: number,
    h: number
  ): void {
    if (!this.getProfile().lightShafts) return;

    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const shaftCount = 4;
    for (let i = 0; i < shaftCount; i++) {
      const angle = -Math.PI / 4 + Math.sin(time * 0.4 + i * 1.5) * 0.05;
      const xOffset = (i - shaftCount / 2) * 220 + Math.sin(time * 0.2 + i) * 30;
      const alpha = 0.08 + Math.sin(time * 0.8 + i * 2) * 0.03;

      ctx.save();
      ctx.translate(cx + xOffset, cy - h / 2 - 100);
      ctx.rotate(angle);

      const grad = ctx.createLinearGradient(0, 0, 140, h * 1.4);
      grad.addColorStop(0, `rgba(255, 235, 170, ${alpha * 1.5})`);
      grad.addColorStop(0.5, `rgba(255, 183, 3, ${alpha})`);
      grad.addColorStop(1, 'rgba(255, 183, 3, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-40, 0);
      ctx.lineTo(140, 0);
      ctx.lineTo(240, h * 1.4);
      ctx.lineTo(-100, h * 1.4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }
}
