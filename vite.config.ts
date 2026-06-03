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

const MINIFY = process.env.MINIFY === 'true';

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
    ...(MINIFY
      ? {
          minify: 'terser',
          terserOptions: {
            mangle: true,
            compress: {
              drop_console: false,
              dead_code: false,
              keep_fnames: false,
              keep_classnames: false,
            },
            format: { comments: false },
          },
        }
      : { minify: false }),
    // lib: {
    //   entry: 'src/main.ts',
    //   name: 'ULearn',
    //   fileName: 'ULearn',
    //   formats: ['iife'],
    // },
    // outDir: path.resolve(__dirname, 'dist/browser'),
  },
});
