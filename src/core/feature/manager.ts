import type { FeatureRegistry } from './index';
import type {
  AnyFeature,
  CleanupFn,
  FeatureContext,
  RouteSnapshot,
} from './types';

export class FeatureManager {
  #cleanups = new Map<string, CleanupFn>();
  #states = new Map<string, any>();
  #configs = new Map<string, any>();

  constructor(private registry: FeatureRegistry) {}

  async update(currentRoute: RouteSnapshot) {
    const features = this.registry.getAll();

    for (const feature of features) {
      const context = this.#createContext(feature, currentRoute);

      const shouldEnable = await this.#matchRoute(
        feature,
        context,
        currentRoute,
      );
      const isRunning = this.#cleanups.has(feature.id);

      if (shouldEnable && !isRunning) {
        await this.enableFeature(feature, context);
      } else if (!shouldEnable && isRunning) {
        await this.disableFeature(feature, context);
      }
    }
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
      i18n: {} as any,
    };
  }

  async #matchRoute(
    feature: AnyFeature,
    context: FeatureContext<any, any, any>,
    route: RouteSnapshot,
  ): Promise<boolean> {
    const test = feature.test;

    if ((test ?? true) === true) return true;
    if (test === false) return false;
    if (test instanceof RegExp) return test.test(route.pathname);
    if (typeof test === 'function') return await test(context, route);

    return false;
  }
}
