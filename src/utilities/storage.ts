import type { StateStorage } from 'zustand/middleware';

type StorageAreaName = 'local' | 'sync';

const createChromeStorage = (area: StorageAreaName): StateStorage => {
  const chromeStorageArea = typeof chrome !== 'undefined' && chrome.storage ? chrome.storage[area] : undefined;

  const fallbackRead = (name: string): string | null => (typeof localStorage === 'undefined' ? null : localStorage.getItem(name));
  const fallbackWrite = (name: string, value: string): void => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(name, value);
    }
  };
  const fallbackRemove = (name: string): void => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(name);
    }
  };

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
      return fallbackRead(name);
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
      fallbackWrite(name, value);
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
      fallbackRemove(name);
    },
  };
};

export const chromeLocalStorage: StateStorage = createChromeStorage('local');
export const chromeSyncStorage: StateStorage = createChromeStorage('sync');
