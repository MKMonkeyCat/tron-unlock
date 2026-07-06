import {
  loadPanelState,
  saveFeatureConfig,
  saveOverride,
  savePlacement,
} from '../../../src/ui/panel/persistence';

import { describe, expect, test } from 'vitest';

describe('panel persistence', () => {
  test('round-trips defaults, overrides, configs and placement', async () => {
    const initial = await loadPanelState();
    expect(initial).toEqual({
      panelOpen: false,
      placement: 'web',
      toggleShortcut: 'ctrl+shift+u',
      overrides: {},
      configs: {},
      bubblePosition: null,
      panelPosition: null,
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
});
