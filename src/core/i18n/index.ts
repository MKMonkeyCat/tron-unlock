import { skipHookFunc } from '@/hook';
import { format } from '@/utils/format';
import { isDict } from '@/utils/type';

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
  #key: string;
  #currentLanguage: LanguageCode;
  #subscribers = new Set<(lang: LanguageCode) => void>();
  #watcherUninstall: (() => void) | null = null;

  constructor(key?: string) {
    this.#key = key ?? STORAGE_KEY;
    this.#currentLanguage = getAppLanguage(this.#key);
  }

  get currentLanguage() {
    return this.#currentLanguage;
  }

  set currentLanguage(lang: LanguageCode) {
    if (lang === this.#currentLanguage) return;

    this.#currentLanguage = lang;
    LANGUAGE_STORAGE.set(this.#key, lang);
    this.#subscribers.forEach((callback) => callback(lang));
  }

  initWatcher() {
    if (this.#watcherUninstall) return;

    window.addEventListener('storage', this.#handleStorageChange);
    window.addEventListener('languagechange', this.#handleLanguageChange);

    this.#watcherUninstall = () => {
      window.removeEventListener('storage', this.#handleStorageChange);
      window.removeEventListener('languagechange', this.#handleLanguageChange);

      this.#watcherUninstall = null;
    };

    return this.#watcherUninstall;
  }

  uninstallWatcher() {
    this.#watcherUninstall?.();
  }

  subscribe(callback: (lang: LanguageCode) => void, signal?: AbortSignal) {
    if (signal?.aborted) return () => {};

    this.#subscribers.add(callback);

    const unsubscribe = skipHookFunc(() => {
      this.#subscribers.delete(callback);
    });

    signal?.addEventListener('abort', unsubscribe, { once: true });

    return unsubscribe;
  }

  #handleStorageChange = skipHookFunc((e: StorageEvent) => {
    if (e.key === this.#key) this.#handleLanguageChange();
  });

  #handleLanguageChange = skipHookFunc(() => {
    const currentLang = getAppLanguage(this.#key);
    if (currentLang === this.#currentLanguage) return;

    this.#currentLanguage = currentLang;
    this.#subscribers.forEach((callback) => callback(currentLang));
  });
}

//#region I18n Context

type ObjectKeysWithoutSuffix<T extends Translations<unknown>> =
  TranslationKeysOf<T> extends infer K
    ? K extends `${infer Base}{}`
      ? Base
      : never
    : never;
export class I18nContext<T extends Translations<unknown>> {
  #manager: I18nManager;
  translations: T;

  constructor(translations: T, manager?: I18nManager) {
    this.#manager = manager ?? new I18nManager();
    this.translations = translations;
  }

  t<K extends string & TranslationKeysOf<T>>(
    key: K,
    ...args: unknown[]
  ): GetPathType<T[typeof DEFAULT_LOCALE], K> {
    const lang = this.#manager.currentLanguage;
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

  addTranslations<K extends ObjectKeysWithoutSuffix<T>>(
    translations: [K] extends [never]
      ? Partial<T>
      : { [L in LanguageCode]?: GetPathType<T[typeof DEFAULT_LOCALE], K> },
    namespace?: K,
  ) {
    const target = this.translations as Record<string, unknown>;
    const src = translations as Record<string, unknown>;

    Object.keys(src).forEach((lang) => {
      if (!target[lang]) target[lang] = {};

      const sourceData = src[lang];
      if (namespace) {
        const deepNestedObject = this.#buildDeepObject(namespace, sourceData);
        target[lang] = this.#deepMerge(target[lang], deepNestedObject);
      } else target[lang] = this.#deepMerge(target[lang], sourceData);
    });
  }

  #buildDeepObject(path: string, value: any): Record<string, any> {
    const cleanPath = path.replace(/(\{\}|\[\])$/, '');
    const parts = cleanPath.split('.').filter(Boolean);
    const root: Record<string, any> = {};

    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) current[part] = value;
      else {
        current[part] = {};
        current = current[part];
      }
    }

    return root;
  }

  #deepMerge(target: any, source: any): any {
    if (!isDict(target) || !isDict(source)) return source;

    const output = { ...target };
    Object.keys(source).forEach((key) => {
      if (isDict(source[key])) {
        if (!(key in target)) output[key] = source[key];
        else output[key] = this.#deepMerge(target[key], source[key]);
      } else output[key] = source[key];
    });

    return output;
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

export type Translations<T = TranslationDict> = {
  [DEFAULT_LOCALE]: T;
} & { [L in LanguageCode]?: RecursivePartial<T> };

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object
      ? RecursivePartial<T[P]>
      : T[P];
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

export type TranslationKeysOf<T extends Translations<unknown>> = ExtractKeys<
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

//#region Custom Translations

export interface CustomTranslations {}

export type CustomTranslationsType = Translations<CustomTranslations>;

export const i18nManager = new I18nManager();
export const i18n = new I18nContext({} as CustomTranslationsType, i18nManager);
