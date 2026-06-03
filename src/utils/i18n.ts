import { skipHookFunc } from '@/hook';

import { format } from './format';

import { isDict } from '.';

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  zh_TW: '中文（繁體）',
  zh_CN: '中文（簡體）',
} as const;
export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export const DEFAULT_LOCALE = 'zh_TW' as const;
const STORAGE_KEY = 'user_language';

const LANGUAGE_STORAGE = {
  get: (key: string) => localStorage.getItem(key),
  set: (key: string, lang: LanguageCode) => localStorage.setItem(key, lang),
};

const FALLBACK_MAP: Record<string, LanguageCode> = {
  en: 'en',
  zh: 'zh_TW',
};

//#region I18n Manager

export class I18nManager {
  #_key: string;
  #_currentLanguage: LanguageCode;
  #_subscribers = new Set<(lang: LanguageCode) => void>();
  #_watcherUninstall: (() => void) | null = null;

  constructor(key?: string) {
    this.#_key = key ?? STORAGE_KEY;
    this.#_currentLanguage = getAppLanguage(this.#_key);
  }

  get currentLanguage() {
    return this.#_currentLanguage;
  }

  set currentLanguage(lang: LanguageCode) {
    if (lang === this.#_currentLanguage) return;

    this.#_currentLanguage = lang;
    LANGUAGE_STORAGE.set(this.#_key, lang);
    this.#_subscribers.forEach((callback) => callback(lang));
  }

  initWatcher() {
    if (this.#_watcherUninstall) return;

    window.addEventListener('storage', this.#handleStorageChange);
    window.addEventListener('languagechange', this.#handleLanguageChange);

    this.#_watcherUninstall = () => {
      window.removeEventListener('storage', this.#handleStorageChange);
      window.removeEventListener('languagechange', this.#handleLanguageChange);

      this.#_watcherUninstall = null;
    };

    return this.#_watcherUninstall;
  }

  uninstallWatcher() {
    this.#_watcherUninstall?.();
  }

  subscribe(callback: (lang: LanguageCode) => void, signal?: AbortSignal) {
    if (signal?.aborted) return () => {};

    this.#_subscribers.add(callback);

    const unsubscribe = skipHookFunc(() => {
      this.#_subscribers.delete(callback);
    });

    signal?.addEventListener('abort', unsubscribe, { once: true });

    return unsubscribe;
  }

  #handleStorageChange = skipHookFunc((e: StorageEvent) => {
    if (e.key === this.#_key) this.#handleLanguageChange();
  });

  #handleLanguageChange = skipHookFunc(() => {
    const currentLang = getAppLanguage(this.#_key);
    if (currentLang === this.#_currentLanguage) return;

    this.#_currentLanguage = currentLang;
    this.#_subscribers.forEach((callback) => callback(currentLang));
  });
}

//#region I18n Context

export class I18nContext<T extends Translations> {
  #_manager: I18nManager;
  translations: T;

  constructor(translations: T, manager?: I18nManager) {
    this.#_manager = manager ?? new I18nManager();
    this.translations = translations;
  }

  t<K extends string & TranslationKeysOf<T>>(
    key: K,
    ...args: unknown[]
  ): GetPathType<T[typeof DEFAULT_LOCALE], K> {
    const lang = this.#_manager.currentLanguage;
    const targetDict =
      this.translations[lang] ?? this.translations[DEFAULT_LOCALE];

    const cleanPath = key.replace(/(\{\}|\[\])$/, '');
    const parts = cleanPath.split('.').filter(Boolean);

    let current: unknown = targetDict;
    for (const part of parts) {
      if (isDict(current) && part in current) {
        current = current[part];
      } else return key as unknown as GetPathType<T[typeof DEFAULT_LOCALE], K>;
    }

    return format(String(current), ...args) as GetPathType<
      T[typeof DEFAULT_LOCALE],
      K
    >;
  }
}

//#region Language Matching

const matchLanguage = (rawLang?: string | null): LanguageCode | null => {
  if (!rawLang) return null;
  const normalized = rawLang.replace('-', '_');
  if (normalized in SUPPORTED_LANGUAGES) return normalized as LanguageCode;

  const [short] = normalized.split('_');
  if (!short) return null;
  if (short in SUPPORTED_LANGUAGES) return short as LanguageCode;

  return FALLBACK_MAP[short] || null;
};

export const getAppLanguage = (key?: string): LanguageCode => {
  return (
    matchLanguage(LANGUAGE_STORAGE.get(key ?? STORAGE_KEY)) ??
    matchLanguage(navigator.language || navigator.languages?.[0]) ??
    DEFAULT_LOCALE
  );
};

//#region I18n Types

export type TranslationDict = {
  [key: string]: string | string[] | TranslationDict;
};
export type Translations = { [DEFAULT_LOCALE]: TranslationDict } & {
  [L in LanguageCode]?: TranslationDict;
};

// prettier-ignore
export type GetPathType<T, K extends string> = 
  K extends `${infer Head}.${infer Tail}`
    ? Head extends keyof T
      ? GetPathType<T[Head], Tail>
      : never
    : K extends string 
      ? K extends `${infer Base}[]`
        ? Base extends keyof T ? T[Base] : never
        : K extends `${infer Base}{}`
          ? Base extends keyof T ? T[Base] : never
          : K extends keyof T ? T[K] : never
      : never;

export type ExtractKeys<T, Prefix extends string = ''> = {
  [K in keyof T]: K extends string
    ? T[K] extends string | string[]
      ? `${Prefix}${K}` | (T[K] extends string[] ? `${Prefix}${K}[]` : never)
      : T[K] extends TranslationDict
        ? `${Prefix}${K}{}` | ExtractKeys<T[K], `${Prefix}${K}.`>
        : never
    : never;
}[keyof T & string];

export type TranslationKeysOf<T extends Translations> = ExtractKeys<
  T[typeof DEFAULT_LOCALE]
>;

// type MyTrans = {
//   zh_TW: {
//     user: { name: string; tags: string[]; settings: { theme: string } };
//   };
// };
//
// const i18n = new I18nContext({} as MyTrans);
// const name = i18n.t('user.name');
// const tags = i18n.t('user.tags[]');
// const theme = i18n.t('user.settings{}');
