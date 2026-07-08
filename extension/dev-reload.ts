import { createStorage } from '@/core/storage';

import { LEARNING_PLATFORM_DOMAINS } from '../const';

// Dev-only: pairs with scripts/dev-reload-server.mjs. Long-polls the local
// dev server; a pending fetch keeps the MV3 service worker alive so we don't
// need chrome.alarms (min 1min granularity - too slow for this).
const DEV_RELOAD_URL = 'http://127.0.0.1:5680/wait';
const RETRY_DELAY_MS = 2000;

const devStore = createStorage({ namespace: 'mk-dev-reload' });

const matches = LEARNING_PLATFORM_DOMAINS.map(
  (domain) => `https://${domain}/*`,
);

const reloadMatchingTabs = async () => {
  const tabs = await chrome.tabs.query({ url: matches });
  await Promise.all(
    tabs
      .filter(
        (tab): tab is chrome.tabs.Tab & { id: number } => tab.id !== undefined,
      )
      .map((tab) => chrome.tabs.reload(tab.id).catch(() => {})),
  );
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const pollForChanges = async () => {
  for (;;) {
    try {
      const res = await fetch(DEV_RELOAD_URL);
      const data = (await res.json()) as { changed: boolean };
      if (data.changed) {
        // chrome.runtime.reload() tears down this worker immediately, so the
        // "reload the open tabs" step has to happen on the *next* worker
        // startup - persist a flag it can pick up.
        await devStore.set('pending', true);
        chrome.runtime.reload();
        return;
      }
    } catch {
      await sleep(RETRY_DELAY_MS);
    }
  }
};

export const initDevReload = async () => {
  if (await devStore.get<boolean>('pending', false)) {
    await devStore.remove('pending');
    await reloadMatchingTabs();
  }

  void pollForChanges();
};
