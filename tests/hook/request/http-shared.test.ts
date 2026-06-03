import {
  HTTPRequestHookManager,
  type HTTPRequestInfo,
} from '../../../src/hook/request/http-shared';

import { beforeEach, describe, expect, test, vi } from 'vitest';

const setLocationOrigin = (origin: string) => {
  Object.defineProperty(globalThis, 'location', {
    value: { origin },
    configurable: true,
  });
};

describe('HTTPRequestHookManager', () => {
  beforeEach(() => {
    setLocationOrigin('https://example.test');
  });

  test('supports boolean test guards', async () => {
    const manager = new HTTPRequestHookManager();
    const onRequest = vi.fn();

    manager.register({ test: false, onRequest });
    manager.register({ test: true, onRequest });

    await manager.handleRequest({
      method: 'GET',
      url: new URL('https://example.test/api'),
      headers: {},
    } satisfies HTTPRequestInfo);

    expect(onRequest).toHaveBeenCalledTimes(1);
  });

  test('routes thrown hook errors into onError', async () => {
    const manager = new HTTPRequestHookManager();
    const onError = vi.fn();

    manager.register({
      test: true,
      onRequest() {
        throw new Error('boom');
      },
      onError,
    });

    await manager.handleRequest({
      method: 'POST',
      url: new URL('https://example.test/api'),
      headers: {},
    } satisfies HTTPRequestInfo);

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[1]).toBeInstanceOf(Error);
    expect((onError.mock.calls[0]?.[1] as Error).message).toBe('boom');
  });
});
