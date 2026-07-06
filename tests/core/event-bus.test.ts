import { createEventBus } from '../../src/core/event-bus';

import { describe, expect, test, vi } from 'vitest';

describe('createEventBus', () => {
  test('notifies subscribers and supports unsubscribe', () => {
    const bus = createEventBus<number>();
    const a = vi.fn();
    const b = vi.fn();

    const unsubA = bus.on(a);
    bus.on(b);

    bus.emit(1);
    expect(a).toHaveBeenCalledWith(1);
    expect(b).toHaveBeenCalledWith(1);

    unsubA();
    bus.emit(2);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);

    bus.clear();
    bus.emit(3);
    expect(b).toHaveBeenCalledTimes(2);
  });
});
