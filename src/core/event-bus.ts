export type Unsubscribe = () => void;

export interface EventBus<T> {
  on(listener: (payload: T) => void): Unsubscribe;
  emit(payload: T): void;
  clear(): void;
}

export const createEventBus = <T = void>(): EventBus<T> => {
  const listeners = new Set<(payload: T) => void>();

  return {
    on(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit(payload) {
      listeners.forEach((listener) => listener(payload));
    },
    clear() {
      listeners.clear();
    },
  };
};
