import { MK_HIDDEN_SCROLL_CLASS } from '@/constants';
import type { GroupBuilder } from '@/core';
import { skipHookFunc } from '@/hook';
import { doc, injectStyle, win } from '@/utils';

const GlobalMiscPluginId = {
  HiddenFooter: 'hidden-footer',
  InitHideScrollbar: 'init-hide-scrollbar',
} as const;

export const createGlobalMiscPlugins = (tab: GroupBuilder) => {
  tab.append({
    id: GlobalMiscPluginId.HiddenFooter,
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
    id: GlobalMiscPluginId.InitHideScrollbar,
    onEnable() {
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
  });
};
