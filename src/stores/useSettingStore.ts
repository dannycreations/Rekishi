import { createJSONStorage, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { SETTINGS_STORAGE_KEY } from '../app/constants';
import { chromeSyncStorage } from '../utilities/storageUtil';

interface SettingState {
  readonly dataRetention: string;
  readonly syncEnabled: boolean;
  readonly setDataRetention: (retention: string) => void;
  readonly setSyncEnabled: (enabled: boolean) => void;
}

export const useSettingStore = createWithEqualityFn(
  persist<SettingState>(
    (set) => ({
      dataRetention: 'disabled',
      syncEnabled: true,
      setDataRetention: (retention) => {
        set({ dataRetention: retention });
      },
      setSyncEnabled: (enabled) => {
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
