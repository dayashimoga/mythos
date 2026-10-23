export interface SpeedrunSplit {
  splitId: string;
  splitName: string;
  timeMs: number;
  deltaMs: number; // vs personal best
}

export interface LeaderboardEntry {
  runnerTag: string;
  category: 'ANY_PERCENT' | 'ALL_BOSSES' | 'NO_HIT';
  totalTimeMs: number;
  splits: SpeedrunSplit[];
  validationHash: string;
  timestamp: number;
}

export class SpeedrunTelemetry {
  public isRunning = false;
  public elapsedTimeMs = 0;
  public personalBestMs: number | null = null;
  public activeSplits: SpeedrunSplit[] = [];
  public completedSplits: SpeedrunSplit[] = [];

  private splitDefinitions: Array<{ id: string; name: string }> = [
    { id: 'split_bhumi_sanctum', name: 'Surya-Kund Sanctum' },
    { id: 'split_patala_depths', name: 'Patala Serpent Chasm' },
    { id: 'split_vayu_citadel', name: 'Vayu Floating Citadel' },
    { id: 'split_titan_defeat', name: 'Mahishasura Fall' },
  ];

  public startTimer(): void {
    this.isRunning = true;
    this.elapsedTimeMs = 0;
    this.completedSplits = [];
  }

  public pauseTimer(): void {
    this.isRunning = false;
  }

  public resumeTimer(): void {
    this.isRunning = true;
  }

  public update(dt: number): void {
    if (!this.isRunning) return;
    this.elapsedTimeMs += dt * 1000;
  }

  public triggerSplit(splitId: string, pbSplitTimeMs?: number): SpeedrunSplit | null {
    if (!this.isRunning) return null;

    const def = this.splitDefinitions.find((s) => s.id === splitId);
    const name = def ? def.name : splitId;

    const currentTotalMs = Math.round(this.elapsedTimeMs);
    const delta = pbSplitTimeMs !== undefined ? currentTotalMs - pbSplitTimeMs : 0;

    const split: SpeedrunSplit = {
      splitId,
      splitName: name,
      timeMs: currentTotalMs,
      deltaMs: delta,
    };

    this.completedSplits.push(split);

    // If final split triggered, stop timer and evaluate PB
    if (splitId === 'split_titan_defeat') {
      this.isRunning = false;
      if (this.personalBestMs === null || currentTotalMs < this.personalBestMs) {
        this.personalBestMs = currentTotalMs;
      }
    }

    return split;
  }

  public formatTime(timeMs: number): string {
    const totalSeconds = Math.floor(timeMs / 1000);
    const ms = Math.floor((timeMs % 1000) / 10);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const mStr = String(minutes).padStart(2, '0');
    const sStr = String(seconds).padStart(2, '0');
    const msStr = String(ms).padStart(2, '0');

    return `${mStr}:${sStr}.${msStr}`;
  }

  public generateTelemetryPayload(runnerTag = 'Veer_Astra', category: LeaderboardEntry['category'] = 'ANY_PERCENT'): LeaderboardEntry {
    // Generate deterministic anti-cheat validation hash
    const rawData = `${runnerTag}|${category}|${Math.round(this.elapsedTimeMs)}|${this.completedSplits.length}`;
    let hash = 0;
    for (let i = 0; i < rawData.length; i++) {
      hash = (hash << 5) - hash + rawData.charCodeAt(i);
      hash |= 0;
    }

    return {
      runnerTag,
      category,
      totalTimeMs: Math.round(this.elapsedTimeMs),
      splits: [...this.completedSplits],
      validationHash: `VALID_${Math.abs(hash).toString(16)}`,
      timestamp: Date.now(),
    };
  }
}
