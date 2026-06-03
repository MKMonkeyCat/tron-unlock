import { MK_BASE_CLASS } from '@/constants';

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

type Child = string | Node | DOMKit<any>;

export class DOMKit<T extends Element = Element> {
  constructor(public el: T) {}

  attr(name: string, value: string) {
    this.el.setAttribute(name, value);
    return this;
  }

  class(...cls: string[]) {
    this.el.classList.add(...cls);
    return this;
  }

  removeClass(...cls: string[]) {
    this.el.classList.remove(...cls);
    return this;
  }

  toggleClass(c: string) {
    this.el.classList.toggle(c);
    return this;
  }

  style(style: Partial<CSSStyleDeclaration>) {
    Object.assign((this.el as unknown as HTMLElement).style, style);
    return this;
  }

  append(...children: Child[]) {
    for (const c of children) {
      if (typeof c === 'string') {
        this.el.appendChild(document.createTextNode(c));
      } else if (c instanceof DOMKit) this.el.appendChild(c.el);
      else this.el.appendChild(c);
    }
    return this;
  }

  on<K extends keyof HTMLElementEventMap>(
    event: K,
    fn: (e: HTMLElementEventMap[K]) => void,
  ) {
    this.el.addEventListener(event, fn as any);
    return this;
  }

  off<K extends keyof HTMLElementEventMap>(event: K, fn: any) {
    this.el.removeEventListener(event, fn);
    return this;
  }

  text(v?: string) {
    if (v === undefined) return this.el.textContent ?? '';
    this.el.textContent = v;
    return this;
  }

  find<T extends Element = Element>(sel: string) {
    return $$<T>(sel, this.el);
  }
}

export const $$ = <T extends Element = Element>(
  selector: string,
  root: ParentNode = doc!,
) => new DOMList([...root.querySelectorAll(selector)] as T[]);

export class DOMList<T extends Element = Element> {
  constructor(public els: T[]) {}

  each(fn: (el: T, i: number) => void) {
    this.els.forEach(fn);
    return this;
  }

  addClass(c: string) {
    return this.each((el) => el.classList.add(c));
  }

  removeClass(c: string) {
    return this.each((el) => el.classList.remove(c));
  }

  on<K extends keyof HTMLElementEventMap>(
    event: K,
    fn: (e: HTMLElementEventMap[K]) => void,
  ) {
    return this.each((el) => el.addEventListener(event, fn as any));
  }

  text(v?: string) {
    if (v === undefined) return this.els[0]?.textContent ?? '';
    return this.each((el) => (el.textContent = v));
  }
}

export function $e<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options?: {
    class?: string[];
    attrs?: Record<string, string>;
    style?: Partial<CSSStyleDeclaration>;
    children?: Child[];
    isMk?: boolean;
  },
) {
  const el = document.createElement(tag);
  const kit = new DOMKit(el);

  if (options?.isMk ?? true) kit.class(MK_BASE_CLASS);
  if (options?.class) kit.class(...options.class);

  if (options?.attrs) {
    for (const [k, v] of Object.entries(options.attrs)) {
      el.setAttribute(k, v);
    }
  }

  if (options?.style) kit.style(options.style);

  if (options?.children) kit.append(...options.children);

  return kit;
}

// type Listener = () => void;

// class I18n {
//   private lang = 'en';
//   private dict: Record<string, Record<string, string>> = {};
//   private listeners = new Set<Listener>();

//   setLang(lang: string) {
//     this.lang = lang;
//     this.emit();
//   }

//   setDict(dict: Record<string, Record<string, string>>) {
//     this.dict = dict;
//   }

//   t(key: string) {
//     return this.dict[this.lang]?.[key] ?? key;
//   }

//   subscribe(fn: Listener) {
//     this.listeners.add(fn);
//     return () => this.listeners.delete(fn);
//   }

//   private emit() {
//     this.listeners.forEach((fn) => fn());
//   }
// }

// export const i18n = new I18n();

// class TextBinding {
//   #node: Text;
//   #key: string;
//   #unsub: () => void;

//   constructor(key: string) {
//     this.#key = key;
//     this.#node = document.createTextNode(i18n.t(key));

//     this.#unsub = i18n.subscribe(() => {
//       this.#node.textContent = i18n.t(this.#key);
//     });
//   }

//   getNode() {
//     return this.#node;
//   }
// }

// export const $t = (key: string): Node => new TextBinding(key).getNode();
