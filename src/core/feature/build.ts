import type { Translations } from '@/core/i18n';

import type {
  AnyFeature,
  BaseStateType,
  ConfigData,
  Feature,
  FeatureId,
  FeatureWithoutCategory,
} from './types';

class FeatureRegistry {
  #map = new Map<string, AnyFeature>();

  register(feature: AnyFeature) {
    this.#map.set(feature.id, feature);
  }

  getAll() {
    return [...this.#map.values()];
  }
}

const registry = new FeatureRegistry();

export class GroupBuilder {
  constructor(
    private tab: string,
    private group: string,
  ) {}

  append<
    TId extends FeatureId = FeatureId,
    TState extends BaseStateType = BaseStateType,
    TConfig extends ConfigData = ConfigData,
    TI18n extends Translations = Translations,
  >(feature: FeatureWithoutCategory<TId, TState, TConfig, TI18n>): this {
    registry.register({
      ...feature,
      category: this.tab,
      group: this.group,
    } as AnyFeature);
    return this;
  }
}

export class TabBuilder implements TabBuilder {
  constructor(private tab: string) {}

  group(group: string, callback?: (builder: GroupBuilder) => void) {
    const groupBuilder = new GroupBuilder(this.tab, group);
    if (!callback) return groupBuilder;

    callback?.(groupBuilder);
    return this;
  }

  append<
    TId extends FeatureId = FeatureId,
    TState extends BaseStateType = BaseStateType,
    TConfig extends ConfigData = ConfigData,
    TI18n extends Translations = Translations,
  >(feature: FeatureWithoutCategory<TId, TState, TConfig, TI18n>): this {
    registry.register({ ...feature, category: this.tab } as AnyFeature);
    return this;
  }
}

export interface TabBuilder {
  group(group: string): GroupBuilder;
  group(group: string, callback: (builder: GroupBuilder) => void): this;
}

class Builder {
  tab(tab: string, callback?: (builder: TabBuilder) => void) {
    const tabBuilder = new TabBuilder(tab);
    if (callback) {
      callback(tabBuilder);
    }
    return this;
  }
}

export const defineFeature = <
  TId extends FeatureId = FeatureId,
  TState extends BaseStateType = BaseStateType,
  TConfig extends ConfigData = ConfigData,
>(
  feature: Feature<TId, TState, TConfig>,
): Feature<TId, TState, TConfig> => feature;

export const builder = new Builder();
