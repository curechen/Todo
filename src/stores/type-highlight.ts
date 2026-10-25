import { create } from 'zustand';

interface TypeHighlightState {
  typeId: string | null;
  highlight: (typeId: string) => void;
  clear: () => void;
}

let clearTimer: ReturnType<typeof setTimeout> | null = null;

export const useTypeHighlightStore = create<TypeHighlightState>((set) => ({
  typeId: null,

  highlight: (typeId) => {
    if (clearTimer) clearTimeout(clearTimer);
    set({ typeId });
    clearTimer = setTimeout(() => {
      set({ typeId: null });
      clearTimer = null;
    }, 2000);
  },

  clear: () => {
    if (clearTimer) clearTimeout(clearTimer);
    clearTimer = null;
    set({ typeId: null });
  },
}));
