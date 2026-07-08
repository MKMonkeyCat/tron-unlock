import { skipHookFunc } from '@/hook';
import { bound, hookManager } from '@/hook/function-hook';
import { win } from '@/utils/dom/element';

import type { FeatureRegistry } from './index';
import type {
  AnyFeature,
  CleanupFn,
  ConfigData,
  FeatureContext,
  FeatureId,
  FeatureSnapshot,
  RouteSnapshot,
} from './types';
import { createEventBus } from '../event-bus';

export interface FeatureChangeEvent {
  id: FeatureId;
}

export const getRouteSnapshot = (): RouteSnapshot => ({
  href: win.location.href,
  pathname: win.location.pathname,
  search: win.location.search,
  hash: win.location.hash,
});

export class FeatureManager {
  #cleanups = new Map<string, CleanupFn>();
  #running = new Set<FeatureId>();
  #states = new Map<string, any>();
  #configs = new Map<string, any>();
  #overrides = new Map<FeatureId, boolean>();
  #lastRoute: RouteSnapshot | null = null;
  #bus = createEventBus<FeatureChangeEvent>();

  constructor(private registry: FeatureRegistry) {}

  async setupWatcher() {
    const notify = skipHookFunc(() => this.update(getRouteSnapshot()));

    const patchHistoryMethod = (key: 'pushState' | 'replaceState') => {
      hookManager.register(
        win.history,
        key,
        async function (original, ...args) {
          const result = bound.Reflect.apply(original, this, args);
          await notify();
          return result;
        },
      );
    };

    patchHistoryMethod('pushState');
    patchHistoryMethod('replaceState');

    win.addEventListener('popstate', notify);
    win.addEventListener('hashchange', notify);

    await notify();
  }

  onChange(listener: (event: FeatureChangeEvent) => void) {
    return this.#bus.on(listener);
  }

  getSnapshot(): FeatureSnapshot[] {
    return this.registry.getAll().map((feature) => ({
      id: feature.id,
      category: feature.category,
      group: feature.group,
      enabled: this.#overrides.get(feature.id) ?? this.#running.has(feature.id),
      config: this.#configs.get(feature.id) ?? feature.defaultConfig ?? {},
      fields: feature.fields ?? [],
    }));
  }

  async setEnabled(id: FeatureId, enabled: boolean | null) {
    if (enabled === null) this.#overrides.delete(id);
    else this.#overrides.set(id, enabled);

    const feature = this.registry.get(id);
    const changed = feature ? await this.#syncFeature(feature) : false;

    if (changed) this.#bus.emit({ id });
  }

  async setConfig(id: FeatureId, patch: Partial<ConfigData>) {
    const feature = this.registry.get(id);
    if (!feature) return;

    const oldConfig = this.#configs.get(id) ?? feature.defaultConfig ?? {};
    const nextConfig = { ...oldConfig, ...patch };
    this.#configs.set(id, nextConfig);

    if (this.#lastRoute) {
      const context = this.#createContext(feature, this.#lastRoute);
      feature.onConfigChange?.(context, oldConfig);
    }

    this.#bus.emit({ id });
  }

  async update(currentRoute: RouteSnapshot) {
    this.#lastRoute = currentRoute;

    for (const feature of this.registry.getAll()) {
      const changed = await this.#syncFeature(feature);
      if (changed) this.#bus.emit({ id: feature.id });
    }
  }

  /** Returns whether the feature's running state actually flipped. */
  async #syncFeature(feature: AnyFeature): Promise<boolean> {
    if (!this.#lastRoute) return false;

    const context = this.#createContext(feature, this.#lastRoute);

    const shouldEnable = await this.#matchRoute(
      feature,
      context,
      this.#lastRoute,
    );
    const isRunning = this.#running.has(feature.id);

    if (shouldEnable && !isRunning) {
      await this.enableFeature(feature, context);
      return true;
    } else if (!shouldEnable && isRunning) {
      await this.disableFeature(feature, context);
      return true;
    }

    return false;
  }

  async enableFeature(
    feature: AnyFeature,
    context: FeatureContext<any, any, any>,
  ) {
    if (feature.setup) {
      const cleanup = await feature.setup(context, true);
      if (cleanup) this.#cleanups.set(feature.id, cleanup);
    }

    const lifecycleCleanup = feature.onEnable?.(context);
    if (lifecycleCleanup && !this.#cleanups.has(feature.id)) {
      this.#cleanups.set(feature.id, lifecycleCleanup);
    }

    this.#running.add(feature.id);
    feature.onToggle?.(context, true);
  }

  async disableFeature(
    feature: AnyFeature,
    context: FeatureContext<any, any, any>,
  ) {
    const cleanup = this.#cleanups.get(feature.id);
    if (cleanup) {
      cleanup(context);
      this.#cleanups.delete(feature.id);
    }

    this.#running.delete(feature.id);
    feature.onDisable?.(context);
    feature.onToggle?.(context, false);
  }

  #createContext(
    feature: AnyFeature,
    route: RouteSnapshot,
  ): FeatureContext<any, any, any> {
    return {
      state: this.#states.get(feature.id) || feature.state || {},
      config: this.#configs.get(feature.id) || feature.defaultConfig || {},
      route,
      i18n: this.registry.i18n.getGroupI18nContext(
        feature.category,
        feature.group,
      ),
      i18nCategory: this.registry.i18n.getCategoryI18nContext(feature.category),
    };
  }

  async #matchRoute(
    feature: AnyFeature,
    context: FeatureContext<any, any, any>,
    route: RouteSnapshot,
  ): Promise<boolean> {
    if (this.#overrides.has(feature.id)) {
      return this.#overrides.get(feature.id)!;
    }

    const test = feature.test;

    if (test === route.pathname) return true;
    if ((test ?? true) === true) return true;
    if (test === false) return false;
    if (test instanceof RegExp) return test.test(route.pathname);
    if (typeof test === 'function') return await test(context, route);

    return false;
  }
}
