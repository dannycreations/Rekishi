import { useMemo } from 'react';

import { groupHistoryByDayAndHour } from '../helpers/historyHelper';

import type { ChromeHistoryItem } from '../app/types';
import type { DayGroup } from '../helpers/historyHelper';

interface UseHistoryGroupReturn {
  readonly dailyGroups: readonly DayGroup[];
  readonly dayKeyByItemId: ReadonlyMap<string, string>;
}

export const useHistoryGroup = (historyItems: readonly ChromeHistoryItem[]): UseHistoryGroupReturn => {
  const dailyGroups = useMemo(() => groupHistoryByDayAndHour(historyItems), [historyItems]);

  const dayKeyByItemId = useMemo(() => {
    const dayKeys = new Map<string, string>();
    for (const dayGroup of dailyGroups) {
      const dayKey = dayGroup.date.toISOString();
      for (const hourGroup of dayGroup.hourlyGroups) {
        for (const item of hourGroup.items) {
          dayKeys.set(item.id, dayKey);
        }
      }
    }
    return dayKeys;
  }, [dailyGroups]);

  return { dailyGroups, dayKeyByItemId };
};
