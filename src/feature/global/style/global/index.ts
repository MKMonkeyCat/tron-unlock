import { SVG_MENU } from '@/assets/svg';
import {
  MK_BASE_CLASS,
  MK_HIDDEN_CLASS,
  MK_HIDDEN_SCROLL_CLASS,
} from '@/constants';
import { skipHookFunc } from '@/hook';
import {
  createElement,
  createSvgFromString,
  doc,
  waitElement,
  win,
} from '@/utils/dom/element';
import { onClickOutside } from '@/utils/dom/utils';

import headerRwd from './header-rwd.scss?inline';
import type { BaseSettings } from '../base';

export default {
  header: {
    test: true,
    css: headerRwd,
    state: { originalHeader: null, mkHeader: null },
    setup({ state }) {
      waitElement('.header').then((originalHeader) => {
        if (originalHeader.classList.contains(MK_BASE_CLASS)) return;
        if (state.originalHeader || state.mkHeader) return;

        state.originalHeader = originalHeader;

        const mkHeader = originalHeader.cloneNode(true) as HTMLElement;
        mkHeader.classList.add(MK_BASE_CLASS, 'mk-rwd-header', MK_HIDDEN_CLASS);
        state.mkHeader = mkHeader;

        //

        const layout = mkHeader.querySelector(
          '.layout-row.default-layout',
        ) as HTMLElement;

        const customLayout = createElement('div', 'custom-layout');
        const customDropMenu = createElement('div', 'custom-drop-menu');

        customLayout.append(
          ...mkHeader.querySelectorAll(
            '.layout-row.default-layout>li,.layout-row.default-layout>ul',
          ),
        );
        customDropMenu.append(createSvgFromString(SVG_MENU));

        layout.append(customLayout, customDropMenu);

        const bodyClassList = doc.body.classList;
        const customLayoutClassList = customLayout.classList;
        onClickOutside(layout, () => {
          bodyClassList.remove(MK_HIDDEN_SCROLL_CLASS);
          customLayoutClassList.remove('mk-open-menu');
        });

        //

        const resizeHandler = skipHookFunc(() => {
          if (win.innerWidth >= 920) {
            bodyClassList.remove(MK_HIDDEN_SCROLL_CLASS);
            customLayoutClassList.remove('mk-open-menu');
          }
        });
        win.addEventListener('resize', resizeHandler);

        const clickHandler = skipHookFunc(() => {
          bodyClassList.toggle(
            MK_HIDDEN_SCROLL_CLASS,
            customLayoutClassList.toggle('mk-open-menu'),
          );
        });
        customDropMenu.addEventListener('click', clickHandler);

        //

        originalHeader.parentElement?.insertBefore(
          mkHeader,
          originalHeader.nextSibling,
        );
      });
    },
    onEnable({ state }) {
      if (!state.originalHeader || !state.mkHeader) {
        console.log('Header not found, cannot enable header-rwd style');
        return;
      }

      (state.originalHeader as HTMLElement)?.classList.add(MK_HIDDEN_CLASS);
      (state.mkHeader as HTMLElement)?.classList.remove(MK_HIDDEN_CLASS);
    },
    onDisable({ state }) {
      if (!state.originalHeader || !state.mkHeader) {
        console.log('Header not found, cannot disable header-rwd style');
        return;
      }

      (state.originalHeader as HTMLElement)?.classList.remove(MK_HIDDEN_CLASS);
      (state.mkHeader as HTMLElement)?.classList.add(MK_HIDDEN_CLASS);
    },
  },
} as BaseSettings;
