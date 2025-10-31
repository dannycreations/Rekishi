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
        const endTime = new Date();
        const startTime = new Date();
        startTime.setMonth(endTime.getMonth() - 3);

        const historyItems = await search({
          endTime: endTime.getTime(),
          maxResults: 10000,
          startTime: startTime.getTime(),
          text: '',
        });

        const dates = new Set<string>();
        for (const item of historyItems) {
          const date = new Date(item.lastVisitTime);
          const dateString = date.toISOString().split('T')[0];
          dates.add(dateString);
        }
        setDatesWithHistory(dates);
      } catch (e) {
        setError('Failed to load history dates.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllHistoryDates();
  }, []);

  return { datesWithHistory, isLoading, error };
};
