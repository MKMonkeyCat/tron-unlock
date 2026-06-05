import manifest from './manifest.config';
import pkg from './package.json';
import {
  minifyCssHtmlPlugin,
  minifyImportedRawCssPlugin,
} from './plugin/minify-css-html';
import { userScriptHeaderPlugin } from './plugin/user-script';

import { crx } from '@crxjs/vite-plugin';
import path from 'path';
import { defineConfig } from 'vite';
import zip from 'vite-plugin-zip-pack';

export default defineConfig({
  plugins: [
    minifyCssHtmlPlugin(),
    minifyImportedRawCssPlugin(),
    userScriptHeaderPlugin(pkg.version || '0.0.0'),
    crx({ manifest }),
    zip({
      outDir: 'release',
      outFileName: `crx-${pkg.name || 'unknown'}-${pkg.version || '0.0.0'}.zip`,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
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
