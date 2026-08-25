import type { StateStorage } from 'zustand/middleware';

type StorageAreaName = 'local' | 'sync';

const createChromeStorage = (area: StorageAreaName): StateStorage => {
  const chromeStorageArea = typeof chrome !== 'undefined' && chrome.storage ? chrome.storage[area] : undefined;
  const fallbackStorage = typeof localStorage === 'undefined' ? null : localStorage;

  return {
    getItem: async (name: string): Promise<string | null> => {
      if (chromeStorageArea) {
        try {
          const result = await chromeStorageArea.get([name]);
          const value = result[name] as unknown;
          return typeof value === 'string' ? value : null;
        } catch (error) {
          console.error(`Failed to read from chrome.storage.${area}`, error);
        }
      }
      return fallbackStorage?.getItem(name) ?? null;
    },
    setItem: async (name: string, value: string): Promise<void> => {
      if (chromeStorageArea) {
        try {
          await chromeStorageArea.set({ [name]: value });
          return;
        } catch (error) {
          console.error(`Failed to write to chrome.storage.${area}`, error);
        }
      }
      fallbackStorage?.setItem(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
      if (chromeStorageArea) {
        try {
          await chromeStorageArea.remove([name]);
          return;
        } catch (error) {
          console.error(`Failed to remove from chrome.storage.${area}`, error);
        }
      }
      fallbackStorage?.removeItem(name);
    },
  };
};

export const chromeLocalStorage: StateStorage = createChromeStorage('local');
export const chromeSyncStorage: StateStorage = createChromeStorage('sync');
