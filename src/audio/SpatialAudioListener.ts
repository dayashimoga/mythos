import { Vector2D } from '../physics/Vector2D';

export interface SpatialAudioParams {
  minRadius?: number;
  maxRadius?: number;
  rollOff?: number;
  speedOfSound?: number;
}

export interface SpatialNodeController {
  inputNode: AudioNode;
  filterNode: BiquadFilterNode | null;
  pannerNode: StereoPannerNode | null;
  gainNode: GainNode;
  update: (sourcePos: Vector2D, sourceVel?: Vector2D) => void;
  disconnect: () => void;
}

export class SpatialAudioListener {
  private listenerPos: Vector2D = new Vector2D(0, 0);
  private listenerVel: Vector2D = new Vector2D(0, 0);

  public minRadius = 120;
  public maxRadius = 1400;
  public rollOff = 0.85;
  public speedOfSound = 1500; // px/s in game scale

  constructor(params?: SpatialAudioParams) {
    if (params) {
      if (params.minRadius !== undefined) this.minRadius = params.minRadius;
      if (params.maxRadius !== undefined) this.maxRadius = params.maxRadius;
      if (params.rollOff !== undefined) this.rollOff = params.rollOff;
      if (params.speedOfSound !== undefined) this.speedOfSound = params.speedOfSound;
    }
  }

  public setListener(position: Vector2D, velocity?: Vector2D): void {
    this.listenerPos = position.clone();
    if (velocity) {
      this.listenerVel = velocity.clone();
    } else {
      this.listenerVel.set(0, 0);
    }
  }

  public getListenerPosition(): Vector2D {
    return this.listenerPos.clone();
  }

  public getListenerVelocity(): Vector2D {
    return this.listenerVel.clone();
  }

  public static calculateDistance(p1: Vector2D, p2: Vector2D): number {
    return p1.distanceTo(p2);
  }

  public static calculateAttenuation(
    distance: number,
    minRadius = 120,
    maxRadius = 1400,
    rollOff = 0.85
  ): number {
    if (distance <= minRadius) return 1.0;
    if (distance >= maxRadius) return 0.0;
    const excess = distance - minRadius;
    const factor = minRadius / (minRadius + excess * rollOff);
    return Math.max(0.0, Math.min(1.0, factor));
  }

  public static calculatePan(listenerX: number, sourceX: number, maxRadius = 1400): number {
    const deltaX = sourceX - listenerX;
    const pan = deltaX / maxRadius;
    return Math.max(-1.0, Math.min(1.0, pan));
  }

  public static calculateCutoff(
    distance: number,
    maxRadius = 1400,
    minCutoff = 2500,
    maxCutoff = 20000
  ): number {
    const fraction = Math.max(0, Math.min(1, distance / maxRadius));
    return maxCutoff - fraction * (maxCutoff - minCutoff);
  }

  public static calculateDoppler(
    listenerPos: Vector2D,
    listenerVel: Vector2D,
    sourcePos: Vector2D,
    sourceVel: Vector2D,
    speedOfSound = 1500
  ): number {
    const delta = sourcePos.subtract(listenerPos);
    const dist = delta.length();
    if (dist < 0.001) return 1.0;

    const unitToSource = delta.multiply(1 / dist);
    const vListenerTowardsSource = listenerVel.dot(unitToSource);
    const vSourceTowardsListener = -sourceVel.dot(unitToSource);

    const denom = speedOfSound - vSourceTowardsListener;
    if (Math.abs(denom) < 1.0) return 1.0;

    const ratio = (speedOfSound + vListenerTowardsSource) / denom;
    return Math.max(0.5, Math.min(2.0, ratio));
  }

  /**
   * Connects a spatial node pipeline into destinationNode.
   */
  public createSpatialPipeline(
    ctx: AudioContext,
    destinationNode: AudioNode,
    initialSourcePos: Vector2D,
    initialSourceVel?: Vector2D
  ): SpatialNodeController {
    const gainNode = ctx.createGain();
    let pannerNode: StereoPannerNode | null = null;
    let filterNode: BiquadFilterNode | null = null;

    try {
      if (typeof ctx.createStereoPanner === 'function') {
        pannerNode = ctx.createStereoPanner();
      }
    } catch {
      pannerNode = null;
    }

    try {
      if (typeof ctx.createBiquadFilter === 'function') {
        filterNode = ctx.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.Q.setValueAtTime(0.7, ctx.currentTime);
      }
    } catch {
      filterNode = null;
    }

    // Pipeline: Input -> Filter (if any) -> Panner (if any) -> Gain -> Destination
    let inputNode: AudioNode = gainNode;

    if (filterNode) {
      inputNode = filterNode;
      if (pannerNode) {
        filterNode.connect(pannerNode);
        pannerNode.connect(gainNode);
      } else {
        filterNode.connect(gainNode);
      }
    } else if (pannerNode) {
      inputNode = pannerNode;
      pannerNode.connect(gainNode);
    }

    gainNode.connect(destinationNode);

    const controller: SpatialNodeController = {
      inputNode,
      filterNode,
      pannerNode,
      gainNode,
      update: (sourcePos: Vector2D, sourceVel?: Vector2D) => {
        const dist = SpatialAudioListener.calculateDistance(this.listenerPos, sourcePos);
        const att = SpatialAudioListener.calculateAttenuation(dist, this.minRadius, this.maxRadius, this.rollOff);
        const pan = SpatialAudioListener.calculatePan(this.listenerPos.x, sourcePos.x, this.maxRadius);
        const cutoff = SpatialAudioListener.calculateCutoff(dist, this.maxRadius);
        if (sourceVel) {
          SpatialAudioListener.calculateDoppler(this.listenerPos, this.listenerVel, sourcePos, sourceVel, this.speedOfSound);
        }

        const now = ctx.currentTime;
        gainNode.gain.setValueAtTime(att, now);

        if (pannerNode && pannerNode.pan) {
          pannerNode.pan.setValueAtTime(pan, now);
        }

        if (filterNode && filterNode.frequency) {
          filterNode.frequency.setValueAtTime(cutoff, now);
        }
      },
      disconnect: () => {
        try {
          gainNode.disconnect();
          if (pannerNode) pannerNode.disconnect();
          if (filterNode) filterNode.disconnect();
        } catch {
          // Graceful cleanup
        }
      },
    };

    controller.update(initialSourcePos, initialSourceVel);
    return controller;
  }
}
