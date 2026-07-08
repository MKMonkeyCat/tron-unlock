import { skipHookFunc } from '@/hook/skip';

import { doc } from './element';

export const onClickOutside = (
  target: Element,
  handler: (event: MouseEvent) => void,
  ignore: (string | Element)[] = [],
) => {
  if (!target) return () => {};

  const shouldIgnore = (ev: MouseEvent) => {
    const path = ev.composedPath();
    return ignore.some((item) => {
      if (typeof item === 'string') {
        return Array.from(doc.querySelectorAll(item)).some(
          (el) => el === ev.target || path.includes(el),
        );
      } else {
        return item && (item === ev.target || path.includes(item));
      }
    });
  };

  const listener = skipHookFunc((event: MouseEvent) => {
    if (
      event.target &&
      !target.contains(event.target as Node) &&
      !shouldIgnore(event)
    ) {
      handler(event);
    }
  });

  doc.addEventListener('click', listener);

  // Return stop function
  return () => doc.removeEventListener('click', listener);
};
