import { I18nManager } from '@/utils';

import { LifecycleManager } from './lifecycle-manager';
import { PluginRegistry } from './registry';
import type { BaseStateType, PluginDefinition, PluginID } from './types';

export interface PluginGroupIDMap {
  [key: PluginID]: PluginID;
}

export interface PluginIDMap {
  [group: string]: PluginGroupIDMap;
}

export type PluginIDs<IDMap extends PluginIDMap> = {
  [K in keyof IDMap]: `${K & string}.${IDMap[K][keyof IDMap[K]] & string}`;
}[keyof IDMap];

export class PluginSystem<
  IDMap extends PluginIDMap = PluginIDMap,
  T extends BaseStateType = BaseStateType,
  IDs extends PluginIDs<IDMap> = PluginIDs<IDMap>,
> {
  public i18n: I18nManager;
  readonly #registry: PluginRegistry<T>;
  readonly #manager: LifecycleManager<T>;

  constructor(i18n?: I18nManager) {
    this.#registry = new PluginRegistry<T>();
    this.#manager = new LifecycleManager<T>(this.#registry);
    this.i18n = i18n ?? new I18nManager();
  }

  async initialize(config: readonly PluginDefinition<T>[]) {
    this.#registry.register(config);

    await this.#manager.syncAll();

    this.#setupRouteListener();
  }

  async toggle(id: IDs, force?: boolean) {
    const target = this.#registry.nodes.get(id);
    if (!target) {
      throw new Error(`Unknown plugin id: ${id}`);
    }

    target.enabled = force ?? !target.enabled;
    await this.#manager.syncAll();
  }

  getStatus(id: IDs) {
    return this.#manager.getStatus(id);
  }

  isEnabled(id: IDs) {
    return this.#registry.nodes.get(id)?.enabled ?? false;
  }

  #setupRouteListener() {
    window.addEventListener('popstate', () => {
      void this.#manager.syncAll();
    });
  }
}
