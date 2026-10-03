import { createJSONStorage, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { BLACKLIST_STORAGE_KEY } from '../app/constants';
import { chromeSyncStorage } from '../utilities/storage';

import type { BlacklistItem } from '../utilities/blacklist';

interface BlacklistState {
  readonly blacklistedItems: readonly BlacklistItem[];
  readonly addDomain: (value: string, isRegex: boolean) => void;
  readonly editDomain: (oldValue: string, newValue: string, newIsRegex: boolean) => void;
  readonly removeDomain: (value: string) => void;
}

interface PersistedBlacklistState {
  readonly blacklistedItems: readonly BlacklistItem[];
}

export const useBlacklistStore = createWithEqualityFn(
  persist<BlacklistState, [], [], PersistedBlacklistState>(
    (set) => ({
      blacklistedItems: [],
      addDomain: (value, isRegex) => {
        set((state) =>
          state.blacklistedItems.some((item) => item.value === value) ? state : { blacklistedItems: [...state.blacklistedItems, { value, isRegex }] },
        );
      },
      editDomain: (oldValue, newValue, newIsRegex) => {
        set((state) => ({
          blacklistedItems: state.blacklistedItems.map((item) => (item.value === oldValue ? { value: newValue, isRegex: newIsRegex } : item)),
        }));
      },
      removeDomain: (value) => {
        set((state) => ({
          blacklistedItems: state.blacklistedItems.filter((item) => item.value !== value),
        }));
      },
    }),
    {
      name: BLACKLIST_STORAGE_KEY,
      storage: createJSONStorage<PersistedBlacklistState>(() => chromeSyncStorage),
      partialize: (state) => ({ blacklistedItems: state.blacklistedItems }),
    },
  ),
  shallow,
);
