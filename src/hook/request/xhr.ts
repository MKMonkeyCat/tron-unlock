import { setHiddenProperty } from '@/utils';
import { win } from '@/utils/dom';

import { httpRequestHookManager, type HTTPRequestInfo } from './http-shared';
import { bound, hookManager } from '../function-hook';

export const REQUEST_CONTEXT_SYMBOL = Symbol('XHR_REQUEST_CONTEXT');

const parseResponseHeaders = (xhr: XMLHttpRequest): Record<string, string> => {
  return xhr
    .getAllResponseHeaders()
    .split('\r\n')
    .reduce(
      (acc, line) => {
        const [key, ...value] = line.split(': ');
        if (key) acc[key.toLowerCase()] = value.join(': ');
        return acc;
      },
      {} as Record<string, string>,
    );
};

export const initializeXHRHook = () => {
  const XHR = win.XMLHttpRequest;

  if (!XHR || !XHR.prototype) return;

  hookManager.register(XHR.prototype, 'open', function (original, ...args) {
    if (args.length < 2) {
      return bound.Reflect.apply(original, this, args);
    }

    // args: method, url, async?, username?, password?
    const [method, url] = args;

    // TODO optimization (use buildRequestInfo or ... ?)
    const requestContext = {
      method: method.toUpperCase() as HTTPRequestInfo['method'],
      url: url instanceof URL ? url : new URL(url, location.href),
      headers: {}, // wait for `setRequestHeader` to populate
    } satisfies HTTPRequestInfo;

    setHiddenProperty(this, REQUEST_CONTEXT_SYMBOL, requestContext);

    return bound.Reflect.apply(original, this, args);
  });

  hookManager.register(
    XHR.prototype,
    'setRequestHeader',
    function (original, ...args) {
      const context = (this as WithRequestContext<typeof this>)[
        REQUEST_CONTEXT_SYMBOL
      ];

      if (context) {
        const [name, value] = args;

        context.headers[name.toLowerCase()] = value;
      }

      return bound.Reflect.apply(original, this, args);
    },
  );

  const defineXHRProperty = <
    T extends XMLHttpRequest,
    K extends keyof XMLHttpRequest,
  >(
    xhr: T,
    key: K,
    value: T[K],
  ) =>
    bound.Object.defineProperty(xhr, key, {
      value,
      configurable: true,
    });

  hookManager.register(XHR.prototype, 'send', async function (original, body) {
    const context = (this as WithRequestContext<typeof this>)[
      REQUEST_CONTEXT_SYMBOL
    ] as HTTPRequestInfo;

    if (!context) return bound.Reflect.apply(original, this, [body]);

    // 處理請求攔截器
    const { request, body: finalBody } =
      await httpRequestHookManager.handleRequest(context, body);

    // 如果 Hook 修改了 URL 或 Method，需要重新 open (僅限未發送狀態)
    // 注意：這裡為了簡化，假設主要修改的是 body 與 headers

    // 監聽響應：攔截真正的數據返回
    const onDone = async () => {
      // xhr.readyState:
      // UNSET: 0, OPENED: 1, HEADERS_RECEIVED: 2, LOADING: 3, DONE: 4
      if (this.readyState === 4) /* DONE */ {
        if (this.status < 200 || this.status > 599) return;

        const responseType = this.responseType;
        if (
          responseType &&
          responseType !== 'text' &&
          responseType !== 'json'
        ) {
          return;
        }

        const originalBody =
          responseType === 'json'
            ? JSON.stringify(this.response)
            : this.response;

        const originalResponse = new Response(originalBody, {
          status: this.status,
          statusText: this.statusText,
          headers: parseResponseHeaders(this),
        });

        const modifiedResponse = await httpRequestHookManager.handleResponse(
          request,
          originalResponse,
        );

        // if response was modified
        if (modifiedResponse !== originalResponse) {
          if (responseType === 'json') {
            const newJson = await modifiedResponse.json();

            defineXHRProperty(this, 'response', newJson);
            defineXHRProperty(this, 'responseText', JSON.stringify(newJson));
          } else {
            const newBody = await modifiedResponse.text();

            defineXHRProperty(this, 'responseText', newBody);
            defineXHRProperty(this, 'response', newBody);
          }
          defineXHRProperty(this, 'status', modifiedResponse.status);
          defineXHRProperty(this, 'statusText', modifiedResponse.statusText);
        }
      }
    };

    // 注入響應攔截監聽
    const originalStateChange = this.onreadystatechange;
    this.onreadystatechange = function (e) {
      onDone()
        .catch((error) => {
          console.error('XHR response hook failed:', error);
        })
        .finally(() => originalStateChange?.call(this, e));
    };

    // 執行原始發送
    return bound.Reflect.apply(original, this, [finalBody]);
  });
};

type WithRequestContext<T> = T & {
  [REQUEST_CONTEXT_SYMBOL]?: HTTPRequestInfo;
};
