import type { ConfigData, FeatureId } from '@/core/feature/types';
import type { BridgeRequest, BridgeResponse } from '@/core/runtime';
import { isBridgeMessage, MK_BRIDGE_MARKER } from '@/core/runtime';
import type { PanelCategoryItem, PanelClient } from '@/ui/panel/client';

const PORT_NAME = 'mk-panel';

/**
 * Used only by the Chrome side panel page (`extension/panel/`), a separate
 * extension JS realm with no direct access to the content script's
 * `FeatureManager`. Talks to it over a `chrome.tabs.connect` port to
 * `extension/relay.ts` (ISOLATED world), which forwards into the MAIN-world page
 * bridge (`createPageBridge()` in `src/main.ts`).
 */
export const createRemotePanelClient = (): PanelClient => {
  let port: chrome.runtime.Port | null = null;
  let snapshot: PanelCategoryItem[] = [];
  const listeners = new Set<() => void>();
  const pending = new Map<string, (response: BridgeResponse) => void>();

  const notify = () => listeners.forEach((listener) => listener());

  const request = (method: string, ...args: unknown[]): Promise<unknown> =>
    new Promise((resolve, reject) => {
      if (!port) {
        reject(new Error('mk-panel: no active tab connection'));
        return;
      }

      const id = crypto.randomUUID();
      const message: BridgeRequest = {
        __mk: MK_BRIDGE_MARKER,
        from: 'relay',
        kind: 'request',
        id,
        method,
        args,
      };

      pending.set(id, (response) => {
        if (response.ok) resolve(response.result);
        else reject(new Error(response.error ?? 'mk-panel: request failed'));
      });

      port.postMessage(message);
    });

  const refreshSnapshot = async () => {
    try {
      snapshot = (await request('get-snapshot')) as PanelCategoryItem[];
      notify();
    } catch {
      // The active tab has no matching content script - keep the last
      // known snapshot instead of clearing the panel.
    }
  };

  const handlePortMessage = (message: unknown) => {
    if (!isBridgeMessage(message)) return;

    if (message.kind === 'response') {
      const resolve = pending.get(message.id);
      if (resolve) {
        pending.delete(message.id);
        resolve(message);
      }
      return;
    }

    if (message.kind === 'push' && message.event === 'snapshot-changed') {
      snapshot = message.payload as PanelCategoryItem[];
      notify();
    }
  };

  const connectToTab = (tabId: number) => {
    port?.disconnect();
    port = chrome.tabs.connect(tabId, { name: PORT_NAME });
    port.onMessage.addListener(handlePortMessage);
    port.onDisconnect.addListener(() => {
      port = null;
    });
    void refreshSnapshot();
  };

  const resolveActiveTab = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.id) connectToTab(tab.id);
  };

  void resolveActiveTab();
  chrome.tabs.onActivated.addListener(({ tabId }) => connectToTab(tabId));
  chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
    if (tab.active && info.status === 'complete') connectToTab(tabId);
  });

  return {
    getSnapshot: () => snapshot,
    setEnabled: async (id: FeatureId, enabled) => {
      await request('set-enabled', id, enabled);
      await refreshSnapshot();
    },
    setConfig: async (id: FeatureId, patch: Partial<ConfigData>) => {
      await request('set-config', id, patch);
      await refreshSnapshot();
    },
    onChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};
