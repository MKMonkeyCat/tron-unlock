import type { FeatureControlModule, PluginGroupIDMap } from '@/plugin';

export const CourseFeaturePluginId = {} as const satisfies PluginGroupIDMap;

export const createCourseFeatureModule = (): FeatureControlModule => ({
  id: 'course',
  plugins: [],
});
