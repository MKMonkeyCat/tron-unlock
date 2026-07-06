import { doc } from './element';
import { isScriptManager } from '../base';

const createStyle = (css: string) => {
  const style = doc.createElement('style');
  style.textContent = css;
  return style;
};

export const injectStyle = (
  css: string,
  options: { id?: string; nonce?: string; target?: HTMLElement } = {},
): { style: HTMLStyleElement; remove: () => void } => {
  const { id, nonce, target = doc.head } = options;

  if (id) {
    const existing = target.querySelector<HTMLStyleElement>(`#${id}`);
    if (existing) {
      return {
        style: existing,
        remove: () => {
          existing.remove();
        },
      };
    }
  }

  const style = isScriptManager() ? GM_addStyle(css) : createStyle(css);

  if (!isScriptManager()) {
    if (id) style.id = id;
    if (nonce) style.setAttribute('nonce', nonce);

    target.appendChild(style);
  } else if (id) style.id = id;

  const remove = () => {
    style?.remove?.();
  };

  return { style, remove };
};
