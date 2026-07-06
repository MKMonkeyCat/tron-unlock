import type { TabBuilder } from '@/core';

import courseI18n from './_i18n.json';
import { createCourseLearningActivityPlugins } from './learning-activity';

export type CourseI18nType = typeof courseI18n;
export type CourseGroupI18nType = CourseI18nType['zh_TW']['groups'];

export const createCourseFeatureModule = (tab: TabBuilder) => {
  tab
    .withI18n(courseI18n)
    .group('learning-activity', createCourseLearningActivityPlugins);
};
