export type QualityTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA' | 'ADAPTIVE';

export interface QualitySettings {
  tier: QualityTier;
  particleBudget: number;
  resolutionScale: number;
  enableGlow: boolean;
  enableChromaticAberration: boolean;
  enableShadows: boolean;
  cullingMargin: number;
  targetFps: number;
}

export class GraphicsQualityManager {
  private static instance: GraphicsQualityManager;
  private currentTier: QualityTier = 'HIGH';
  private adaptiveResolutionScale = 1.0;
  private frameTimes: number[] = [];
  private readonly windowSize = 30;
  private thermalThrottled = false;

  private readonly tierPresets: Record<Exclude<QualityTier, 'ADAPTIVE'>, QualitySettings> = {
    LOW: {
      tier: 'LOW',
      particleBudget: 300,
      resolutionScale: 0.75,
      enableGlow: false,
      enableChromaticAberration: false,
      enableShadows: false,
      cullingMargin: 50,
      targetFps: 60,
    },
    MEDIUM: {
      tier: 'MEDIUM',
      particleBudget: 700,
      resolutionScale: 0.85,
      enableGlow: false,
      enableChromaticAberration: true,
      enableShadows: false,
      cullingMargin: 100,
      targetFps: 60,
    },
    HIGH: {
      tier: 'HIGH',
      particleBudget: 1200,
      resolutionScale: 1.0,
      enableGlow: true,
      enableChromaticAberration: true,
      enableShadows: true,
      cullingMargin: 150,
      targetFps: 60,
    },
    ULTRA: {
      tier: 'ULTRA',
      particleBudget: 2000,
      resolutionScale: 1.25,
      enableGlow: true,
      enableChromaticAberration: true,
      enableShadows: true,
      cullingMargin: 200,
      targetFps: 120,
    },
  };

  private constructor() {
    this.detectHardwareProfile();
  }

  public static getInstance(): GraphicsQualityManager {
    if (!GraphicsQualityManager.instance) {
      GraphicsQualityManager.instance = new GraphicsQualityManager();
    }
    return GraphicsQualityManager.instance;
  }

  private detectHardwareProfile(): void {
    if (typeof window === 'undefined') return;

    // Check device memory if available
    const memory = (navigator as any).deviceMemory; // in GB
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;

    if (memory && memory <= 2) {
      this.currentTier = 'LOW';
    } else if (memory && memory <= 4) {
      this.currentTier = 'MEDIUM';
    } else if (hardwareConcurrency >= 8 && (!memory || memory >= 8)) {
      this.currentTier = 'HIGH';
    } else {
      this.currentTier = 'HIGH';
    }
  }

  public getTier(): QualityTier {
    return this.currentTier;
  }

  public setTier(tier: QualityTier): void {
    this.currentTier = tier;
    if (tier !== 'ADAPTIVE') {
      this.adaptiveResolutionScale = this.tierPresets[tier].resolutionScale;
    }
  }

  public setThermalThrottled(throttled: boolean): void {
    this.thermalThrottled = throttled;
    if (throttled && this.currentTier === 'ULTRA') {
      this.currentTier = 'MEDIUM';
    }
  }

  public isThermalThrottled(): boolean {
    return this.thermalThrottled;
  }

  public reportFrameTime(ms: number): void {
    this.frameTimes.push(ms);
    if (this.frameTimes.length > this.windowSize) {
      this.frameTimes.shift();
    }

    if (this.currentTier === 'ADAPTIVE' && this.frameTimes.length >= this.windowSize) {
      this.evaluateAdaptiveScaling();
    }
  }

  private evaluateAdaptiveScaling(): void {
    const sum = this.frameTimes.reduce((acc, t) => acc + t, 0);
    const avg = sum / this.frameTimes.length;

    // Target is <= 16.6ms (60 FPS)
    if (avg > 18.0) {
      // Underperforming: scale down resolution
      this.adaptiveResolutionScale = Math.max(0.65, Math.round((this.adaptiveResolutionScale - 0.05) * 100) / 100);
    } else if (avg < 13.0 && this.adaptiveResolutionScale < 1.0) {
      // Plenty of headroom: step resolution up
      this.adaptiveResolutionScale = Math.min(1.0, Math.round((this.adaptiveResolutionScale + 0.02) * 100) / 100);
    }
  }

  public getSettings(): QualitySettings {
    const targetFps = this.thermalThrottled ? 30 : (this.currentTier === 'ULTRA' ? 120 : 60);

    if (this.currentTier === 'ADAPTIVE') {
      return {
        tier: 'ADAPTIVE',
        particleBudget: this.adaptiveResolutionScale < 0.8 ? 500 : 1000,
        resolutionScale: this.adaptiveResolutionScale,
        enableGlow: this.adaptiveResolutionScale >= 0.85,
        enableChromaticAberration: this.adaptiveResolutionScale >= 0.75,
        enableShadows: this.adaptiveResolutionScale >= 0.9,
        cullingMargin: 120,
        targetFps,
      };
    }

    const preset = this.tierPresets[this.currentTier];
    return {
      ...preset,
      targetFps,
    };
  }

  public getAdaptiveScale(): number {
    return this.adaptiveResolutionScale;
  }

  public resetMetrics(): void {
    this.frameTimes = [];
  }
}
