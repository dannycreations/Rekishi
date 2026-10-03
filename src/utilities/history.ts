import { isPotentialRegex, safeRegExp } from './common';
import { isSameDay, startOfDay } from './date';

import type { ChromeHistoryItem, DayGroup, HourGroup } from '../app/types';

const REGEX_SEARCH_ERROR = 'Invalid regular expression.';

const compileRegex = (query: string): RegExp | null => {
  const regex = safeRegExp(query.slice(1, -1), 'i');
  if (!regex) {
    console.error('Invalid regex provided:', query);
  }
  return regex;
};

export const mapToChromeHistoryItem = (item: chrome.history.HistoryItem): ChromeHistoryItem => {
  return {
    id: `${item.id}-${item.lastVisitTime}`,
    url: item.url ?? '',
    title: item.title ?? item.url ?? '',
    lastVisitTime: item.lastVisitTime ?? 0,
    visitCount: item.visitCount ?? 0,
  };
};

export const shouldSearchClientSide = (query: string): boolean => {
  return isPotentialRegex(query) || query.length < 3;
};

export const applyClientSideSearch = (
  items: readonly ChromeHistoryItem[],
  searchQuery: string,
): {
  readonly items: readonly ChromeHistoryItem[];
  readonly error?: string;
} => {
  if (isPotentialRegex(searchQuery)) {
    const regex = compileRegex(searchQuery);
    if (!regex) {
      return { items: [], error: REGEX_SEARCH_ERROR };
    }
    return { items: items.filter((item) => regex.test(item.title) || regex.test(item.url)) };
  }

  const query = searchQuery.toLowerCase();
  return {
    items: items.filter((item) => (item.title ?? '').toLowerCase().includes(query) || (item.url ?? '').toLowerCase().includes(query)),
  };
};

export const groupHistoryByDayAndHour = (items: readonly ChromeHistoryItem[]): readonly DayGroup[] => {
  if (items.length === 0) {
    return [];
  }

  const dayGroups: DayGroup[] = [];
  let currentDayDate: Date | null = null;
  let currentDayItems: ChromeHistoryItem[] = [];
  let currentDayHourlyGroups: HourGroup[] = [];
  let currentHour = -1;
  let currentHourItems: ChromeHistoryItem[] = [];

  for (const item of items) {
    const itemDate = new Date(item.lastVisitTime);

    if (!currentDayDate || !isSameDay(itemDate, currentDayDate)) {
      currentDayDate = startOfDay(itemDate);
      currentDayItems = [];
      currentDayHourlyGroups = [];
      dayGroups.push({ date: currentDayDate, items: currentDayItems, hourlyGroups: currentDayHourlyGroups });
      currentHour = -1;
    }

    currentDayItems.push(item);

    const hour = itemDate.getHours();
    if (hour !== currentHour) {
      currentHour = hour;
      currentHourItems = [];
      const hourDate = new Date(itemDate);
      hourDate.setMinutes(0, 0, 0);
      currentDayHourlyGroups.push({
        time: hourDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        items: currentHourItems,
      });
    }

    currentHourItems.push(item);
  }

  return dayGroups;
};
