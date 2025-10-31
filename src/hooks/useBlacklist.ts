import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { StateStorage } from 'zustand/middleware';

declare const chrome: any;

const chromeStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const result = await chrome.storage.local.get([name]);
      return result[name] ?? null;
    }
    return localStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [name]: value });
    } else {
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.remove([name]);
    } else {
      localStorage.removeItem(name);
    }
  },
};

export interface BlacklistItem {
  isRegex: boolean;
  value: string;
}

interface BlacklistState {
  addDomain: (value: string, isRegex: boolean) => void;
  blacklistedItems: BlacklistItem[];
  isBlacklisted: (domain: string) => boolean;
  removeDomain: (value: string) => void;
}

let lastBlacklistedItems: BlacklistItem[] | undefined;
let cachedPlainMatchers: Set<string>;
let cachedRegexMatchers: RegExp[];

const createAndCacheMatchers = (items: BlacklistItem[]): void => {
  if (items === lastBlacklistedItems) {
    return;
  }

  cachedPlainMatchers = new Set();
  cachedRegexMatchers = [];

  for (const item of items) {
    if (item.isRegex) {
      try {
        cachedRegexMatchers.push(new RegExp(item.value, 'i'));
      } catch (e) {
        console.error(`Invalid regex in blacklist: ${item.value}`, e);
      }
    } else {
      cachedPlainMatchers.add(item.value);
    }
  }
  lastBlacklistedItems = items;
};

export const useBlacklist = create<BlacklistState>()(
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
        createAndCacheMatchers(blacklistedItems);

        if (cachedPlainMatchers.has(domain)) {
          return true;
        }

        for (const regex of cachedRegexMatchers) {
          if (regex.test(domain)) {
            return true;
          }
        }
        return false;
      },
    }),
    {
      name: 'rekishi-blacklist-storage',
      storage: createJSONStorage(() => chromeStorage),
    },
  ),
);
