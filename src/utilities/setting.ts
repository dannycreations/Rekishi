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

export const parseRetentionDays = (dataRetention: string): number | null => {
  if (dataRetention === 'disabled') {
    return null;
  }
  const days = Number.parseInt(dataRetention, 10);
  return Number.isNaN(days) || days <= 0 ? null : days;
};

export const parseSettingsFromJSON = (json: string | null): Settings => {
  const stored = parseStoredJSON<StoredState>(json);
  return {
    dataRetention: stored?.dataRetention ?? defaultSettings.dataRetention,
  };
};
