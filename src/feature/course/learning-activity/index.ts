import type { GroupBuilder } from '@/core';
import { httpRequestHookManager } from '@/hook/request/http-shared';

export const CourseLearningActivityPluginId = {
  ForceAllowDownload: 'force-allow-download',
  ForceAllowForwardSeeking: 'force-allow-forward-seeking',
  AutoViewVideoActivity: 'auto-view-video-activity',
} as const;

type AutoVideoMode = 'auto' | 'custom';

const hookActivityApi = (key: 'allow_download' | 'allow_forward_seeking') =>
  httpRequestHookManager.register({
    test: /^\/api\/activities\/(\d+)\/?$/,
    onResponse(
      request,
      { status },
      body: TronClassApi.Endpoints['GET /api/activities/:id']['response'],
    ) {
      if (request.method !== 'GET') return;
      if (status === 200 && body && typeof body === 'object') {
        if (body.data[key]) return; // already allowed, no need to modify

        // TODO add log
        const clonedBody = { ...body };
        clonedBody.data[key] = true; // force allow
        return JSON.stringify(clonedBody);
      }
    },
  });

export const createCourseLearningActivityPlugins = (group: GroupBuilder) => {
  group.append({
    id: CourseLearningActivityPluginId.ForceAllowDownload,
    onEnable: () => hookActivityApi('allow_download'),
  });
  group.append({
    id: CourseLearningActivityPluginId.ForceAllowForwardSeeking,
    onEnable: () => hookActivityApi('allow_forward_seeking'),
  });
  group.append({
    id: CourseLearningActivityPluginId.AutoViewVideoActivity,
    defaultConfig: {
      playRate: 1.75,
      autoStart: true,
      playThresholdMode: 'custom' as AutoVideoMode,
      playThreshold: 1,
      // TODO add random config
      playThresholdRandom: true,
    },
    fields: [
      { key: 'autoStart', type: 'toggle' },
      { key: 'playRate', type: 'number', min: 0.1, step: 0.1, max: 16 },
      { key: 'playThreshold', type: 'number', min: 0, step: 0.05, max: 1 },
      { key: 'playThresholdMode', type: 'select', options: ['auto', 'custom'] },
      { key: 'playThresholdRandom', type: 'toggle' },
    ],
  });
};
