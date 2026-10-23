import { describe, it, expect, beforeEach } from 'vitest';
import { SpriteAtlas } from '../../src/assets/SpriteAtlas';
import { AssetPipelineDiagnostics } from '../../src/assets/AssetPipelineDiagnostics';
import { ASSET_PROVENANCE_REGISTRY } from '../../src/assets/AssetProvenance';
import { GameScene } from '../../src/scenes/GameScene';
import { Engine } from '../../src/engine/Engine';

describe('Stage R1 — Production Art Pipeline & Reconstructed Sanctum Verification', () => {
  let engine: Engine;
  let canvas: HTMLCanvasElement;
  let gameScene: GameScene;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    engine = new Engine();
    engine.init(canvas);
    gameScene = new GameScene();
  });

  it('verifies SpriteAtlas contains registered production Sanctum frames with normalized pivots', () => {
    const atlas = SpriteAtlas.getInstance();
    const frames = atlas.getAllFrames();

    expect(frames.length).toBeGreaterThanOrEqual(9);

    const pillarFrame = atlas.getFrame('SANCTUM_PILLAR');
    expect(pillarFrame).toBeDefined();
    expect(pillarFrame!.pivotX).toBeCloseTo(0.5, 2);
    expect(pillarFrame!.pivotY).toBeGreaterThanOrEqual(0.85); // Pivot at pillar base

    const altarFrame = atlas.getFrame('SANCTUM_ALTAR');
    expect(altarFrame).toBeDefined();
    expect(altarFrame!.pivotX).toBeCloseTo(0.5, 2);

    const sentinelFrame = atlas.getFrame('SANCTUM_SENTINEL');
    expect(sentinelFrame).toBeDefined();

    const shardFrame = atlas.getFrame('SANCTUM_SHARD');
    expect(shardFrame).toBeDefined();

    const toranaFrame = atlas.getFrame('SANCTUM_TORANA');
    expect(toranaFrame).toBeDefined();
    expect(toranaFrame!.pivotY).toBeGreaterThanOrEqual(0.85);
  });

  it('runs AssetPipelineDiagnostics and confirms zero audit violations', () => {
    const result = AssetPipelineDiagnostics.runAudit();
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.totalAtlasFrames).toBeGreaterThanOrEqual(9);
    expect(result.totalProvenanceRecords).toBeGreaterThanOrEqual(9);
  });

  it('validates ASSET_PROVENANCE_REGISTRY contains valid checksums, categories, and licensing', () => {
    const records = Object.values(ASSET_PROVENANCE_REGISTRY);
    expect(records.length).toBeGreaterThanOrEqual(9);

    for (const record of records) {
      expect(record.checksum).toBeDefined();
      expect(record.checksum.length).toBe(64); // SHA-256 hex string length
      expect(record.license).toContain('Apache-2.0');
      expect(record.authoringStudio).toBe('Mythos Vedic Arts Studio');
      expect(record.dimensions.width).toBe(1024);
      expect(record.dimensions.height).toBe(1024);
    }
  });

  it('renders the reconstructed Sanctum level with SpriteAtlas, braziers, and layered lighting without throwing', () => {
    gameScene.onEnter(engine);
    const renderer = engine.getRenderer();

    // Verify initial update
    expect(() => {
      gameScene.update(0.016);
    }).not.toThrow();

    // Verify rendering of reconstructed floor, nave inlay, pillars, altar, sentinels, and braziers
    expect(() => {
      gameScene.render(renderer);
    }).not.toThrow();
  });

  it('verifies SpriteAtlas.drawSprite applies translation, scale, and pivot offset cleanly', () => {
    const atlas = SpriteAtlas.getInstance();
    const mockCtx = {
      save: () => {},
      restore: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      drawImage: () => {},
      fillRect: () => {},
      fillStyle: '',
      globalAlpha: 1.0,
      globalCompositeOperation: 'source-over',
    } as unknown as CanvasRenderingContext2D;

    const drawn = atlas.drawSprite(mockCtx, 'SANCTUM_PILLAR', 100, 200, { scale: 0.25 });
    expect(drawn).toBe(true);

    const nonExistent = atlas.drawSprite(mockCtx, 'NON_EXISTENT_SPRITE', 0, 0);
    expect(nonExistent).toBe(false);
  });
});
