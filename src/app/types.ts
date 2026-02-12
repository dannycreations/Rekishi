export interface ChromeHistoryItem {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly lastVisitTime: number;
  readonly visitCount: number;
  readonly typedCount?: number;
}

export interface ChromeDevice {
  readonly deviceName: string;
  readonly sessions: readonly {
    readonly lastModified: number;
  }[];
}

export interface Device {
  readonly name: string;
  readonly type: 'laptop' | 'phone' | 'desktop';
  readonly lastSync: string;
}

export interface HistoryItemGroup {
  readonly time: string;
  readonly items: readonly ChromeHistoryItem[];
}

export type ViewType = 'devices' | 'blacklist' | 'export' | 'settings';

export type Theme = 'light' | 'dark' | 'system';

export interface SearchParams {
  readonly text: string;
  readonly startTime?: number;
  readonly endTime?: number;
  readonly maxResults?: number;
}

export interface RegexResult {
  readonly regex: RegExp | null;
  readonly error: string | null;
}
