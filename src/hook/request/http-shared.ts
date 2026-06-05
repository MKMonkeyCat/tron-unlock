import { isFunction, type MaybePromise } from '@/utils';
import { win } from '@/utils/dom';

//#region Types
export class HTTPRequestHookManager {
  #hooks = new Set<HTTPRequestHook>();

  register(hook: HTTPRequestHook) {
    this.#hooks.add(hook);

    return () => this.#hooks.delete(hook);
  }

  async #shouldTrigger(
    { test }: HTTPRequestHook,
    info: HTTPRequestInfo,
  ): Promise<boolean> {
    if (isFunction(test)) return await test(info);
    if (typeof test === 'boolean') return test;

    const { url } = info;
    const urlStr = url.origin === win.location.origin ? url.pathname : url.href;

    if (test instanceof RegExp) return test.test(urlStr);
    if (typeof test === 'string') return urlStr.includes(test);
    return false;
  }

  async handleRequest(info: HTTPRequestInfo, body?: any) {
    let currentInfo = { ...info };
    let currentBody = body;

    for (const hook of this.#hooks) {
      if (await this.#shouldTrigger(hook, currentInfo)) {
        try {
          const result = await hook.onRequest?.(currentInfo, currentBody);
          if (result) {
            if (result.request) currentInfo = result.request;
            if (result.body !== undefined) currentBody = result.body;
          }
        } catch (error) {
          await hook.onError?.(
            currentInfo,
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      }
    }
    return { request: currentInfo, body: currentBody };
  }

  async handleResponse(info: HTTPRequestInfo, response: Response) {
    let currentResponse = response;
    let cachedBody: unknown = null;
    let lastProcessedResponse: Response | null = null;

    for (const hook of this.#hooks) {
      if (await this.#shouldTrigger(hook, info)) {
        if (currentResponse !== lastProcessedResponse) {
          const contentType = currentResponse.headers.get('Content-Type') || '';
          const lowerContentType = contentType.toLowerCase();

          const isJSON = lowerContentType.includes('application/json');
          const isText =
            isJSON ||
            lowerContentType.includes('text/') ||
            lowerContentType.includes('application/xml') ||
            lowerContentType.includes('application/javascript');

          if (isText) {
            const rawText = await currentResponse.clone().text();
            try {
              cachedBody =
                isJSON && rawText.trim() ? JSON.parse(rawText) : rawText;
            } catch {
              cachedBody = rawText;
            }
          } else {
            // TODO handle other types like blob, arrayBuffer, formData if needed
            cachedBody = null;
          }

          lastProcessedResponse = currentResponse;
        }

        try {
          const modifiedResponse = await hook.onResponse?.(
            info,
            currentResponse,
            cachedBody,
          );

          if (modifiedResponse instanceof Response) {
            currentResponse = modifiedResponse;
          } else if (typeof modifiedResponse === 'string') {
            currentResponse = new Response(modifiedResponse, {
              headers: currentResponse.headers,
              status: currentResponse.status,
              statusText: currentResponse.statusText,
            });
          }
        } catch (error) {
          await hook.onError?.(
            info,
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      }
    }
    return currentResponse;
  }
}

const instance = new HTTPRequestHookManager();
export { instance as httpRequestHookManager };
//#endregion

//#region Types

export interface HTTPRequestHook {
  test?:
    | ((request: HTTPRequestInfo) => MaybePromise<boolean>)
    | RegExp
    | string
    | boolean;

  onRequest?(
    request: HTTPRequestInfo,
    body?: any,
  ): MaybePromise<{ request?: HTTPRequestInfo; body?: any } | void>;

  onResponse?(
    request: HTTPRequestInfo,
    response: Response,
    body: any,
  ): MaybePromise<Response | string | void>;

  onError?(request: HTTPRequestInfo, error: Error): void | MaybePromise<void>;
}

export interface HTTPRequestInfo {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  url: URL;
  headers: Record<string, string>;
}
//#endregion
