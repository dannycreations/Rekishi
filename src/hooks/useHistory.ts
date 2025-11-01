import { useCallback, useEffect, useMemo, useState } from 'react';

import { deleteUrl, search } from '../services/chromeApi';
import { useBlacklistStore } from '../stores/useBlacklistStore';
import { useHistoryStore } from '../stores/useHistoryStore';
import { isSameDay } from '../utilities/dateUtil';
import { getHostnameFromUrl } from '../utilities/urlUtil';

import type { ChromeHistoryItem } from '../app/types';

const SEARCH_PAGE_SIZE = 100;

interface NewHistoryItemMessage {
  type: 'NEW_HISTORY_ITEM';
  payload: ChromeHistoryItem;
}

function isNewHistoryItemMessage(message: unknown): message is NewHistoryItemMessage {
  return (
    !!message &&
    typeof message === 'object' &&
    'type' in message &&
    (message as { type: unknown }).type === 'NEW_HISTORY_ITEM' &&
    'payload' in message &&
    !!(message as { payload: unknown }).payload
  );
}

function applyRegexFilter(
  items: ChromeHistoryItem[],
  searchQuery: string,
): {
  filteredItems: ChromeHistoryItem[];
  error: string | null;
} {
  try {
    const regex = new RegExp(searchQuery, 'i');
    const filteredItems = items.filter((item) => regex.test(item.title) || regex.test(item.url));
    return { filteredItems, error: null };
  } catch (e: unknown) {
    console.error('Invalid regex provided:', e);
    return { filteredItems: [], error: 'Invalid regular expression.' };
  }
}

interface UseHistoryReturn {
  deleteHistoryItem: (id: string) => Promise<void>;
  deleteHistoryItems: (ids: string[]) => Promise<void>;
  error: string | null;
  hasMore: boolean;
  history: ChromeHistoryItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
}

export const useHistory = (): UseHistoryReturn => {
  const [rawHistory, setRawHistory] = useState<ChromeHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreSearchResults, setHasMoreSearchResults] = useState(true);
  const [lastLoadedDate, setLastLoadedDate] = useState(() => new Date());

  const { isBlacklisted, blacklistedItems } = useBlacklistStore();
  const { isRegex, searchQuery, selectedDate } = useHistoryStore();

  const history = useMemo(() => {
    return rawHistory.filter((item) => {
      const domain = getHostnameFromUrl(item.url);
      return !domain || !isBlacklisted(domain);
    });
  }, [rawHistory, blacklistedItems, isBlacklisted]);

  const fetchInitialDailyHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setRawHistory([]);
    setLastLoadedDate(selectedDate);

    const startTime = new Date(selectedDate);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(selectedDate);
    endTime.setHours(23, 59, 59, 999);

    try {
      const newItems = await search({
        endTime: endTime.getTime(),
        startTime: startTime.getTime(),
        text: '',
      });
      setRawHistory(newItems);
    } catch (err: unknown) {
      console.error('Failed to fetch initial daily history:', err);
      setError('Failed to fetch history data.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  const fetchInitialSearchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setRawHistory([]);
    setHasMoreSearchResults(true);

    try {
      const newItems = await search({
        maxResults: SEARCH_PAGE_SIZE,
        text: searchQuery,
      });

      let filteredItems = newItems;
      if (isRegex) {
        const result = applyRegexFilter(newItems, searchQuery);
        if (result.error) {
          setError(result.error);
        }
        filteredItems = result.filteredItems;
      }

      setRawHistory(filteredItems);
      if (newItems.length < SEARCH_PAGE_SIZE) {
        setHasMoreSearchResults(false);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch initial search history:', err);
      setError('Failed to fetch history data.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, isRegex]);

  useEffect(() => {
    if (searchQuery) {
      fetchInitialSearchHistory();
    } else {
      fetchInitialDailyHistory();
    }
  }, [searchQuery, selectedDate, isRegex, fetchInitialDailyHistory, fetchInitialSearchHistory]);

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) {
      return undefined;
    }

    const messageListener = (message: unknown): void => {
      if (isNewHistoryItemMessage(message)) {
        const newItem = message.payload;
        const domain = getHostnameFromUrl(newItem.url);
        if (isBlacklisted(domain)) {
          return;
        }

        const isMatch = (() => {
          if (searchQuery) {
            if (isRegex) {
              const { filteredItems } = applyRegexFilter([newItem], searchQuery);
              return filteredItems.length > 0;
            }
            const query = searchQuery.toLowerCase();
            return (newItem.title ?? '').toLowerCase().includes(query) || (newItem.url ?? '').toLowerCase().includes(query);
          }
          return isSameDay(selectedDate, new Date(newItem.lastVisitTime));
        })();

        if (isMatch) {
          setRawHistory((prev) => [newItem, ...prev]);
        }
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [searchQuery, isRegex, selectedDate, isBlacklisted]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore) {
      return;
    }
    setIsLoadingMore(true);

    try {
      if (searchQuery) {
        const lastItem = rawHistory[rawHistory.length - 1];
        if (!lastItem || !hasMoreSearchResults) {
          setIsLoadingMore(false);
          return;
        }

        const newItems = await search({
          endTime: lastItem.lastVisitTime,
          maxResults: SEARCH_PAGE_SIZE,
          text: searchQuery,
        });

        if (newItems.length < SEARCH_PAGE_SIZE) {
          setHasMoreSearchResults(false);
        }

        setRawHistory((prev) => {
          let itemsToAdd = newItems;

          if (isRegex) {
            const result = applyRegexFilter(newItems, searchQuery);
            if (result.error && !error) {
              setError(result.error);
            }
            itemsToAdd = result.filteredItems;
          }

          const combinedItems = [...prev, ...itemsToAdd];
          const itemMap = new Map(combinedItems.map((item) => [item.id, item]));
          const uniqueItems = Array.from(itemMap.values());
          uniqueItems.sort((a, b) => b.lastVisitTime - a.lastVisitTime);

          return uniqueItems;
        });
      } else {
        const nextDate = new Date(lastLoadedDate);
        nextDate.setDate(lastLoadedDate.getDate() - 1);

        const startTime = new Date(nextDate);
        startTime.setHours(0, 0, 0, 0);
        const endTime = new Date(nextDate);
        endTime.setHours(23, 59, 59, 999);

        const newItems = await search({
          endTime: endTime.getTime(),
          startTime: startTime.getTime(),
          text: '',
        });
        setRawHistory((prev) => {
          const combinedItems = [...prev, ...newItems];
          const itemMap = new Map(combinedItems.map((item) => [item.id, item]));
          const uniqueItems = Array.from(itemMap.values());
          uniqueItems.sort((a, b) => b.lastVisitTime - a.lastVisitTime);
          return uniqueItems;
        });
        setLastLoadedDate(nextDate);
      }
    } catch (err: unknown) {
      console.error('Failed to load more history:', err);
      setError('Failed to fetch more history data.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, searchQuery, rawHistory, lastLoadedDate, hasMoreSearchResults, isRegex, error]);

  const deleteHistoryItem = useCallback(
    async (id: string): Promise<void> => {
      try {
        const urlToDelete = rawHistory.find((item) => item.id === id)?.url;
        if (urlToDelete) {
          await deleteUrl({ url: urlToDelete });
          setRawHistory((prev) => prev.filter((item) => item.id !== id));
        }
      } catch (err: unknown) {
        console.error('Failed to delete history item:', err);
        setError('Failed to delete history item.');
      }
    },
    [rawHistory],
  );

  const deleteHistoryItems = useCallback(
    async (ids: string[]): Promise<void> => {
      try {
        const idsToDelete = new Set(ids);
        const deletePromises = rawHistory
          .filter((item) => idsToDelete.has(item.id) && item.url)
          .map((item) => deleteUrl({ url: item.url as string }));

        await Promise.all(deletePromises);
        setRawHistory((prev) => prev.filter((item) => !idsToDelete.has(item.id)));
      } catch (err: unknown) {
        console.error('Failed to delete history items:', err);
        setError('Failed to delete history items.');
      }
    },
    [rawHistory],
  );

  const hasMore = useMemo(() => {
    if (searchQuery) {
      return hasMoreSearchResults;
    }
    return true;
  }, [searchQuery, hasMoreSearchResults]);

  return {
    deleteHistoryItem,
    deleteHistoryItems,
    error,
    hasMore,
    history,
    isLoading,
    isLoadingMore,
    loadMore,
  };
};
