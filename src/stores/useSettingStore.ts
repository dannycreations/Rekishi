import { createJSONStorage, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { SETTINGS_STORAGE_KEY } from '../app/constants';
import { chromeSyncStorage } from '../utilities/storageUtil';

interface SettingState {
  readonly dataRetention: string;
  readonly setDataRetention: (retention: string) => void;
}

export const useSettingStore = createWithEqualityFn(
  persist<SettingState>(
    (set) => ({
      dataRetention: 'disabled',
      setDataRetention: (retention) => {
        set({ dataRetention: retention });
      },
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => chromeSyncStorage),
    },
  ),
  shallow,
);
