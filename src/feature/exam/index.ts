import type { TabBuilder } from '@/core';

import { createExamMiscPlugins } from './misc';

export const createExamFeatureModule = (tab: TabBuilder) => {
  createExamMiscPlugins(tab.group('misc'));
};
