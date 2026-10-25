import { create } from 'zustand';

import { getSetting, setSetting } from '@/db';
import { DEFAULT_SORT_MODE, isSortMode, type SortMode } from '@/lib/sort';

interface SettingsState {
  sortMode: SortMode;
  loaded: boolean;
  load: () => Promise<void>;
  setSortMode: (mode: SortMode) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  sortMode: DEFAULT_SORT_MODE,
  loaded: false,

  load: async () => {
    if (get().loaded) return;

    try {
      const value = await getSetting('sort_mode');
      if (isSortMode(value)) {
        set({ sortMode: value, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  setSortMode: async (mode) => {
    set({ sortMode: mode });
    try {
      await setSetting('sort_mode', mode);
    } catch {
      // Keep the UI selection even if persistence fails.
    }
  },
}));
