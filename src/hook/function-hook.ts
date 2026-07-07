import type { WinType } from '@/utils/dom/element';
import { win } from '@/utils/dom/element';

const targets = [
  'Object',
  'Function',
  'Symbol',
  'Reflect',
  'performance',
  'setTimeout',
  'Proxy',
] as const;

type TargetName = (typeof targets)[number];
type TargetMap = { [K in TargetName]: WinType[K] };

export const original = {} as TargetMap;
export const bound = {} as TargetMap;

const BINDABLE_TYPES = new Set(['object', 'function']);

for (const target of targets) {
  const source = win[target];
  (original as Record<TargetName, unknown>)[target] = source;
  if (source !== null && BINDABLE_TYPES.has(typeof source)) {
    const objBound = Object.create(Object.getPrototypeOf(source));
    for (const key of Reflect.ownKeys(source)) {
      const descriptor = Object.getOwnPropertyDescriptor(source, key);
      if (!descriptor) continue;

      const cloned = { ...descriptor };
      if ('value' in cloned && typeof cloned.value === 'function') {
        cloned.value = cloned.value.bind(source);
      }

      Object.defineProperty(objBound, key, cloned);
    }

    bound[target] = objBound;
  } else (bound as Record<TargetName, unknown>)[target] = source;
}

type AnyFn = (...args: any[]) => unknown;

type MethodKeys<T> = {
  [K in keyof T]: T[K] extends AnyFn ? K : never;
}[keyof T];

export class FunctionHookManager {
  #hooks = new Set<HookState<object, AnyFn>>();
  #map = new WeakMap<object, Map<PropertyKey, HookState<object, AnyFn>[]>>();

  register<
    T extends object,
    K extends MethodKeys<T>,
    F extends Extract<T[K], AnyFn>,
  >(
    targetObj: T,
    propName: K,
    interceptor: (
      this: T,
      originalFn: F,
      ...args: Parameters<F>
    ) => ReturnType<F>,
    options: FunctionHookManagerOptions = {},
  ): HookController {
    const { forceLock = false } = options;

    let propMap = this.#map.get(targetObj);
    if (!propMap) {
      propMap = new Map();
      this.#map.set(targetObj, propMap);
    }

    let hookList = propMap.get(propName);
    if (!hookList) {
      hookList = [];
      propMap.set(propName, hookList);
    }

    const isFirstHook = !hookList || hookList.length === 0;
    const originalFn = (
      isFirstHook ? targetObj[propName] : hookList[0].original
    ) as F;

    const state: HookState<T, F> = {
      target: targetObj,
      prop: propName,
      original: originalFn,
      interceptor: interceptor as AnyFn,
      active: true,
    };

    hookList.push(state);
    this.#hooks.add(state);

    if (isFirstHook) {
      const reflectApply = bound.Reflect.apply;
      const proxy = new original.Proxy(originalFn, {
        apply(_target, thisArg, args) {
          const currentHooks = propMap!.get(propName) || [];
          const activeHooks = currentHooks.filter((h) => h.active);
          if (activeHooks.length === 0) {
            return reflectApply(originalFn, thisArg, args);
          }

          let index = 0;
          const runner = function (
            this: unknown,
            ...currentArgs: unknown[]
          ): unknown {
            if (index >= activeHooks.length) {
              return reflectApply(originalFn, thisArg, currentArgs);
            }

            const currentHook = activeHooks[index++];
            return currentHook.interceptor.call(
              thisArg,
              runner,
              ...currentArgs,
            );
          };

          return runner(...args);
        },
        construct(target, args, newTarget) {
          return bound.Reflect.construct(target, args, newTarget);
        },
        get(target, key, receiver) {
          if (key === 'toString') {
            return () => {
              return bound.Reflect.apply(
                bound.Function.prototype.toString,
                originalFn,
                [],
              );
            };
          }

          return bound.Reflect.get(target, key, receiver);
        },
      });

      if (forceLock) {
        try {
          Object.defineProperty(targetObj, propName, {
            value: proxy,
            writable: false,
            configurable: false,
            enumerable: true,
          });
        } catch {
          targetObj[propName] = proxy;
        }
      } else targetObj[propName] = proxy;
    }

    return {
      enable: () => (state.active = true),
      disable: () => (state.active = false),
      isActive: () => state.active,
      remove: () => {
        this.#hooks.delete(state);

        const list = propMap!.get(propName);
        if (list) {
          const idx = list.indexOf(state);
          if (idx !== -1) list.splice(idx, 1);

          if (list.length === 0) {
            try {
              targetObj[propName] = originalFn;
            } catch {}
            propMap!.delete(propName);
          }
        }
      },
    };
  }

  clear() {
    for (const state of this.#hooks) {
      this.removeState(state);
    }
    this.#hooks.clear();
  }

  private removeState(state: HookState<object, AnyFn>) {
    const propMap = this.#map.get(state.target);
    if (propMap) {
      const list = propMap.get(state.prop);
      if (list) {
        const idx = list.indexOf(state);
        if (idx !== -1) list.splice(idx, 1);
        if (list.length === 0) {
          try {
            state.target[state.prop as keyof object] = state.original as never;
          } catch {}
          propMap.delete(state.prop);
        }
      }
    }
  }
}

export const hookManager = new FunctionHookManager();

export interface HookController {
  enable(): void;
  disable(): void;
  isActive(): boolean;
  remove(): void;
}

interface HookState<T extends object = object, F extends AnyFn = AnyFn> {
  target: T;
  prop: PropertyKey;
  original: F;
  interceptor: AnyFn;
  active: boolean;
}

export interface FunctionHookManagerOptions {
  forceLock?: boolean;
}
