import type { RelayToPageMessage } from '@/core/runtime';
import { MK_BRIDGE_MARKER } from '@/core/runtime';
import { createStorage } from '@/core/storage';

const panelStore = createStorage({ namespace: 'mk-panel' });

chrome.runtime.onInstalled.addListener((opt) => {
  if (opt.reason === 'install') {
    chrome.tabs.create({
      active: true,
      url: chrome.runtime.getURL('welcome/index.html'),
    });
  } else if (opt.reason === 'update') {
    chrome.tabs.create({
      active: true,
      url: chrome.runtime.getURL('changelog/index.html'),
    });
  }
});

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
