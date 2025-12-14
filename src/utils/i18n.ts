import zhTWTranslations from '@/locale/zh_TW.json';

import { dynamicElementWatcher } from '.';

// All TronClass supported language codes, but not all are fully translated yet
export const SUPPORTED_LANGUAGE_CODES = [
  'zh-TW',
  'zh-CN',
  'zh-MO',
  'en-US',
  'en-GB',
  'th-TH',
  'id-ID',
  'ms-MY',
  'vi-VN',
] as const;

export const createTranslations = (): Translations => ({
  'zh-TW': zhTWTranslations,
  'zh-CN': {},
  'zh-MO': {},
  'en-US': {},
  'en-GB': {},
  'th-TH': {},
  'id-ID': {},
  'ms-MY': {},
  'vi-VN': {},
});

export const DEFAULT_LANGUAGE_CODE = 'zh-TW';
export const USER_LANGUAGE_CODE: LanguageCode = (() => {
  const lang = navigator.language || navigator.languages[0] || 'zh-TW';
  if (SUPPORTED_LANGUAGE_CODES.includes(lang as LanguageCode)) {
    return lang as LanguageCode;
  }

  if (lang.startsWith('zh')) return 'zh-TW';

  return DEFAULT_LANGUAGE_CODE;
})();

export class I18n {
  private _locale: LanguageCode;
  private _translations: Translations;
  private _cache: Map<string, string> = new Map();
  private _listeners = new Set<LocaleListener>();

  constructor(options: I18nOptions) {
    this._locale = options.locale;
    this._translations = options.translations;
  }

  onLocaleChange(fn: LocaleListener, signal?: AbortSignal): () => void {
    this._listeners.add(fn);

    if (signal) {
      signal.addEventListener('abort', () => {
        this._listeners.delete(fn);
      });
    }

    return () => this._listeners.delete(fn);
  }

  get locale(): LanguageCode {
    return this._locale;
  }

  setLocale(locale: LanguageCode) {
    if (this._locale !== locale) {
      this._locale = locale;
      this._cache.clear();
      this._listeners.forEach((fn) => fn(locale));
    }
  }

  t(key: TranslationKey | (string & {})): string {
    const cached = this._cache.get(key);
    if (cached !== undefined) return cached;

    const getValue = (obj: any, path: string): string | undefined => {
      const value = path.split('.').reduce((curr, k) => curr?.[k], obj);
      return typeof value === 'string' ? value : undefined;
    };

    const dict = this._translations[this._locale];
    console.log(dict, key);
    const zh_TW = this._translations['zh-TW'];
    const result = getValue(dict, key) ?? getValue(zh_TW, key) ?? key;

    this._cache.set(key, result);
    return result;
  }
}

type NestedKeyOf<T extends Record<string, any>> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : T[K] extends Record<string, any>
    ? `${K}` | `${K}.${NestedKeyOf<T[K]>}`
    : never;
}[keyof T & string];

const createKeys = <T extends Record<string, any>>(
  obj: T,
  prefix = ''
): Record<string, any> => {
  return Object.entries(obj).reduce((result, [key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    result[key] =
      typeof value === 'string' ? fullKey : createKeys(value, fullKey);

    return result;
  }, {} as Record<string, any>);
};

export const bindText = (
  el: HTMLElement,
  key: TranslationKey,
  attr: 'textContent' | 'innerText' = 'textContent',
  i18n: I18n = i18nInstance
) => {
  const ctrl = new AbortController();
  const render = () => (el[attr] = i18n.t(key));

  render();
  i18n.onLocaleChange(render, ctrl.signal);
  dynamicElementWatcher(el, () => ctrl.abort());
};

export const K = createKeys(zhTWTranslations) as BuildKeys<
  typeof zhTWTranslations
>;
export const translations = createTranslations();
export const i18nInstance = new I18n({
  locale: USER_LANGUAGE_CODE,
  translations,
});
export const t: TranslateFn = (key) => i18nInstance.t(key);

type LocaleListener = (locale: LanguageCode) => void;

type BuildKeys<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends string
    ? Prefix extends ''
      ? `${K & string}`
      : `${Prefix}.${K & string}`
    : T[K] extends Record<string, any>
    ? BuildKeys<
        T[K],
        Prefix extends '' ? K & string : `${Prefix}.${K & string}`
      > & {
        [P in Prefix extends ''
          ? K & string
          : `${Prefix}.${K & string}`]: Prefix extends ''
          ? `${K & string}`
          : `${Prefix}.${K & string}`;
      }
    : never;
};

export type TranslationKey = NestedKeyOf<typeof zhTWTranslations>;
export type TranslateFn = (key: TranslationKey) => string;
export type LanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];
export type TranslationDict = Record<string, any>;
export type Translations = Record<LanguageCode, TranslationDict>;

export interface I18nOptions {
  locale: LanguageCode;
  translations: Translations;
}

export default I18n;
