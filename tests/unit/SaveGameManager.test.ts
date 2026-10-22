import { describe, it, expect, beforeEach } from 'vitest';
import { SaveGameManager } from '../../src/state/SaveGameManager';
import { StorageAdapter, MemoryStorage } from '../../src/state/StorageAdapter';

describe('SaveGameManager State Persistence', () => {
  beforeEach(() => {
    StorageAdapter.setCustomStorage(new MemoryStorage());
    SaveGameManager.reset();
  });

  it('loads default state when no saved state exists', () => {
    const state = SaveGameManager.load();
    expect(state.version).toBe('1.0.0');
    expect(state.currentRealm).toBe('SanctumOfAstra');
    expect(state.shardsCollected).toBe(0);
    expect(state.altarConsecrated).toBe(false);
    expect(state.checksum).toBeDefined();
  });

  it('saves state and loads it back with verified checksum', () => {
    const saved = SaveGameManager.save({
      shardsCollected: 3,
      altarConsecrated: true,
      highScore: 4500,
    });
    expect(saved).toBe(true);

    const loaded = SaveGameManager.load();
    expect(loaded.shardsCollected).toBe(3);
    expect(loaded.altarConsecrated).toBe(true);
    expect(loaded.highScore).toBe(4500);
  });

  it('reverts to default state if data has been tampered with (invalid checksum)', () => {
    SaveGameManager.save({ shardsCollected: 2 });
    const storage = StorageAdapter.getStorage();

    // Tamper with shards without updating checksum
    const raw = JSON.parse(storage.getItem('mythos_save_data_v1')!);
    raw.shardsCollected = 999;
    storage.setItem('mythos_save_data_v1', JSON.stringify(raw));

    const loaded = SaveGameManager.load();
    expect(loaded.shardsCollected).toBe(0); // reverted to default due to checksum mismatch
  });

  it('resets state properly', () => {
    SaveGameManager.save({ shardsCollected: 3 });
    SaveGameManager.reset();

    const loaded = SaveGameManager.load();
    expect(loaded.shardsCollected).toBe(0);
  });
});
