export interface ChromeHistoryItem {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly lastVisitTime: number;
  readonly visitCount: number;
  readonly typedCount?: number;
}

export interface HistoryItemGroup {
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

export interface RegexResult {
  readonly regex: RegExp | null;
  readonly error: string | null;
}
