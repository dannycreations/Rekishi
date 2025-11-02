import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createBlacklistMatchers, isDomainBlacklisted } from '../utilities/blacklistUtil';
import { chromeLocalStorage } from '../utilities/storageUtil';

import type { BlacklistItem, BlacklistMatchers } from '../utilities/blacklistUtil';

interface BlacklistState {
  readonly addDomain: (value: string, isRegex: boolean) => void;
  readonly blacklistedItems: BlacklistItem[];
  readonly editDomain: (oldValue: string, newValue: string, newIsRegex: boolean) => void;
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
      editDomain: (oldValue, newValue, newIsRegex) => {
        set((state) => ({
          blacklistedItems: state.blacklistedItems.map((item) => {
            if (item.value === oldValue) {
              return { value: newValue, isRegex: newIsRegex };
            }
            return item;
          }),
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
      removeDomain: (value) => {
        set((state) => ({
          blacklistedItems: state.blacklistedItems.filter((item) => {
            return item.value !== value;
          }),
        }));
      },
    }),
    {
      name: 'rekishi-blacklist',
      storage: createJSONStorage(() => chromeLocalStorage),
    },
  ),
);
