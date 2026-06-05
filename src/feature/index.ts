import { builder } from '@/core';

import { createGlobalFeatureModule } from './global';

export const initializeFeatures = async () => {
  builder.tab('global', (tab) => {
    createGlobalFeatureModule(tab);
  });
};
