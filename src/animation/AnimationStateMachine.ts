import { AnimationClip } from './AnimationClip';
import { BlendTree1D } from './BlendTree1D';
import { Skeleton } from './Skeleton';

export interface StateNode {
  name: string;
  clip?: AnimationClip;
  blendTree?: BlendTree1D;
}

export interface StateTransition {
  from: string; // state name or '*' for any state
  to: string;
  duration: number; // cross-fade duration in seconds
  condition?: (params: Map<string, any>) => boolean;
  hasExitTime?: boolean;
}

export class AnimationStateMachine {
  public states: Map<string, StateNode> = new Map();
  public transitions: StateTransition[] = [];
  public parameters: Map<string, any> = new Map();

  public currentState: StateNode | null = null;
  public previousState: StateNode | null = null;

  public stateTime = 0;
  private prevStateTime = 0;
  public transitionProgress = 1.0; // 1.0 = fully in currentState
  public currentTransitionDuration = 0.15;

  private onEventCallback?: (eventName: string, payload: any) => void;

  public addState(name: string, content: AnimationClip | BlendTree1D): this {
    if (content instanceof AnimationClip) {
      this.states.set(name, { name, clip: content });
    } else {
      this.states.set(name, { name, blendTree: content });
    }
    if (!this.currentState) {
      this.currentState = this.states.get(name)!;
    }
    return this;
  }

  public addTransition(
    from: string,
    to: string,
    duration = 0.15,
    condition?: (params: Map<string, any>) => boolean,
    hasExitTime = false
  ): this {
    this.transitions.push({ from, to, duration, condition, hasExitTime });
    return this;
  }

  public setFloat(name: string, value: number): void {
    this.parameters.set(name, value);
  }

  public getFloat(name: string, fallback = 0): number {
    return this.parameters.get(name) ?? fallback;
  }

  public setBool(name: string, value: boolean): void {
    this.parameters.set(name, value);
  }

  public getBool(name: string, fallback = false): boolean {
    return this.parameters.get(name) ?? fallback;
  }

  public setTrigger(name: string): void {
    this.parameters.set(name, true);
  }

  public onEvent(callback: (eventName: string, payload: any) => void): void {
    this.onEventCallback = callback;
  }

  public transitionTo(stateName: string, duration = 0.15): boolean {
    const target = this.states.get(stateName);
    if (!target || target === this.currentState) return false;

    this.previousState = this.currentState;
    this.prevStateTime = this.stateTime;
    this.currentState = target;
    this.stateTime = 0;
    this.currentTransitionDuration = Math.max(0.001, duration);
    this.transitionProgress = 0.0;
    return true;
  }

  public update(dt: number, skeleton: Skeleton): void {
    if (!this.currentState) return;

    // Check automatic transitions if not currently transitioning
    if (this.transitionProgress >= 1.0) {
      for (const t of this.transitions) {
        if (t.from === '*' || t.from === this.currentState.name) {
          let canTransition = true;

          if (t.hasExitTime && this.currentState.clip) {
            canTransition = this.stateTime >= this.currentState.clip.duration;
          }

          if (canTransition && t.condition && !t.condition(this.parameters)) {
            canTransition = false;
          }

          if (canTransition) {
            this.transitionTo(t.to, t.duration);
            break;
          }
        }
      }
    }

    // Reset one-frame triggers
    for (const [k, v] of this.parameters) {
      if (typeof v === 'boolean' && v && k.startsWith('trigger_')) {
        this.parameters.set(k, false);
      }
    }

    // Advance transition progress
    if (this.transitionProgress < 1.0) {
      this.transitionProgress = Math.min(1.0, this.transitionProgress + dt / this.currentTransitionDuration);
      this.prevStateTime += dt;
    }

    const prevT = this.stateTime;
    this.stateTime += dt;

    // Apply blended poses
    const blendWeight = this.easeSmooth(this.transitionProgress);

    // 1. Previous state (if cross-fading)
    if (this.previousState && blendWeight < 0.999) {
      const prevWeight = 1.0 - blendWeight;
      if (this.previousState.clip) {
        this.previousState.clip.apply(this.prevStateTime, skeleton, prevWeight);
      } else if (this.previousState.blendTree) {
        const param = this.getFloat(this.previousState.blendTree.parameterName, 0);
        this.previousState.blendTree.update(dt, param, skeleton, prevWeight);
      }
    }

    // 2. Current state
    if (this.currentState.clip) {
      this.currentState.clip.apply(this.stateTime, skeleton, blendWeight);
      // Check events
      if (this.onEventCallback) {
        const events = this.currentState.clip.getTriggeredEvents(prevT, this.stateTime);
        for (const ev of events) {
          this.onEventCallback(ev.name, ev.payload);
        }
      }
    } else if (this.currentState.blendTree) {
      const param = this.getFloat(this.currentState.blendTree.parameterName, 0);
      this.currentState.blendTree.update(dt, param, skeleton, blendWeight);
    }
  }

  private easeSmooth(t: number): number {
    // Hermite cubic ease-in-out: 3t^2 - 2t^3
    const c = Math.max(0, Math.min(1, t));
    return c * c * (3 - 2 * c);
  }
}
