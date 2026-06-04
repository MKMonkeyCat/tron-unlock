import type { BaseStateType, ConfigData, Feature, FeatureId } from './types';

export const defineFeature = <
  TId extends FeatureId = FeatureId,
  TState extends BaseStateType = BaseStateType,
  TConfig extends ConfigData = ConfigData,
>(
  feature: Feature<TId, TState, TConfig>,
): Feature<TId, TState, TConfig> => feature;
