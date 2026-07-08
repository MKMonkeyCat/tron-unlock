import { MK_BASE_CLASS } from '@/constants';
import type {
  CategoryTranslationRegistry,
  FeatureGroupTranslation,
  GroupBuilder,
} from '@/core';
import type { HookController } from '@/hook';
import {
  createEventHookGroup,
  createKeyboardShortcutHook,
  mergeHookControllers,
  setupDisableDevToolDetector,
  skipHookFunc,
} from '@/hook';
import { doc, injectStyle, jQuery, win } from '@/utils';

import { createHumanLikePointerBehavior } from './utils/level-detector';

import type { GlobalGroupI18nType } from '.';

const isInsideMkComponent = (event: Event): boolean =>
  event
    .composedPath()
    .some(
      (node) =>
        node instanceof Element && node.classList.contains(MK_BASE_CLASS),
    );

export const createGlobalEventHookPlugins = <
  TI18n extends CategoryTranslationRegistry = CategoryTranslationRegistry,
>(
  tab: GroupBuilder<
    FeatureGroupTranslation<GlobalGroupI18nType['event-hook']>,
    TI18n
  >,
) => {
  tab.append({
    id: 'blur-hook',
    state: { reenable: null as (() => () => void) | null },
    setup({ state }) {
      const { disable, reenable } = mergeHookControllers(
        createEventHookGroup(
          ['blur', 'focus', 'beforeunload', 'unload', 'pagehide', 'pageshow'],
          {
            preCallCheck({ target }) {
              return (
                target === undefined ||
                target instanceof Window ||
                target instanceof Document
              );
            },
          },
        ),
      );
      state.reenable = reenable;
      return disable;
    },
    onEnable: ({ state }) => state.reenable?.(),
  });

  tab.append({
    id: 'devtool-hook',
    state: { controller: null as HookController | null },
    setup({ state }, value) {
      state.controller = setupDisableDevToolDetector();

      if (value) state.controller.enable();
      else state.controller.disable();
    },
    async onToggle({ state }, value) {
      const controller = state.controller;
      if (!controller) return;

      if (value) controller.enable();
      else controller.disable();
    },
  });

  tab.append({
    id: 'idle-checker-hook',
    state: {
      showIdleWarning: undefined as boolean | undefined,
      enableIdleWarning: undefined as boolean | undefined,
    },
    onEnable({ state }) {
      let isActive = true;

      const cleanupPointer = createHumanLikePointerBehavior(doc, win);
      const style = injectStyle(`$css
        #idle-warning-popup {
          display: none !important;
        }
      `);

      const statisticsSettings = win.statisticsSettings;
      if (statisticsSettings) {
        if (state.showIdleWarning === undefined) {
          state.showIdleWarning = statisticsSettings.showIdleWarning;
        }
        if (state.enableIdleWarning === undefined) {
          state.enableIdleWarning = statisticsSettings.enableIdleWarning;
        }

        statisticsSettings.showIdleWarning = false;
        statisticsSettings.enableIdleWarning = true;
      }

      const load = skipHookFunc(async () => {
        if (!isActive) return;

        try {
          const $ = await jQuery;
          if (!isActive) return;

          $('#idle-warning-popup').foundation?.('reveal', 'close');
        } catch {}
      });

      if (doc.readyState === 'loading') {
        win.addEventListener('DOMContentLoaded', load);
      } else load();

      return () => {
        isActive = false;

        cleanupPointer();
        style.remove();
        win.removeEventListener('DOMContentLoaded', load);

        const statisticsSettings = win.statisticsSettings;
        if (statisticsSettings) {
          if (state.showIdleWarning !== undefined) {
            statisticsSettings.showIdleWarning = state.showIdleWarning;
          }
          if (state.enableIdleWarning !== undefined) {
            statisticsSettings.enableIdleWarning = state.enableIdleWarning;
          }
        }

        state.showIdleWarning = undefined;
        state.enableIdleWarning = undefined;
      };
    },
  });

  tab.append({
    id: 'copy-paste-cut-hook',
    state: { reenable: null as (() => () => void) | null },
    setup({ state }) {
      const { disable, reenable } = mergeHookControllers(
        createEventHookGroup(
          ['copy', 'selectstart', 'cut', 'paste', 'contextmenu'],
          {
            preCallCheck({ event }) {
              return !isInsideMkComponent(event);
            },
          },
        ),
        createKeyboardShortcutHook((event, meta) => {
          if (isInsideMkComponent(event)) return false;

          // ctrl/cmd + c/v/x
          return meta.isMod && 'cvx'.includes(meta.key);
        }),
      );
      state.reenable = reenable;
      return disable;
    },
    onEnable: ({ state }) => {
      const style = injectStyle(`$css
        *:not(.${MK_BASE_CLASS}) {
          user-select: text !important;
        }
      `);

      const cleanup = state.reenable?.();
      return () => {
        style.remove();
        cleanup?.();
      };
    },
  });

  tab.append({
    id: 'fullscreen-hook',
    state: { reenable: null as (() => () => void) | null },
    setup({ state }) {
      const { disable, reenable } = mergeHookControllers(
        createEventHookGroup([
          'fullscreenchange',
          'MSFullscreenChange',
          'mozfullscreenchange',
          'webkitfullscreenchange',
        ]),
        createKeyboardShortcutHook((_, meta) => meta.key === 'f11'),
      );

      state.reenable = reenable;
      return disable;
    },
    onEnable: ({ state }) => state.reenable?.(),
  });
};
