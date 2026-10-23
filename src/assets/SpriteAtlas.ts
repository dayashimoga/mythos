import { AssetManager } from './AssetManager';

export interface SpriteFrameMetadata {
  id: string;
  textureId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pivotX: number; // Normalized (0.0 - 1.0), e.g. 0.5 for horizontal center
  pivotY: number; // Normalized (0.0 - 1.0), e.g. 0.9 for standing entity feet/base
  sourceWidth: number;
  sourceHeight: number;
  name: string;
  category: 'environment' | 'actor' | 'prop' | 'decal' | 'ui';
}

export interface DrawSpriteOptions {
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  opacity?: number;
  flipX?: boolean;
  tint?: string;
  blendMode?: GlobalCompositeOperation;
}

export class SpriteAtlas {
  private static instance: SpriteAtlas | null = null;
  private frames: Map<string, SpriteFrameMetadata> = new Map();

  private constructor() {
    this.registerSanctumFrames();
  }

  public static getInstance(): SpriteAtlas {
    if (!SpriteAtlas.instance) {
      SpriteAtlas.instance = new SpriteAtlas();
    }
    return SpriteAtlas.instance;
  }

  public registerFrame(frame: SpriteFrameMetadata): void {
    this.frames.set(frame.id, frame);
  }

  public getFrame(id: string): SpriteFrameMetadata | undefined {
    return this.frames.get(id);
  }

  public getAllFrames(): SpriteFrameMetadata[] {
    return Array.from(this.frames.values());
  }

  /**
   * Draws a registered sprite frame using its authoritative pivot point.
   */
  public drawSprite(
    ctx: CanvasRenderingContext2D,
    frameId: string,
    worldX: number,
    worldY: number,
    options: DrawSpriteOptions = {}
  ): boolean {
    const frame = this.frames.get(frameId);
    if (!frame) return false;

    const tex = AssetManager.getInstance().getTexture(frame.textureId);
    if (!tex) return false;

    const scaleX = (options.scaleX ?? options.scale ?? 1.0) * (options.flipX ? -1 : 1);
    const scaleY = options.scaleY ?? options.scale ?? 1.0;
    const rotation = options.rotation ?? 0;
    const opacity = options.opacity ?? 1.0;

    ctx.save();
    ctx.translate(worldX, worldY);

    if (rotation !== 0) {
      ctx.rotate(rotation);
    }

    if (scaleX !== 1 || scaleY !== 1) {
      ctx.scale(scaleX, scaleY);
    }

    if (opacity < 1.0) {
      ctx.globalAlpha *= opacity;
    }

    if (options.blendMode) {
      ctx.globalCompositeOperation = options.blendMode;
    }

    // Offset by normalized pivot point
    const destX = -frame.width * frame.pivotX;
    const destY = -frame.height * frame.pivotY;

    try {
      ctx.drawImage(
        tex as CanvasImageSource,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        destX,
        destY,
        frame.width,
        frame.height
      );
    } catch {
      // Fallback proxy representation
      ctx.fillStyle = '#FFB703';
      ctx.fillRect(destX, destY, frame.width, frame.height);
    }

    ctx.restore();
    return true;
  }

  private registerSanctumFrames(): void {
    // 1. Production Hoysala Temple Pillar (Pivot at base)
    this.registerFrame({
      id: 'SANCTUM_PILLAR',
      textureId: 'TEX_SANCTUM_PILLAR_PROD',
      x: 0,
      y: 0,
      width: 1024,
      height: 1024,
      pivotX: 0.5,
      pivotY: 0.92, // Ground contact foot
      sourceWidth: 1024,
      sourceHeight: 1024,
      name: 'Carved Hoysala Stone Column with Diya Brazier',
      category: 'environment',
    });

    // 2. Production Surya Peetham Sun Altar (Pivot at center dais)
    this.registerFrame({
      id: 'SANCTUM_ALTAR',
      textureId: 'TEX_SANCTUM_ALTAR_PROD',
      x: 0,
      y: 0,
      width: 1024,
      height: 1024,
      pivotX: 0.5,
      pivotY: 0.56,
      sourceWidth: 1024,
      sourceHeight: 1024,
      name: 'Sacred Stepped Surya Lotus Altar Shrine',
      category: 'prop',
    });

    // 3. Production Sanchi Torana Archway Gateway (Pivot at bottom threshold)
    this.registerFrame({
      id: 'SANCTUM_TORANA',
      textureId: 'TEX_SANCTUM_TORANA_PROD',
      x: 0,
      y: 0,
      width: 1024,
      height: 1024,
      pivotX: 0.5,
      pivotY: 0.90,
      sourceWidth: 1024,
      sourceHeight: 1024,
      name: 'Sanchi Celestial Torana Gateway with Solar Vortex',
      category: 'environment',
    });

    // 4. Production Corrupted Asura Sentinel (Pivot at center of mass)
    this.registerFrame({
      id: 'SANCTUM_SENTINEL',
      textureId: 'TEX_SANCTUM_SENTINEL_PROD',
      x: 0,
      y: 0,
      width: 1024,
      height: 1024,
      pivotX: 0.5,
      pivotY: 0.52,
      sourceWidth: 1024,
      sourceHeight: 1024,
      name: 'Corrupted Asura Automaton Guardian',
      category: 'actor',
    });

    // 5. Production Astra Shard Crystal (Pivot at crystal center)
    this.registerFrame({
      id: 'SANCTUM_SHARD',
      textureId: 'TEX_SANCTUM_SHARD_PROD',
      x: 0,
      y: 0,
      width: 1024,
      height: 1024,
      pivotX: 0.5,
      pivotY: 0.5,
      sourceWidth: 1024,
      sourceHeight: 1024,
      name: 'Radiant Crystalline Astra Shard Prism',
      category: 'prop',
    });

    // 6. Production Bronze Brazier Pedestal (Pivot at stone base)
    this.registerFrame({
      id: 'SANCTUM_BRAZIER',
      textureId: 'TEX_SANCTUM_BRAZIER_PROD',
      x: 0,
      y: 0,
      width: 1024,
      height: 1024,
      pivotX: 0.5,
      pivotY: 0.88,
      sourceWidth: 1024,
      sourceHeight: 1024,
      name: 'Carved Bronze Agni Camphor Brazier Pedestal',
      category: 'prop',
    });

    // 7. Production Sculpted Temple Pavers (Floor tile)
    this.registerFrame({
      id: 'SANCTUM_PAVERS',
      textureId: 'TEX_SANCTUM_PAVERS_PROD',
      x: 0,
      y: 0,
      width: 1024,
      height: 1024,
      pivotX: 0.0,
      pivotY: 0.0,
      sourceWidth: 1024,
      sourceHeight: 1024,
      name: 'Sculpted Basalt Temple Floor Pavers with Gold Inlay',
      category: 'environment',
    });

    // 8. Production Central Ceremonial Pathway Inlay
    this.registerFrame({
      id: 'SANCTUM_INLAY',
      textureId: 'TEX_SANCTUM_INLAY_PROD',
      x: 0,
      y: 0,
      width: 1024,
      height: 1024,
      pivotX: 0.5,
      pivotY: 0.0,
      sourceWidth: 1024,
      sourceHeight: 1024,
      name: 'Ceremonial Nave Solar Sanskrit Glyph Stone Avenue',
      category: 'decal',
    });

    // 9. Production Wall Relief Frieze
    this.registerFrame({
      id: 'SANCTUM_WALL',
      textureId: 'TEX_SANCTUM_WALL_PROD',
      x: 0,
      y: 0,
      width: 1024,
      height: 1024,
      pivotX: 0.5,
      pivotY: 0.5,
      sourceWidth: 1024,
      sourceHeight: 1024,
      name: 'Hoysala Carved Bas-Relief Perimeter Wall Frieze',
      category: 'environment',
    });

    // 10. Production Hero Veer Sprite (Pivot at ground feet)
    this.registerFrame({
      id: 'SANCTUM_HERO_VEER',
      textureId: 'TEX_SANCTUM_HERO_VEER',
      x: 120,
      y: 40,
      width: 640,
      height: 940,
      pivotX: 0.5,
      pivotY: 0.96,
      sourceWidth: 1024,
      sourceHeight: 1024,
      name: 'Hero Veer with Agni Solar Gauntlets and Celestial Sash',
      category: 'actor',
    });
  }
}
