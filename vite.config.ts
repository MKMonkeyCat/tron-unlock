import manifest from './manifest.config';
import pkg from './package.json';
import {
  minifyCssHtmlPlugin,
  minifyImportedRawCssPlugin,
} from './plugin/minify-css-html';

import { crx } from '@crxjs/vite-plugin';
import path from 'path';
import { defineConfig } from 'vite';
import zip from 'vite-plugin-zip-pack';

// Chrome extension build: multiple entries (main.ts, relay.ts,
// background.ts, panel) that share chunked code via ES module imports. For
// the single-file Tampermonkey userscript build, see vite.config.userscript.ts.
export default defineConfig({
  plugins: [
    minifyCssHtmlPlugin(),
    minifyImportedRawCssPlugin(),
    crx({ manifest }),
    zip({
      outDir: 'release',
      outFileName: `crx-${pkg.name || 'unknown'}-${pkg.version || '0.0.0'}.zip`,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@@': path.resolve(__dirname, 'extension'),
    },
  },
  build: {
    minify: false,
  },
  oxc: {
    jsx: {
      importSource: 'preact',
    },
  },
});
