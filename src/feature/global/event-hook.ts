import { MK_BASE_CLASS } from '@/constants';
import type { HookController } from '@/hook';
import {
  createEventHookGroup,
  createKeyboardShortcutHook,
  mergeHookControllers,
  setupDisableDevToolDetector,
  skipHookFunc,
} from '@/hook';
import type { PluginGroupIDMap } from '@/plugin';
import { definePlugin } from '@/plugin';
import { doc, injectStyle, jQuery, win } from '@/utils';

import { createHumanLikePointerBehavior } from './level-detector';

export const GlobalEventHookPluginId = {
  BlurHook: 'blur-hook',
  DevtoolHook: 'devtool-hook',
  IdleCheckerHook: 'idle-checker-hook',
  CopyPasteCutHook: 'copy-paste-cut-hook',
  FullscreenHook: 'fullscreen-hook',
} as const satisfies PluginGroupIDMap;

export const createGlobalEventHookPlugins = () => [
  definePlugin({
    id: GlobalEventHookPluginId.BlurHook,
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
    enable: ({ state }) => state.reenable?.(),
  }),
  definePlugin({
    id: GlobalEventHookPluginId.DevtoolHook,
    state: { controller: null as HookController | null },
    setup({ state }, value) {
      state.controller = setupDisableDevToolDetector();
      if (value) state.controller.enable();
      else state.controller.disable();
    },
    async toggle({ state }, value) {
      const controller = state.controller;
      if (!controller) return;

      if (value) controller.enable();
      else controller.disable();
    },
  }),
  definePlugin({
    id: GlobalEventHookPluginId.IdleCheckerHook,
    state: {
      showIdleWarning: undefined as boolean | undefined,
      enableIdleWarning: undefined as boolean | undefined,
    },
    enable({ state }) {
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
  }),
  definePlugin({
    id: GlobalEventHookPluginId.CopyPasteCutHook,
    state: { reenable: null as (() => () => void) | null },
    setup({ state }) {
      const { disable, reenable } = mergeHookControllers(
        createEventHookGroup([
          'copy',
          'selectstart',
          'cut',
          'paste',
          'contextmenu',
        ]),
        createKeyboardShortcutHook((_, meta) => {
          // ctrl/cmd + c/v/x
          return meta.isMod && 'cvx'.includes(meta.key);
        }),
      );
      state.reenable = reenable;
      return disable;
    },
    enable: ({ state }) => {
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
  }),
  definePlugin({
    id: GlobalEventHookPluginId.FullscreenHook,
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
    enable: ({ state }) => state.reenable?.(),
  }),
];
