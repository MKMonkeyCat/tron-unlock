import type {
  CategoryTranslationRegistry,
  FeatureGroupTranslation,
  GroupBuilder,
} from '@/core';
import { injectStyle } from '@/utils';

import course from './course';
import global from './global';
import baseGlobalStyle from './global.scss?inline';

import type { GlobalGroupI18nType } from '..';

const styles = {
  course,
  global,
};

const createGlobalStyleManager = () => {
  let count = 0;
  let removeBaseStyle: (() => void) | undefined;

  return {
    acquire() {
      if (count++ === 0) {
        removeBaseStyle = injectStyle(baseGlobalStyle, {
          id: 'mk-base-global-style',
        }).remove;
      }
    },

    release() {
      count--;

      if (count <= 0) {
        count = 0;
        removeBaseStyle?.();
        removeBaseStyle = undefined;
      }
    },
  };
};

export const createGlobalStylePlugins = <
  TI18n extends CategoryTranslationRegistry = CategoryTranslationRegistry,
>(
  tab: GroupBuilder<
    FeatureGroupTranslation<GlobalGroupI18nType['style']>,
    TI18n
  >,
) => {
  const globalStyleManager = createGlobalStyleManager();

  const withGlobalStyle = (cleanup: () => void) => {
    globalStyleManager.acquire();

    return () => {
      cleanup();
      globalStyleManager.release();
    };
  };

  for (const [groupKey, groupStyles] of Object.entries(styles)) {
    for (const [styleKey, style] of Object.entries(groupStyles)) {
      if (!style.test) continue;

      tab.append({
        id: `${groupKey}:${styleKey}`,
        ...(style as any),
        onEnable(ctx) {
          const cleanup = withGlobalStyle(
            injectStyle(style.css, {
              id: `mk-style-${groupKey}-${styleKey}`,
            }).remove,
          );

          const clearup2 = style.onEnable?.(ctx as any);
          return (ctx) => {
            cleanup();
            clearup2?.(ctx as any);
          };
        },
      });
    }
  }
};
