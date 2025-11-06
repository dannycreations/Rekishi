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
