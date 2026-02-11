import { useMemo } from 'react';

import { groupHistoryByDayAndHour } from '../helpers/historyHelper';

import type { ChromeHistoryItem, HistoryItemGroup } from '../app/types';

interface ProcessedDayGroup {
  readonly date: Date;
  readonly items: readonly ChromeHistoryItem[];
  readonly hourlyGroups: readonly HistoryItemGroup[];
  readonly hourlyGroupsMap: Map<string, HistoryItemGroup>;
}

interface ItemLocation {
  readonly dayKey: string;
  readonly hourKey: string;
}

interface UseHistoryGroupReturn {
  readonly dailyGroups: readonly ProcessedDayGroup[];
  readonly dailyGroupsMap: Map<string, ProcessedDayGroup>;
  readonly itemLocator: Map<string, ItemLocation>;
}

export const useHistoryGroup = (historyItems: readonly ChromeHistoryItem[]): UseHistoryGroupReturn => {
  const dailyGroupsRaw = useMemo(() => groupHistoryByDayAndHour(historyItems), [historyItems]);

  return useMemo(() => {
    const itemLocator = new Map<string, ItemLocation>();
    const dailyGroups: readonly ProcessedDayGroup[] = dailyGroupsRaw.map((dayGroup) => {
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
