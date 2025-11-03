import { useMemo } from 'react';

import { groupHistoryByDayAndHour } from '../utilities/historyUtil';

import type { ChromeHistoryItem, HistoryItemGroup } from '../app/types';

interface ProcessedDayGroup {
  date: Date;
  items: ChromeHistoryItem[];
  hourlyGroups: HistoryItemGroup[];
  hourlyGroupsMap: Map<string, HistoryItemGroup>;
}

interface ItemLocation {
  dayKey: string;
  hourKey: string;
}

interface UseHistoryGroupReturn {
  dailyGroups: ProcessedDayGroup[];
  dailyGroupsMap: Map<string, ProcessedDayGroup>;
  itemLocator: Map<string, ItemLocation>;
}

export const useHistoryGroup = (historyItems: ChromeHistoryItem[]): UseHistoryGroupReturn => {
  const dailyGroupsRaw = useMemo(() => groupHistoryByDayAndHour(historyItems), [historyItems]);

  return useMemo(() => {
    const itemLocator = new Map<string, ItemLocation>();
    const dailyGroups: ProcessedDayGroup[] = dailyGroupsRaw.map((dayGroup) => {
      const dayKey = dayGroup.date.toISOString();
      const hourlyGroupsMap = new Map(
        dayGroup.hourlyGroups.map((hg) => {
          const hourKey = `${dayKey}_${hg.time}`;
          hg.items.forEach((item) => {
            itemLocator.set(item.id, { dayKey, hourKey });
          });
          return [hg.time, hg];
        }),
      );
      return { ...dayGroup, hourlyGroupsMap };
    });
    const dailyGroupsMap = new Map(dailyGroups.map((g) => [g.date.toISOString(), g]));
    return { dailyGroups, dailyGroupsMap, itemLocator };
  }, [dailyGroupsRaw]);
};
