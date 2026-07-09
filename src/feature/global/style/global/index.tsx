import { SvgMenu } from '@/assets/icons';
import { MK_BASE_CLASS, MK_HIDDEN_SCROLL_CLASS } from '@/constants';
import { skipHookFunc } from '@/hook';
import { createElement, doc, waitElement, win } from '@/utils/dom/element';
import { onClickOutside } from '@/utils/dom/utils';

import headerRwd from './header-rwd.scss?inline';
import type { BaseSettings } from '../base';

import { render } from 'preact';

export default {
  header: {
    test: true,
    css: headerRwd,
    state: { originalHeader: null, mkHeader: null },
    needPageReload: true,
    onEnable({ state }) {
      waitElement('.header').then((header) => {
        if (header.classList.contains(MK_BASE_CLASS)) return;
        if (state.originalHeader) return;
        state.originalHeader = header;

        const defaultLayoutClass = '.layout-row.default-layout';

        if (!header.querySelector(defaultLayoutClass)) return;

        header.classList.add(MK_BASE_CLASS, 'mk-rwd-header');

        //

        const layout = header.querySelector(defaultLayoutClass) as HTMLElement;

        const customLayout = createElement('div', 'custom-layout');
        const customDropMenu = createElement('div', 'custom-drop-menu');

        customLayout.append(
          ...header.querySelectorAll(
            `${defaultLayoutClass}>li,${defaultLayoutClass}>ul`,
          ),
        );
        render(<SvgMenu />, customDropMenu);

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
      });
    },
  },
} as BaseSettings;
