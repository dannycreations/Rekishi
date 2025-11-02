import { useCallback, useState } from 'react';

import { search } from '../services/chromeApi';

interface UseHistoryDateReturn {
  datesWithHistory: Set<string>;
  error: string | null;
  fetchDatesForMonth: (date: Date) => void;
  isLoading: boolean;
}

export const useHistoryDate = (): UseHistoryDateReturn => {
  const [datesWithHistory, setDatesWithHistory] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedMonths, setFetchedMonths] = useState<Set<string>>(new Set());

  const fetchDatesForMonth = useCallback(
    async (date: Date) => {
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (fetchedMonths.has(monthKey) || isLoading) {
        return;
      }

      setIsLoading(true);
      setError(null);

      const year = date.getFullYear();
      const month = date.getMonth();
      const startTime = new Date(year, month, 1);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(year, month + 1, 0);
      endTime.setHours(23, 59, 59, 999);

      try {
        const historyItems = await search({
          endTime: endTime.getTime(),
          maxResults: 0,
          startTime: startTime.getTime(),
          text: '',
        });

        const datesInMonth = new Set<string>();
        for (const item of historyItems) {
          const itemDate = new Date(item.lastVisitTime);
          const dateString = itemDate.toISOString().split('T')[0];
          datesInMonth.add(dateString);
        }

        setDatesWithHistory((prev) => new Set([...prev, ...datesInMonth]));
        setFetchedMonths((prev) => new Set(prev).add(monthKey));
      } catch (e: unknown) {
        console.error('Failed to load history dates for month:', e);
        setError('Failed to load history dates.');
      } finally {
        setIsLoading(false);
      }
    },
    [fetchedMonths, isLoading],
  );

  return { datesWithHistory, isLoading, error, fetchDatesForMonth };
};
