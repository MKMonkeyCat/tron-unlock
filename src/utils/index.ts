export const deepMerge = <
  T extends Record<string, any>,
  O extends Record<string, any> = Partial<T>
>(
  base: T,
  override: O
): T => {
  const result: T = { ...base };
  for (const key in override) {
    const value = override[key];
    if (
      value && // check for null/undefined
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof base[key] === 'object' &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMerge(base[key], value);
    } else if (value !== undefined) {
      result[key] = value as T[typeof key];
    }
  }
  return result;
};

export type SkipHookFn<Args extends unknown[], R> = ((...args: Args) => R) & {
  __skipMKHook?: boolean;
};

export const isHookSkipped = <Args extends unknown[], R>(
  func: (...args: Args) => R
): func is SkipHookFn<Args, R> => {
  return '__skipMKHook' in func && func.__skipMKHook === true;
};

export const skipHookFunc = <Args extends unknown[], R>(
  func: (...args: Args) => R
): SkipHookFn<Args, R> => {
  (func as SkipHookFn<Args, R>).__skipMKHook = true;
  return func;
};

export const poll = <T = boolean>(
  conditionFunc: () => { value: T } | Error | undefined,
  timeout: number = 5000,
  interval: number = 50
): Promise<T> => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = Math.floor(timeout / interval);

    const check = () => {
      const result = conditionFunc();
      if (result instanceof Error) {
        reject(result);
        return;
      }

      if (result !== undefined) {
        resolve(result.value);
        return;
      }

      if (attempts >= maxAttempts) {
        reject(new Error(`poll: timeout exceeded after ${timeout}ms`));
        return;
      }

      attempts++;
      setTimeout(check, interval);
    };

    check();
  });
};

export const dynamicElementWatcher = (el: HTMLElement, abort: () => void) => {
  const mo = new MutationObserver(() => {
    if (!el.isConnected) {
      abort();
      mo.disconnect();
    }
  });

  mo.observe(document.body, { childList: true, subtree: true });

  return () => mo.disconnect();
};
