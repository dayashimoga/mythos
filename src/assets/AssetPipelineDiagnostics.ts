import { ASSET_MANIFEST } from './AssetManifest';
import { ASSET_PROVENANCE_REGISTRY } from './AssetProvenance';
import { SpriteAtlas } from './SpriteAtlas';

export interface PipelineAuditResult {
  valid: boolean;
  totalManifestAssets: number;
  totalProvenanceRecords: number;
  totalAtlasFrames: number;
  issues: string[];
  worldSpritesCount: number;
  uiPortraitsCount: number;
}

export class AssetPipelineDiagnostics {
  public static runAudit(): PipelineAuditResult {
    const issues: string[] = [];
    const manifestIds = new Set(ASSET_MANIFEST.map((a) => a.id));

    // 1. Verify provenance records match manifest
    for (const [id, record] of Object.entries(ASSET_PROVENANCE_REGISTRY)) {
      if (!manifestIds.has(id)) {
        issues.push(`Provenance record ${id} missing from ASSET_MANIFEST.`);
      }
      if (record.dimensions.width <= 0 || record.dimensions.height <= 0) {
        issues.push(`Asset ${id} has invalid dimensions (${record.dimensions.width}x${record.dimensions.height}).`);
      }
      if (!record.checksum || record.checksum.length < 16) {
        issues.push(`Asset ${id} lacks a valid SHA-256 equivalent checksum.`);
      }
    }

    // 2. Verify SpriteAtlas frames and normalized pivots
    const atlas = SpriteAtlas.getInstance();
    const frames = atlas.getAllFrames();
    let worldSpritesCount = 0;
    let uiPortraitsCount = 0;

    for (const frame of frames) {
      if (frame.pivotX < 0 || frame.pivotX > 1.0 || frame.pivotY < 0 || frame.pivotY > 1.0) {
        issues.push(`Frame ${frame.id} has invalid non-normalized pivot (${frame.pivotX}, ${frame.pivotY}).`);
      }
      if (!manifestIds.has(frame.textureId)) {
        issues.push(`Frame ${frame.id} references unregistered textureId ${frame.textureId}.`);
      }

      if (frame.category === 'ui') {
        uiPortraitsCount++;
      } else {
        worldSpritesCount++;
      }
    }

    // 3. Verify separation of UI portraits and in-world game sprites
    const uiPortraitIds = new Set(['CHAR_DEVI_TARA', 'CHAR_VEER', 'CHAR_STONE_RAKSHASA', 'CHAR_VANARA_KAPI', 'CHAR_MAHISHASURA']);
    for (const frame of frames) {
      if (frame.category !== 'ui' && uiPortraitIds.has(frame.textureId)) {
        issues.push(`UI Portrait ${frame.textureId} is erroneously used as in-world sprite frame ${frame.id}.`);
      }
    }

    return {
      valid: issues.length === 0,
      totalManifestAssets: ASSET_MANIFEST.length,
      totalProvenanceRecords: Object.keys(ASSET_PROVENANCE_REGISTRY).length,
      totalAtlasFrames: frames.length,
      issues,
      worldSpritesCount,
      uiPortraitsCount,
    };
  }
}
