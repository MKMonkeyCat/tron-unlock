import type { FeatureRegistry } from '@/core/feature/build';
import type { FeatureManager } from '@/core/feature/manager';
import type {
  ConfigData,
  FeatureCategoryId,
  FeatureGroupId,
  FeatureId,
  FeatureSnapshot,
  LeafFeatureId,
} from '@/core/feature/types';
import { DEFAULT_LOCALE, i18nManager } from '@/core/i18n';

import { loadPanelState, saveFeatureConfig, saveOverride } from './persistence';

export interface PanelFieldLabel {
  name: string;
  description?: string;
}

export interface PanelFeatureLabel {
  name: string;
  description?: string;
  fields: Record<string, PanelFieldLabel>;
}

export interface PanelFeatureItem extends FeatureSnapshot {
  label: PanelFeatureLabel;
}

export interface PanelGroupItem {
  group: FeatureGroupId | undefined;
  label: string;
  features: PanelFeatureItem[];
}

export interface PanelCategoryItem {
  category: FeatureCategoryId;
  label: string;
  groups: PanelGroupItem[];
}

export interface PanelClient {
  getSnapshot(): PanelCategoryItem[];
  setEnabled(id: FeatureId, enabled: boolean | null): Promise<void>;
  setConfig(id: FeatureId, patch: Partial<ConfigData>): Promise<void>;
  onChange(listener: () => void): () => void;
}

const getLeafId = (id: FeatureId) => id.split('.').pop() as LeafFeatureId;

const currentLocaleDict = <T>(translations: Record<string, T>): T | undefined =>
  translations[i18nManager.currentLanguage] ?? translations[DEFAULT_LOCALE];

export const resolveFeatureLabel = (
  registry: FeatureRegistry,
  snapshot: FeatureSnapshot,
): PanelFeatureLabel => {
  const groupI18n = registry.i18n.getGroupI18nContext(
    snapshot.category,
    snapshot.group,
  );
  const dict = currentLocaleDict(groupI18n.translations);
  const leaf = getLeafId(snapshot.id);
  const info = dict?.features?.[leaf];

  return {
    name: info?.name || snapshot.id,
    description: info?.description || undefined,
    fields: Object.fromEntries(
      Object.entries(info?.fields ?? {}).map(([key, fieldInfo]) => [
        key,
        { name: fieldInfo?.name || key, description: fieldInfo?.description },
      ]),
    ),
  };
};

export const resolveCategoryLabel = (
  registry: FeatureRegistry,
  category: FeatureCategoryId,
): string => {
  const categoryI18n = registry.i18n.getCategoryI18nContext(category);
  const dict = currentLocaleDict(categoryI18n.translations);

  return dict?.name || category;
};

export const resolveGroupLabel = (
  registry: FeatureRegistry,
  category: FeatureCategoryId,
  group: FeatureGroupId | undefined,
): string => {
  if (!group) return category;

  const categoryI18n = registry.i18n.getCategoryI18nContext(category);
  const dict = currentLocaleDict(categoryI18n.translations);

  return dict?.groups?.[group]?.name || group;
};

export const createLocalPanelClient = (
  manager: FeatureManager,
  registry: FeatureRegistry,
): PanelClient => {
  const getSnapshot = (): PanelCategoryItem[] => {
    const snapshots = manager.getSnapshot();
    const byCategory = new Map<FeatureCategoryId, FeatureSnapshot[]>();

    for (const snapshot of snapshots) {
      const list = byCategory.get(snapshot.category) ?? [];
      list.push(snapshot);
      byCategory.set(snapshot.category, list);
    }

    return [...byCategory.entries()].map(([category, features]) => {
      const byGroup = new Map<FeatureGroupId | undefined, FeatureSnapshot[]>();

      for (const snapshot of features) {
        const list = byGroup.get(snapshot.group) ?? [];
        list.push(snapshot);
        byGroup.set(snapshot.group, list);
      }

      return {
        category,
        label: resolveCategoryLabel(registry, category),
        groups: [...byGroup.entries()].map(([group, groupFeatures]) => ({
          group,
          label: resolveGroupLabel(registry, category, group),
          features: groupFeatures.map((snapshot) => ({
            ...snapshot,
            label: resolveFeatureLabel(registry, snapshot),
          })),
        })),
      };
    });
  };

  return {
    getSnapshot,
    setEnabled: (id, enabled) => manager.setEnabled(id, enabled),
    setConfig: (id, patch) => manager.setConfig(id, patch),
    onChange: (listener) => manager.onChange(() => listener()),
  };
};

/**
 * Same as `createLocalPanelClient`, but replays previously persisted
 * overrides/configs into the manager on creation (so a reload doesn't lose
 * manual toggles), and mirrors every future `setEnabled`/`setConfig` call
 * back into storage.
 */
export const createPersistingLocalClient = async (
  manager: FeatureManager,
  registry: FeatureRegistry,
): Promise<PanelClient> => {
  const base = createLocalPanelClient(manager, registry);
  const state = await loadPanelState();

  for (const [id, enabled] of Object.entries(state.overrides)) {
    await manager.setEnabled(id as FeatureId, enabled);
  }
  for (const [id, config] of Object.entries(state.configs)) {
    await manager.setConfig(id as FeatureId, config as Partial<ConfigData>);
  }

  return {
    ...base,
    setEnabled: async (id, enabled) => {
      await base.setEnabled(id, enabled);
      await saveOverride(id, enabled);
    },
    setConfig: async (id, patch) => {
      await base.setConfig(id, patch);
      await saveFeatureConfig(id, patch);
    },
  };
};
