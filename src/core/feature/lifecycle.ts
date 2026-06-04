import type {
  BaseStateType,
  CleanupFn,
  ConfigData,
  FeatureContext,
} from './types';
import type { Translations } from '../i18n';

export interface FeatureLifecycle<
  TStatus extends BaseStateType = BaseStateType,
  TConfig extends ConfigData = ConfigData,
  TI18n extends Translations = Translations,
> {
  onEnable?: (
    ctx: FeatureContext<TStatus, TConfig, TI18n>,
  ) => CleanupFn<TStatus, TConfig, TI18n> | void;
  onDisable?: (ctx: FeatureContext<TStatus, TConfig, TI18n>) => void;
  onToggle?: (
    ctx: FeatureContext<TStatus, TConfig, TI18n>,
    enabled: boolean,
  ) => void;

  onConfigChange?: (
    ctx: FeatureContext<TStatus, TConfig, TI18n>,
    oldConfig: TConfig,
  ) => void;
}
