import { HANDLE_WIDTH } from '../../../src/ui/panel/components/EdgeHandle';
import {
  loadPanelState,
  saveBubblePosition,
  saveFeatureConfig,
  saveOverride,
  savePlacement,
} from '../../../src/ui/panel/persistence';

import { afterEach, describe, expect, test } from 'vitest';

describe('panel persistence', () => {
  afterEach(() => {
    delete (globalThis as { innerWidth?: number }).innerWidth;
    delete (globalThis as { innerHeight?: number }).innerHeight;
  });

  test('round-trips defaults, overrides, configs and placement', async () => {
    const initial = await loadPanelState();
    expect(initial).toEqual({
      placement: 'web',
      toggleShortcut: 'ctrl+shift+u',
      overrides: {},
      configs: {},
      bubblePosition: null,
    });

    await saveOverride('demo', true);
    await saveFeatureConfig('demo', { foo: 2 });
    await savePlacement('plugin');

    const next = await loadPanelState();
    expect(next.overrides).toEqual({ demo: true });
    expect(next.configs).toEqual({ demo: { foo: 2 } });
    expect(next.placement).toBe('plugin');

    await saveOverride('demo', null);
    const cleared = await loadPanelState();
    expect(cleared.overrides).toEqual({});
  });

  test('stores the bubble position as docked side + %-of-height, not raw pixels', async () => {
    Object.assign(globalThis, { innerWidth: 1000, innerHeight: 800 });

    // near the right edge, a quarter of the way down the viewport
    await saveBubblePosition({ x: 990, y: 200 });

    // simulate the page reloading on a differently sized viewport - a
    // position stored as raw pixels would now point at the wrong spot
    Object.assign(globalThis, { innerWidth: 2000, innerHeight: 1600 });

    const { bubblePosition } = await loadPanelState();
    expect(bubblePosition).toEqual({
      x: 2000 - HANDLE_WIDTH, // still docked to the right edge
      y: 400, // still 25% of the (new, taller) viewport height
    });
  });
});
