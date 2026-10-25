import { create } from 'zustand';

import type { Priority } from '@/lib/priority';

export type FilterTab = 'pending' | 'completed';

export interface FilterState {
  typeId: string | null;
  keyword: string;
  priorities: Priority[];
  overdueOnly: boolean;
}

function createEmptyFilters(): FilterState {
  return {
    typeId: null,
    keyword: '',
    priorities: [],
    overdueOnly: false,
  };
}

interface FilterStore {
  pending: FilterState;
  completed: FilterState;
  update: (tab: FilterTab, patch: Partial<FilterState>) => void;
  clear: (tab: FilterTab) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  pending: createEmptyFilters(),
  completed: createEmptyFilters(),

  update: (tab, patch) =>
    set((state) =>
      tab === 'pending'
        ? { pending: { ...state.pending, ...patch } }
        : { completed: { ...state.completed, ...patch } }
    ),

  clear: (tab) =>
    set((state) =>
      tab === 'pending'
        ? { pending: createEmptyFilters() }
        : { completed: createEmptyFilters() }
    ),
}));
