export type SliceCadence = 'EVERY_FRAME' | 'EVERY_2ND_FRAME' | 'EVERY_4TH_FRAME' | 'EVERY_8TH_FRAME';

export interface SlicedTask {
  id: string;
  cadence: SliceCadence;
  execute: (dt: number, frameIndex: number) => void;
  offset: number;
}

export class TimeSliceScheduler {
  private static instance: TimeSliceScheduler;
  private tasks: Map<string, SlicedTask> = new Map();
  private frameIndex = 0;

  private constructor() {}

  public static getInstance(): TimeSliceScheduler {
    if (!TimeSliceScheduler.instance) {
      TimeSliceScheduler.instance = new TimeSliceScheduler();
    }
    return TimeSliceScheduler.instance;
  }

  public registerTask(
    id: string,
    cadence: SliceCadence,
    execute: (dt: number, frameIndex: number) => void
  ): void {
    // Spread offset uniformly to prevent grouping
    const offset = this.tasks.size % 8;
    this.tasks.set(id, { id, cadence, execute, offset });
  }

  public unregisterTask(id: string): boolean {
    return this.tasks.delete(id);
  }

  public step(dt: number): void {
    this.frameIndex++;
    const currentFrame = this.frameIndex;

    this.tasks.forEach((task) => {
      let shouldRun = false;

      switch (task.cadence) {
        case 'EVERY_FRAME':
          shouldRun = true;
          break;
        case 'EVERY_2ND_FRAME':
          shouldRun = (currentFrame + task.offset) % 2 === 0;
          break;
        case 'EVERY_4TH_FRAME':
          shouldRun = (currentFrame + task.offset) % 4 === 0;
          break;
        case 'EVERY_8TH_FRAME':
          shouldRun = (currentFrame + task.offset) % 8 === 0;
          break;
      }

      if (shouldRun) {
        task.execute(dt, currentFrame);
      }
    });
  }

  public getTaskCount(): number {
    return this.tasks.size;
  }

  public getFrameIndex(): number {
    return this.frameIndex;
  }

  public clear(): void {
    this.tasks.clear();
    this.frameIndex = 0;
  }
}
