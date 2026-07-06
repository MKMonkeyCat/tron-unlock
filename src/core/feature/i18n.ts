import type { FeatureCategoryId, FeatureGroupId, LeafFeatureId } from './types';
import type { BaseTranslations, RecursivePartial } from '../i18n';
import { DEFAULT_LOCALE, I18nContext, i18nManager } from '../i18n';

export interface FeatureTranslationInfo {
  name: string;
  description?: string;
  fields?: Record<string, string>;
}

export interface BaseFeatureGroupTranslation {
  name: string;
  description?: string;
  features: { [featureId: LeafFeatureId]: FeatureTranslationInfo };
}

export type FeatureGroupTranslation<
  T extends BaseFeatureGroupTranslation = BaseFeatureGroupTranslation,
> = BaseTranslations<T>;

export interface BaseCategoryTranslationRegistry {
  name: string;
  description?: string;
  /**
   * Stored unwrapped (not re-nested under each group's own locale key).
   * Keyed by plain `string`, not the branded `FeatureGroupId` - a branded
   * index signature makes `ExtractGroupTranslation`'s indexed access
   * unprovable for an arbitrary still-generic `T`/`G` (TS can't show every
   * `string`-constrained `G` satisfies the brand), which breaks its use as
   * a default type parameter.
   */
  groups: { [groupId: string]: BaseFeatureGroupTranslation };
}

export type CategoryTranslationRegistry<
  T extends BaseCategoryTranslationRegistry = BaseCategoryTranslationRegistry,
> = BaseTranslations<T>;

/**
 * A registered `FeatureGroupTranslation`/`CategoryTranslationRegistry` with
 * every locale (and every field within it) made optional - used wherever
 * data is merged incrementally (`registerCategoryTranslations`) or supplied
 * as an override on top of an already-registered `withI18n(...)` category
 * (`.group(id, callback, i18n)`'s 3rd argument), so callers don't have to
 * restate the full shape just to patch a couple of fields.
 */
export type PartialTranslations<T extends BaseTranslations<unknown>> = {
  [L in keyof T]?: RecursivePartial<T[L]>;
};

/**
 * `true` once `TabBuilder.withI18n(...)` has narrowed `TI18n` away from the
 * unconstrained default - used by `.group(id, callback, i18n)`'s 3rd
 * argument to require the full group shape only when there's no category
 * data to fall back on, and accept a `PartialTranslations` patch otherwise.
 */
export type CategoryI18nProvided<T extends CategoryTranslationRegistry> =
  CategoryTranslationRegistry extends T ? false : true;

/**
 * Given a category's registered i18n type and a literal group id, resolves
 * the specific `FeatureGroupTranslation` for that one group - so
 * `tab.withI18n(categoryJson).group('event-hook', (group) => ...)` gets a
 * `group` whose `ctx.i18n.t(...)` is typed against `categoryJson`'s own
 * `groups['event-hook']` entry, without needing to pass that group's data a
 * second time.
 *
 * This has to stay a conditional type (rather than an inlined indexed
 * access) - as a default type parameter, a plain
 * `FeatureGroupTranslation<NonNullable<T[...]['groups']>[G]>` expression is
 * checked eagerly against `FeatureGroupTranslation`'s constraint, which TS
 * can't prove for an arbitrary still-generic `T`/`G`. A conditional type is
 * deferred as an opaque unit until `T`/`G` are concretely substituted, so
 * the constraint check is skipped until then.
 */
export type ExtractGroupTranslation<
  T extends CategoryTranslationRegistry,
  G extends string,
> = G extends keyof NonNullable<T[typeof DEFAULT_LOCALE]['groups']>
  ? FeatureGroupTranslation<NonNullable<T[typeof DEFAULT_LOCALE]['groups']>[G]>
  : FeatureGroupTranslation;

const EMPTY_GROUP: FeatureGroupTranslation = {
  zh_TW: { name: '', features: {} },
};
const EMPTY_CATEGORY: CategoryTranslationRegistry = {
  zh_TW: { name: '', groups: {} },
};

const isDict = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const deepMerge = (target: unknown, source: unknown): unknown => {
  if (!isDict(target) || !isDict(source)) return source;

  const output: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    output[key] =
      key in target ? deepMerge(target[key], source[key]) : source[key];
  }
  return output;
};

/**
 * Per-category translation data, built up incrementally as each category's
 * `builder.tab(...)`/`tab.group(...)` calls register their own name,
 * description and feature translations - feature-specific i18n content lives
 * next to the registration call, not in a shared global dictionary
 * (@/core/i18n is reserved for panel-shell strings not tied to a feature).
 *
 * This is a factory (not a module-level singleton) so each FeatureRegistry
 * owns its own store - a shared singleton here would leak translations
 * across independent registries (e.g. between tests).
 */
export const createCategoryTranslationStore = () => {
  const store = new Map<FeatureCategoryId, CategoryTranslationRegistry>();

  const registerCategoryTranslations = (
    category: FeatureCategoryId,
    data: PartialTranslations<CategoryTranslationRegistry>,
  ) => {
    const current = store.get(category) ?? {};
    store.set(
      category,
      deepMerge(current, data) as CategoryTranslationRegistry,
    );
  };

  const registerGroupTranslations = (
    category: FeatureCategoryId,
    group: FeatureGroupId,
    data: PartialTranslations<FeatureGroupTranslation>,
  ) => {
    // Store the group's content unwrapped (not re-nested under its own
    // zh_TW), so `groups.<id>` inside the category dict is a plain
    // {name, description, features} object, navigable in one hop.
    const content = data[DEFAULT_LOCALE];
    // No zh_TW content to merge in (e.g. an empty `{}` patch passed just to
    // satisfy the required-argument case) - skip, since merging in
    // `undefined` here would overwrite whatever this group already got from
    // `withI18n(...)`'s category data with `undefined`.
    if (!content) return;

    registerCategoryTranslations(category, {
      [DEFAULT_LOCALE]: { groups: { [group]: content } },
    });
  };

  const getCategoryI18nContext = (
    category: FeatureCategoryId,
  ): I18nContext<CategoryTranslationRegistry> =>
    new I18nContext(store.get(category) ?? EMPTY_CATEGORY, i18nManager);

  const getGroupI18nContext = (
    category: FeatureCategoryId,
    group?: FeatureGroupId,
  ): I18nContext<FeatureGroupTranslation> => {
    const categoryData = store.get(category);
    const localeDict = categoryData?.[DEFAULT_LOCALE];
    const groupContent = group ? localeDict?.groups?.[group] : undefined;

    if (!groupContent) return new I18nContext(EMPTY_GROUP, i18nManager);

    return new I18nContext(
      { [DEFAULT_LOCALE]: groupContent } as FeatureGroupTranslation,
      i18nManager,
    );
  };

  return {
    registerCategoryTranslations,
    registerGroupTranslations,
    getCategoryI18nContext,
    getGroupI18nContext,
  };
};

export type CategoryTranslationStore = ReturnType<
  typeof createCategoryTranslationStore
>;
