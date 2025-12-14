import type {
  DEFAULT_LANGUAGE_CODE,
  LanguageCode,
  TranslationKey,
} from '@/utils/i18n';
import type { BaseStateType } from '@/utils/state';
import type { MaybePromise } from '@/utils/type';

export type FeatureContext<T extends BaseStateType> = {
  custom: Record<string, unknown>;
  module: FeatureModule<T>;
  paths: string[];
};

export type BaseStateToString<T> = {
  [K in keyof T]: T[K] extends Record<PropertyKey, any>
    ? BaseStateToString<T[K]>
    : { name: string; description?: string } | string;
};

export type FeatureModuleMessageFull<T extends BaseStateType> = {
  module: { name: TranslationKey; description?: TranslationKey };
  groups?: { [K in keyof T]?: string };
} & BaseStateToString<T>;

export type FeatureModuleI18N<T extends BaseStateType> = {
  // Default language is required
  [K in typeof DEFAULT_LANGUAGE_CODE]: FeatureModuleMessageFull<T>;
} & {
  // Other languages are optional
  [K in Exclude<
    LanguageCode,
    typeof DEFAULT_LANGUAGE_CODE
  >]?: FeatureModuleMessageFull<T>;
};

export type CleanupFn<T extends BaseStateType> = (
  ctx: FeatureContext<T>
) => MaybePromise<any>;
export type CleanupResult<T extends BaseStateType> =
  | CleanupFn<T>
  | CleanupFn<T>[]
  | void;
export type CallbackWithCleanupFn<
  T extends BaseStateType,
  P extends any[] = []
> = (
  ctx: FeatureContext<T>,
  enabled: boolean,
  ...args: P
) => MaybePromise<CleanupResult<T>>;

export type FeatureObject<
  T extends BaseStateType,
  K extends string = keyof T & string
> = {
  id: K;
  test?: (() => MaybePromise<boolean>) | RegExp;
  setup?: CallbackWithCleanupFn<T>;
  // default: false
  routeAware?:
    | boolean
    | CallbackWithCleanupFn<
        T,
        [{ pathname: string; query: string; hash: string }]
      >;
  liveReload?: boolean; // default: true
  experimental?: boolean; // default: false
} & (
  | { setup: CallbackWithCleanupFn<T> } // setup only
  // toggle only
  | { toggle: CallbackWithCleanupFn<T> }
  // toggle with enable/disable
  | { enable: CallbackWithCleanupFn<T>; disable?: CallbackWithCleanupFn<T> }
  // button
  | { click?: (ctx: FeatureContext<T>) => MaybePromise<void> }
);
