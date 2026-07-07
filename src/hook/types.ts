export type RequestHookTransport = 'fetch' | 'xhr';
// | 'beacon' | 'websocket'

export interface EventHookPreHookContext<
  TType extends string = string,
  TTarget extends EventTarget = EventTarget,
> {
  type: TType;
  target: TTarget;
  listener: EventListenerOrEventListenerObject;
  options?: boolean | AddEventListenerOptions | undefined;
}

export interface EventHookPreCallContext<
  TEvent extends Event = Event,
  TType extends string = string,
  TTarget extends EventTarget = EventTarget,
> {
  type: TType;
  target: TTarget;
  event: TEvent;
  listener: EventListenerOrEventListenerObject;
}

export interface EventHookOptions<
  TEvent extends Event = Event,
  TType extends string = string,
  TTarget extends EventTarget = EventTarget,
> {
  preHookCheck?: (
    ctx: EventHookPreHookContext<TType, TTarget>,
  ) => boolean | void;
  preCallCheck?: (
    ctx: EventHookPreCallContext<TEvent, TType, TTarget>,
  ) => boolean | void;
}
