import { createJSONStorage, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { BLACKLIST_STORAGE_KEY } from '../app/constants';
import { createBlacklistMatchers, isDomainBlacklisted } from '../utilities/blacklistUtil';
import { chromeLocalStorage } from '../utilities/storageUtil';

import type { StateStorage } from 'zustand/middleware';
import type { BlacklistItem, BlacklistMatchers } from '../utilities/blacklistUtil';

interface BlacklistState {
  blacklistedItems: readonly BlacklistItem[];
  blacklistMatchers: BlacklistMatchers;
  readonly addDomain: (value: string, isRegex: boolean) => void;
  readonly editDomain: (oldValue: string, newValue: string, newIsRegex: boolean) => void;
  readonly removeDomain: (value: string) => void;
  readonly isBlacklisted: (domain: string) => boolean;
}

export const useBlacklistStore = createWithEqualityFn(
  persist<BlacklistState>(
    (set, get) => ({
      blacklistedItems: [],
      blacklistMatchers: { plain: new Set(), combinedRegex: null },
      addDomain: (value, isRegex) => {
        set((state) => {
          if (state.blacklistedItems.some((item) => item.value === value)) {
            return state;
          }
          const newItems = [...state.blacklistedItems, { value, isRegex }];
          return {
            blacklistedItems: newItems,
            blacklistMatchers: createBlacklistMatchers(newItems),
          };
        });
      },
      editDomain: (oldValue, newValue, newIsRegex) => {
        set((state) => {
          const newItems = state.blacklistedItems.map((item) => {
            if (item.value === oldValue) {
              return { value: newValue, isRegex: newIsRegex };
            }
            return item;
          });
          return {
            blacklistedItems: newItems,
            blacklistMatchers: createBlacklistMatchers(newItems),
          };
        });
      },
      removeDomain: (value) => {
        set((state) => {
          const newItems = state.blacklistedItems.filter((item) => item.value !== value);
          return {
            blacklistedItems: newItems,
            blacklistMatchers: createBlacklistMatchers(newItems),
          };
        });
      },
      isBlacklisted: (domain: string): boolean => {
        return isDomainBlacklisted(domain, get().blacklistMatchers);
      },
    }),
    {
      name: BLACKLIST_STORAGE_KEY,
      storage: createJSONStorage(() => chromeLocalStorage as StateStorage),
      partialize: (state) => ({ blacklistedItems: state.blacklistedItems }) as BlacklistState,
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.blacklistMatchers = createBlacklistMatchers(state.blacklistedItems);
        }
      },
    },
  ),
  shallow,
);
