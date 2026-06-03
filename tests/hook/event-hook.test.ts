import {
  initializeEventHooks,
  registerEventHook,
  uninstallEventHooks,
} from '../../src/hook/event-hook';

import { afterEach, describe, expect, test, vi } from 'vitest';

describe('event hooks', () => {
  afterEach(() => {
    uninstallEventHooks();
  });

  test('keeps listener removal isolated by target and capture', () => {
    initializeEventHooks();
    const hook = registerEventHook('ping', {});

    const target = new EventTarget();
    const listener = vi.fn();

    target.addEventListener('ping', listener, false);
    target.addEventListener('ping', listener, true);

    target.removeEventListener('ping', listener, false);
    target.dispatchEvent(new Event('ping'));

    expect(listener).toHaveBeenCalledTimes(1);

    hook.remove();
  });
});
