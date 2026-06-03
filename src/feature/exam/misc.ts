import type { PluginGroupIDMap } from '@/plugin';
import { definePlugin } from '@/plugin';
import { injectStyle } from '@/utils';

export const ExamMiscPluginId = {
  HiddenMark: 'hidden-mark',
} as const satisfies PluginGroupIDMap;

export const createExamMiscPlugins = () => [
  definePlugin({
    id: ExamMiscPluginId.HiddenMark,
    enable() {
      // 實際不須使用 ::before 或 ::after
      const style = injectStyle(`$css
        [id="Symbol(water-mark)"],
        [id="Symbol(water-mark)"]::before,
        [id="Symbol(water-mark)"]::after,
        #symbol-water-mark,
        #symbol-water-mark::before,
        #symbol-water-mark::after {
          display: none !important;
          background: none !important;
          background-image: none !important;
        }
      `);
      return () => style.remove();
    },
  }),
];
