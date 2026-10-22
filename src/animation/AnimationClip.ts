import { NumberTrack, Vector2Track } from './KeyframeTrack';
import { Skeleton } from './Skeleton';

export interface AnimationEvent {
  time: number;
  name: string;
  payload?: any;
}

export class AnimationClip {
  public name: string;
  public duration: number;
  public isLooping: boolean;

  // Key: boneName.rotation or boneName.position
  public rotationTracks: Map<string, NumberTrack> = new Map();
  public positionTracks: Map<string, Vector2Track> = new Map();
  public events: AnimationEvent[] = [];

  constructor(name: string, duration: number, isLooping = true) {
    this.name = name;
    this.duration = Math.max(0.01, duration);
    this.isLooping = isLooping;
  }

  public addRotationTrack(boneName: string, track: NumberTrack): this {
    this.rotationTracks.set(boneName, track);
    return this;
  }

  public addPositionTrack(boneName: string, track: Vector2Track): this {
    this.positionTracks.set(boneName, track);
    return this;
  }

  public addEvent(time: number, name: string, payload?: any): this {
    this.events.push({ time, name, payload });
    this.events.sort((a, b) => a.time - b.time);
    return this;
  }

  /**
   * Applies this clip to a skeleton at normalized or absolute time t.
   */
  public apply(time: number, skeleton: Skeleton, weight = 1.0): void {
    if (weight <= 0) return;

    let sampleTime = time;
    if (this.isLooping) {
      sampleTime = time % this.duration;
      if (sampleTime < 0) sampleTime += this.duration;
    } else {
      sampleTime = Math.max(0, Math.min(this.duration, time));
    }

    // Apply rotation tracks
    for (const [boneName, track] of this.rotationTracks) {
      const bone = skeleton.getBone(boneName);
      if (bone) {
        const val = track.evaluate(sampleTime);
        if (weight >= 0.999) {
          bone.localTransform.rotation = val;
        } else {
          // Blend with existing rotation
          let diff = (val - bone.localTransform.rotation) % (Math.PI * 2);
          if (diff > Math.PI) diff -= Math.PI * 2;
          if (diff < -Math.PI) diff += Math.PI * 2;
          bone.localTransform.rotation += diff * weight;
        }
      }
    }

    // Apply position tracks
    for (const [boneName, track] of this.positionTracks) {
      const bone = skeleton.getBone(boneName);
      if (bone) {
        const val = track.evaluate(sampleTime);
        if (weight >= 0.999) {
          bone.localTransform.position.x = val.x;
          bone.localTransform.position.y = val.y;
        } else {
          bone.localTransform.position.x += (val.x - bone.localTransform.position.x) * weight;
          bone.localTransform.position.y += (val.y - bone.localTransform.position.y) * weight;
        }
      }
    }
  }

  /**
   * Dispatches events that fall between prevTime and currentTime.
   */
  public getTriggeredEvents(prevTime: number, currentTime: number): AnimationEvent[] {
    const triggered: AnimationEvent[] = [];
    const t0 = this.isLooping ? prevTime % this.duration : prevTime;
    const t1 = this.isLooping ? currentTime % this.duration : currentTime;

    for (const ev of this.events) {
      if (t0 <= t1) {
        if (ev.time >= t0 && ev.time < t1) triggered.push(ev);
      } else {
        // Wrapped around loop boundary
        if (ev.time >= t0 || ev.time < t1) triggered.push(ev);
      }
    }

    return triggered;
  }
}
