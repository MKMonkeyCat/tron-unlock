import { win } from '@/utils/dom/element';
import { isFunction, isObject } from '@/utils/type';

import type { MergedHookController } from './base';
import { mergeHookControllers } from './base';
import { createKeyboardShortcutHook, initializeEventHooks } from './event-hook';
import { bound, type HookController, hookManager } from './function-hook';

export interface DisableDevToolDetectorCustomOptions {
  clearConsoleOnDetect?: boolean;
  maxFakeDuration?: number;
  maxSize?: number;
}

export const setupDisableDevToolDetector = (
  options?: DisableDevToolDetectorCustomOptions,
): MergedHookController => {
  initializeEventHooks();

  const MAX_SIZE = options?.maxSize ?? 5;
  const lastLogs = new WeakMap<object, number>();
  const LOG_INTERVAL = 300;

  //#region DevTools shortcut key event hook
  const installDevToolsShortcutSkip = (): HookController | null => {
    return createKeyboardShortcutHook((event, { key }) => {
      if (key === 'f12') return true;

      return (
        ((event.ctrlKey && event.shiftKey) ||
          (event.metaKey && event.altKey)) &&
        'ijc'.includes(key) // i for devtools, j for js profiler, c for element picker
      );
    });
  };

  const devToolsShortcutSkipController = installDevToolsShortcutSkip();

  //#region Console method hooks to bypass console log tampering and suppress repeated logs

  const toStringModifiedCache = new WeakMap<object, boolean>();

  const isToStringModified = (obj: any): boolean => {
    if (!obj || (typeof obj !== 'object' && !isFunction(obj))) {
      return false;
    }

    const cached = toStringModifiedCache.get(obj);
    if (cached !== undefined) return cached;

    try {
      const fn = obj?.toString;
      if (!isFunction(fn)) return false;

      const src = bound.Function.prototype.toString.call(fn);

      // for fast check, we can just check some specific characters in the stringified function
      // or `const modified = !src.includes('[native code]');` ?
      const modified =
        src.charAt(0) !== 'f' ||
        src.charAt(9) !== 'o' ||
        src.indexOf('[native code]') === -1;

      toStringModifiedCache.set(obj, modified);

      return modified;
    } catch {
      return true;
    }
  };

  const limitArg = (arg: any) => {
    if (arg === null || arg === undefined) return arg;

    if (Array.isArray(arg)) {
      return arg.length > MAX_SIZE ? arg.slice(0, MAX_SIZE) : arg;
    }

    if (isObject(arg)) {
      const limited: Record<string, any> = {};
      let count = 0;
      for (const k in arg) {
        if (!Object.prototype.hasOwnProperty.call(arg, k)) continue;
        if (++count <= MAX_SIZE) {
          limited[k] = (arg as Record<string, unknown>)[k];
        } else break;
      }

      return count > MAX_SIZE ? limited : arg;
    }

    return arg;
  };

  const logHookController = hookManager.register(
    win.console,
    'log',
    function (originalConsole, ...args) {
      const obj = args[0];
      if (
        obj instanceof HTMLElement &&
        bound.Object.prototype.hasOwnProperty.call(obj, 'id')
      ) {
        return originalConsole.call(this, ...args);
      }

      if (
        (obj instanceof Date ||
          obj instanceof RegExp ||
          obj instanceof Function) &&
        isToStringModified(obj)
      ) {
        return originalConsole.call(this, ...args);
      }

      const now = performance.now();
      if (isObject(obj)) {
        const last = lastLogs.get(obj);
        if (last && now - last < LOG_INTERVAL) {
          return originalConsole.call(this, '[Repeated log suppressed]');
        }

        lastLogs.set(obj, now);
      }

      const processedArgs = args.map((arg) => {
        // if (isToStringModified(arg)) return arg;
        return limitArg(arg);
      });

      return originalConsole.call(this, ...processedArgs);
    },
  );

  const tableHookController = hookManager.register(
    win.console,
    'table',
    function (originalConsole, obj: Record<PropertyKey, any>, ...args: any[]) {
      const now = performance.now();
      const shouldSuppress = (val: any): boolean => {
        if (isObject(val)) {
          const last = lastLogs.get(val);
          if (last && now - last < LOG_INTERVAL) return true;
          lastLogs.set(val, now);
        }
        return false;
      };

      if (shouldSuppress(obj)) {
        return originalConsole.call(
          this,
          '[Repeated table suppressed]',
          ...args,
        );
      }

      if (Array.isArray(obj)) {
        const filtered = obj.map((el) =>
          shouldSuppress(el) ? '[Repeated item suppressed]' : limitArg(el),
        );
        return originalConsole.call(this, filtered.slice(0, MAX_SIZE), ...args);
      }

      if (isObject(obj)) {
        const limited: Record<string, any> = {};

        let count = 0;
        for (const key in obj) {
          if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
          const val = obj[key];
          limited[key] = shouldSuppress(val)
            ? '[Repeated item suppressed]'
            : val;
          if (++count >= MAX_SIZE) break;
        }

        return originalConsole.call(this, limited, ...args);
      }

      return originalConsole.call(this, obj, ...args);
    },
  );

  const clearHookController = hookManager.register(
    win.console,
    'clear',
    function (originalConsole) {
      if (options?.clearConsoleOnDetect) {
        return originalConsole.call(this);
      }
    },
  );

  //#region Function constructor hook to bypass function toString tampering

  const functionConstructorHookController = hookManager.register(
    Function.prototype as unknown as {
      constructor: (this: Function, ...args: string[]) => Function;
    },
    'constructor',
    function (originalConstructor, ...args) {
      const code = args.at(-1) as string;

      if (code.replace(/\s|;/g, '').includes('debugger')) {
        return bound.Reflect.apply(originalConstructor, this, [
          ...args.slice(0, -1),
          code.replace(/debugger;?/g, '/* bypassed */'),
        ]);
      }

      return bound.Reflect.apply(originalConstructor, this, args);
    },
  );

  //#region Timing manipulation hooks

  let previousDateTime = win.Date.now();
  const dateNowController = hookManager.register(
    win.Date,
    'now',
    function (originalDateNow) {
      const actualTime = originalDateNow.call(win.Date);
      if (actualTime - previousDateTime > 100) {
        previousDateTime += 16;
        return previousDateTime;
      }
      previousDateTime = actualTime;
      return actualTime;
    },
  );

  //#region Performance.now hook

  let previousPerformanceTime = win.performance.now();
  const performanceNowController = hookManager.register(
    win.performance,
    'now',
    function (originalNow) {
      const actualTime = originalNow.call(win.performance);

      if (actualTime - previousPerformanceTime > 100) {
        previousPerformanceTime += 16;
        return previousPerformanceTime;
      }

      previousPerformanceTime = actualTime;
      return actualTime;
    },
  );

  const handles = [
    logHookController,
    tableHookController,
    clearHookController,
    functionConstructorHookController,
    performanceNowController,
    dateNowController,
  ] satisfies HookController[];

  if (devToolsShortcutSkipController) {
    handles.push(devToolsShortcutSkipController);
  }

  return mergeHookControllers(...handles);
};
