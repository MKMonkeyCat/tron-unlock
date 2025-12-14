import { skipHookFunc } from '@/utils';
import { win } from '@/utils/hook/utils';
import { DEFAULT_LANGUAGE_CODE, type LanguageCode } from '@/utils/i18n';
import {
  type BaseStateType,
  type ChangeListener,
  getDeep,
  type PartialPathValue,
  type Path,
  PersistentState,
} from '@/utils/state';
import type { MaybePromise } from '@/utils/type';

import { registerCourseModule } from './course';
import { registerExamModule } from './exam';
import { registerGlobalModule } from './global';
import type {
  CleanupFn,
  CleanupResult,
  FeatureContext,
  FeatureModuleI18N,
  FeatureModuleMessageFull,
  FeatureObject,
} from './type';

export class FeatureModule<
  T extends BaseStateType,
  I18N extends FeatureModuleI18N<T> = FeatureModuleI18N<T>
> extends PersistentState<{ enabled: boolean } & T> {
  public id: string;
  protected i18n?: Partial<I18N>;
  public readonly groups: { [K in keyof T]?: Feature<T>[] } = {};

  constructor(id: string, defaultState: T, i18n?: Partial<I18N>) {
    super(
      { enabled: true, ...defaultState },
      // TODO make storage configurable
      { storage: localStorage, storageKey: `mk-feature-${id}` }
    );
    this.id = id;
    this.i18n = i18n;
  }

  getI18N(lang?: LanguageCode) {
    if (!lang) lang = DEFAULT_LANGUAGE_CODE;
    return this.i18n?.[lang as keyof I18N];
  }

  register<K extends Extract<keyof T, string>>(
    groupName: K,
    ...features: FeatureObject<
      T,
      T[K] extends Record<string, any> ? keyof T[K] & string : never
    >[]
  ) {
    if (!this.groups[groupName]) {
      this.groups[groupName] = [];
    }

    this.groups[groupName]!.push(
      ...features.map((f) => {
        return new Feature<T>(this as FeatureModule<T>, f as FeatureObject<T>, [
          groupName,
          f.id,
        ]);
      })
    );
  }

  async init(): Promise<void> {
    await super.init();
    for (const groupFeatures of Object.values(this.groups)) {
      if (!groupFeatures) continue;
      for (const feature of groupFeatures) {
        try {
          await feature.init();
        } catch (e) {
          console.error(
            `[FeatureModule:init] ${this.id} - ${feature.options.id}`,
            e
          );
        }
      }
    }
  }
}

export class FeatureManager {
  protected modules: Map<string, FeatureModule<any>>;
  protected removeRouteListeners: (() => void) | null = null;

  constructor() {
    this.modules = new Map();
  }

  register<T extends BaseStateType>(name: string, feature: FeatureModule<T>) {
    this.modules.set(name, feature);
  }

  get<T extends BaseStateType>(): Map<string, FeatureModule<T>>;
  get<T extends BaseStateType>(name: string): FeatureModule<T> | undefined;
  get<T extends BaseStateType>(
    name?: string
  ): FeatureModule<T> | Map<string, FeatureModule<T>> | undefined {
    return name ? this.modules.get(name) : this.modules;
  }

  async init(): Promise<void> {
    for (const module of this.modules.values()) {
      try {
        await module.init();
      } catch (e) {
        console.error(`[FeatureManager:init] ${module.id}`, e);
      }
    }

    this.setupRouteWatcher();
  }

  protected setupRouteWatcher(): void {
    this.removeRouteListeners?.();

    const realHandlerLogic = () => {
      console.log(
        '[FeatureManager] Route change detected. Re-evaluating features...'
      );
      for (const module of this.modules.values()) {
        for (const groupFeatures of Object.values(module.groups)) {
          if (!groupFeatures) continue;
          for (const feature of groupFeatures) {
            if (feature.options.routeAware) {
              feature.reEvaluate();
            }
          }
        }
      }
    };

    let lastRunTime = 0;
    let routeChangeTimer: number | null = null;
    const handler = skipHookFunc(() => {
      if (routeChangeTimer) {
        clearTimeout(routeChangeTimer);
      }

      const now = Date.now();
      // Throttling: if last run time is more than 1 second ago, run immediately
      if (lastRunTime > 0 && now - lastRunTime > 1_000) {
        console.warn(
          '[FeatureManager] Route change detected (throttled). Re-evaluating features...'
        );
        lastRunTime = now;
        realHandlerLogic();
        return;
      }

      routeChangeTimer = window.setTimeout(() => {
        lastRunTime = Date.now();
        realHandlerLogic();
        routeChangeTimer = null;
      }, 100);
    });

    window.addEventListener('popstate', handler);
    window.addEventListener('hashchange', handler);

    this.removeRouteListeners = () => {
      window.removeEventListener('popstate', handler);
      window.removeEventListener('hashchange', handler);

      if (routeChangeTimer) clearTimeout(routeChangeTimer);
    };
  }
}

export class Feature<T extends BaseStateType, P extends string[] = string[]> {
  public readonly options: FeatureObject<T>;
  public readonly paths: P;
  protected readonly module: FeatureModule<T>;
  protected readonly customData: Record<string, unknown> = {};
  protected readonly cleanups: CleanupFn<T>[] = [];
  protected readonly setupCleanups: CleanupFn<T>[] = [];

  constructor(module: FeatureModule<T>, options: FeatureObject<T>, paths: P) {
    this.module = module;
    this.options = options;
    this.paths = paths;
  }

  get name(): string {
    return this.getMessage('name') ?? this.options.id;
  }

  get description(): string | undefined {
    return this.getMessage('description');
  }

  get ctx(): FeatureContext<T> {
    return { module: this.module, custom: this.customData, paths: this.paths };
  }

  async init(): Promise<void> {
    try {
      await this.applyOption('init');
    } catch (e) {
      console.error(`[Feature:init] ${this.options.id}`, e);
    }
  }

  async check(): Promise<boolean> {
    const testValue = this.options.test;
    if (testValue instanceof RegExp) {
      return testValue.test(window.location.pathname);
    } else if (typeof testValue === 'function') {
      try {
        const res = await testValue();
        return typeof res === 'boolean' ? res : false;
      } catch (e) {
        console.error(`[Feature:check] ${this.options.id}`, e);
        return false;
      }
    }
    // No test means always enabled
    return true;
  }

  async click(): Promise<void> {
    try {
      const value = this.get();
      if ('click' in this.options) {
        this.addCleanup(await this.safeCall(this.options.click, !!value));
        return;
      }

      if (
        'toggle' in this.options ||
        'enable' in this.options ||
        'disable' in this.options
      ) {
        await this.applyOption('click', !value);
      }
    } catch (e) {
      console.error(`[Feature:click] ${this.options.id}`, e);
    }
  }

  on(callback: ChangeListener<T, Path<T>>): void {
    // @ts-ignore
    this.module.on(this.paths, callback);
  }

  off(callback: ChangeListener<T, Path<T>>): void {
    // @ts-ignore
    this.module.off(this.paths, callback);
  }

  get(): PartialPathValue<T, P> {
    // @ts-ignore
    return this.module.get(this.paths);
  }

  set(value: PartialPathValue<T, P>): void {
    // @ts-ignore
    this.module.set(this.paths, value);
  }

  async dispose(skipSetupCleanup: boolean = false): Promise<void> {
    const cleanupsToRun = skipSetupCleanup
      ? this.cleanups
      : [...this.cleanups, ...this.setupCleanups];

    for (const fn of cleanupsToRun) {
      try {
        await fn.call(this, this.ctx);
      } catch (e) {
        console.error(`[Feature:dispose] ${this.options.id}`, e);
      }
    }

    this.cleanups.length = 0;
    if (!skipSetupCleanup) this.setupCleanups.length = 0;
  }

  async reEvaluate(): Promise<void> {
    await this.applyOption('routeChange', !!this.get());
  }

  protected async checkRouteAware(): Promise<boolean> {
    const routeAwareValue = this.options.routeAware;
    if (typeof routeAwareValue === 'function') {
      try {
        const { pathname, search: query, hash } = win.location;
        const res = await routeAwareValue(this.ctx, !!this.get(), {
          pathname,
          query,
          hash,
        });

        return typeof res === 'boolean' ? res : false; // default: false
      } catch (e) {
        console.error(`[Feature:checkRouteAware] ${this.options.id}`, e);
        return false;
      }
    }
    return routeAwareValue === true;
  }

  protected getMessage<K extends keyof FeatureModuleMessageFull<T>>(
    key: K
  ): string | undefined {
    const msg = getDeep(this.module.getI18N(), this.paths as any);
    if (typeof msg === 'string') return key === 'name' ? msg : undefined;
    if (msg && key in msg) return (msg as any)[key];
    return undefined;
  }

  protected async applyOption(
    type: 'init' | 'click' | 'routeChange',
    newValue?: boolean
  ): Promise<void> {
    const isRouteChange = type === 'routeChange';
    if (!(await this.check())) {
      if (isRouteChange && this.cleanups.length > 0) {
        await this.dispose();
      }
      return;
    }

    const isRouteAware = await this.checkRouteAware();
    if (isRouteChange && !isRouteAware) {
      return;
    }

    const oldValue = this.get();
    if (type === 'init' && 'setup' in this.options) {
      this.addCleanup(
        await this.safeCall(this.options.setup, !!oldValue),
        true
      );
    }

    if (newValue === undefined) {
      if (type === 'init') newValue = !!oldValue;
      else return;
    }

    // If the feature is not liveReload and it's not init, only update config
    if (this.options.liveReload === false && type !== 'init') {
      this.set(newValue as any);
      return;
    }

    // If route change and value not changed, do nothing
    if (isRouteChange || (oldValue && newValue !== oldValue)) {
      // If route change, skip setup cleanup
      await this.dispose(isRouteChange);
    }

    // Apply the option
    try {
      if ('toggle' in this.options) {
        this.addCleanup(await this.safeCall(this.options.toggle, !newValue));
      } else if (newValue && 'enable' in this.options) {
        this.addCleanup(await this.safeCall(this.options.enable, true));
      } else if (!newValue && 'disable' in this.options) {
        this.addCleanup(await this.safeCall(this.options.disable, false));
      }

      this.set(newValue as any);
    } catch (e) {
      console.error(`[Feature:applyOption] ${this.options.id}`, e);
    }
  }

  protected async safeCall(
    fn?: (
      ctx: FeatureContext<T>,
      ...args: any[]
    ) => MaybePromise<CleanupResult<T>>,
    ...args: any[]
  ): Promise<CleanupResult<T> | void> {
    if (!fn) return;
    try {
      return await fn(this.ctx, ...args);
    } catch (e) {
      console.error(`[Feature:safeCall] ${this.options.id}`, e);
    }
  }

  protected addCleanup(
    result: CleanupResult<T> | void,
    isSetupCleanup: boolean = false
  ): void {
    if (!result) return;
    const fns = Array.isArray(result) ? result : [result];
    if (isSetupCleanup) {
      this.setupCleanups.push(...fns.filter(Boolean));
    } else {
      this.cleanups.push(...fns.filter(Boolean));
    }
  }
}

export const featureManager = new FeatureManager();

registerCourseModule(featureManager);
registerExamModule(featureManager);
registerGlobalModule(featureManager);
