import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { chromeSyncStorage } from '../utilities/storageUtil';

interface SettingState {
  readonly dataRetention: string;
  readonly syncEnabled: boolean;
  readonly setDataRetention: (retention: string) => void;
  readonly setSyncEnabled: (enabled: boolean) => void;
}

export const useSettingStore = create<SettingState>()(
  persist(
    (set) => ({
      dataRetention: '90',
      syncEnabled: true,
      setDataRetention: (retention) => set({ dataRetention: retention }),
      setSyncEnabled: (enabled) => set({ syncEnabled: enabled }),
    }),
    {
      name: 'rekishi-setting',
      storage: createJSONStorage(() => chromeSyncStorage),
    },
  ),
);
