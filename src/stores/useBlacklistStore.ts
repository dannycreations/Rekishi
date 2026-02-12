import { createJSONStorage, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { BLACKLIST_STORAGE_KEY } from '../app/constants';
import { createBlacklistMatchers, isUrlBlacklisted } from '../helpers/blacklistHelper';
import { chromeSyncStorage } from '../helpers/storageHelper';

import type { BlacklistItem, BlacklistMatchers } from '../helpers/blacklistHelper';

interface BlacklistState {
  readonly blacklistedItems: readonly BlacklistItem[];
  readonly addDomain: (value: string, isRegex: boolean) => void;
  readonly editDomain: (oldValue: string, newValue: string, newIsRegex: boolean) => void;
  readonly removeDomain: (value: string) => void;
  readonly isBlacklisted: (url: string) => boolean;
  blacklistMatchers: BlacklistMatchers;
}

export const useBlacklistStore = createWithEqualityFn(
  persist<BlacklistState>(
    (set, get) => {
      const updateBlacklist = (newItems: readonly BlacklistItem[]): Partial<BlacklistState> => ({
        blacklistedItems: newItems,
        blacklistMatchers: createBlacklistMatchers(newItems),
      });

      return {
        blacklistedItems: [],
        blacklistMatchers: { plain: new Set(), domainRegex: null, urlRegex: null },
        addDomain: (value, isRegex) => {
          set((state) => {
            if (state.blacklistedItems.some((item) => item.value === value)) {
              return state;
            }
            return updateBlacklist([...state.blacklistedItems, { value, isRegex }]);
          });
        },
        editDomain: (oldValue, newValue, newIsRegex) => {
          set((state) => {
            const newItems = state.blacklistedItems.map((item) => (item.value === oldValue ? { value: newValue, isRegex: newIsRegex } : item));
            return updateBlacklist(newItems);
          });
        },
        removeDomain: (value) => {
          set((state) => {
            const newItems = state.blacklistedItems.filter((item) => item.value !== value);
            return updateBlacklist(newItems);
          });
        },
        isBlacklisted: (url: string): boolean => {
          return isUrlBlacklisted(url, get().blacklistMatchers);
        },
      };
    },
    {
      name: BLACKLIST_STORAGE_KEY,
      storage: createJSONStorage(() => chromeSyncStorage),
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
