interface StoredSettings {
  readonly state?: {
    readonly dataRetention?: string;
  };
}

export interface Settings {
  readonly dataRetention: string;
}

export const defaultSettings: Settings = {
  dataRetention: 'disabled',
} as const;

export function parseSettingsFromJSON(json: string | null): Settings {
  if (!json) {
    return { ...defaultSettings };
  }
  try {
    const parsed: StoredSettings = JSON.parse(json);
    return {
      dataRetention: parsed.state?.dataRetention ?? defaultSettings.dataRetention,
    };
  } catch (error) {
    console.error('Failed to parse settings from storage', error);
    return { ...defaultSettings };
  }
}
