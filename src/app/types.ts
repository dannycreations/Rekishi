export interface ChromeHistoryItem {
  id: string;
  url: string;
  title: string;
  lastVisitTime: number;
  visitCount: number;
}

export interface HistoryItemGroup {
  time: string;
  items: ChromeHistoryItem[];
}

export interface Device {
  name: string;
  type: 'laptop' | 'phone' | 'desktop';
  lastSync: string;
}

export type ViewType = 'activity' | 'devices' | 'blacklist' | 'export' | 'settings';
