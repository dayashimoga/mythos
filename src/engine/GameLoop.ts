export class GameLoop {
  private isRunning = false;
  private isPaused = false;
  private lastTime = 0;
  private accumulator = 0;
  private fixedDeltaTime: number; // in seconds (e.g., 1/60)
  private maxFrameTime = 0.25; // 250ms guard against spiral of death
  private rafId: number | null = null;

  private onUpdate: (dt: number) => void;
  private onRender: (interpolation: number) => void;

  constructor(
    onUpdate: (dt: number) => void,
    onRender: (interpolation: number) => void,
    targetFps = 60
  ) {
    this.onUpdate = onUpdate;
    this.onRender = onRender;
    this.fixedDeltaTime = 1 / targetFps;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop = this.loop.bind(this);
    this.rafId = requestAnimationFrame(this.loop);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    if (this.isPaused) {
      this.isPaused = false;
      this.lastTime = performance.now();
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public stepManual(dt: number): void {
    this.onUpdate(dt);
    this.onRender(1.0);
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    const frameDelta = Math.min((currentTime - this.lastTime) / 1000, this.maxFrameTime);
    this.lastTime = currentTime;

    if (!this.isPaused) {
      this.accumulator += frameDelta;

      while (this.accumulator >= this.fixedDeltaTime) {
        this.onUpdate(this.fixedDeltaTime);
        this.accumulator -= this.fixedDeltaTime;
      }

      const interpolation = this.accumulator / this.fixedDeltaTime;
      this.onRender(interpolation);
    }

    this.rafId = requestAnimationFrame(this.loop);
  }
}
