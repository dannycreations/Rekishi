import { parseStoredJSON } from './common';

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
  const stored = parseStoredJSON<StoredState>(json);
  return {
    dataRetention: stored?.dataRetention ?? defaultSettings.dataRetention,
  };
};
