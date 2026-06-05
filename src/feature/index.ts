import { Builder, FeatureRegistry } from '@/core/feature/build';

import { createGlobalFeatureModule } from './global';

export const registry = new FeatureRegistry();
export const builder = new Builder(registry);

export const initializeFeatures = async () => {
  builder.tab('global', (tab) => {
    createGlobalFeatureModule(tab);
  });
};
