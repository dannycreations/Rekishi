import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { StateStorage } from 'zustand/middleware';

interface HistorySettingsState {
  isRegex: boolean;
  searchQuery: string;
  selectedDate: Date;
  setIsRegex: (value: boolean | ((prev: boolean) => boolean)) => void;
  setSearchQuery: (query: string) => void;
  setSelectedDate: (date: Date) => void;
}

const storage: StateStorage = {
  getItem: (name: string): string | null => {
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    localStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

export const useHistorySettingsStore = create<HistorySettingsState>()(
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
      name: 'rekishi-history-settings-storage',
      storage: createJSONStorage(() => storage, {
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
