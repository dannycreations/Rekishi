import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  readonly id: number;
  readonly message: string;
  readonly type: ToastType;
}

interface ToastState {
  readonly toasts: readonly Toast[];
  readonly addToast: (message: string, type?: ToastType) => void;
  readonly removeToast: (id: number) => void;
}

let nextId = 0;

export const useToastStore = createWithEqualityFn<ToastState>(
  (set) => ({
    toasts: [],
    addToast: (message, type = 'info') => {
      const id = nextId++;
      set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    },
    removeToast: (id) => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    },
  }),
  shallow,
);
