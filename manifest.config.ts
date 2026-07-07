import { LEARNING_PLATFORM_DOMAINS } from './const';
import pkg from './package.json';

import { defineManifest } from '@crxjs/vite-plugin';

const matches = LEARNING_PLATFORM_DOMAINS.map(
  (domain) => `https://${domain}/*`,
);

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: 'public/logo.png',
  },
  action: {
    // default_icon: {
    //   48: 'public/logo.png',
    // },
    // no default_popup: keep chrome.action.onClicked usable for placement routing
  },
  content_scripts: [
    {
      js: ['src/main.ts'],
      matches,
      world: 'MAIN',
      run_at: 'document_start',
    },
    {
      js: ['src/relay.ts'],
      matches,
      run_at: 'document_start',
    },
  ],
  permissions: ['sidePanel', 'contentSettings', 'storage'],
  side_panel: {
    default_path: 'src/panel/index.html',
  },
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
});
