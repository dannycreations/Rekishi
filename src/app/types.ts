export interface ChromeHistoryItem {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly lastVisitTime: number;
  readonly visitCount: number;
}

export interface HourGroup {
  readonly time: string;
  readonly items: readonly ChromeHistoryItem[];
}

export type ViewType = 'blacklist' | 'export' | 'settings';

export type Theme = 'light' | 'dark' | 'system';

export interface SearchParams {
  readonly text: string;
  readonly startTime?: number;
  readonly endTime?: number;
  readonly maxResults?: number;
}
