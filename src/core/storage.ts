import { detectEnvironment, Environment } from '@/utils/base';
import type { MaybePromise } from '@/utils/type';
import { isFunction } from '@/utils/type';

const ADAPTER_MEMORY = 'memory' as const;
const ADAPTER_LOCAL_STORAGE = 'localStorage' as const;
const ADAPTER_GM = 'gm' as const;
const ADAPTER_CHROME_STORAGE = 'chrome.storage' as const;

/**
 * Shared memory storage pool to persist data across instances
 * using the same namespace during the page lifecycle.
 */
const memoryStores = new Map<string, Map<string, string>>();

const getPrefix = (namespace: string) => (namespace ? `${namespace}:` : '');

const encodeValue = (value: unknown) => JSON.stringify(value);

const decodeValue = <T>(value: string | null, fallback?: T): T | undefined => {
  if (value === null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    // Return raw string if JSON parsing fails
    return value as unknown as T;
  }
};

//#region Adapters

const createMemoryAdapter = (namespace: string): StorageAdapter => {
  if (!memoryStores.has(namespace)) {
    memoryStores.set(namespace, new Map<string, string>());
  }
  const store = memoryStores.get(namespace)!;

  return {
    backend: ADAPTER_MEMORY,
    get: (key) => store.get(key) ?? null,
    set: (key, value) => {
      store.set(key, value);
    },
    remove: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    keys: () => Array.from(store.keys()),
  };
};

const createLocalStorageAdapter = (
  namespace: string,
): StorageAdapter | null => {
  const storage = globalThis.localStorage;
  if (!storage) return null;

  const prefix = getPrefix(namespace);

  return {
    backend: ADAPTER_LOCAL_STORAGE,
    get: (key) => storage.getItem(prefix + key),
    set: (key, value) => storage.setItem(prefix + key, value),
    remove: (key) => storage.removeItem(prefix + key),
    clear: () => {
      Object.keys(storage).forEach((key) => {
        if (key.startsWith(prefix)) storage.removeItem(key);
      });
    },
    keys: () =>
      Object.keys(storage)
        .filter((key) => key.startsWith(prefix))
        .map((key) => key.slice(prefix.length)),
  };
};

/**
 * Adapter for UserScript Managers (Violentmonkey, Tampermonkey, Greasemonkey).
 * Provides cross-domain persistence.
 */
const createGmAdapter = (namespace: string): StorageAdapter | null => {
  const gm = globalThis as any;
  // Check for basic GM storage APIs
  if (!gm.GM_getValue || !gm.GM_setValue) return null;

  const prefix = getPrefix(namespace);

  return {
    backend: ADAPTER_GM,
    get: (key) => gm.GM_getValue(prefix + key, null),
    set: (key, value) => gm.GM_setValue(prefix + key, value),
    remove: (key) => gm.GM_deleteValue(prefix + key),
    clear: () => {
      // GM_listValues might not be available in all script handlers or configurations
      if (isFunction(gm.GM_listValues)) {
        gm.GM_listValues().forEach((key: string) => {
          if (key.startsWith(prefix)) gm.GM_deleteValue(key);
        });
      }
    },
    keys: () => {
      if (isFunction(gm.GM_listValues)) {
        return gm
          .GM_listValues()
          .filter((key: string) => key.startsWith(prefix))
          .map((key: string) => key.slice(prefix.length));
      }
      return [];
    },
  };
};

/**
 * Adapter for Browser Extensions (Chrome/Firefox).
 * Handles both Promise-based (Firefox) and Callback-based (Chrome) APIs.
 */
const createExtensionStorageAdapter = (
  namespace: string,
): StorageAdapter | null => {
  const storageArea =
    (globalThis as any).browser?.storage?.local ??
    (globalThis as any).chrome?.storage?.local;
  if (!storageArea) return null;

  const prefix = getPrefix(namespace);

  /**
   * Universal executor that bridges the gap between Chrome callbacks and Firefox Promises.
   */
  const exec = <T>(method: string, ...args: unknown[]): Promise<T> => {
    return new Promise((resolve, reject) => {
      try {
        const result = storageArea[method](...args, (res: T) => {
          // TODO check runtime.lastError for Chrome callback errors
          const err = (globalThis as any).chrome?.runtime?.lastError;
          if (err) return reject(err);
          resolve(res);
        });

        // Firefox returns a Promise directly
        if (result instanceof Promise) {
          result.then(resolve).catch(reject);
        }
      } catch (e) {
        reject(e);
      }
    });
  };

  return {
    backend: ADAPTER_CHROME_STORAGE,
    get: async (key) => {
      const fullKey = prefix + key;
      const res = await exec<Record<string, string>>('get', fullKey);
      return res[fullKey] ?? null;
    },
    set: async (key, value) => {
      await exec('set', { [prefix + key]: value });
    },
    remove: async (key) => {
      await exec('remove', prefix + key);
    },
    clear: async () => {
      const all = await exec<Record<string, unknown>>('get', null);
      const keysToRemove = Object.keys(all).filter((k) => k.startsWith(prefix));
      if (keysToRemove.length > 0) await exec('remove', keysToRemove);
    },
    keys: async () => {
      const all = await exec<Record<string, unknown>>('get', null);
      return Object.keys(all)
        .filter((k) => k.startsWith(prefix))
        .map((k) => k.slice(prefix.length));
    },
  };
};

const adapters = {
  [ADAPTER_GM]: createGmAdapter,
  [ADAPTER_CHROME_STORAGE]: createExtensionStorageAdapter,
  [ADAPTER_LOCAL_STORAGE]: createLocalStorageAdapter,
  [ADAPTER_MEMORY]: createMemoryAdapter,
} satisfies Record<
  StorageBackend,
  (namespace: string) => StorageAdapter | null
>;

//#endregion

/**
 * Factory to determine the best storage strategy based on environment and preference.
 */
const createStorageAdapter = (
  namespace: string,
  backend: StorageBackend | 'auto',
): StorageAdapter => {
  const env = detectEnvironment();

  // If a specific backend is requested, try it and fallback to memory
  if (backend !== 'auto') {
    return adapters[backend](namespace) ?? createMemoryAdapter(namespace);
  }

  // Priority queue for 'auto' mode based on the detected environment
  const priorityMap: Record<string, StorageBackend[]> = {
    [Environment.Tampermonkey]: [ADAPTER_GM, ADAPTER_LOCAL_STORAGE],
    [Environment.Violentmonkey]: [ADAPTER_GM, ADAPTER_LOCAL_STORAGE],
    [Environment.Greasemonkey]: [ADAPTER_GM, ADAPTER_LOCAL_STORAGE],
    [Environment.FirefoxExtension]: [
      ADAPTER_CHROME_STORAGE,
      ADAPTER_LOCAL_STORAGE,
    ],
    [Environment.ChromeExtension]: [
      ADAPTER_CHROME_STORAGE,
      ADAPTER_LOCAL_STORAGE,
    ],
    [Environment.Web]: [ADAPTER_LOCAL_STORAGE, ADAPTER_MEMORY],
  };

  const priority = priorityMap[env] ?? [ADAPTER_LOCAL_STORAGE, ADAPTER_MEMORY];

  for (const type of priority) {
    const adapter = adapters[type](namespace);
    if (adapter) return adapter;
  }

  return createMemoryAdapter(namespace);
};

//#region Public API

export const createStorage = (options: StorageOptions = {}) => {
  const namespace = options.namespace ?? '';
  const backend = options.backend ?? 'auto';
  const adapter = createStorageAdapter(namespace, backend);

  return {
    backend: adapter.backend,
    namespace,
    get: async <T = unknown>(key: string, fallback?: T) => {
      const raw = await adapter.get(key);
      return decodeValue<T>(raw, fallback);
    },
    set: async <T = unknown>(key: string, value: T) => {
      await adapter.set(key, encodeValue(value));
    },
    remove: async (key: string) => {
      await adapter.remove(key);
    },
    clear: async () => {
      await adapter.clear();
    },
    keys: async () => {
      return await adapter.keys();
    },
  };
};

/**
 * Default storage instance with 'auto' backend and no namespace.
 */
export const storage = createStorage();

//#region Types

export type StorageBackend =
  | 'gm'
  | 'chrome.storage'
  | 'localStorage'
  | 'memory';

export interface StorageOptions {
  namespace?: string;
  backend?: StorageBackend | 'auto';
}

export interface StorageAdapter {
  backend: StorageBackend;
  get(key: string): MaybePromise<string | null>;
  set(key: string, value: string): MaybePromise<void>;
  remove(key: string): MaybePromise<void>;
  clear(): MaybePromise<void>;
  keys(): MaybePromise<string[]>;
}
