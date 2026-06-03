import { setHiddenProperty } from '@/utils/base';

const SKIP_HOOK_SYMBOL = Symbol.for('feature-plugin.skip-hook');

export type HookSkippableFunction<
  Args extends unknown[] = unknown[],
  R = unknown,
> = ((...args: Args) => R) & { [SKIP_HOOK_SYMBOL]?: true };

export const skipHookFunc = <Args extends unknown[], R>(
  fn: (...args: Args) => R,
): HookSkippableFunction<Args, R> => {
  setHiddenProperty(fn, SKIP_HOOK_SYMBOL, true);
  return fn as HookSkippableFunction<Args, R>;
};

export const isHookSkipped = <Args extends unknown[], R>(
  fn: (...args: Args) => R,
): fn is HookSkippableFunction<Args, R> => {
  return (fn as HookSkippableFunction<Args, R>)[SKIP_HOOK_SYMBOL] === true;
};
