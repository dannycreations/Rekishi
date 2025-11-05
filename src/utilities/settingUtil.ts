interface StoredSettings {
  readonly state?: {
    readonly dataRetention?: string;
    readonly syncEnabled?: boolean;
  };
}

export interface Settings {
  readonly dataRetention: string;
  readonly syncEnabled: boolean;
}

export const defaultSettings: Settings = {
  dataRetention: 'disabled',
  syncEnabled: true,
} as const;

export function parseSettingsFromJSON(json: string | null): Settings {
  if (!json) return { ...defaultSettings };
  try {
    const parsed: StoredSettings = JSON.parse(json);
    return {
      dataRetention: parsed.state?.dataRetention ?? defaultSettings.dataRetention,
      syncEnabled: parsed.state?.syncEnabled ?? defaultSettings.syncEnabled,
    };
  } catch (error) {
    console.error('Failed to parse settings from storage', error);
    return { ...defaultSettings };
  }
}
