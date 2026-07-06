import type {
  CategoryTranslationRegistry,
  FeatureGroupTranslation,
} from './i18n';
import type {
  BaseStateType,
  CleanupFn,
  ConfigData,
  FeatureContext,
} from './types';

export interface FeatureLifecycle<
  TStatus extends BaseStateType = BaseStateType,
  TConfig extends ConfigData = ConfigData,
  FI18n extends FeatureGroupTranslation = FeatureGroupTranslation,
  TI18n extends CategoryTranslationRegistry = CategoryTranslationRegistry,
> {
  onEnable?: (
    ctx: FeatureContext<TStatus, TConfig, FI18n, TI18n>,
  ) => CleanupFn<TStatus, TConfig, FI18n, TI18n> | void;
  onDisable?: (ctx: FeatureContext<TStatus, TConfig, FI18n, TI18n>) => void;
  onToggle?: (
    ctx: FeatureContext<TStatus, TConfig, FI18n, TI18n>,
    enabled: boolean,
  ) => void;

  onConfigChange?: (
    ctx: FeatureContext<TStatus, TConfig, FI18n, TI18n>,
    oldConfig: TConfig,
  ) => void;
}
