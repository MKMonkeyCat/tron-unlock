import type { BridgeResponse, RelayToPageMessage } from '@/core/runtime';
import { isBridgeMessage } from '@/core/runtime';

/**
 * ISOLATED-world content script. Bridges chrome.runtime messaging (from the
 * background service worker's one-shot `toggle-panel` relay, and from the
 * side panel's long-lived `mk-panel` port) into the MAIN-world page bridge
 * (`createPageBridge()` in main.ts), which runs in a separate JS realm with
 * no access to `chrome.*` APIs.
 */

const ports = new Set<chrome.runtime.Port>();
const pendingResponses = new Map<
  string,
  (response: BridgeResponse) => void
>();

window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  const data = event.data;
  if (!isBridgeMessage(data) || data.from !== 'page') return;

  if (data.kind === 'push') {
    ports.forEach((port) => port.postMessage(data));
    return;
  }

  const resolve = pendingResponses.get(data.id);
  if (resolve) {
    pendingResponses.delete(data.id);
    resolve(data);
    return;
  }

  ports.forEach((port) => port.postMessage(data));
});

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isBridgeMessage(message) || message.kind !== 'request') return;

  pendingResponses.set(message.id, sendResponse);
  window.postMessage(message satisfies RelayToPageMessage, window.location.origin);

  return true;
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'mk-panel') return;

  ports.add(port);

  port.onMessage.addListener((message: unknown) => {
    if (!isBridgeMessage(message)) return;
    window.postMessage(message, window.location.origin);
  });

  port.onDisconnect.addListener(() => {
    ports.delete(port);
  });
});
