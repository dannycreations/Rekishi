import { isSameDay } from '../utilities/dateUtil';

import type { ChromeHistoryItem, HistoryItemGroup } from '../app/types';

export const mapToChromeHistoryItem = (item: chrome.history.HistoryItem): ChromeHistoryItem => {
  return {
    id: `${item.id}-${item.lastVisitTime}`,
    url: item.url ?? '',
    title: item.title ?? item.url ?? '',
    lastVisitTime: item.lastVisitTime ?? 0,
    visitCount: item.visitCount ?? 0,
    typedCount: item.typedCount ?? 0,
  };
};

export const applyClientSideSearch = (
  items: readonly ChromeHistoryItem[],
  searchQuery: string,
  isRegex: boolean,
  compiledRegex: {
    readonly regex: RegExp | null;
    readonly error: string | null;
  },
): {
  readonly items: readonly ChromeHistoryItem[];
  readonly error?: string;
} => {
  if (isRegex) {
    if (compiledRegex.error) {
      return { items: [], error: compiledRegex.error };
    }
    if (compiledRegex.regex) {
      const regex = compiledRegex.regex;
      return { items: items.filter((item) => regex.test(item.title) || regex.test(item.url)) };
    }
    return { items: [] };
  }

  const query = searchQuery.toLowerCase();
  return {
    items: items.filter((item) => (item.title ?? '').toLowerCase().includes(query) || (item.url ?? '').toLowerCase().includes(query)),
  };
};

interface GroupHistoryReturn {
  readonly date: Date;
  readonly items: readonly ChromeHistoryItem[];
  readonly hourlyGroups: readonly HistoryItemGroup[];
}

export const groupHistoryByDayAndHour = (items: readonly ChromeHistoryItem[]): readonly GroupHistoryReturn[] => {
  if (!items || items.length === 0) {
    return [];
  }

  const dayGroups: { date: Date; items: ChromeHistoryItem[]; hourlyGroups: { time: string; items: ChromeHistoryItem[] }[] }[] = [];
  let currentDayGroup: { date: Date; items: ChromeHistoryItem[]; hourlyGroups: { time: string; items: ChromeHistoryItem[] }[] } | null = null;
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
