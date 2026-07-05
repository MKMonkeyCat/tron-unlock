import { Builder, FeatureRegistry } from '@/core/feature/build';

import { createCourseFeatureModule } from './course';
import { createExamFeatureModule } from './exam';
import { createGlobalFeatureModule } from './global';

export const registry = new FeatureRegistry();
export const builder = new Builder(registry);

export const initializeFeatures = async () => {
  builder
    .tab('course', (tab) => {
      createCourseFeatureModule(tab);
    })
    .tab('exam', (tab) => {
      createExamFeatureModule(tab);
    })
    .tab('global', (tab) => {
      createGlobalFeatureModule(tab);
    });
};
