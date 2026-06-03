import { MK_HIDDEN_SCROLL_CLASS } from '@/constants';
import { skipHookFunc } from '@/hook';
import type { PluginGroupIDMap } from '@/plugin';
import { definePlugin } from '@/plugin';
import { doc, injectStyle, win } from '@/utils';

export const GlobalMiscPluginId = {
  HiddenFooter: 'hidden-footer',
  InitHideScrollbar: 'init-hide-scrollbar',
} as const satisfies PluginGroupIDMap;

export const createGlobalMiscPlugins = () => [
  definePlugin({
    id: GlobalMiscPluginId.HiddenFooter,
    enable() {
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
  }),
  definePlugin({
    id: GlobalMiscPluginId.InitHideScrollbar,
    enable() {
      const INIT_HIDE_SCROLL_CLASSNAME = `${MK_HIDDEN_SCROLL_CLASS}-init`;

      const toggleHideScroll = (hide: boolean) => {
        doc.body?.classList.toggle(INIT_HIDE_SCROLL_CLASSNAME, hide);
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
  }),
];
