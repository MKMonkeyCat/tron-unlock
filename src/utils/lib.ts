import type { WinType } from './dom';
import { win } from './dom';

const libCache = new Map<keyof WinType, WinType[keyof WinType]>();

export const WAIT_FOR_LIB_DEFAULT_OPTIONS = {
  timeout: 60_000, // 60s
  interval: 50, // 50ms
} as const;

type WaitForLibOptions = Partial<typeof WAIT_FOR_LIB_DEFAULT_OPTIONS> & {
  predicate?: (lib: any) => boolean;
};

export const waitForAnyLib = <K extends keyof WinType>(
  libName: K,
  options: WaitForLibOptions = {},
): Promise<NonNullable<WinType[K]>> => {
  const timeout = options.timeout ?? WAIT_FOR_LIB_DEFAULT_OPTIONS.timeout;
  // eslint-disable-next-line eqeqeq
  const predicate = options.predicate ?? ((lib) => lib != null);

  return new Promise((resolve, reject) => {
    const start = Date.now();
    let done = false;

    const timer = setInterval(() => {
      if (done) return;

      const lib = win[libName];
      if (predicate(lib)) {
        done = true;
        clearInterval(timer);
        resolve(lib);
        return;
      }

      if (Date.now() - start > timeout) {
        done = true;
        clearInterval(timer);
        reject(new Error(`waitForAnyLib timeout: ${String(libName)}`));
      }
    }, options.timeout ?? WAIT_FOR_LIB_DEFAULT_OPTIONS.timeout);
  });
};

export const loadLibraryWithCache = async <K extends keyof WinType>(
  libName: K,
  options: WaitForLibOptions = {},
): Promise<NonNullable<WinType[K]>> => {
  if (libCache.has(libName)) return libCache.get(libName);

  const lib = await waitForAnyLib(libName, options);
  libCache.set(libName, lib);
  return lib;
};

const baseLibPredicate = (lib: any): boolean =>
  typeof lib === 'function' || (typeof lib === 'object' && lib !== null);

export const jQuery = loadLibraryWithCache('jQuery', {
  predicate: baseLibPredicate,
});
export const angular = loadLibraryWithCache('angular', {
  predicate: baseLibPredicate,
});
