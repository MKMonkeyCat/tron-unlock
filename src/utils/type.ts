declare const BrandSymbol: unique symbol;
export type Brand<T, B extends string> = T & { readonly [BrandSymbol]: B };

export type RequiredAt<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

export type MaybePromise<T> = T | Promise<T>;

export const isFunction = (value: unknown): value is Function => {
  return typeof value === 'function';
};

export const isObject = (value: unknown): value is object => {
  return typeof value === 'object' && value !== null;
};

export const isDict = (
  value: unknown,
): value is Record<PropertyKey, unknown> => {
  return isObject(value) && !Array.isArray(value);
};
