import { create } from 'zustand';

export interface UndoAction {
  message: string;
  restore: () => Promise<void>;
}

interface UndoState {
  action: UndoAction | null;
  timer: ReturnType<typeof setTimeout> | null;
  show: (action: UndoAction) => void;
  dismiss: () => void;
}

export const useUndoStore = create<UndoState>((set, get) => ({
  action: null,
  timer: null,

  show: (action) => {
    const existing = get().timer;
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      set({ action: null, timer: null });
    }, 5000);

    set({ action, timer });
  },

  dismiss: () => {
    const existing = get().timer;
    if (existing) clearTimeout(existing);
    set({ action: null, timer: null });
  },
}));
