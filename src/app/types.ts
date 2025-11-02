export interface ChromeHistoryItem {
  id: string;
  url: string;
  title: string;
  lastVisitTime: number;
  visitCount: number;
}

export interface Device {
  name: string;
  type: 'laptop' | 'phone' | 'desktop';
  lastSync: string;
}

export interface HistoryItemGroup {
  time: string;
  items: ChromeHistoryItem[];
}

export type ViewType = 'activity' | 'devices' | 'blacklist' | 'export' | 'settings';
export type ModalViewType = Exclude<ViewType, 'activity'>;
