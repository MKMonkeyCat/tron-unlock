import { waitForElement } from '@/utils/dom';

import type { CleanupFn } from '../type';

import type { defaultConfig, ExamFeatureModule } from '.';

const cleanups: CleanupFn<typeof defaultConfig>[] = [];

export const registerMarkFeature = (module: ExamFeatureModule) => {
  module.register('mark', {
    id: 'examMark',
    enable: () => {
      const removeMark = (el: HTMLElement) => {
        const originalBg = el.style.background;
        el.style.background = '';

        cleanups.push(() => (el.style.background = originalBg));
      };

      // -> #Symbol(water-mark)
      waitForElement('#Symbol\\28water-mark\\29')
        .then(removeMark)
        .catch(() => {});

      waitForElement('#symbol-water-mark')
        .then(removeMark)
        .catch(() => {});
    },
    disable: (ctx) => cleanups.forEach((fn) => fn(ctx)),
  });
};
