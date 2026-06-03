import type { FeatureControlModule, PluginGroupIDMap } from '@/plugin';

import { createExamMiscPlugins, ExamMiscPluginId } from './misc';

export const ExamFeaturePluginId = {
  ...ExamMiscPluginId,
} as const satisfies PluginGroupIDMap;

export const createExamFeatureModule = (): FeatureControlModule => ({
  id: 'exam',
  plugins: [...createExamMiscPlugins()],
});
