import type { MessageType, RequestOf, ResponseOf } from './schema';

interface Envelope<T extends MessageType = MessageType> {
  type: T;
  payload: RequestOf<T>;
}

export class Messenger {
  static async send<T extends MessageType>(
    type: T,
    payload: RequestOf<T>,
  ): Promise<ResponseOf<T>> {
    const envelope: Envelope<T> = { type, payload };

    try {
      return await chrome.runtime.sendMessage(envelope);
    } catch (err) {
      throw new Error(`[Messenger] ${type} error: ${(err as Error).message}`);
    }
  }

  static async sendToTab<T extends MessageType>(
    tabId: number,
    type: T,
    payload: RequestOf<T>,
  ): Promise<ResponseOf<T>> {
    const envelope: Envelope<T> = { type, payload };

    try {
      return await chrome.tabs.sendMessage(tabId, envelope);
    } catch (err) {
      throw new Error(`[Messenger] ${type} error: ${(err as Error).message}`);
    }
  }
}

type Handler<T extends MessageType> = (
  payload: RequestOf<T>,
  sender: chrome.runtime.MessageSender,
) => ResponseOf<T> | Promise<ResponseOf<T>>;

type HandlerMap = Required<{ [K in MessageType]: Handler<K> }>;

const invokeHandler = (
  handlers: HandlerMap,
  raw: Envelope,
  sender: chrome.runtime.MessageSender,
): ResponseOf<MessageType> | Promise<ResponseOf<MessageType>> => {
  const handler = handlers[raw.type] as (
    payload: unknown,
    sender: chrome.runtime.MessageSender,
  ) => ResponseOf<MessageType> | Promise<ResponseOf<MessageType>>;

  return handler(raw.payload, sender);
};

export const registerHandlers = (handlers: HandlerMap): void => {
  chrome.runtime.onMessage.addListener(
    (raw: Envelope, sender, sendResponse) => {
      const result = invokeHandler(handlers, raw, sender);

      if (result instanceof Promise) {
        result.then(sendResponse).catch((err) => {
          console.error(`[Messenger] handler ${raw.type} error:`, err);
          sendResponse(undefined);
        });
        return true;
      }
      sendResponse(result);
      return false;
    },
  );
};
