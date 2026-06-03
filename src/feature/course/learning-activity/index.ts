import { httpRequestHookManager } from '@/hook/request/http-shared';
import type { PluginGroupIDMap } from '@/plugin';
import { definePlugin } from '@/plugin';

export const CourseLearningActivityPluginId = {
  ForceAllowDownload: 'force-allow-download',
  ForceAllowForwardSeeking: 'force-allow-forward-seeking',
  AutoPlayNextVideo: 'auto-play-next-video',
} as const satisfies PluginGroupIDMap;

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

export const createCourseLearningActivityPlugins = () => [
  definePlugin({
    id: CourseLearningActivityPluginId.ForceAllowDownload,
    setup() {
      hookActivityApi('allow_download');
    },
  }),
  definePlugin({
    id: CourseLearningActivityPluginId.ForceAllowForwardSeeking,
    setup() {
      hookActivityApi('allow_forward_seeking');
    },
  }),
  definePlugin({
    id: CourseLearningActivityPluginId.AutoPlayNextVideo,
    // TODO implement auto play next video
    enable: () => {},
  }),
];
