import { isSameDay } from '../utilities/dateUtil';

import type { ChromeHistoryItem, HistoryItemGroup } from '../app/types';

interface GroupHistoryReturn {
  readonly date: Date;
  readonly items: readonly ChromeHistoryItem[];
  readonly hourlyGroups: readonly HistoryItemGroup[];
}

export function groupHistoryByDayAndHour(items: readonly ChromeHistoryItem[]): readonly GroupHistoryReturn[] {
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
}
