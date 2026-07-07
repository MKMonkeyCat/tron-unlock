import { MK_HIDDEN_SCROLL_CLASS } from '@/constants';
import type {
  CategoryTranslationRegistry,
  FeatureGroupTranslation,
  GroupBuilder,
} from '@/core';
import { skipHookFunc } from '@/hook';
import { doc, injectStyle, win } from '@/utils';

import type { GlobalGroupI18nType } from '.';

export const createGlobalMiscPlugins = <
  TI18n extends CategoryTranslationRegistry = CategoryTranslationRegistry,
>(
  tab: GroupBuilder<
    FeatureGroupTranslation<GlobalGroupI18nType['misc']>,
    TI18n
  >,
) => {
  tab.append({
    id: 'hidden-footer',
    onEnable() {
      const style = injectStyle(`$css
        .main-content {
          padding-bottom: 0 !important;
        }
        [data-category=tronclass-footer] {
          display: none !important;
        }
      `);
      return () => style.remove();
    },
  });
  tab.append({
    id: 'init-hide-scrollbar',
    onEnable() {
      const toggleHideScroll = (hide: boolean) => {
        doc.body?.classList.toggle(`${MK_HIDDEN_SCROLL_CLASS}-init`, hide);
      };
      const fixScrollStyleHandle = skipHookFunc(() => {
        if (doc.readyState !== 'complete') {
          toggleHideScroll(true);
          win.addEventListener(
            'load',
            skipHookFunc(() => toggleHideScroll(false)),
            { once: true },
          );
        }
      });

      fixScrollStyleHandle();
      doc.addEventListener('DOMContentLoaded', fixScrollStyleHandle);
      return () => {
        toggleHideScroll(false);
        doc.removeEventListener('DOMContentLoaded', fixScrollStyleHandle);
      };
    },
  });
};
