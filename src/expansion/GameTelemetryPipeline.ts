export type TelemetryEventType =
  | 'PLAYER_DEATH'
  | 'BOSS_PHASE_CLEARED'
  | 'WEAPON_SWAP'
  | 'COMBO_CHAIN_COMPLETED'
  | 'CHECKPOINT_REACHED';

export interface TelemetryEvent {
  eventId: string;
  type: TelemetryEventType;
  timestamp: number;
  payload: Record<string, unknown>;
}

export class GameTelemetryPipeline {
  public endpointUrl: string;
  public eventQueue: TelemetryEvent[] = [];
  public maxQueueSize: number;
  public batchSize: number;
  public dispatchedBatches: TelemetryEvent[][] = [];

  constructor(endpointUrl = 'https://telemetry.mythos.internal/v1/events', maxQueueSize = 500, batchSize = 10) {
    this.endpointUrl = endpointUrl;
    this.maxQueueSize = maxQueueSize;
    this.batchSize = batchSize;
  }

  public recordEvent(type: TelemetryEventType, payload: Record<string, unknown>): TelemetryEvent {
    const event: TelemetryEvent = {
      eventId: `telem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      timestamp: Date.now(),
      payload,
    };

    if (this.eventQueue.length >= this.maxQueueSize) {
      this.eventQueue.shift(); // Evict oldest to respect memory cap
    }

    this.eventQueue.push(event);

    if (this.eventQueue.length >= this.batchSize) {
      this.flushBatch();
    }

    return event;
  }

  public flushBatch(): TelemetryEvent[] {
    if (this.eventQueue.length === 0) return [];

    const batch = this.eventQueue.splice(0, this.batchSize);
    this.dispatchedBatches.push(batch);
    return batch;
  }

  public getPendingEventCount(): number {
    return this.eventQueue.length;
  }

  public getDispatchedBatchCount(): number {
    return this.dispatchedBatches.length;
  }
}
