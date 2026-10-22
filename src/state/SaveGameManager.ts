import { StorageAdapter } from './StorageAdapter';

export interface GameSaveState {
  version: string;
  timestamp: number;
  unlockedRealms: string[];
  currentRealm: string;
  shardsCollected: number;
  altarConsecrated: boolean;
  highScore: number;
  playtimeSeconds: number;
  checksum: string;
}

export class SaveGameManager {
  private static readonly STORAGE_KEY = 'mythos_save_data_v1';
  private static readonly CURRENT_VERSION = '1.0.0';

  public static getDefaultState(): GameSaveState {
    const base = {
      version: this.CURRENT_VERSION,
      timestamp: Date.now(),
      unlockedRealms: ['SanctumOfAstra'],
      currentRealm: 'SanctumOfAstra',
      shardsCollected: 0,
      altarConsecrated: false,
      highScore: 0,
      playtimeSeconds: 0,
    };
    return {
      ...base,
      checksum: this.calculateChecksum(base),
    };
  }

  private static calculateChecksum(data: Omit<GameSaveState, 'checksum'>): string {
    const str = `${data.version}:${data.currentRealm}:${data.shardsCollected}:${data.altarConsecrated}:${data.highScore}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(16);
  }

  public static save(state: Partial<GameSaveState>): boolean {
    try {
      const storage = StorageAdapter.getStorage();
      const current = this.load();
      const updated = {
        ...current,
        ...state,
        version: this.CURRENT_VERSION,
        timestamp: Date.now(),
      };
      updated.checksum = this.calculateChecksum(updated);

      storage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch (e) {
      console.error('[SaveGameManager] Failed to save state:', e);
      return false;
    }
  }

  public static load(): GameSaveState {
    try {
      const storage = StorageAdapter.getStorage();
      const raw = storage.getItem(this.STORAGE_KEY);
      if (!raw) return this.getDefaultState();

      const parsed = JSON.parse(raw) as GameSaveState;
      const expectedChecksum = this.calculateChecksum(parsed);
      if (parsed.checksum !== expectedChecksum) {
        console.warn('[SaveGameManager] Checksum mismatch in save state. Reverting to default.');
        return this.getDefaultState();
      }
      return parsed;
    } catch {
      return this.getDefaultState();
    }
  }

  public static reset(): void {
    const storage = StorageAdapter.getStorage();
    storage.removeItem(this.STORAGE_KEY);
  }
}
