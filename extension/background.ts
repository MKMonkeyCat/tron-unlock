import type { RelayToPageMessage } from '@/core/runtime';
import { MK_BRIDGE_MARKER } from '@/core/runtime';
import { createStorage } from '@/core/storage';

import { initDevReload } from './dev-reload';
import { registerHandlers } from './messaging/messenger';

// Static import, not `import('./dev-reload')`: a dynamic import here makes
// Vite split it into its own chunk and inject a browser-only modulePreload
// helper (`document.getElementsByTagName('link')`) into this chunk, which
// throws in the service worker (no `document`). Static import inlines it
// instead, and the runtime check below still keeps it inert in production.
if (import.meta.env.MODE === 'development') {
  void initDevReload();
}

export interface ExtensionMessages {
  TOGGLE_MUTE: [{ muted: boolean }, { success: boolean }];
  GET_MUTE_STATUS: [{}, { muted: boolean }];
}

const panelStore = createStorage({ namespace: 'mk-panel' });

// chrome.runtime.onInstalled.addListener((opt) => {
//   if (opt.reason === 'install') {
//     chrome.tabs.create({
//       active: true,
//       url: chrome.runtime.getURL('welcome/index.html'),
//     });
//   } else if (opt.reason === 'update') {
//     chrome.tabs.create({
//       active: true,
//       url: chrome.runtime.getURL('changelog/index.html'),
//     });
//   }
// });

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  const placement = await panelStore.get('placement', 'web');

  if (placement === 'plugin') {
    await chrome.sidePanel.open({ tabId: tab.id });
    return;
  }

  const request: RelayToPageMessage = {
    __mk: MK_BRIDGE_MARKER,
    from: 'relay',
    kind: 'request',
    id: crypto.randomUUID(),
    method: 'toggle-panel',
    args: [],
  };

  chrome.tabs.sendMessage(tab.id, request).catch(() => {});
});

registerHandlers({
  TOGGLE_MUTE: async ({ muted }, sender) => {
    if (!sender.tab?.id) return { success: false };

    await chrome.tabs.update(sender.tab.id, { muted });

    return { success: true };
  },
  GET_MUTE_STATUS: async (_payload, sender) => {
    if (!sender.tab?.id) return { muted: false };

    const tab = await chrome.tabs.get(sender.tab.id);

    return { muted: tab.mutedInfo?.muted ?? false };
  },
});
