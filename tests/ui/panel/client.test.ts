import { Builder, FeatureRegistry } from '../../../src/core/feature/build';
import { FeatureManager } from '../../../src/core/feature/manager';
import type { RouteSnapshot } from '../../../src/core/feature/types';
import { createLocalPanelClient } from '../../../src/ui/panel/client';

import { describe, expect, test } from 'vitest';

const route: RouteSnapshot = {
  href: 'https://example.test/',
  pathname: '/',
  search: '',
  hash: '',
};

describe('createLocalPanelClient', () => {
  test('groups features by category/group and resolves i18n labels', async () => {
    const registry = new FeatureRegistry();
    const builder = new Builder(registry);

    builder.tab('global', (tab) => {
      tab
        .withI18n({
          zh_TW: {
            name: '全域',
            groups: {
              misc: {
                name: '雜項',
                features: {
                  demo: { name: '示範功能', description: '示範描述' },
                },
              },
            },
          },
        })
        .group('misc', (group) => {
          group.append({
            id: 'demo',
            test: true,
            defaultConfig: { foo: 1 },
            fields: [{ key: 'foo', type: 'number' }],
            onEnable: () => () => {},
          });
        });
    });

    const manager = new FeatureManager(registry);
    await manager.update(route);

    const client = createLocalPanelClient(manager, registry);
    const snapshot = client.getSnapshot();

    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]?.category).toBe('global');
    expect(snapshot[0]?.label).toBe('全域');
    expect(snapshot[0]?.groups).toHaveLength(1);
    expect(snapshot[0]?.groups[0]?.label).toBe('雜項');
    expect(snapshot[0]?.groups[0]?.features).toHaveLength(1);
    expect(snapshot[0]?.groups[0]?.features[0]?.label).toEqual({
      name: '示範功能',
      description: '示範描述',
    });
    expect(snapshot[0]?.groups[0]?.features[0]?.enabled).toBe(true);

    let changed = 0;
    const unsubscribe = client.onChange(() => changed++);

    await client.setConfig('global.misc.demo' as never, { foo: 2 });
    expect(changed).toBe(1);
    expect(client.getSnapshot()[0]?.groups[0]?.features[0]?.config).toEqual({
      foo: 2,
    });

    await client.setEnabled('global.misc.demo' as never, false);
    expect(client.getSnapshot()[0]?.groups[0]?.features[0]?.enabled).toBe(
      false,
    );

    unsubscribe();
  });

  test('falls back to the feature/group/category id when no translation is registered', async () => {
    const registry = new FeatureRegistry();
    const builder = new Builder(registry);

    builder.tab('exam', (tab) => {
      tab.group('misc', (group) => {
        group.append({ id: 'demo', test: true });
      });
    });

    const manager = new FeatureManager(registry);
    await manager.update(route);

    const client = createLocalPanelClient(manager, registry);
    const snapshot = client.getSnapshot();

    expect(snapshot[0]?.label).toBe('exam');
    expect(snapshot[0]?.groups[0]?.label).toBe('misc');
    expect(snapshot[0]?.groups[0]?.features[0]?.label.name).toBe(
      'exam.misc.demo',
    );
    expect(
      snapshot[0]?.groups[0]?.features[0]?.label.description,
    ).toBeUndefined();
  });
});
