export type CloudProviderType = 'WEBDAV' | 'FIREBASE' | 'LOCAL_PERSISTENCE';

export type ConflictResolutionStrategy = 'LOCAL_WINS' | 'REMOTE_WINS' | 'LATEST_TIMESTAMP';

export interface CloudSavePayload {
  slotId: string;
  revision: number;
  timestamp: number;
  checksum: string;
  data: Record<string, unknown>;
}

export interface SyncResult {
  status: 'SYNCED' | 'CONFLICT_RESOLVED' | 'OFFLINE_QUEUED' | 'ERROR';
  resolvedPayload?: CloudSavePayload;
  errorMessage?: string;
}

export class CloudSaveAdapter {
  public provider: CloudProviderType;
  public endpointUrl: string;
  public strategy: ConflictResolutionStrategy;
  public offlineQueue: CloudSavePayload[] = [];
  public isOnline = true;

  // Mock remote storage map
  private remoteStore = new Map<string, CloudSavePayload>();

  constructor(
    provider: CloudProviderType = 'WEBDAV',
    endpointUrl = 'https://cloud.mythos.internal/save',
    strategy: ConflictResolutionStrategy = 'LATEST_TIMESTAMP'
  ) {
    this.provider = provider;
    this.endpointUrl = endpointUrl;
    this.strategy = strategy;
  }

  public async syncSave(localSave: CloudSavePayload): Promise<SyncResult> {
    if (!this.isOnline) {
      this.offlineQueue.push(localSave);
      return { status: 'OFFLINE_QUEUED', resolvedPayload: localSave };
    }

    const remoteSave = this.remoteStore.get(localSave.slotId);

    if (!remoteSave) {
      // First upload
      this.remoteStore.set(localSave.slotId, localSave);
      return { status: 'SYNCED', resolvedPayload: localSave };
    }

    // Check for conflict: same slot, divergent revisions or timestamps
    if (remoteSave.revision !== localSave.revision) {
      return this.resolveConflict(localSave, remoteSave);
    }

    // Identical revision, updated timestamp
    this.remoteStore.set(localSave.slotId, localSave);
    return { status: 'SYNCED', resolvedPayload: localSave };
  }

  private resolveConflict(local: CloudSavePayload, remote: CloudSavePayload): SyncResult {
    let chosen: CloudSavePayload;

    switch (this.strategy) {
      case 'LOCAL_WINS':
        chosen = { ...local, revision: Math.max(local.revision, remote.revision) + 1 };
        break;
      case 'REMOTE_WINS':
        chosen = remote;
        break;
      case 'LATEST_TIMESTAMP':
      default:
        chosen = local.timestamp >= remote.timestamp
          ? { ...local, revision: Math.max(local.revision, remote.revision) + 1 }
          : remote;
        break;
    }

    this.remoteStore.set(chosen.slotId, chosen);
    return { status: 'CONFLICT_RESOLVED', resolvedPayload: chosen };
  }

  public async flushOfflineQueue(): Promise<number> {
    if (!this.isOnline || this.offlineQueue.length === 0) return 0;
    let count = 0;
    while (this.offlineQueue.length > 0) {
      const save = this.offlineQueue.shift()!;
      await this.syncSave(save);
      count++;
    }
    return count;
  }

  public getRemoteSave(slotId: string): CloudSavePayload | undefined {
    return this.remoteStore.get(slotId);
  }
}
