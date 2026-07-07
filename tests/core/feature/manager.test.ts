import { Builder, FeatureRegistry } from '../../../src/core/feature/build';
import { FeatureManager } from '../../../src/core/feature/manager';
import type { RouteSnapshot } from '../../../src/core/feature/types';

import { describe, expect, test, vi } from 'vitest';

const route: RouteSnapshot = {
  href: 'https://example.test/',
  pathname: '/',
  search: '',
  hash: '',
};

const DEMO_ID = 'global.misc.demo';

describe('FeatureManager', () => {
  test('enables features that match test, respects manual override, and reports snapshots', async () => {
    const registry = new FeatureRegistry();
    const builder = new Builder(registry);

    const onEnable = vi.fn(() => () => {});
    const onDisable = vi.fn();
    const onConfigChange = vi.fn();

    builder.tab('global', (tab) => {
      tab.group('misc', (group) => {
        group.append({
          id: 'demo',
          test: true,
          defaultConfig: { foo: 1 },
          fields: [{ key: 'foo', type: 'number' }],
          onEnable,
          onDisable,
          onConfigChange,
        });
      });
    });

    const manager = new FeatureManager(registry);
    const changes: string[] = [];
    manager.onChange((e) => changes.push(e.id));

    await manager.update(route);
    expect(onEnable).toHaveBeenCalledTimes(1);

    let snapshot = manager.getSnapshot();
    expect(snapshot).toEqual([
      {
        id: DEMO_ID,
        category: 'global',
        group: 'misc',
        enabled: true,
        config: { foo: 1 },
        fields: [{ key: 'foo', type: 'number' }],
      },
    ]);

    await manager.setConfig(DEMO_ID as never, { foo: 2 });
    expect(onConfigChange).toHaveBeenCalledTimes(1);
    expect(onConfigChange.mock.calls[0]?.[1]).toEqual({ foo: 1 });
    snapshot = manager.getSnapshot();
    expect(snapshot[0]?.config).toEqual({ foo: 2 });

    await manager.setEnabled(DEMO_ID as never, false);
    expect(onDisable).toHaveBeenCalledTimes(1);
    snapshot = manager.getSnapshot();
    expect(snapshot[0]?.enabled).toBe(false);

    // test:true would normally re-enable on the next route update, but the
    // manual override should keep it disabled.
    await manager.update(route);
    expect(onEnable).toHaveBeenCalledTimes(1);

    await manager.setEnabled(DEMO_ID as never, null);
    await manager.update(route);
    expect(onEnable).toHaveBeenCalledTimes(2);

    // One emit each for: the initial auto-enable, setConfig, the manual
    // disable, and the override-clear re-enable. The route updates that
    // don't flip running state (before setEnabled(false) took effect, and
    // after setEnabled(null) already re-enabled it) emit nothing.
    expect(changes).toEqual([DEMO_ID, DEMO_ID, DEMO_ID, DEMO_ID]);
  });

  test('treats a feature as running even when its setup/onEnable returns no cleanup', async () => {
    const registry = new FeatureRegistry();
    const builder = new Builder(registry);

    const setup = vi.fn();

    builder.tab('global', (tab) => {
      tab.group('misc', (group) => {
        // Mirrors real features like `devtool-hook`, whose `setup` performs
        // side effects but returns nothing - there is no cleanup to store,
        // but the feature is still meant to count as "on".
        group.append({ id: 'demo', test: true, setup });
      });
    });

    const manager = new FeatureManager(registry);
    const changes: string[] = [];
    manager.onChange((e) => changes.push(e.id));

    await manager.update(route);
    expect(setup).toHaveBeenCalledTimes(1);
    expect(manager.getSnapshot()[0]?.enabled).toBe(true);
    // Reported as an automatic transition, with no manual setEnabled call.
    expect(changes).toEqual([DEMO_ID]);

    // A later route update with no actual change must not re-run setup -
    // the feature is already considered running.
    await manager.update(route);
    expect(setup).toHaveBeenCalledTimes(1);
    expect(changes).toEqual([DEMO_ID]);
  });
});
