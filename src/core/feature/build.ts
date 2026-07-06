import type {
  CategoryI18nProvided,
  CategoryTranslationRegistry,
  CategoryTranslationStore,
  ExtractGroupTranslation,
  FeatureGroupTranslation,
  PartialTranslations,
} from './i18n';
import { createCategoryTranslationStore } from './i18n';
import type {
  AnyFeature,
  BaseStateType,
  ConfigData,
  FeatureCategoryId,
  FeatureGroupId,
  FeatureId,
  GroupFeature,
} from './types';
import type { DEFAULT_LOCALE } from '../i18n';

export class FeatureRegistry {
  #map = new Map<FeatureId, AnyFeature>();
  i18n: CategoryTranslationStore = createCategoryTranslationStore();

  register(feature: AnyFeature) {
    this.#map.set(feature.id, feature);
  }

  get(id: FeatureId) {
    return this.#map.get(id);
  }

  getAll() {
    return [...this.#map.values()];
  }
}

export class GroupBuilder<
  FI18n extends FeatureGroupTranslation = FeatureGroupTranslation,
  TI18n extends CategoryTranslationRegistry = CategoryTranslationRegistry,
> {
  constructor(
    private registry: FeatureRegistry,
    private tab: FeatureCategoryId,
    private group: FeatureGroupId,
  ) {}

  append<
    TId extends string = Extract<
      keyof NonNullable<FI18n[typeof DEFAULT_LOCALE]['features']>,
      string
    >,
    TState extends BaseStateType = BaseStateType,
    TConfig extends ConfigData = ConfigData,
  >(feature: GroupFeature<TId, TState, TConfig, FI18n, TI18n>): this {
    this.registry.register({
      ...feature,
      id: `${this.tab}.${this.group}.${feature.id}` as FeatureId,
      category: this.tab,
      group: this.group,
    } as AnyFeature);
    return this;
  }
}

export class TabBuilder<
  TI18n extends CategoryTranslationRegistry = CategoryTranslationRegistry,
> {
  constructor(
    private registry: FeatureRegistry,
    private tab: FeatureCategoryId,
  ) {}

  withI18n<T extends CategoryTranslationRegistry>(i18n: T): TabBuilder<T> {
    this.registry.i18n.registerCategoryTranslations(this.tab, i18n);
    return this as unknown as TabBuilder<T>;
  }

  group<
    G extends Extract<
      keyof NonNullable<TI18n[typeof DEFAULT_LOCALE]['groups']>,
      string
    >,
    I18n extends FeatureGroupTranslation = ExtractGroupTranslation<TI18n, G>,
  >(
    group: G,
    callback?: (builder: GroupBuilder<I18n, TI18n>) => void,
    i18n?: CategoryI18nProvided<TI18n> extends true
      ? PartialTranslations<I18n>
      : I18n,
  ): this {
    const groupId = group as unknown as FeatureGroupId;
    if (i18n) {
      this.registry.i18n.registerGroupTranslations(this.tab, groupId, i18n);
    }

    const groupBuilder = new GroupBuilder<I18n, TI18n>(
      this.registry,
      this.tab,
      groupId,
    );
    callback?.(groupBuilder);
    return this;
  }
}

export class Builder {
  constructor(private registry: FeatureRegistry) {}

  tab(tab: string, callback?: (builder: TabBuilder) => void): this {
    const categoryId = tab as FeatureCategoryId;
    const tabBuilder = new TabBuilder(this.registry, categoryId);
    callback?.(tabBuilder);
    return this;
  }
}
