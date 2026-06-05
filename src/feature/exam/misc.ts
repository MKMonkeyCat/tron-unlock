import type { GroupBuilder } from '@/core';
import { injectStyle } from '@/utils';

export const ExamMiscPluginId = {
  HiddenMark: 'hidden-mark',
} as const;

export const createExamMiscPlugins = (group: GroupBuilder) => {
  group.append({
    id: ExamMiscPluginId.HiddenMark,
    onEnable() {
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
  });
};
