import type { TabBuilder } from '@/core';

import examI18n from './_i18n.json';
import { createExamMiscPlugins } from './misc';

export type ExamI18nType = typeof examI18n;
export type ExamGroupI18nType = ExamI18nType['zh_TW']['groups'];

export const createExamFeatureModule = (tab: TabBuilder) => {
  tab.withI18n(examI18n).group('misc', (group) => createExamMiscPlugins(group));
};
