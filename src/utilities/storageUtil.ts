import { SETTINGS_STORAGE_KEY } from '../app/constants';
import { parseSettingsFromJSON } from './settingUtil';

import type { StateStorage } from 'zustand/middleware';
import type { Settings } from './settingUtil';

type StorageAreaName = 'local' | 'sync';

function createChromeStorage(area: StorageAreaName): StateStorage {
  const chromeStorageArea = typeof chrome !== 'undefined' && chrome.storage ? chrome.storage[area] : undefined;

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
}

export const chromeLocalStorage: StateStorage = createChromeStorage('local');
export const chromeSyncStorage: StateStorage = createChromeStorage('sync');

async function getSettings(): Promise<Settings> {
  const json = await chromeSyncStorage.getItem(SETTINGS_STORAGE_KEY);
  return parseSettingsFromJSON(json);
}

export const syncedStorage: StateStorage = {
  getItem: async (name: string) => {
    const { syncEnabled } = await getSettings();
    const storage = syncEnabled ? chromeSyncStorage : chromeLocalStorage;
    return storage.getItem(name);
  },
  setItem: async (name: string, value: string) => {
    const { syncEnabled } = await getSettings();
    const storage = syncEnabled ? chromeSyncStorage : chromeLocalStorage;
    await storage.setItem(name, value);
  },
  removeItem: async (name: string) => {
    const { syncEnabled } = await getSettings();
    const storage = syncEnabled ? chromeSyncStorage : chromeLocalStorage;
    await storage.removeItem(name);
  },
} as const;
