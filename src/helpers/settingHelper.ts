import { parsePersistedState } from '../utilities/commonUtil';

interface StoredState {
  readonly dataRetention?: string;
}

export interface Settings {
  readonly dataRetention: string;
}

export const defaultSettings: Settings = {
  dataRetention: 'disabled',
} as const;

export const parseSettingsFromJSON = (json: string | null): Settings => {
  return parsePersistedState<Settings, StoredState>(
    json,
    (state) => ({
      dataRetention: state.dataRetention ?? defaultSettings.dataRetention,
    }),
    { ...defaultSettings },
  );
};
