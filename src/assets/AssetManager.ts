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
          this.textures.set(desc.id, this.processBlackKeying(desc.id, img));
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

  private processBlackKeying(descId: string, img: HTMLImageElement): HTMLCanvasElement | HTMLImageElement {
    const TRANSPARENT_SPRITE_IDS = new Set([
      'TEX_SANCTUM_TORANA',
      'TEX_SANCTUM_PILLAR',
      'TEX_SANCTUM_ALTAR',
      'TEX_SANCTUM_SHARD',
      'TEX_SANCTUM_SENTINEL',
      'TEX_SANCTUM_HERO_VEER',
      'TEX_SANCTUM_TORANA_PROD',
      'TEX_SANCTUM_PILLAR_PROD',
      'TEX_SANCTUM_ALTAR_PROD',
      'TEX_SANCTUM_SHARD_PROD',
      'TEX_SANCTUM_SENTINEL_PROD',
      'TEX_SANCTUM_BRAZIER_PROD',
    ]);

    if (!TRANSPARENT_SPRITE_IDS.has(descId) || typeof document === 'undefined') {
      return img;
    }

    try {
      const canvas = document.createElement('canvas');
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (w <= 0 || h <= 0) return img;

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return img;

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      const isCheckerboardBackground = (r: number, g: number, b: number): boolean => {
        const diffRG = Math.abs(r - g);
        const diffGB = Math.abs(g - b);
        const diffRB = Math.abs(r - b);
        return diffRG <= 16 && diffGB <= 16 && diffRB <= 16;
      };

      // BFS Flood-fill from borders to clear external background without affecting interior
      const queue: number[] = [];
      const visited = new Uint8Array(w * h);

      // Seed all 4 borders
      for (let x = 0; x < w; x++) {
        queue.push(x);
        queue.push((h - 1) * w + x);
      }
      for (let y = 1; y < h - 1; y++) {
        queue.push(y * w);
        queue.push(y * w + (w - 1));
      }

      let qIdx = 0;
      while (qIdx < queue.length) {
        const p = queue[qIdx++];
        if (visited[p]) continue;
        visited[p] = 1;

        const idx = p * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const maxVal = Math.max(r, g, b);

        const isDark = maxVal <= 36;
        const isNeutral = isCheckerboardBackground(r, g, b) && maxVal >= 70;

        if (isDark || isNeutral) {
          data[idx + 3] = 0; // Transparent

          const px = p % w;
          const py = Math.floor(p / w);

          if (px > 0 && !visited[p - 1]) queue.push(p - 1);
          if (px < w - 1 && !visited[p + 1]) queue.push(p + 1);
          if (py > 0 && !visited[p - w]) queue.push(p - w);
          if (py < h - 1 && !visited[p + w]) queue.push(p + w);
        } else if (maxVal <= 64 || (isCheckerboardBackground(r, g, b) && maxVal <= 96)) {
          // Soft feathered alpha edge
          data[idx + 3] = Math.round(data[idx + 3] * 0.4);
        }
      }

      ctx.putImageData(imgData, 0, 0);
      return canvas;
    } catch {
      return img;
    }
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
