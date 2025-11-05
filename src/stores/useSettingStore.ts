import { createJSONStorage, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { BLACKLIST_STORAGE_KEY, HISTORY_STORAGE_KEY, SETTINGS_STORAGE_KEY } from '../app/constants';
import { chromeLocalStorage, chromeSyncStorage } from '../utilities/storageUtil';

const keysToMigrate = [BLACKLIST_STORAGE_KEY, HISTORY_STORAGE_KEY];

async function migrateData(fromSync: boolean, toSync: boolean): Promise<void> {
  if (fromSync === toSync) return;

  const fromStorage = fromSync ? chromeSyncStorage : chromeLocalStorage;
  const toStorage = toSync ? chromeSyncStorage : chromeLocalStorage;

  for (const key of keysToMigrate) {
    try {
      const value = await fromStorage.getItem(key);
      if (value !== null) {
        await toStorage.setItem(key, value);
        await fromStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Failed to migrate ${key}:`, error);
    }
  }
}
interface SettingState {
  readonly dataRetention: string;
  readonly syncEnabled: boolean;
  readonly setDataRetention: (retention: string) => void;
  readonly setSyncEnabled: (enabled: boolean) => Promise<void>;
}

export const useSettingStore = createWithEqualityFn(
  persist<SettingState>(
    (set, get) => ({
      dataRetention: 'disabled',
      syncEnabled: true,
      setDataRetention: (retention) => {
        set({ dataRetention: retention });
      },
      setSyncEnabled: async (enabled) => {
        const wasEnabled = get().syncEnabled;
        if (wasEnabled !== enabled) {
          await migrateData(wasEnabled, enabled);
        }
        set({ syncEnabled: enabled });
      },
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => chromeSyncStorage),
    },
  ),
  shallow,
);
