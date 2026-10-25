import { create } from 'zustand';

export interface ToastAction {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastState {
  toast: ToastAction | null;
  timer: ReturnType<typeof setTimeout> | null;
  show: (toast: ToastAction) => void;
  dismiss: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toast: null,
  timer: null,

  show: (toast) => {
    const existing = get().timer;
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      set({ toast: null, timer: null });
    }, 4000);

    set({ toast, timer });
  },

  dismiss: () => {
    const existing = get().timer;
    if (existing) clearTimeout(existing);
    set({ toast: null, timer: null });
  },
}));
