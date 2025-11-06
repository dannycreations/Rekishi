import type { ViewType } from './types';

export const VIEW_TITLES: Record<ViewType, string> = {
  devices: 'Devices',
  blacklist: 'Blacklist',
  export: 'Export',
  settings: 'Settings',
} as const;

export const VIEW_MODAL_SIZES: Partial<Record<ViewType, 'md' | 'lg' | 'xl' | '2xl' | '3xl'>> = {
  devices: '3xl',
  blacklist: 'lg',
  export: 'md',
  settings: 'lg',
} as const;

export const BLACKLIST_STORAGE_KEY = 'rekishi-blacklist';
export const HISTORY_STORAGE_KEY = 'rekishi-history';
export const SETTINGS_STORAGE_KEY = 'rekishi-setting';
export const CLEANUP_STORAGE_KEY = 'rekishi-cleanup';
export const RETENTION_STORAGE_KEY = 'rekishi-retention';

export const CLEANER_ALARM_KEY = 'blacklist-cleaner';

export const DAYS_OF_WEEK: readonly string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DAILY_PAGE_SIZE = 500;
export const SEARCH_PAGE_SIZE = 100;
export const INIT_CHUNK_SIZE = 20;
