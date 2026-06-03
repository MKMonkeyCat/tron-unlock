import pkg from './package.json';

import { defineManifest } from '@crxjs/vite-plugin';

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
    // default_popup: 'src/popup/index.html',
  },
  content_scripts: [
    {
      js: ['src/main.ts'],
      matches: ['https://*/*'],
      world: 'MAIN',
      run_at: 'document_start',
    },
  ],
  permissions: ['sidePanel', 'contentSettings'],
  side_panel: {
    // default_path: 'src/sidepanel/index.html',
  },
  background: {
    service_worker: 'src/background.ts',
    type: 'module',
  },
});
