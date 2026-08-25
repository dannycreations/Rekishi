import { compileRegex, isPotentialRegex } from './common';
import { isSameDay } from './date';

import type { ChromeHistoryItem, HourGroup } from '../app/types';

export const mapToChromeHistoryItem = (item: chrome.history.HistoryItem): ChromeHistoryItem => {
  return {
    id: `${item.id}-${item.lastVisitTime}`,
    url: item.url ?? '',
    title: item.title ?? item.url ?? '',
    lastVisitTime: item.lastVisitTime ?? 0,
    visitCount: item.visitCount ?? 0,
  };
};

export const applyClientSideSearch = (
  items: readonly ChromeHistoryItem[],
  searchQuery: string,
): {
  readonly items: readonly ChromeHistoryItem[];
  readonly error?: string;
} => {
  if (isPotentialRegex(searchQuery)) {
    const { regex, error } = compileRegex(searchQuery);
    if (error) {
      return { items: [], error };
    }
    if (!regex) {
      return { items: [] };
    }
    return { items: items.filter((item) => regex.test(item.title) || regex.test(item.url)) };
  }

  const query = searchQuery.toLowerCase();
  return {
    items: items.filter((item) => (item.title ?? '').toLowerCase().includes(query) || (item.url ?? '').toLowerCase().includes(query)),
  };
};

export interface DayGroup {
  readonly date: Date;
  readonly items: readonly ChromeHistoryItem[];
  readonly hourlyGroups: readonly HourGroup[];
}

interface MutableDayGroup {
  date: Date;
  items: ChromeHistoryItem[];
  hourlyGroups: HourGroup[];
}

export const groupHistoryByDayAndHour = (items: readonly ChromeHistoryItem[]): readonly DayGroup[] => {
  if (!items || items.length === 0) {
    return [];
  }

  const dayGroups: MutableDayGroup[] = [];
  let currentDayGroup: MutableDayGroup | null = null;
  let currentHourGroup: { time: string; items: ChromeHistoryItem[] } | null = null;
  let currentHour = -1;

  for (const item of items) {
    const itemDate = new Date(item.lastVisitTime);

    if (!currentDayGroup || !isSameDay(itemDate, currentDayGroup.date)) {
      const dayDate = new Date(itemDate);
      dayDate.setHours(0, 0, 0, 0);
      currentDayGroup = { date: dayDate, items: [], hourlyGroups: [] };
      dayGroups.push(currentDayGroup);
      currentHour = -1;
    }

    currentDayGroup.items.push(item);

    const hour = itemDate.getHours();
    if (hour !== currentHour) {
      currentHour = hour;
      const hourDate = new Date(itemDate);
      hourDate.setMinutes(0, 0, 0);
      currentHourGroup = {
        time: hourDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        items: [],
      };
      currentDayGroup.hourlyGroups.push(currentHourGroup);
    }

    if (currentHourGroup) {
      currentHourGroup.items.push(item);
    }
  }

  return dayGroups;
};
