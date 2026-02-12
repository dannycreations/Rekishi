import { createJSONStorage, persist } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { SETTINGS_STORAGE_KEY } from '../app/constants';
import { chromeSyncStorage } from '../helpers/storageHelper';

import type { Theme } from '../app/types';

interface SettingState {
  readonly dataRetention: string;
  readonly theme: Theme;
  readonly setDataRetention: (retention: string) => void;
  readonly setTheme: (theme: Theme) => void;
}

export const useSettingStore = createWithEqualityFn(
  persist<SettingState>(
    (set) => ({
      dataRetention: 'disabled',
      theme: 'system',
      setDataRetention: (retention) => {
        set({ dataRetention: retention });
      },
      setTheme: (theme) => {
        set({ theme });
      },
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => chromeSyncStorage),
    },
  ),
  shallow,
);
