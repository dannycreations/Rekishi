import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { chromeLocalStorage } from '../utilities/storageUtil';

interface HistoryState {
  readonly isRegex: boolean;
  readonly searchQuery: string;
  readonly selectedDate: Date;
  readonly setSearchQuery: (query: string) => void;
  readonly setSelectedDate: (date: Date) => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      isRegex: false,
      searchQuery: '',
      selectedDate: new Date(),
      setSearchQuery: (query) => {
        set({
          searchQuery: query,
          isRegex: query.length > 2 && query.startsWith('/') && query.endsWith('/'),
        });
      },
      setSelectedDate: (date) => {
        set({ selectedDate: date, searchQuery: '', isRegex: false });
      },
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
