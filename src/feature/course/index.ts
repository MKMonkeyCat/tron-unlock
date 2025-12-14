// import i18n from './_i18n.json';
import { registerLearningActivityFeature } from './learning-activity';

import type { FeatureManager } from '..';
import { FeatureModule } from '..';

export const defaultConfig = {
  'learning-activity': {
    forceAllowDownload: false,
    forceAllowForwardSeeking: false,
  },
};

export const registerCourseModule = (moduleManager: FeatureManager) => {
  const courseFeatureModule = new FeatureModule('course', defaultConfig);

  registerLearningActivityFeature(courseFeatureModule);

  moduleManager.register('course', courseFeatureModule);

  return courseFeatureModule;
};

export type CourseFeatureModule = ReturnType<typeof registerCourseModule>;
