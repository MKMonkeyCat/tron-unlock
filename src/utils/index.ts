export * from './base';
export * from './dom';
export * from './format';
export * from './i18n';
export * from './lib';
export * from './storage';
export * from './type';

export const clamp = (v: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, v));
};

export const rand = (min: number, max: number) => {
  return min + Math.random() * (max - min);
};

export const pick = <T>(arr: T[]) => {
  return arr[Math.floor(Math.random() * arr.length)];
};
