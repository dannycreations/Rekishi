import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createBlacklistMatchers, isDomainBlacklisted } from '../utilities/blacklistUtil';
import { chromeLocalStorage } from '../utilities/storageUtil';

import type { BlacklistItem, BlacklistMatchers } from '../utilities/blacklistUtil';

interface BlacklistState {
  readonly blacklistedItems: BlacklistItem[];
  readonly addDomain: (value: string, isRegex: boolean) => void;
  readonly isBlacklisted: (domain: string) => boolean;
  readonly removeDomain: (value: string) => void;
}

let lastBlacklistedItems: BlacklistItem[] | undefined;
let cachedMatchers: BlacklistMatchers;

export const useBlacklistStore = create<BlacklistState>()(
  persist(
    (set, get) => ({
      blacklistedItems: [],
      addDomain: (value, isRegex) => {
        set((state) => {
          if (state.blacklistedItems.some((item) => item.value === value)) {
            return state;
          }
          return { blacklistedItems: [...state.blacklistedItems, { value, isRegex }] };
        });
      },
      removeDomain: (value) => {
        set((state) => ({
          blacklistedItems: state.blacklistedItems.filter((item) => item.value !== value),
        }));
      },
      isBlacklisted: (domain: string): boolean => {
        const { blacklistedItems } = get();
        if (blacklistedItems !== lastBlacklistedItems) {
          cachedMatchers = createBlacklistMatchers(blacklistedItems);
          lastBlacklistedItems = blacklistedItems;
        }

        return isDomainBlacklisted(domain, cachedMatchers);
      },
    }),
    {
      name: 'rekishi-blacklist',
      storage: createJSONStorage(() => chromeLocalStorage),
    },
  ),
);
