import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { StateStorage } from 'zustand/middleware';

declare const chrome: any;

const chromeSyncStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      const result = await chrome.storage.sync.get([name]);
      return result[name] ?? null;
    }
    return localStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      await chrome.storage.sync.set({ [name]: value });
    } else {
      localStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      await chrome.storage.sync.remove([name]);
    } else {
      localStorage.removeItem(name);
    }
  },
};

interface SettingsState {
  dataRetention: string;
  setDataRetention: (retention: string) => void;
  setSyncEnabled: (enabled: boolean) => void;
  syncEnabled: boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      dataRetention: '90',
      setDataRetention: (retention) => set({ dataRetention: retention }),
      setSyncEnabled: (enabled) => set({ syncEnabled: enabled }),
      syncEnabled: true,
    }),
    {
      name: 'rekishi-settings-storage',
      storage: createJSONStorage(() => chromeSyncStorage),
    },
  ),
);
