export interface DiagnosticMetrics {
  fps: number;
  frameTimeMs: number;
  updateTimeMs: number;
  renderTimeMs: number;
  entityCount: number;
  particleCount: number;
  collisionChecks: number;
  activeScene: string;
  memoryUsageMb: number;
  audioVoices: number;
}

export class Diagnostics {
  private fps = 60;
  private frameTimeMs = 16.6;
  private updateTimeMs = 0;
  private renderTimeMs = 0;
  private entityCount = 0;
  private particleCount = 0;
  private collisionChecks = 0;
  private activeScene = 'None';
  private audioVoices = 0;

  private frameCount = 0;
  private lastFpsUpdate = 0;
  private isVisible = false;
  private showColliders = false;

  public updateFrame(frameDeltaMs: number): void {
    this.frameTimeMs = frameDeltaMs;
    this.frameCount++;

    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  public setTimings(updateMs: number, renderMs: number): void {
    this.updateTimeMs = updateMs;
    this.renderTimeMs = renderMs;
  }

  public setCounts(entities: number, particles: number, collisionChecks: number): void {
    this.entityCount = entities;
    this.particleCount = particles;
    this.collisionChecks = collisionChecks;
  }

  public setActiveScene(sceneName: string): void {
    this.activeScene = sceneName;
  }

  public setAudioVoices(voices: number): void {
    this.audioVoices = voices;
  }

  public toggleVisible(): boolean {
    this.isVisible = !this.isVisible;
    return this.isVisible;
  }

  public toggle(): boolean {
    return this.toggleVisible();
  }

  public toggleColliders(): boolean {
    this.showColliders = !this.showColliders;
    return this.showColliders;
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }

  public getShowColliders(): boolean {
    return this.showColliders;
  }

  public getMetrics(): DiagnosticMetrics {
    let memoryUsageMb = 0;
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const mem = (performance as any).memory;
      if (mem && mem.usedJSHeapSize) {
        memoryUsageMb = Math.round((mem.usedJSHeapSize / (1024 * 1024)) * 10) / 10;
      }
    }

    return {
      fps: this.fps,
      frameTimeMs: Math.round(this.frameTimeMs * 10) / 10,
      updateTimeMs: Math.round(this.updateTimeMs * 10) / 10,
      renderTimeMs: Math.round(this.renderTimeMs * 10) / 10,
      entityCount: this.entityCount,
      particleCount: this.particleCount,
      collisionChecks: this.collisionChecks,
      activeScene: this.activeScene,
      memoryUsageMb,
      audioVoices: this.audioVoices,
    };
  }
}
