import './courses';

declare global {
  namespace TronClassApi {
    export type ExtractRouteParams<T extends string> =
      T extends `${string}/:${infer Param}/${infer Rest}`
        ? { [K in Param]: string } & ExtractRouteParams<`/${Rest}`>
        : T extends `${string}/:${infer Param}`
          ? { [K in Param]: string }
          : never;

    export interface Endpoints {}

    export type AllRoutes = keyof Endpoints;

    export type ExtractMethod<R extends AllRoutes> =
      R extends `${infer M} ${string}` ? M : never;
    export type ExtractPath<R extends AllRoutes> =
      R extends `${string} ${infer P}` ? P : never;

    export type RequestConfig<R extends AllRoutes> = {
      params: ExtractRouteParams<ExtractPath<R>>;
      query: Endpoints[R] extends { query: infer Q } ? Q : never;
      body: Endpoints[R] extends { body: infer B } ? B : never;
    };
  }
}

export {};
