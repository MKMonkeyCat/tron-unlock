import type { PluginIDMap } from '@/plugin';
import { PluginSystem } from '@/plugin';

import { createExamFeatureModule, ExamFeaturePluginId } from './exam';
import { createGlobalFeatureModule, GlobalFeaturePluginId } from './global';

export const FeaturePluginId = {
  exam: ExamFeaturePluginId,
  global: GlobalFeaturePluginId,
} as const satisfies PluginIDMap;

let featureSystem: PluginSystem<typeof FeaturePluginId> | null = null;

export const initializeFeatures = async () => {
  if (featureSystem) return featureSystem;

  const modules = [createExamFeatureModule(), createGlobalFeatureModule()];

  featureSystem = new PluginSystem();

  await Promise.all(
    modules.map((module) => featureSystem!.initialize(module.plugins)),
  );

  return featureSystem;
};

export const getFeatureSystem = () => {
  if (!featureSystem) {
    throw new Error(
      'Feature system is not initialized. Please call initializeFeatures() first.',
    );
  }
  return featureSystem;
};
