import { isFunction, isObject } from '@/utils/type';

import { type HookController, hookManager } from './function-hook';
import { isHookSkipped } from './skip';
import type {
  EventHookOptions,
  EventHookPreCallContext,
  EventHookPreHookContext,
} from './types';

const eventHookRegistry = new Map<string, Set<EventHookItem>>();
const wrappedListenerMap = new WeakMap<
  EventTarget,
  Map<
    EventListenerOrEventListenerObject,
    Map<string, Map<boolean, EventListener>>
  >
>();

let eventHooksInstalled = false;
let addEventListenerHookController: { remove: () => void } | null = null;
let removeEventListenerHookController: { remove: () => void } | null = null;

const getListenerCallable = (
  listener: EventListenerOrEventListenerObject,
): ((ev: Event) => void) | null => {
  if (isFunction(listener)) return listener;

  if (isObject(listener)) {
    const candidate = listener.handleEvent;
    if (isFunction(candidate)) {
      return (ev: Event) => {
        candidate.call(listener, ev);
      };
    }
  }

  return null;
};

const shouldSkipListenerHook = (
  listener: EventListenerOrEventListenerObject,
): boolean => {
  if (isFunction(listener)) return isHookSkipped(listener);

  if (isObject(listener)) {
    const candidate = listener.handleEvent;
    if (isFunction(candidate)) {
      return isHookSkipped(candidate);
    }
  }

  return false;
};

const getCaptureFlag = (
  options: boolean | AddEventListenerOptions | undefined,
): boolean => {
  if (typeof options === 'boolean') return options;
  return options?.capture ?? false;
};

const getTargetListenerMap = (target: EventTarget) => {
  const perTarget = wrappedListenerMap.get(target) ?? new Map();
  wrappedListenerMap.set(target, perTarget);
  return perTarget;
};

const getActiveEventHooks = (type: string): EventHookItem[] => {
  const set = eventHookRegistry.get(type);
  if (!set || set.size === 0) return [];

  return [...set].filter((item) => item.enabled);
};

export const initializeEventHooks = (): boolean => {
  if (eventHooksInstalled) return true;

  const maybeEventTarget = globalThis.EventTarget;
  if (!maybeEventTarget?.prototype) {
    return false;
  }

  addEventListenerHookController = hookManager.register(
    maybeEventTarget.prototype,
    'addEventListener',
    function (this: EventTarget, original, type, listener, options) {
      if (!listener || shouldSkipListenerHook(listener)) {
        return original.call(this, type, listener, options);
      }

      const activeHooks = getActiveEventHooks(type);
      if (activeHooks.length === 0) {
        return original.call(this, type, listener, options);
      }

      const preHookContext: EventHookPreHookContext = {
        type,
        target: this,
        listener,
        options,
      };

      if (
        activeHooks.some(
          (hook) => hook.preHookCheck?.(preHookContext) === false,
        )
      ) {
        return original.call(this, type, listener, options);
      }

      const listenerCallable = getListenerCallable(listener);
      if (!listenerCallable) {
        return original.call(this, type, listener, options);
      }

      const wrapped: EventListener = (event) => {
        const currentHooks = getActiveEventHooks(type);
        if (currentHooks.length === 0) {
          listenerCallable.call(this, event);
          return;
        }

        const preCallContext: EventHookPreCallContext = {
          type,
          target: this,
          event,
          listener,
        };

        // A hook with no `preCallCheck` blocks every listener of this event
        // type unconditionally (used by hooks like copy/paste or fullscreen
        // that always want to suppress the event, not just conditionally).
        const shouldBlock = currentHooks.some(
          (hook) => (hook.preCallCheck?.(preCallContext) ?? true) === true,
        );

        if (!shouldBlock) {
          listenerCallable.call(this, event);
        }
      };

      console.log(this);

      const capture = getCaptureFlag(options);
      const listenerKey = `${type}`;
      const perTarget = getTargetListenerMap(this);
      const perListener = perTarget.get(listener) ?? new Map();
      const perType = perListener.get(listenerKey) ?? new Map();

      perType.set(capture, wrapped);
      perListener.set(listenerKey, perType);
      perTarget.set(listener, perListener);

      return original.call(this, type, wrapped, options);
    },
  );

  removeEventListenerHookController = hookManager.register(
    maybeEventTarget.prototype,
    'removeEventListener',
    function (this: EventTarget, original, type, listener, options) {
      if (!listener) {
        return original.call(this, type, listener, options);
      }

      const capture = getCaptureFlag(options);
      const wrapped = wrappedListenerMap
        .get(this)
        ?.get(listener)
        ?.get(`${type}`)
        ?.get(capture);
      return original.call(this, type, wrapped ?? listener, options);
    },
  );

  eventHooksInstalled = true;
  return true;
};

export const uninstallEventHooks = (): void => {
  if (!eventHooksInstalled) {
    return;
  }

  addEventListenerHookController?.remove();
  removeEventListenerHookController?.remove();

  addEventListenerHookController = null;
  removeEventListenerHookController = null;
  eventHooksInstalled = false;
};

export const registerEventHook = (
  type: string,
  options: EventHookOptions = {},
): HookController => {
  const item: EventHookItem = { ...options, enabled: true };

  const set = eventHookRegistry.get(type) ?? new Set<EventHookItem>();
  set.add(item);
  eventHookRegistry.set(type, set);

  return {
    enable: () => {
      item.enabled = true;
    },
    disable: () => {
      item.enabled = false;
    },
    isActive: () => item.enabled,
    remove: () => {
      set.delete(item);
      if (set.size === 0) eventHookRegistry.delete(type);
    },
  };
};

export const createEventHookGroup = (
  events: readonly EventKeys[],
  options: EventHookOptions = {},
): HookController => {
  const controllers = events.map((eventType) =>
    registerEventHook(eventType, options),
  );

  return {
    enable: () => {
      controllers.forEach((controller) => controller.enable());
    },
    disable: () => {
      controllers.forEach((controller) => controller.disable());
    },
    isActive: () => controllers.some((controller) => controller.isActive()),
    remove: () => {
      controllers.forEach((controller) => controller.remove());
    },
  };
};

export const createKeyboardShortcutHook = (
  shouldBlock: (event: KeyboardEvent, meta: ShortcutMeta) => boolean,
) =>
  createEventHookGroup(['keydown', 'keyup', 'keypress'], {
    preCallCheck({ event }) {
      if (!(event instanceof KeyboardEvent)) return false;

      return shouldBlock(event, {
        isMod: event.ctrlKey || event.metaKey,
        key: event.key.toLowerCase(),
      });
    },
  });

export const registerTypedEventHook = <
  TType extends EventKeys,
  TEvent extends Event = Event,
  TTarget extends EventTarget = EventTarget,
>(
  type: TType,
  options: EventHookOptions<TEvent, TType, TTarget> = {},
): HookController => {
  return registerEventHook(type, options as EventHookOptions);
};

export const createTypedEventHookGroup = <
  TType extends EventKeys,
  TEvent extends Event = Event,
  TTarget extends EventTarget = EventTarget,
>(
  events: readonly TType[],
  options: EventHookOptions<TEvent, TType, TTarget> = {},
): HookController => {
  return createEventHookGroup(events, options as EventHookOptions);
};

interface EventHookItem<
  TEvent extends Event = Event,
  TType extends EventKeys = EventKeys,
  TTarget extends EventTarget = EventTarget,
> extends EventHookOptions<TEvent, TType, TTarget> {
  enabled: boolean;
}

export interface ShortcutMeta {
  isMod: boolean;
  key: string;
}

export type EventKeys =
  | keyof DocumentEventMap
  | keyof WindowEventMap
  | keyof HTMLElementEventMap
  | (string & {});
