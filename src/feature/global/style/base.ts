import type { Feature } from '@/core/feature/types';

export interface BaseSetting extends Pick<
  Feature,
  'test' | 'setup' | 'onEnable' | 'onDisable' | 'state' | 'needPageReload'
> {
  css: string;
}

export type BaseSettings = Record<string, BaseSetting>;
