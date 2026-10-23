import { describe, it, expect, beforeEach } from 'vitest';
import { AssetManager } from '../../src/assets/AssetManager';
import { ASSET_MANIFEST, ASSET_IDS } from '../../src/assets/AssetManifest';

describe('Production Asset Pipeline & Manifest Verification', () => {
  beforeEach(() => {
    AssetManager.resetInstance();
  });

  it('validates the complete production asset manifest integrity', () => {
    const manager = AssetManager.getInstance();
    const validation = manager.validateManifest();

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(manager.getManifest().length).toBeGreaterThanOrEqual(19);
  });

  it('contains valid descriptors for all core sanctum visual assets, characters, and environments', () => {
    const ids = ASSET_MANIFEST.map((m) => m.id);
    expect(ids).toContain(ASSET_IDS.SANCTUM_FLOOR);
    expect(ids).toContain(ASSET_IDS.SANCTUM_ALTAR);
    expect(ids).toContain(ASSET_IDS.SANCTUM_PILLAR);
    expect(ids).toContain(ASSET_IDS.SANCTUM_SHARD);
    expect(ids).toContain(ASSET_IDS.SANCTUM_SENTINEL);
    expect(ids).toContain(ASSET_IDS.SANCTUM_HERO_VEER);
    expect(ids).toContain(ASSET_IDS.SANCTUM_SKY);
    expect(ids).toContain(ASSET_IDS.SANCTUM_TORANA);
    expect(ids).toContain(ASSET_IDS.CHAR_VEER);
    expect(ids).toContain(ASSET_IDS.CHAR_DEVI_TARA);
    expect(ids).toContain(ASSET_IDS.CHAR_STONE_RAKSHASA);
    expect(ids).toContain(ASSET_IDS.CHAR_VANARA_KAPI);
    expect(ids).toContain(ASSET_IDS.CHAR_MAHISHASURA);
    expect(ids).toContain(ASSET_IDS.BHUMI_FLOOR);
    expect(ids).toContain(ASSET_IDS.BHUMI_LAVA);
    expect(ids).toContain(ASSET_IDS.BHUMI_BACKDROP);
    expect(ids).toContain(ASSET_IDS.BHUMI_CLIFF);
    expect(ids).toContain(ASSET_IDS.BHUMI_BRIDGE);
    expect(ids).toContain(ASSET_IDS.BHUMI_SHRINE);

    for (const asset of ASSET_MANIFEST) {
      expect(asset.width).toBeGreaterThan(0);
      expect(asset.height).toBeGreaterThan(0);
      expect(asset.src).toMatch(/\.(jpg|png|webp)$/i);
      expect(asset.category).toBeDefined();
      expect(asset.provenance).toBeDefined();
    }
  });

  it('loads all assets asynchronously with headless test safety', async () => {
    const manager = AssetManager.getInstance();
    expect(manager.isReady()).toBe(false);

    await manager.loadAll();

    expect(manager.isReady()).toBe(true);
    for (const asset of ASSET_MANIFEST) {
      expect(manager.isLoaded(asset.id)).toBe(true);
      const texture = manager.getTexture(asset.id);
      expect(texture).toBeDefined();
    }
  });

  it('generates graceful procedural fallbacks for unknown or pending textures', () => {
    const manager = AssetManager.getInstance();
    const fallbackAltar = manager.getTexture('TEX_UNKNOWN_ALTAR');
    expect(fallbackAltar).toBeDefined();

    const fallbackShard = manager.getTexture('TEX_UNKNOWN_SHARD');
    expect(fallbackShard).toBeDefined();

    const fallbackGeneric = manager.getTexture('TEX_UNKNOWN_GENERIC');
    expect(fallbackGeneric).toBeDefined();
  });

  it('maintains singleton instance semantics across callers', () => {
    const instanceA = AssetManager.getInstance();
    const instanceB = AssetManager.getInstance();
    expect(instanceA).toBe(instanceB);
  });
});
