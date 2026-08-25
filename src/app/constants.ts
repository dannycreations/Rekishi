import type { ViewType } from './types';

export const VIEW_TITLES: Record<ViewType, string> = {
  blacklist: 'Blacklist',
  export: 'Export',
  settings: 'Settings',
} as const;

export const BLACKLIST_STORAGE_KEY = 'rekishi-blacklist';
export const HISTORY_STORAGE_KEY = 'rekishi-history';
export const SETTINGS_STORAGE_KEY = 'rekishi-setting';
export const CLEANUP_STORAGE_KEY = 'rekishi-cleanup';
export const RETENTION_STORAGE_KEY = 'rekishi-retention';

export const CLEANER_ALARM_KEY = 'blacklist-cleaner';

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const DAILY_PAGE_SIZE = 500;
export const SEARCH_PAGE_SIZE = 100;
export const INIT_CHUNK_SIZE = 20;

export const MONTH_HISTORY_SCAN_LIMIT = 10_000;
