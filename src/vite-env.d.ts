/// <reference types="vite/client" />
/// <reference types="angular" />
/// <reference types="tampermonkey" />
/// <reference types="jquery" />

import type {} from 'chrome-types';
import type {} from 'firefox-webext-browser';

declare global {
  interface JQuery<TElement = HTMLElement> {
    foundation?(method?: string, ...options: any[]): JQuery<TElement>;
  }
}

declare global {
  interface Window {
    angular: angular.IAngularStatic | undefined;
    $: JQueryStatic | undefined;
    jQuery: JQueryStatic | undefined;

    // TronClass variables
    statisticsSettings?: {
      showIdleWarning?: boolean;
      enableIdleWarning?: boolean;
    };
  }
  // interface Function {
  //   $inject?: readonly string[] | undefined;
  // }

  interface ImportMetaEnv {
    readonly ARCH: 'userscript' | 'extension';
    // more env variables...
  }
}
