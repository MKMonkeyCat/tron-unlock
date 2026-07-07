import type { Brand, MaybePromise } from '@/utils/type';

import type {
  CategoryTranslationRegistry,
  FeatureGroupTranslation,
} from './i18n';
import type { FeatureLifecycle } from './lifecycle';
import type { I18nContext } from '../i18n';

export type FeatureCategoryId = Brand<string, 'FeatureCategoryId'>;
export type FeatureGroupId = Brand<string, 'FeatureGroupId'>;
export type LeafFeatureId = Brand<string, 'LeafFeatureId'>;

/** `<category>.<group>.<leaf>` - guarantees global uniqueness by construction. */
export type FeatureId =
  `${FeatureCategoryId}.${FeatureGroupId}.${LeafFeatureId}`;

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
  FI18n extends FeatureGroupTranslation = FeatureGroupTranslation,
  TI18n extends CategoryTranslationRegistry = CategoryTranslationRegistry,
> = (ctx: FeatureContext<TStatus, TConfig, FI18n, TI18n>) => void;

export interface FeatureContext<
  TStatus extends BaseStateType,
  TConfig extends ConfigData,
  FI18n extends FeatureGroupTranslation = FeatureGroupTranslation,
  TI18n extends CategoryTranslationRegistry = CategoryTranslationRegistry,
> {
  state: TStatus;
  config: TConfig;
  route: RouteSnapshot;
  /** Scoped to this feature's own group. */
  i18n: I18nContext<FI18n>;
  /** The whole category (e.g. for rendering a tab-level label). */
  i18nCategory: I18nContext<TI18n>;
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

export interface FeatureSnapshot<TConfig extends ConfigData = ConfigData> {
  id: FeatureId;
  category: FeatureCategoryId;
  group?: FeatureGroupId;
  enabled: boolean;
  config: TConfig;
  fields: FeatureSchemaField<string, any>[];
}

export type AnyFeature = Feature<FeatureId, any, any>;

export type GroupFeature<
  TId extends string = string,
  TState extends BaseStateType = BaseStateType,
  TConfig extends ConfigData = ConfigData,
  FI18n extends FeatureGroupTranslation = FeatureGroupTranslation,
  TI18n extends CategoryTranslationRegistry = CategoryTranslationRegistry,
> = Omit<
  Feature<TId, TState, TConfig, FI18n, TI18n>,
  'category' | 'group' | 'id'
> & { id: TId };

export type Feature<
  TId extends string = FeatureId,
  TState extends BaseStateType = BaseStateType,
  TConfig extends ConfigData = ConfigData,
  FI18n extends FeatureGroupTranslation = FeatureGroupTranslation,
  TI18n extends CategoryTranslationRegistry = CategoryTranslationRegistry,
> = {
  id: TId;

  category: FeatureCategoryId;
  group?: FeatureGroupId;

  state?: TState;

  defaultConfig?: TConfig;

  test?:
    | ((
        ctx: FeatureContext<TState, TConfig, FI18n, TI18n>,
        route: RouteSnapshot,
      ) => MaybePromise<boolean>)
    | RegExp
    | boolean;
  setup?: (
    ctx: FeatureContext<TState, TConfig, FI18n, TI18n>,
    value: boolean,
  ) => MaybePromise<CleanupFn<TState, TConfig, FI18n, TI18n> | void>;

  fields?: FieldForConfig<TConfig>[];
} & FeatureLifecycle<TState, TConfig, FI18n, TI18n>;
