import type {
  CategoryTranslationRegistry,
  FeatureGroupTranslation,
  GroupBuilder,
} from '@/core';
import { httpRequestHookManager } from '@/hook/request/http-shared';

import type { CourseGroupI18nType } from '..';

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
        const clonedBody = { ...body, data: { ...body.data, [key]: true } };
        return JSON.stringify(clonedBody);
      }
    },
  });

export const createCourseLearningActivityPlugins = <
  TI18n extends CategoryTranslationRegistry = CategoryTranslationRegistry,
>(
  group: GroupBuilder<
    FeatureGroupTranslation<CourseGroupI18nType['learning-activity']>,
    TI18n
  >,
) => {
  group.append({
    id: 'auto-view-video-activity',
    onEnable: () => hookActivityApi('allow_download'),
  });
  group.append({
    id: 'force-allow-forward-seeking',
    onEnable: () => hookActivityApi('allow_forward_seeking'),
  });
  group.append({
    id: 'auto-view-video-activity',
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
