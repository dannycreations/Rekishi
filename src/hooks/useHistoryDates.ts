import { useEffect, useState } from 'react';

import { search } from '../services/chromeApi';

interface UseHistoryDatesReturn {
  datesWithHistory: Set<string>;
  error: string | null;
  isLoading: boolean;
}

export const useHistoryDates = (): UseHistoryDatesReturn => {
  const [datesWithHistory, setDatesWithHistory] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllHistoryDates = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const dates = new Set<string>();
        const today = new Date();
        const promises: Promise<void>[] = [];

        for (let i = 0; i < 90; i++) {
          const date = new Date();
          date.setDate(today.getDate() - i);

          const startTime = new Date(date);
          startTime.setHours(0, 0, 0, 0);

          const endTime = new Date(date);
          endTime.setHours(23, 59, 59, 999);

          promises.push(
            search({
              endTime: endTime.getTime(),
              maxResults: 1,
              startTime: startTime.getTime(),
              text: '',
            }).then((items) => {
              if (items.length > 0) {
                const itemDate = new Date(items[0].lastVisitTime);
                const dateString = itemDate.toISOString().split('T')[0];
                dates.add(dateString);
              }
            }),
          );
        }

        await Promise.all(promises);
        setDatesWithHistory(dates);
      } catch (e: unknown) {
        console.error('Failed to load history dates:', e);
        setError('Failed to load history dates.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllHistoryDates();
  }, []);

  return { datesWithHistory, isLoading, error };
};
