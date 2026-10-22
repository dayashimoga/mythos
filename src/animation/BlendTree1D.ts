import { AnimationClip } from './AnimationClip';
import { Skeleton } from './Skeleton';

export interface BlendEntry {
  threshold: number;
  clip: AnimationClip;
}

export class BlendTree1D {
  public name: string;
  public parameterName: string;
  public entries: BlendEntry[] = [];
  private phase = 0; // Normalized cycle phase [0, 1)

  constructor(name: string, parameterName: string) {
    this.name = name;
    this.parameterName = parameterName;
  }

  public addEntry(threshold: number, clip: AnimationClip): this {
    this.entries.push({ threshold, clip });
    this.entries.sort((a, b) => a.threshold - b.threshold);
    return this;
  }

  public getWeights(paramValue: number): Map<AnimationClip, number> {
    const weights = new Map<AnimationClip, number>();
    if (this.entries.length === 0) return weights;

    if (this.entries.length === 1 || paramValue <= this.entries[0].threshold) {
      weights.set(this.entries[0].clip, 1.0);
      return weights;
    }

    const last = this.entries[this.entries.length - 1];
    if (paramValue >= last.threshold) {
      weights.set(last.clip, 1.0);
      return weights;
    }

    // Find interval [e0, e1]
    for (let i = 0; i < this.entries.length - 1; i++) {
      const e0 = this.entries[i];
      const e1 = this.entries[i + 1];
      if (paramValue >= e0.threshold && paramValue <= e1.threshold) {
        const span = e1.threshold - e0.threshold;
        const t = span > 0.0001 ? (paramValue - e0.threshold) / span : 0;
        weights.set(e0.clip, 1 - t);
        weights.set(e1.clip, t);
        break;
      }
    }

    return weights;
  }

  /**
   * Advances the normalized phase and applies all weighted clips to the skeleton.
   */
  public update(dt: number, paramValue: number, skeleton: Skeleton, baseWeight = 1.0): void {
    if (this.entries.length === 0 || baseWeight <= 0) return;

    const weights = this.getWeights(paramValue);

    // Calculate effective cycle duration based on active weights
    let blendedDuration = 0;
    for (const [clip, weight] of weights) {
      blendedDuration += clip.duration * weight;
    }
    if (blendedDuration <= 0.01) blendedDuration = 1.0;

    // Advance normalized phase
    this.phase = (this.phase + dt / blendedDuration) % 1.0;

    // Sample each active clip at synchronized phase
    for (const [clip, weight] of weights) {
      if (weight > 0.001) {
        const sampleTime = this.phase * clip.duration;
        clip.apply(sampleTime, skeleton, weight * baseWeight);
      }
    }
  }

  public getPhase(): number {
    return this.phase;
  }

  public setPhase(phase: number): void {
    this.phase = phase % 1.0;
    if (this.phase < 0) this.phase += 1.0;
  }
}
