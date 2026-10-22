import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../../src/core/EventBus';

describe('EventBus Pub/Sub', () => {
  it('subscribes and emits events with payload', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    const unsubscribe = bus.on('TEST_EVENT', handler);
    expect(bus.getListenerCount('TEST_EVENT')).toBe(1);

    bus.emit('TEST_EVENT', { value: 42 });
    expect(handler).toHaveBeenCalledWith({ value: 42 });

    unsubscribe();
    expect(bus.getListenerCount('TEST_EVENT')).toBe(0);

    bus.emit('TEST_EVENT', { value: 99 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes with off() method', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('EVENT_A', handler);
    bus.off('EVENT_A', handler);

    bus.emit('EVENT_A');
    expect(handler).not.toHaveBeenCalled();
  });

  it('handles errors inside handlers gracefully without halting other listeners', () => {
    const bus = new EventBus();
    const faulty = vi.fn(() => {
      throw new Error('Boom');
    });
    const normal = vi.fn();

    bus.on('CRASH_TEST', faulty);
    bus.on('CRASH_TEST', normal);

    bus.emit('CRASH_TEST');
    expect(faulty).toHaveBeenCalled();
    expect(normal).toHaveBeenCalled();
  });

  it('clears all listeners across all events', () => {
    const bus = new EventBus();
    bus.on('E1', () => {});
    bus.on('E2', () => {});
    expect(bus.getListenerCount()).toBe(2);

    bus.clear();
    expect(bus.getListenerCount()).toBe(0);
  });
});
