import { useCallback, useRef, useState } from 'react';

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
  const fetchedMonthsRef = useRef<Set<string>>(new Set());
  const isFetchingRef = useRef(false);

  const fetchDatesForMonth = useCallback(async (date: Date) => {
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (fetchedMonthsRef.current.has(monthKey) || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
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
        maxResults: 10000,
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
      fetchedMonthsRef.current.add(monthKey);
    } catch (error: unknown) {
      console.error('Failed to load history dates for month:', error);
      setError('Failed to load history dates.');
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  return { datesWithHistory, isLoading, error, fetchDatesForMonth };
};
