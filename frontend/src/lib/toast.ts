/**
 * Lightweight module-level toast event bus.
 * Works from anywhere — React components, Redux thunks, or plain functions.
 * Timing is owned by the Toaster component; this module is a pure store + emitter.
 */

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

type Subscriber = (toasts: readonly Toast[]) => void;

let toasts: Toast[] = [];
const subscribers = new Set<Subscriber>();

const notify = () => {
  const snapshot = [...toasts] as const;
  subscribers.forEach((fn) => fn(snapshot));
};

const add = (type: ToastType, message: string): string => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  toasts = [...toasts, { id, type, message }];
  notify();
  return id;
};

const dismiss = (id: string): void => {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
};

const subscribe = (fn: Subscriber): (() => void) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};

export const toast = {
  success: (message: string) => add("success", message),
  error:   (message: string) => add("error",   message),
  info:    (message: string) => add("info",     message),
  warning: (message: string) => add("warning",  message),
  dismiss,
  subscribe,
};
