import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { chromeLocalStorage } from '../utilities/storageUtil';

interface HistoryState {
  readonly isRegex: boolean;
  readonly searchQuery: string;
  readonly selectedDate: Date;
  readonly setIsRegex: (value: boolean | ((prev: boolean) => boolean)) => void;
  readonly setSearchQuery: (query: string) => void;
  readonly setSelectedDate: (date: Date) => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      isRegex: false,
      searchQuery: '',
      selectedDate: new Date(),
      setIsRegex: (value) => set((state) => ({ isRegex: typeof value === 'function' ? value(state.isRegex) : value })),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedDate: (date) => set({ selectedDate: date, searchQuery: '' }),
    }),
    {
      name: 'rekishi-history',
      storage: createJSONStorage(() => chromeLocalStorage, {
        reviver: (key, value) => {
          if (key === 'selectedDate' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        },
      }),
      partialize: (state) => ({
        selectedDate: state.selectedDate,
      }),
    },
  ),
);
