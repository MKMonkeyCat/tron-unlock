import type {
  CategoryTranslationRegistry,
  FeatureGroupTranslation,
  GroupBuilder,
} from '@/core';

import type { GlobalGroupI18nType } from '..';

export const createGlobalStylePlugins = <
  TI18n extends CategoryTranslationRegistry = CategoryTranslationRegistry,
>(
  tab: GroupBuilder<
    FeatureGroupTranslation<GlobalGroupI18nType['style']>,
    TI18n
  >,
) => {
  tab.append({
    id: 'course',
    onEnable() {},
  });

  tab.append({
    id: 'course-lesson',
    onEnable() {},
  });
};
