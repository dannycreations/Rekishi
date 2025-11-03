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
  readonly sessions: { readonly lastModified: number }[];
}

export interface Device {
  readonly name: string;
  readonly type: 'laptop' | 'phone' | 'desktop';
  readonly lastSync: string;
}

export interface HistoryItemGroup {
  readonly time: string;
  readonly items: ChromeHistoryItem[];
}

export type ViewType = 'activity' | 'devices' | 'blacklist' | 'export' | 'settings';
export type ModalViewType = Exclude<ViewType, 'activity'>;
