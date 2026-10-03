import { createJSONStorage, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { BLACKLIST_STORAGE_KEY } from '../app/constants';
import { createBlacklistMatchers, isUrlBlacklisted } from '../utilities/blacklist';
import { chromeSyncStorage } from '../utilities/storage';

import type { BlacklistItem, BlacklistMatchers } from '../utilities/blacklist';

interface BlacklistState {
  readonly blacklistedItems: readonly BlacklistItem[];
  readonly addDomain: (value: string, isRegex: boolean) => void;
  readonly editDomain: (oldValue: string, newValue: string, newIsRegex: boolean) => void;
  readonly removeDomain: (value: string) => void;
  readonly isBlacklisted: (url: string) => boolean;
}

interface PersistedBlacklistState {
  readonly blacklistedItems: readonly BlacklistItem[];
}

const NO_ITEMS: readonly BlacklistItem[] = [];

export const useBlacklistStore = createWithEqualityFn(
  persist<BlacklistState, [], [], PersistedBlacklistState>(
    (set, get) => {
      // Compiling the blacklist into matchers is the expensive part, so one compiled form is kept per
      // distinct item list instead of being carried in the store state.
      let matchersSource = NO_ITEMS;
      let matchers = createBlacklistMatchers(NO_ITEMS);

      const matchersFor = (items: readonly BlacklistItem[]): BlacklistMatchers => {
        if (items !== matchersSource) {
          matchersSource = items;
          matchers = createBlacklistMatchers(items);
        }
        return matchers;
      };

      return {
        blacklistedItems: NO_ITEMS,
        addDomain: (value, isRegex) => {
          set((state) =>
            state.blacklistedItems.some((item) => item.value === value)
              ? state
              : { blacklistedItems: [...state.blacklistedItems, { value, isRegex }] },
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
        isBlacklisted: (url: string): boolean => {
          return isUrlBlacklisted(url, matchersFor(get().blacklistedItems));
        },
      };
    },
    {
      name: BLACKLIST_STORAGE_KEY,
      storage: createJSONStorage<PersistedBlacklistState>(() => chromeSyncStorage),
      partialize: (state) => ({ blacklistedItems: state.blacklistedItems }),
    },
  ),
  shallow,
);
