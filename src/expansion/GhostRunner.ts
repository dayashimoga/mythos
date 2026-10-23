import { Vector2D } from '../physics/Vector2D';
import { IRenderer } from '../render/CanvasRenderer';

export interface GhostFrame {
  timestampMs: number;
  x: number;
  y: number;
  action: 'IDLE' | 'RUN' | 'DASH' | 'SLASH';
}

export interface GhostData {
  runnerName: string;
  totalTimeMs: number;
  frames: GhostFrame[];
}

export class GhostRunner {
  public isRecording = false;
  public isPlaying = false;
  public playbackTimeMs = 0;
  public recordedFrames: GhostFrame[] = [];
  public currentGhostData: GhostData | null = null;
  public recordSampleIntervalMs = 50; // 20Hz sample rate
  private lastSampleTime = 0;

  public startRecording(): void {
    this.isRecording = true;
    this.recordedFrames = [];
    this.lastSampleTime = 0;
  }

  public recordFrame(timeMs: number, playerPos: Vector2D, action: GhostFrame['action']): void {
    if (!this.isRecording) return;
    if (this.recordedFrames.length === 0 || timeMs - this.lastSampleTime >= this.recordSampleIntervalMs) {
      this.lastSampleTime = timeMs;
      this.recordedFrames.push({
        timestampMs: timeMs,
        x: Math.round(playerPos.x * 10) / 10,
        y: Math.round(playerPos.y * 10) / 10,
        action,
      });
    }
  }

  public stopRecording(runnerName = 'Veer', totalTimeMs: number): GhostData {
    this.isRecording = false;
    this.currentGhostData = {
      runnerName,
      totalTimeMs,
      frames: [...this.recordedFrames],
    };
    return this.currentGhostData;
  }

  public loadGhost(ghost: GhostData): void {
    this.currentGhostData = ghost;
    this.playbackTimeMs = 0;
    this.isPlaying = true;
  }

  public updatePlayback(dt: number): void {
    if (!this.isPlaying || !this.currentGhostData) return;
    this.playbackTimeMs += dt * 1000;
    if (this.playbackTimeMs > this.currentGhostData.totalTimeMs) {
      this.isPlaying = false;
    }
  }

  public getGhostPositionAtCurrentTime(): { position: Vector2D; action: GhostFrame['action'] } | null {
    if (!this.currentGhostData || this.currentGhostData.frames.length === 0) return null;

    const frames = this.currentGhostData.frames;
    // Find frames bounding playbackTimeMs
    let prev = frames[0];
    let next = frames[0];

    for (let i = 0; i < frames.length; i++) {
      if (frames[i].timestampMs <= this.playbackTimeMs) {
        prev = frames[i];
      }
      if (frames[i].timestampMs >= this.playbackTimeMs) {
        next = frames[i];
        break;
      }
    }

    if (prev === next) {
      return { position: new Vector2D(prev.x, prev.y), action: prev.action };
    }

    const t = (this.playbackTimeMs - prev.timestampMs) / Math.max(1, next.timestampMs - prev.timestampMs);
    const interpX = prev.x + (next.x - prev.x) * t;
    const interpY = prev.y + (next.y - prev.y) * t;

    return {
      position: new Vector2D(interpX, interpY),
      action: next.action,
    };
  }

  public render(renderer: IRenderer): void {
    if (!this.isPlaying) return;
    const ghostSample = this.getGhostPositionAtCurrentTime();
    if (!ghostSample) return;

    const p = ghostSample.position;
    const ctx = renderer.getContext();
    ctx.save();
    ctx.globalAlpha = 0.45; // Translucent spectral appearance
    renderer.drawCircle(p.x, p.y, 14, '#00ffff', '#ffffff');
    renderer.drawText('GHOST', p.x, p.y - 20, '10px Inter', '#00ffff', 'center');
    ctx.restore();
  }
}
