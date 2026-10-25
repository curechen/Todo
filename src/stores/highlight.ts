import { create } from 'zustand';

interface HighlightState {
  todoId: string | null;
  highlight: (todoId: string) => void;
  clear: () => void;
}

let clearTimer: ReturnType<typeof setTimeout> | null = null;

export const useHighlightStore = create<HighlightState>((set) => ({
  todoId: null,

  highlight: (todoId) => {
    if (clearTimer) clearTimeout(clearTimer);
    set({ todoId });
    clearTimer = setTimeout(() => {
      set({ todoId: null });
      clearTimer = null;
    }, 2000);
  },

  clear: () => {
    if (clearTimer) clearTimeout(clearTimer);
    clearTimer = null;
    set({ todoId: null });
  },
}));
