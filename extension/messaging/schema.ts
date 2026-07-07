export interface MessageSchema<TRequest = unknown, TResponse = unknown> {
  request: TRequest;
  response: TResponse;
}

export interface ExtensionMessages {
  TOGGLE_MUTE: MessageSchema<{ muted: boolean }, { success: boolean }>;
  GET_MUTE_STATUS: MessageSchema<Record<string, never>, { muted: boolean }>;
}

export type MessageType = keyof ExtensionMessages;
export type RequestOf<T extends MessageType> = ExtensionMessages[T]['request'];
export type ResponseOf<T extends MessageType> =
  ExtensionMessages[T]['response'];
