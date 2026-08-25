import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { MONTH_HISTORY_SCAN_LIMIT } from '../app/constants';
import { search } from '../services/chromeApi';
import { toDateKey } from '../utilities/date';

interface HistoryDateState {
  readonly datesWithHistory: ReadonlySet<string>;
  readonly fetchDatesForMonth: (date: Date) => Promise<void>;
  readonly isLoading: boolean;
}

export const useHistoryDateStore = createWithEqualityFn<HistoryDateState>((set) => {
  const fetchedMonths = new Set<string>();
  let isFetching = false;

  const fetchDatesForMonth = async (date: Date): Promise<void> => {
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (fetchedMonths.has(monthKey) || isFetching) {
      return;
    }

    isFetching = true;
    set({ isLoading: true });

    const year = date.getFullYear();
    const month = date.getMonth();
    const startTime = new Date(year, month, 1);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(year, month + 1, 0);
    endTime.setHours(23, 59, 59, 999);

    try {
      const historyItems = await search({
        endTime: endTime.getTime(),
        maxResults: MONTH_HISTORY_SCAN_LIMIT,
        startTime: startTime.getTime(),
        text: '',
      });

      const datesInMonth = new Set<string>();
      for (const item of historyItems) {
        datesInMonth.add(toDateKey(new Date(item.lastVisitTime)));
      }

      set((state) => ({ datesWithHistory: new Set([...state.datesWithHistory, ...datesInMonth]) }));
      fetchedMonths.add(monthKey);
    } catch (error: unknown) {
      console.error('Failed to load history dates for month:', error);
    } finally {
      isFetching = false;
      set({ isLoading: false });
    }
  };

  return {
    datesWithHistory: new Set<string>(),
    fetchDatesForMonth,
    isLoading: false,
  };
}, shallow);
