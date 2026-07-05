import { LEARNING_PLATFORM_DOMAINS } from '../const';

import type { Plugin } from 'vite';

const userScriptHeader = (version?: string) => `// ==UserScript==
// @name         一些 TronClass 功能 - DEV
// @namespace    https://github.com/MKMonkeyCat/ulearn-script
// @version      ${version || 'v0.0.0-dev'}
// @description  移除頁腳、修復部份樣式、繞過下載限制、繞過快轉限制、繞過複製限制、繞過畫面切換檢測、繞過全螢幕檢測等等
// @license      MIT
// @author       MonkeyCat
${LEARNING_PLATFORM_DOMAINS.map((url) => `// @match        https://${url}/*`).join('\n')}
// @match        http*//10.0.20.15*
// @match        https://coreyadam8.github.io/copyguard/
// @match        https://theajack.github.io/disable-devtool/
// @match        https://blog.aepkill.com/demos/devtools-detector/
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @run-at       document-start
// ==/UserScript==`;

export const userScriptHeaderPlugin = (version: string): Plugin => ({
  name: 'vite-plugin-userscript-header',
  enforce: 'post',
  apply: 'build',
  generateBundle(_options, bundle) {
    for (const fileName in bundle) {
      const asset = bundle[fileName];
      if (
        asset.type === 'chunk' &&
        asset.isEntry &&
        fileName.endsWith('.js') &&
        fileName.split('/').pop()?.startsWith('main')
      ) {
        asset.code = `${userScriptHeader(version)}\n\n${asset.code}`;
      }
    }
  },
});
