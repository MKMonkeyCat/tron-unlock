import { MK_BASE_CLASS, MK_SVG_CLASS } from '@/constants';

const globalScope = globalThis as typeof globalThis & {
  unsafeWindow?: typeof globalThis;
  window?: typeof globalThis;
  document?: Document;
};

export const win =
  globalScope.unsafeWindow ?? globalScope.window ?? globalScope;
export type WinType = typeof win;

export const doc =
  (win as typeof globalThis & { document?: Document }).document ??
  globalScope.document;

export const body = doc?.body;

export const parseClass = (
  ...classNames: (string | string[] | undefined)[]
): string[] => {
  return classNames.flatMap((className) => {
    if (typeof className === 'string') {
      return className.trim().split(/\s+/).filter(Boolean);
    }
    return className || [];
  });
};

export const createElement = <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  ...className: (string | string[])[]
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tagName);
  element.classList.add(MK_BASE_CLASS, ...parseClass(...className));
  return element;
};

export const createSvgFromString = (
  svgString: string,
  className?: string | string[],
): SVGSVGElement => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = doc.documentElement as unknown as SVGSVGElement;

  svgElement.classList.add(
    ...parseClass(className),
    MK_BASE_CLASS,
    MK_SVG_CLASS,
  );

  return svgElement;
};

export const waitElement = <T extends Element = Element>(
  selector: string,
  options: {
    root?: ParentNode | null;
    timeout?: number;
    signal?: AbortSignal;
  } = {},
): Promise<T> => {
  const { root = doc, timeout = 60_000, signal } = options;

  return new Promise<T>((resolve, reject) => {
    if (!root) {
      reject(new Error('waitElement: no document/root available'));
      return;
    }

    // Already present?
    const existing = root.querySelector<T>(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      observer.disconnect();
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(new Error(`waitElement: aborted while waiting for "${selector}"`));
    };

    const observer = new MutationObserver(() => {
      const el = root.querySelector<T>(selector);
      if (el) {
        cleanup();
        resolve(el);
      }
    });

    observer.observe(
      // MutationObserver needs a Node; ParentNode covers Document/Element/DocumentFragment
      root as unknown as Node,
      { childList: true, subtree: true },
    );

    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`waitElement: timed out waiting for "${selector}"`));
      }, timeout);
    }

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener('abort', onAbort);
    }
  });
};
