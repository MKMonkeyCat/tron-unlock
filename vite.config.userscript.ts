import pkg from './package.json';
import {
  minifyCssHtmlPlugin,
  minifyImportedRawCssPlugin,
} from './plugin/minify-css-html';
import { userScriptHeaderPlugin } from './plugin/user-script';

import path from 'path';
import { defineConfig } from 'vite';

// Tampermonkey userscript build: a single entry with no code-splitting, so
// the output is one self-contained file with no import statements - unlike
// the extension build (vite.config.ts), which shares chunks across multiple
// entries and would not work if pasted directly into a userscript manager.
export default defineConfig({
  define: {
    'import.meta.env.ARCH': 'userscript',
  },
  plugins: [
    minifyCssHtmlPlugin(),
    minifyImportedRawCssPlugin(),
    userScriptHeaderPlugin(pkg.version || '0.0.0'),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@@': path.resolve(__dirname, 'extension'),
    },
  },
  publicDir: false,
  build: {
    outDir: 'dist-userscript',
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/main.ts'),
      output: {
        format: 'iife',
        entryFileNames: 'main.user.js',
      },
    },
  },
  oxc: {
    jsx: {
      importSource: 'preact',
    },
  },
});
