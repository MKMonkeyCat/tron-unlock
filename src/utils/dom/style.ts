import { doc } from './element';

export const injectStyle = (
  css: string,
  options: { id?: string; nonce?: string; target?: HTMLElement } = {},
): { style: HTMLStyleElement; remove: () => void } => {
  const { id, nonce, target = doc.head } = options;

  const style = doc.createElement('style');

  if (id) style.id = id;
  if (nonce) style.setAttribute('nonce', nonce);

  style.textContent = css;
  target.appendChild(style);

  const remove = () => {
    style.parentNode?.removeChild(style);
  };

  return { style, remove };
};
