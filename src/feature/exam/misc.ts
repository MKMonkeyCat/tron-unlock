import type {
  CategoryTranslationRegistry,
  FeatureGroupTranslation,
  GroupBuilder,
} from '@/core';
import { injectStyle } from '@/utils';

import type { ExamGroupI18nType } from '.';

export const createExamMiscPlugins = <
  TI18n extends CategoryTranslationRegistry = CategoryTranslationRegistry,
>(
  group: GroupBuilder<
    FeatureGroupTranslation<ExamGroupI18nType['misc']>,
    TI18n
  >,
) => {
  group.append({
    id: 'hidden-mark',
    onEnable() {
      // 實際不須使用 ::before 或 ::after
      const style = injectStyle(`$css
        [id="Symbol(water-mark)"],
        [id="Symbol(water-mark)"]::before,
        [id="Symbol(water-mark)"]::after,
        #symbol-water-mark,
        #symbol-water-mark::before,
        #symbol-water-mark::after {
          display: none !important;
          background: none !important;
          background-image: none !important;
        }
      `);
      return () => style.remove();
    },
  });
};
