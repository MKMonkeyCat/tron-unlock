import type { TabBuilder } from '@/core';

import globalI18n from './_i18n.json';
import { createGlobalEventHookPlugins } from './event-hook';
import { createGlobalMiscPlugins } from './misc';

export type GlobalI18nType = typeof globalI18n;
export type GlobalGroupI18nType = GlobalI18nType['zh_TW']['groups'];

export const createGlobalFeatureModule = (tab: TabBuilder) => {
  tab
    .withI18n(globalI18n)
    .group('event-hook', (group) => createGlobalEventHookPlugins(group))
    .group('misc', (group) => createGlobalMiscPlugins(group));
};
