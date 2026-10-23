import { ASSET_MANIFEST, AssetDescriptor } from './AssetManifest';

export class AssetManager {
  private static instance: AssetManager | null = null;
  private textures: Map<string, HTMLImageElement | HTMLCanvasElement> = new Map();
  private loadedCount = 0;
  private isAllLoaded = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  public static resetInstance(): void {
    AssetManager.instance = null;
  }

  public getManifest(): AssetDescriptor[] {
    return ASSET_MANIFEST;
  }

  public isLoaded(id: string): boolean {
    return this.textures.has(id);
  }

  public isReady(): boolean {
    return this.isAllLoaded;
  }

  public getTexture(id: string): HTMLImageElement | HTMLCanvasElement | null {
    const tex = this.textures.get(id);
    if (tex) return tex;

    // Create a procedural fallback if not yet loaded
    const fallback = this.createFallbackTexture(id);
    this.textures.set(id, fallback);
    return fallback;
  }

  public async loadAll(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise<void>((resolve) => {
      // Check if running in headless node/JSDOM environment
      const isHeadless =
        typeof window === 'undefined' ||
        typeof Image === 'undefined' ||
        (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) ||
        (typeof process !== 'undefined' && (process.env?.NODE_ENV === 'test' || process.env?.VITEST === 'true'));

      if (isHeadless) {
        for (const desc of ASSET_MANIFEST) {
          this.textures.set(desc.id, this.createFallbackTexture(desc.id));
        }
        this.isAllLoaded = true;
        resolve();
        return;
      }

      let pending = ASSET_MANIFEST.length;
      if (pending === 0) {
        this.isAllLoaded = true;
        resolve();
        return;
      }

      for (const desc of ASSET_MANIFEST) {
        const img = new Image();
        img.onload = () => {
          this.textures.set(desc.id, img);
          this.loadedCount++;
          pending--;
          if (pending === 0) {
            this.isAllLoaded = true;
            resolve();
          }
        };
        img.onerror = () => {
          console.warn(`[AssetManager] Texture ${desc.id} at ${desc.src} failed to load. Falling back to procedural proxy.`);
          this.textures.set(desc.id, this.createFallbackTexture(desc.id));
          this.loadedCount++;
          pending--;
          if (pending === 0) {
            this.isAllLoaded = true;
            resolve();
          }
        };
        img.src = desc.src;
      }
    });

    return this.loadPromise;
  }

  private createFallbackTexture(id: string): HTMLCanvasElement {
    if (typeof document === 'undefined') {
      return {} as HTMLCanvasElement;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = id.includes('ALTAR') ? '#FFB703' : id.includes('SHARD') ? '#00E5FF' : '#4A5568';
      ctx.fillRect(0, 0, 64, 64);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, 60, 60);
    }
    return canvas;
  }

  /**
   * Validates that all manifest assets are defined with positive dimensions.
   */
  public validateManifest(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const ids = new Set<string>();

    for (const item of ASSET_MANIFEST) {
      if (ids.has(item.id)) {
        errors.push(`Duplicate asset id: ${item.id}`);
      }
      ids.add(item.id);

      if (!item.src || item.src.length === 0) {
        errors.push(`Empty src for asset: ${item.id}`);
      }
      if (item.width <= 0 || item.height <= 0) {
        errors.push(`Invalid dimensions for asset: ${item.id} (${item.width}x${item.height})`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
