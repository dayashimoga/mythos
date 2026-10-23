export interface MemorySample {
  timestamp: number;
  usedHeapMb: number;
  totalHeapMb: number;
  activeEntities: number;
  activeParticles: number;
  activeVoices: number;
}

export interface MemoryReport {
  currentHeapMb: number;
  peakHeapMb: number;
  averageHeapMb: number;
  sampleCount: number;
  isLeakingSuspected: boolean;
  leakWarningMessage?: string;
}

export class MemoryProfiler {
  private static instance: MemoryProfiler;
  private samples: MemorySample[] = [];
  private readonly maxSamples = 120;
  private peakHeapMb = 0;

  private constructor() {}

  public static getInstance(): MemoryProfiler {
    if (!MemoryProfiler.instance) {
      MemoryProfiler.instance = new MemoryProfiler();
    }
    return MemoryProfiler.instance;
  }

  public recordSample(
    activeEntities = 0,
    activeParticles = 0,
    activeVoices = 0
  ): MemorySample {
    let usedHeapMb = 0;
    let totalHeapMb = 0;

    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const mem = (performance as any).memory;
      if (mem && mem.usedJSHeapSize) {
        usedHeapMb = Math.round((mem.usedJSHeapSize / (1024 * 1024)) * 100) / 100;
        totalHeapMb = Math.round((mem.totalJSHeapSize / (1024 * 1024)) * 100) / 100;
      }
    } else {
      // Fallback synthetic calculation for environments without performance.memory
      usedHeapMb = Math.round((28.5 + (activeEntities * 0.05) + (activeParticles * 0.002)) * 100) / 100;
      totalHeapMb = 48.0;
    }

    if (usedHeapMb > this.peakHeapMb) {
      this.peakHeapMb = usedHeapMb;
    }

    const sample: MemorySample = {
      timestamp: performance.now(),
      usedHeapMb,
      totalHeapMb,
      activeEntities,
      activeParticles,
      activeVoices,
    };

    this.samples.push(sample);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    return sample;
  }

  public generateReport(): MemoryReport {
    if (this.samples.length === 0) {
      return {
        currentHeapMb: 0,
        peakHeapMb: 0,
        averageHeapMb: 0,
        sampleCount: 0,
        isLeakingSuspected: false,
      };
    }

    const current = this.samples[this.samples.length - 1].usedHeapMb;
    const sum = this.samples.reduce((acc, s) => acc + s.usedHeapMb, 0);
    const averageHeapMb = Math.round((sum / this.samples.length) * 100) / 100;

    // Leak detection: check if last 5 non-trivial samples show strictly positive slope
    let isLeakingSuspected = false;
    let leakWarningMessage: string | undefined;

    if (this.samples.length >= 10) {
      const recent = this.samples.slice(-10);
      let strictlyIncreasing = true;
      for (let i = 1; i < recent.length; i++) {
        if (recent[i].usedHeapMb <= recent[i - 1].usedHeapMb) {
          strictlyIncreasing = false;
          break;
        }
      }

      const diff = recent[recent.length - 1].usedHeapMb - recent[0].usedHeapMb;
      if (strictlyIncreasing && diff > 15.0) {
        isLeakingSuspected = true;
        leakWarningMessage = `Heap inflated continuously by +${diff.toFixed(1)}MB over 10 consecutive sample intervals without GC recovery.`;
      }
    }

    return {
      currentHeapMb: current,
      peakHeapMb: this.peakHeapMb,
      averageHeapMb,
      sampleCount: this.samples.length,
      isLeakingSuspected,
      leakWarningMessage,
    };
  }

  public reset(): void {
    this.samples = [];
    this.peakHeapMb = 0;
  }
}
