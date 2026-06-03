import type { FeatureControlModule, PluginGroupIDMap } from '@/plugin';

import {
  createGlobalEventHookPlugins,
  GlobalEventHookPluginId,
} from './event-hook';
import { createGlobalMiscPlugins, GlobalMiscPluginId } from './misc';

export const GlobalFeaturePluginId = {
  ...GlobalEventHookPluginId,
  ...GlobalMiscPluginId,
} as const satisfies PluginGroupIDMap;

export const createGlobalFeatureModule = (): FeatureControlModule => ({
  id: 'global',
  plugins: [...createGlobalEventHookPlugins(), ...createGlobalMiscPlugins()],
});
