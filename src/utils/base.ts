//#region Environment Detection

import { bound } from '@/hook/function-hook';

import { isFunction } from './type';

export const Environment = {
  Web: 'web',
  ChromeExtension: 'chrome-extension',
  FirefoxExtension: 'firefox-extension',
  Tampermonkey: 'tampermonkey',
  Greasemonkey: 'greasemonkey',
  Violentmonkey: 'violentmonkey',
} as const;
export type Environment = (typeof Environment)[keyof typeof Environment];

const detectEnvironment = (): Environment => {
  const global = globalThis as typeof globalThis & {
    unsafeWindow?: typeof globalThis;
    GM_info?: { scriptHandler: string };
    browser?: { runtime?: { getBrowserInfo?: Function } };
    chrome?: { runtime?: { getManifest?: Function } };
  };

  if (
    typeof global.unsafeWindow !== 'undefined' &&
    typeof global.GM_info !== 'undefined'
  ) {
    const handler = global.GM_info.scriptHandler;
    if (handler === 'Greasemonkey') return Environment.Greasemonkey;
    if (handler === 'Violentmonkey') return Environment.Violentmonkey;
    if (handler === 'Tampermonkey') return Environment.Tampermonkey;

    return Environment.Tampermonkey;
  }

  if (isFunction(global.browser?.runtime?.getBrowserInfo)) {
    return Environment.FirefoxExtension;
  }

  if (isFunction(global.chrome?.runtime?.getManifest)) {
    return Environment.ChromeExtension;
  }

  return Environment.Web;
};

export const ENV = detectEnvironment();

export const isScriptManager = (): boolean => {
  return (
    [
      Environment.Greasemonkey,
      Environment.Tampermonkey,
      Environment.Violentmonkey,
    ] as Environment[]
  ).includes(ENV);
};

//#region Hidden Property Utility

type SetHiddenPropertyFn = <T extends object, K extends PropertyKey, V>(
  obj: T,
  prop: K,
  value: V,
) => asserts obj is T & Record<K, V>;
export const setHiddenProperty: SetHiddenPropertyFn = (obj, prop, value) => {
  bound.Object.defineProperty(obj, prop, {
    value,
    writable: true,
    configurable: false,
    enumerable: false,
  });
};

// export type SupportedPlatform = 'mac' | 'windows';

// let uaPlatform: SupportedPlatform | null = null;
// export const getPlatform = (): SupportedPlatform => {
//   if (uaPlatform) return uaPlatform;

//   const ua = globalThis.navigator?.userAgent?.toLowerCase() ?? '';
//   uaPlatform = ua.includes('mac') ? 'mac' : 'windows';
//   return uaPlatform;
// };
