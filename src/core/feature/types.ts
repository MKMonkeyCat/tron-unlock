import type { MaybePromise } from '@/utils/type';

import type { FeatureLifecycle } from './lifecycle';
import type { I18nContext, Translations } from '../i18n';

export type FeatureId = string;
export type FeatureCategoryId = string;
export type FeatureGroupId = string;

export type BaseStateType = Record<string, unknown>;

export type RouteSnapshot = Pick<
  Location,
  'href' | 'pathname' | 'search' | 'hash'
>;

export type ConfigValue =
  | string
  | number
  | boolean
  | null
  | ConfigData
  | ConfigValue[];

export interface ConfigData {
  [key: string]: ConfigValue;
}

export type CleanupFn<
  TStatus extends BaseStateType = BaseStateType,
  TConfig extends ConfigData = ConfigData,
  TI18n extends Translations = Translations,
> = (ctx: FeatureContext<TStatus, TConfig, TI18n>) => void;

export interface FeatureContext<
  TStatus extends BaseStateType,
  TConfig extends ConfigData,
  TI18n extends Translations,
> {
  state: TStatus;
  config: TConfig;
  route: RouteSnapshot;
  i18n: I18nContext<TI18n>;
}

export type FeatureSchemaField<
  K extends string = string,
  V extends ConfigValue = ConfigValue,
> = (
  | ([V] extends [boolean] ? { type: 'toggle' } : never)
  | ([V] extends [boolean | string | number] ? { type: 'input' } : never)
  | ([V] extends [number]
      ? { type: 'number'; step?: number; min?: number; max?: number }
      : never)
  | ([V] extends [string | boolean | number]
      ? { type: 'select'; options: V[] }
      : never)
) & { key: K };

export type FieldForConfig<TConfig extends ConfigData> = {
  [K in keyof TConfig & string]: FeatureSchemaField<
    K,
    TConfig[K] extends ConfigValue ? TConfig[K] : never
  >;
}[keyof TConfig & string];

export type AnyFeature = Feature<FeatureId, any, any>;

export type FeatureWithoutCategory<
  TId extends FeatureId = FeatureId,
  TState extends BaseStateType = BaseStateType,
  TConfig extends ConfigData = ConfigData,
  TI18n extends Translations = Translations,
> = Omit<Feature<TId, TState, TConfig, TI18n>, 'category'>;

export type Feature<
  TId extends FeatureId = FeatureId,
  TState extends BaseStateType = BaseStateType,
  TConfig extends ConfigData = ConfigData,
  TI18n extends Translations = Translations,
> = {
  id: TId;

  category: FeatureCategoryId;
  group?: FeatureGroupId;

  state?: TState;

  defaultConfig?: TConfig;

  test?:
    | ((
        ctx: FeatureContext<TState, TConfig, TI18n>,
        route: RouteSnapshot,
      ) => MaybePromise<boolean>)
    | RegExp
    | boolean;
  setup?: (
    ctx: FeatureContext<TState, TConfig, TI18n>,
    value: boolean,
  ) => MaybePromise<CleanupFn<TState, TConfig, TI18n> | void>;

  fields?: FieldForConfig<TConfig>[];
} & FeatureLifecycle<TState, TConfig, TI18n>;
