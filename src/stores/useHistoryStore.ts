import { createJSONStorage, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { HISTORY_STORAGE_KEY } from '../app/constants';
import { chromeLocalStorage } from '../utilities/storageUtil';

interface HistoryState {
  readonly searchQuery: string;
  readonly selectedDate: Date;
  readonly setSearchQuery: (query: string) => void;
  readonly setSelectedDate: (date: Date) => void;
}

export const useHistoryStore = createWithEqualityFn(
  persist<HistoryState>(
    (set) => ({
      searchQuery: '',
      selectedDate: new Date(),
      setSearchQuery: (query) => {
        set({
          searchQuery: query,
        });
      },
      setSelectedDate: (date) => {
        set({ selectedDate: date, searchQuery: '' });
      },
    }),
    {
      name: HISTORY_STORAGE_KEY,
      storage: createJSONStorage(() => chromeLocalStorage, {
        reviver: (key: string, value: unknown): unknown => {
          if (key === 'selectedDate' && typeof value === 'string') {
            return new Date(value);
          }
          return value;
        },
      }),
      partialize: (state) =>
        ({
          selectedDate: state.selectedDate,
        }) as HistoryState,
    },
  ),
  shallow,
);
