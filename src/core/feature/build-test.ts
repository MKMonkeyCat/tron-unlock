import { i18n, type Translations } from '@/core/i18n';

import { builder } from './build';
import { defineFeature } from './defineFeature';

export const i18nModules = {
  zh_TW: { a: '測試' },
} satisfies Translations;

declare module '@/core/i18n' {
  interface CustomTranslations {
    test: {
      test2: typeof i18nModules.zh_TW;
    };
  }
}

i18n.addTranslations(i18nModules, 'test.test2');

builder
  .tab('exam')
  .append(
    defineFeature({
      id: 'exam.auto-submit',
      category: 'exam',
      defaultConfig: { a1: false },
      onEnable() {},
    }),
    defineFeature({
      id: 'exam.auto-submit',
      category: 'exam',
      defaultConfig: { a2: false },
      onEnable() {},
    }),
  )
  .group('tools', (builder) => {
    builder
      .append(
        defineFeature({
          category: 'exam',
          id: 'exam.timer',
          defaultConfig: { duration: 60 },
          onEnable({ config }) {
            const id = setInterval(() => {
              console.log(config.duration);
            }, 1000);

            return () => clearInterval(id);
          },
        }),
      )
      .append(
        defineFeature({
          category: 'exam',
          id: 'exam.timer',
          defaultConfig: { duration: 60 },
          onEnable({ config }) {
            const id = setInterval(() => {
              console.log(config.duration);
            }, 1000);

            return () => clearInterval(id);
          },
        }),
      );
  });
