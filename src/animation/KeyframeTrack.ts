import { Vector2D } from '../physics/Vector2D';

export type InterpolationMode = 'linear' | 'hermite' | 'step';

export interface NumberKeyframe {
  time: number;
  value: number;
  inTangent?: number;
  outTangent?: number;
}

export interface Vector2Keyframe {
  time: number;
  value: Vector2D;
}

export class NumberTrack {
  public propertyName: string;
  public interpolation: InterpolationMode;
  public keyframes: NumberKeyframe[] = [];

  constructor(propertyName: string, interpolation: InterpolationMode = 'linear') {
    this.propertyName = propertyName;
    this.interpolation = interpolation;
  }

  public addKeyframe(time: number, value: number, inTangent = 0, outTangent = 0): this {
    this.keyframes.push({ time, value, inTangent, outTangent });
    this.keyframes.sort((a, b) => a.time - b.time);
    return this;
  }

  public evaluate(time: number): number {
    if (this.keyframes.length === 0) return 0;
    if (this.keyframes.length === 1 || time <= this.keyframes[0].time) {
      return this.keyframes[0].value;
    }
    const last = this.keyframes[this.keyframes.length - 1];
    if (time >= last.time) {
      return last.value;
    }

    // Binary / linear search for adjacent keyframes
    let k0 = this.keyframes[0];
    let k1 = this.keyframes[1];
    for (let i = 0; i < this.keyframes.length - 1; i++) {
      if (time >= this.keyframes[i].time && time <= this.keyframes[i + 1].time) {
        k0 = this.keyframes[i];
        k1 = this.keyframes[i + 1];
        break;
      }
    }

    const duration = k1.time - k0.time;
    if (duration <= 0.00001) return k0.value;
    const t = (time - k0.time) / duration;

    if (this.interpolation === 'step') {
      return k0.value;
    }

    if (this.interpolation === 'hermite') {
      // Cubic Hermite Spline: h00 = 2t^3 - 3t^2 + 1, h10 = t^3 - 2t^2 + t, h01 = -2t^3 + 3t^2, h11 = t^3 - t^2
      const t2 = t * t;
      const t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1;
      const h10 = t3 - 2 * t2 + t;
      const h01 = -2 * t3 + 3 * t2;
      const h11 = t3 - t2;

      const m0 = (k0.outTangent ?? 0) * duration;
      const m1 = (k1.inTangent ?? 0) * duration;

      return h00 * k0.value + h10 * m0 + h01 * k1.value + h11 * m1;
    }

    // Linear interpolation
    return k0.value + (k1.value - k0.value) * t;
  }
}

export class Vector2Track {
  public propertyName: string;
  public keyframes: Vector2Keyframe[] = [];

  constructor(propertyName: string) {
    this.propertyName = propertyName;
  }

  public addKeyframe(time: number, x: number, y: number): this {
    this.keyframes.push({ time, value: new Vector2D(x, y) });
    this.keyframes.sort((a, b) => a.time - b.time);
    return this;
  }

  public evaluate(time: number): Vector2D {
    if (this.keyframes.length === 0) return new Vector2D(0, 0);
    if (this.keyframes.length === 1 || time <= this.keyframes[0].time) {
      return this.keyframes[0].value.clone();
    }
    const last = this.keyframes[this.keyframes.length - 1];
    if (time >= last.time) {
      return last.value.clone();
    }

    let k0 = this.keyframes[0];
    let k1 = this.keyframes[1];
    for (let i = 0; i < this.keyframes.length - 1; i++) {
      if (time >= this.keyframes[i].time && time <= this.keyframes[i + 1].time) {
        k0 = this.keyframes[i];
        k1 = this.keyframes[i + 1];
        break;
      }
    }

    const duration = k1.time - k0.time;
    if (duration <= 0.00001) return k0.value.clone();
    const t = (time - k0.time) / duration;

    return Vector2D.lerp(k0.value, k1.value, t);
  }
}
