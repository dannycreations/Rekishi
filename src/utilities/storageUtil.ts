import type { StateStorage } from 'zustand/middleware';

declare const chrome: any;

type StorageArea = 'local' | 'sync';

const createChromeStorage = (area: StorageArea): StateStorage => {
  const chromeStorageArea = typeof chrome !== 'undefined' ? chrome.storage?.[area] : undefined;

  return {
    getItem: async (name: string): Promise<string | null> => {
      if (chromeStorageArea) {
        const result = await chromeStorageArea.get([name]);
        const value = result[name];
        return typeof value === 'string' ? value : null;
      }
      return localStorage.getItem(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
      if (chromeStorageArea) {
        await chromeStorageArea.set({ [name]: value });
      } else {
        localStorage.setItem(name, value);
      }
    },
    removeItem: async (name: string): Promise<void> => {
      if (chromeStorageArea) {
        await chromeStorageArea.remove([name]);
      } else {
        localStorage.removeItem(name);
      }
    },
  };
};

export const chromeLocalStorage = createChromeStorage('local');
export const chromeSyncStorage = createChromeStorage('sync');
