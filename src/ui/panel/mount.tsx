import { ENV, Environment } from '@/utils/base';
import { doc } from '@/utils/dom';

import type { PanelClient } from './client';
import { PanelApp } from './PanelApp';
import { loadPanelState } from './persistence';

import { render } from 'preact';

export interface InlinePanelHandle {
  toggle: () => void;
}

const MODIFIER_KEYS = new Set(['ctrl', 'cmd', 'meta', 'shift', 'alt']);

const parseShortcut = (shortcut: string) => {
  const parts = shortcut
    .toLowerCase()
    .split('+')
    .map((part) => part.trim());

  return {
    mod:
      parts.includes('ctrl') || parts.includes('cmd') || parts.includes('meta'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    key: parts.filter((part) => !MODIFIER_KEYS.has(part)).pop() ?? '',
  };
};

const matchesShortcut = (event: KeyboardEvent, shortcut: string): boolean => {
  if (!shortcut) return false;
  const parsed = parseShortcut(shortcut);

  return (
    parsed.mod === (event.ctrlKey || event.metaKey) &&
    parsed.shift === event.shiftKey &&
    parsed.alt === event.altKey &&
    parsed.key === event.key.toLowerCase()
  );
};

const appendWhenBodyReady = (el: HTMLElement) => {
  if (doc.body) {
    doc.body.appendChild(el);
    return;
  }

  const observer = new MutationObserver(() => {
    if (!doc.body) return;
    doc.body.appendChild(el);
    observer.disconnect();
  });
  observer.observe(doc.documentElement, { childList: true });
};

export const mountInlinePanel = async (
  client: PanelClient,
): Promise<InlinePanelHandle> => {
  const host = doc.createElement('div');
  host.id = 'mk-panel-container';
  appendWhenBodyReady(host);

  const canUsePlugin =
    ENV === Environment.ChromeExtension || ENV === Environment.FirefoxExtension;

  let toggle = () => {};

  await loadPanelState().then((state) => {
    doc.addEventListener('keydown', (event) => {
      if (matchesShortcut(event, state.toggleShortcut)) {
        event.preventDefault();
        toggle();
      }
    });
  });

  const container = host.attachShadow({ mode: 'open' });
  render(
    <PanelApp
      client={client}
      mode="inline"
      canUsePlugin={canUsePlugin}
      container={container}
      onToggleReady={(fn) => {
        toggle = fn;
      }}
    />,
    container,
  );

  return {
    toggle: () => toggle(),
  };
};
