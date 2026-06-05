import type { TabBuilder } from '@/core';

import { createCourseLearningActivityPlugins } from './learning-activity';

export const createCourseFeatureModule = (tab: TabBuilder) => {
  createCourseLearningActivityPlugins(tab.group('learning-activity'));
};
