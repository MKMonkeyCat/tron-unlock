import { win } from '@/utils/dom';

import { httpRequestHookManager, type HTTPRequestInfo } from './http-shared';
import { bound, hookManager } from '../function-hook';

const buildHeadersObject = (headers: Headers): Record<string, string> => {
  const result: Record<string, string> = {};

  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });

  return result;
};

export const buildRequestInfo = (request: Request): HTTPRequestInfo => ({
  method: request.method.toUpperCase() as HTTPRequestInfo['method'],
  url: new URL(request.url, location.href),
  headers: buildHeadersObject(request.headers),
});

const isTextLikeRequest = (request: Request): boolean => {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';

  return (
    contentType.startsWith('text/') ||
    contentType.includes('json') ||
    contentType.includes('xml') ||
    contentType.includes('x-www-form-urlencoded') ||
    contentType.includes('javascript')
  );
};

export const initializeFetchHook = () => {
  const fetchFn = win.fetch;

  if (!fetchFn) return;

  hookManager.register(win, 'fetch', async function (originalFetch, ...args) {
    const [input, init] = args as [RequestInfo | URL, RequestInit?];
    const request =
      input instanceof Request ? input : new Request(input.toString(), init);
    const requestInfo = buildRequestInfo(request);

    let body: BodyInit | undefined;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        body = isTextLikeRequest(request)
          ? await request.clone().text()
          : await request.clone().arrayBuffer();
      } catch {
        body = undefined;
      }
    }

    const { request: nextInfo, body: nextBody } =
      await httpRequestHookManager.handleRequest(requestInfo, body);

    const shouldRebuildRequest =
      nextInfo.method !== requestInfo.method ||
      nextInfo.url.href !== requestInfo.url.href ||
      JSON.stringify(nextInfo.headers) !==
        JSON.stringify(requestInfo.headers) ||
      nextBody !== body;

    const nextInit: RequestInit = {
      method: nextInfo.method,
      headers: nextInfo.headers,
      credentials: request.credentials,
      cache: request.cache,
      mode: request.mode,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
      integrity: request.integrity,
      keepalive: request.keepalive,
      signal: request.signal,
    };

    if (nextBody !== undefined) {
      nextInit.body = nextBody as BodyInit;
    }

    const requestToSend = shouldRebuildRequest
      ? nextInfo.url.href === requestInfo.url.href
        ? new Request(request, nextInit)
        : new Request(nextInfo.url, nextInit)
      : request;

    const response = (await bound.Reflect.apply(originalFetch, this, [
      requestToSend,
    ])) as Response;

    return httpRequestHookManager.handleResponse(nextInfo, response);
  });
};
