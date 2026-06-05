import type { TabBuilder } from '@/core';

import { createGlobalEventHookPlugins } from './event-hook';
import { createGlobalMiscPlugins } from './misc';

export const createGlobalFeatureModule = (tab: TabBuilder) => {
  createGlobalEventHookPlugins(tab.group('event-hook'));
  createGlobalMiscPlugins(tab.group('misc'));
};
