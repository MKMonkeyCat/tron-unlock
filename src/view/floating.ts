import { skipHookFunc } from '@/utils';
import type { TranslationKey } from '@/utils/i18n';

import { createElement, createStyle } from '../utils/dom';
import { bound } from '../utils/hook/utils';

export type FloatingType = 'tooltip' | 'popover' | 'dropdown' | 'menu';

// TODO use 1 element pool to reduce DOM creation

export interface FloatingOptions {
  offset?: number;
  content?: string | HTMLElement;
  panelClassName?: string;
}

const DEFAULT_OFFSET = 8;
const FLOATING_ROOT_CLASSNAME = 'mk-floating-root';
const FLOATING_PANEL_CLASSNAME = 'mk-floating-panel';

const ROOT_ELEMENT = (() => {
  createStyle(`$css
    .${FLOATING_ROOT_CLASSNAME} {
      position: relative;
      z-index: 910000;
    }

    .${FLOATING_PANEL_CLASSNAME} {
      position: fixed;
      z-index: 910000;
      background: #222;
      color: #fff;
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 14px;
      line-height: 1.4;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      display: none;
      opacity: 0;
      transform: scale(0.98);
      transform-origin: center;
      transition: opacity 0.12s ease, transform 0.12s ease;
    }

    .${FLOATING_PANEL_CLASSNAME}.show {
      display: block;
      opacity: 1;
      transform: scale(1);
    }

    .${FLOATING_PANEL_CLASSNAME}.tooltip {
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      max-width: 240px;
      text-align: center;
      font-weight: 400;
    }

    .${FLOATING_PANEL_CLASSNAME}.popover {
      background: #fff;
      color: #222;
      border: 1px solid #ccc;
      border-radius: 8px;
      width: 260px;
      padding: 10px 12px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }

    .${FLOATING_PANEL_CLASSNAME}.menu,
    .${FLOATING_PANEL_CLASSNAME}.dropdown {
      background: #fff;
      color: #222;
      border: 1px solid #ccc;
      border-radius: 6px;
      min-width: 160px;
      overflow: hidden;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }

    .${FLOATING_PANEL_CLASSNAME}.dropdown button,
    .${FLOATING_PANEL_CLASSNAME}.menu a {
      display: block;
      width: 100%;
      text-align: left;
      padding: 8px 12px;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 14px;
      color: inherit;
      text-decoration: none;
      transition: background 0.12s ease;
    }

    .${FLOATING_PANEL_CLASSNAME}.menu a:hover,
    .${FLOATING_PANEL_CLASSNAME}.dropdown button:hover {
      background: #f0f0f0;
    }

    .${FLOATING_PANEL_CLASSNAME}::after {
      content: '';
      position: absolute;
      width: 8px;
      height: 8px;
      background: inherit;
      transform: rotate(45deg);
      z-index: -1;
    }

    .${FLOATING_PANEL_CLASSNAME}[data-placement='bottom']::after {
      top: -4px;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
      box-shadow: -1px -1px 2px rgba(0, 0, 0, 0.1);
    }

    .${FLOATING_PANEL_CLASSNAME}[data-placement='top']::after {
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
      box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
    }

    .${FLOATING_PANEL_CLASSNAME}[data-placement='right']::after {
      left: -4px;
      top: 50%;
      transform: translateY(-50%) rotate(45deg);
      box-shadow: -1px 1px 2px rgba(0, 0, 0, 0.1);
    }

    .${FLOATING_PANEL_CLASSNAME}[data-placement='left']::after {
      right: -4px;
      top: 50%;
      transform: translateY(-50%) rotate(45deg);
      box-shadow: 1px -1px 2px rgba(0, 0, 0, 0.1);
    }

    .${FLOATING_PANEL_CLASSNAME}[data-placement='top'].show {
      transform-origin: bottom center;
    }
    .${FLOATING_PANEL_CLASSNAME}[data-placement='bottom'].show {
      transform-origin: top center;
    }
    .${FLOATING_PANEL_CLASSNAME}[data-placement='left'].show {
      transform-origin: right center;
    }
    .${FLOATING_PANEL_CLASSNAME}[data-placement='right'].show {
      transform-origin: left center;
    }
  `);

  const el = createElement('div', FLOATING_ROOT_CLASSNAME);
  document.body.append(el);
  return el;
})();

export class FloatingUI {
  static active: FloatingUI | null = null;

  trigger: HTMLElement;
  panel: HTMLElement;
  type: FloatingType;
  offset: number;
  placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  private rafId = 0;

  constructor(
    trigger: HTMLElement,
    panel: HTMLElement,
    type: FloatingType,
    options?: FloatingOptions
  ) {
    this.trigger = trigger;
    this.panel = panel;
    this.type = type;
    this.offset = options?.offset ?? DEFAULT_OFFSET;
    this.init();
  }

  private init() {
    this.ensurePanelStyle();

    if (this.type === 'tooltip') {
      this.trigger.addEventListener('mouseenter', this.show);
      this.trigger.addEventListener('mouseleave', this.hide);
      this.trigger.addEventListener('focus', this.show);
      this.trigger.addEventListener('blur', this.hide);
      this.trigger.addEventListener('touchstart', this.onTouch, {
        passive: false,
      });
    } else {
      this.trigger.addEventListener(
        'click',
        skipHookFunc((e) => {
          e.stopPropagation();
          if (FloatingUI.active && FloatingUI.active !== this) {
            FloatingUI.active.hide();
          }
          this.toggle();
        })
      );
    }
  }

  private ensurePanelStyle() {
    if (!this.panel.classList.contains('floating')) {
      this.panel.classList.add('floating');
    }
    if (!this.panel.classList.contains(this.type)) {
      this.panel.classList.add(this.type);
    }
    this.panel.setAttribute(
      'role',
      this.type === 'tooltip' ? 'tooltip' : 'dialog'
    );
  }

  show = skipHookFunc(() => this._show());
  hide = skipHookFunc(() => this._hide());
  toggle = skipHookFunc(() => this._toggle());

  private _show() {
    if (FloatingUI.active && FloatingUI.active !== this) {
      FloatingUI.active.hide();
    }

    this.panel.classList.add('show');
    this.updatePosition();
    FloatingUI.active = this;

    document.addEventListener('click', this.onDocClick, true);
    document.addEventListener('keydown', this.onKeyDown, true);
    window.addEventListener('scroll', this.onScroll, true);
    window.addEventListener('resize', this.onScroll, true);
  }

  private _hide() {
    this.panel.classList.remove('show');
    cancelAnimationFrame(this.rafId);

    if (FloatingUI.active === this) FloatingUI.active = null;

    document.removeEventListener('click', this.onDocClick, true);
    document.removeEventListener('keydown', this.onKeyDown, true);
    window.removeEventListener('scroll', this.onScroll, true);
    window.removeEventListener('resize', this.onScroll, true);
  }

  private _toggle() {
    if (this.panel.classList.contains('show')) this.hide();
    else this.show();
  }

  private onScroll = skipHookFunc(() => {
    cancelAnimationFrame(this.rafId);
    this.rafId = bound.requestAnimationFrame(() => {
      if (this.panel.classList.contains('show')) this.updatePosition();
    });
  });

  private onKeyDown = skipHookFunc((e: KeyboardEvent) => {
    if (e.key === 'Escape') this.hide();
  });

  private onDocClick = skipHookFunc((e: Event) => {
    const t = e.target as Node;
    if (!this.panel.contains(t) && !this.trigger.contains(t)) this.hide();
  });

  private onTouch = skipHookFunc((e: TouchEvent) => {
    e.preventDefault();
    this.toggle();
  });

  updatePosition() {
    const rect = this.trigger.getBoundingClientRect();
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const offset = this.offset;
    const p = this.panel;

    let top = rect.bottom + offset;
    let left = rect.left + rect.width / 2 - p.offsetWidth / 2;
    this.placement = 'bottom';

    // 下方不夠 改上方
    if (top + p.offsetHeight > vpH - 4) {
      top = rect.top - p.offsetHeight - offset;
      this.placement = 'top';
    }

    // 左右邊界修正
    if (left < 4) left = 4;
    if (left + p.offsetWidth > vpW - 4) {
      left = vpW - p.offsetWidth - 4;
    }

    // 若上方也放不下 嘗試左右
    if (top < 4) {
      const rightSpace = vpW - rect.right;
      const leftSpace = rect.left;
      if (rightSpace > p.offsetWidth + offset) {
        left = rect.right + offset;
        top = rect.top + (rect.height - p.offsetHeight) / 2;
        this.placement = 'right';
      } else if (leftSpace > p.offsetWidth + offset) {
        left = rect.left - p.offsetWidth - offset;
        top = rect.top + (rect.height - p.offsetHeight) / 2;
        this.placement = 'left';
      } else {
        top = rect.bottom + offset;
        this.placement = 'bottom';
      }
    }

    top = Math.max(4, Math.min(vpH - p.offsetHeight - 4, top));
    left = Math.max(4, Math.min(vpW - p.offsetWidth - 4, left));

    p.style.top = `${top}px`;
    p.style.left = `${left}px`;
    p.dataset.placement = this.placement;
  }
}

const createPanel = (
  type: FloatingType,
  content?: string | HTMLElement,
  className?: string | string[]
): HTMLElement => {
  const el = createElement('div', 'mk-floating-panel', className ?? []);
  el.setAttribute('role', type === 'tooltip' ? 'tooltip' : 'dialog');

  if (typeof content === 'string') el.textContent = content;
  else if (content instanceof HTMLElement) el.append(content);

  ROOT_ELEMENT.append(el);
  return el;
};

// TODO add more options like delay, interactive, etc.
export const createTooltip = (
  trigger: HTMLElement,
  content: TranslationKey | HTMLElement,
  opt?: FloatingOptions
): FloatingUI => {
  return new FloatingUI(
    trigger,
    createPanel('tooltip', content, opt?.panelClassName),
    'tooltip',
    opt
  );
};

export const createPopover = (
  trigger: HTMLElement,
  content: string | HTMLElement,
  opt?: FloatingOptions
): FloatingUI => {
  return new FloatingUI(
    trigger,
    createPanel('popover', content, opt?.panelClassName),
    'popover',
    opt
  );
};

export const createDropdown = (
  trigger: HTMLElement,
  content: string | HTMLElement,
  opt?: FloatingOptions
): FloatingUI => {
  return new FloatingUI(
    trigger,
    createPanel('dropdown', content, opt?.panelClassName),
    'dropdown',
    opt
  );
};

export const createMenu = (
  trigger: HTMLElement,
  content: string | HTMLElement,
  opt?: FloatingOptions
): FloatingUI => {
  return new FloatingUI(
    trigger,
    createPanel('menu', content, opt?.panelClassName),
    'menu',
    opt
  );
};
