export interface IStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

export class MemoryStorage implements IStorage {
  private store: Map<string, string> = new Map();

  public getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  public removeItem(key: string): void {
    this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }
}

export class StorageAdapter {
  private static backend: IStorage | null = null;

  public static getStorage(): IStorage {
    if (this.backend) return this.backend;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const testKey = '__mythos_storage_test__';
        window.localStorage.setItem(testKey, '1');
        window.localStorage.removeItem(testKey);
        this.backend = window.localStorage;
        return this.backend;
      }
    } catch {
      // Storage unavailable or disabled
    }

    this.backend = new MemoryStorage();
    return this.backend;
  }

  public static setCustomStorage(storage: IStorage): void {
    this.backend = storage;
  }
}
