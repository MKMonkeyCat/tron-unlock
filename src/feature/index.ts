import { Builder, FeatureRegistry } from '@/core/feature/build';
import { FeatureManager } from '@/core/feature/manager';

import { createCourseFeatureModule } from './course';
import { createExamFeatureModule } from './exam';
import { createGlobalFeatureModule } from './global';

export const registry = new FeatureRegistry();
export const builder = new Builder(registry);
export const manager = new FeatureManager(registry);

export const initializeFeatures = async () => {
  builder
    .tab('course', createCourseFeatureModule)
    .tab('exam', createExamFeatureModule)
    .tab('global', createGlobalFeatureModule);
};
