export type EventHandler<T = any> = (payload: T) => void;

export class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  public on<T = any>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const handlers = this.listeners.get(event)!;
    handlers.add(handler as EventHandler);

    return () => this.off(event, handler);
  }

  public off<T = any>(event: string, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  public emit<T = any>(event: string, payload?: T): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(payload);
        } catch (err) {
          console.error(`[EventBus] Error handling event ${event}:`, err);
        }
      });
    }
  }

  public clear(): void {
    this.listeners.clear();
  }

  public getListenerCount(event?: string): number {
    if (event) {
      return this.listeners.get(event)?.size ?? 0;
    }
    let total = 0;
    this.listeners.forEach((set) => (total += set.size));
    return total;
  }
}
