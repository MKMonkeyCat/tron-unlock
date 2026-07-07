import { LEARNING_PLATFORM_DOMAINS } from './const';
import pkg from './package.json';

import { defineManifest } from '@crxjs/vite-plugin';

const matches = LEARNING_PLATFORM_DOMAINS.map(
  (domain) => `https://${domain}/*`,
);

// Chrome's manifest `version` must be 1-4 dot-separated integers - it
// rejects semver pre-release suffixes like the "-dev.<sha>" pkg.version
// carries for "latest" CI builds. Fall back to the numeric major.minor.patch
// plus the CI run number as a 4th segment, and surface the full pkg.version
// via `version_name`, which Chrome displays as-is with no format restriction.
const numericVersion = pkg.version.match(/^\d+\.\d+\.\d+/)?.[0];
const manifestVersion = numericVersion
  ? numericVersion === pkg.version
    ? pkg.version
    : `${numericVersion}.${process.env.GITHUB_RUN_NUMBER ?? 0}`
  : '0.0.0';

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: manifestVersion,
  version_name: pkg.version,
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
      js: ['extension/relay.ts'],
      matches,
      run_at: 'document_start',
    },
  ],
  permissions: [
    'sidePanel', // for panel placement
    'contentSettings', // for video mute
    'storage', // for panel config persistence
    'tabs', // for video mute
  ],
  side_panel: {
    default_path: 'extension/panel/index.html',
  },
  background: {
    service_worker: 'extension/background.ts',
    type: 'module',
  },
});
