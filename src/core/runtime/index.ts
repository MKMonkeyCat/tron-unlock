import { win } from '@/utils/dom';

export const MK_BRIDGE_MARKER = '__mk_bridge__';

export type BridgeSource = 'page' | 'relay';

export interface BridgeRequest {
  __mk: typeof MK_BRIDGE_MARKER;
  from: 'relay';
  kind: 'request';
  id: string;
  method: string;
  args: unknown[];
}

export interface BridgeResponse {
  __mk: typeof MK_BRIDGE_MARKER;
  from: 'page';
  kind: 'response';
  id: string;
  ok: boolean;
  result?: unknown;
  error?: string;
}

export interface BridgePush {
  __mk: typeof MK_BRIDGE_MARKER;
  from: 'page';
  kind: 'push';
  event: string;
  payload: unknown;
}

export type PageToRelayMessage = BridgeResponse | BridgePush;
export type RelayToPageMessage = BridgeRequest;
export type BridgeMessage = PageToRelayMessage | RelayToPageMessage;

export const isBridgeMessage = (data: unknown): data is BridgeMessage =>
  typeof data === 'object' &&
  data !== null &&
  (data as { __mk?: unknown }).__mk === MK_BRIDGE_MARKER;

export type BridgeHandler = (...args: any[]) => unknown | Promise<unknown>;

export interface PageBridge {
  registerHandler(method: string, handler: BridgeHandler): () => void;
  push(event: string, payload: unknown): void;
  stop(): void;
}

/**
 * Runs on the MAIN-world content script. Answers requests relayed in from
 * the ISOLATED-world relay content script (which itself relays them from the
 * extension's side panel), and can proactively push events the other way.
 */
export const createPageBridge = (): PageBridge => {
  const handlers = new Map<string, BridgeHandler>();

  const respond = (message: PageToRelayMessage) => {
    win.postMessage(message, win.location.origin);
  };

  const handleMessage = (event: MessageEvent) => {
    const data = event.data;
    if (
      !isBridgeMessage(data) ||
      data.from !== 'relay' ||
      data.kind !== 'request'
    ) {
      return;
    }

    const request = data;
    const handler = handlers.get(request.method);

    Promise.resolve()
      .then(() => {
        if (!handler) {
          throw new Error(`Unknown bridge method: ${request.method}`);
        }
        return handler(...request.args);
      })
      .then((result) => {
        respond({
          __mk: MK_BRIDGE_MARKER,
          from: 'page',
          kind: 'response',
          id: request.id,
          ok: true,
          result,
        });
      })
      .catch((error: unknown) => {
        respond({
          __mk: MK_BRIDGE_MARKER,
          from: 'page',
          kind: 'response',
          id: request.id,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      });
  };

  win.addEventListener('message', handleMessage);

  return {
    registerHandler(method, handler) {
      handlers.set(method, handler);
      return () => handlers.delete(method);
    },
    push(event, payload) {
      respond({
        __mk: MK_BRIDGE_MARKER,
        from: 'page',
        kind: 'push',
        event,
        payload,
      });
    },
    stop() {
      win.removeEventListener('message', handleMessage);
    },
  };
};
