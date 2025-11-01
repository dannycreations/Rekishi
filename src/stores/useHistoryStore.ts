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
      setIsRegex: (value) =>
        set((state) => {
          if (typeof value === 'function') {
            return { isRegex: value(state.isRegex) };
          }
          return { isRegex: value };
        }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedDate: (date) => set({ selectedDate: date, searchQuery: '' }),
    }),
    {
      name: 'rekishi-history',
      storage: createJSONStorage(() => chromeLocalStorage, {
        reviver: (key: string, value: unknown) => {
          if (key === 'selectedDate' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        },
      }),
      partialize: (state) => {
        return {
          selectedDate: state.selectedDate,
        };
      },
    },
  ),
);
