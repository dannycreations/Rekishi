import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  const [history, setHistory] = useState<ChromeHistoryItem[]>([]);
  const rawHistoryRef = useRef<ChromeHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreSearchResults, setHasMoreSearchResults] = useState(true);
  const [lastLoadedDate, setLastLoadedDate] = useState(() => new Date());

  const { isBlacklisted, blacklistedItems } = useBlacklistStore();
  const { isRegex, searchQuery, selectedDate } = useHistoryStore();

  const compiledRegex = useMemo(() => {
    if (!isRegex || searchQuery.length <= 2) {
      return { regex: null, error: null };
    }
    const pattern = searchQuery.slice(1, -1);
    if (!pattern) {
      return { regex: null, error: null };
    }
    try {
      return { regex: new RegExp(pattern, 'i'), error: null };
    } catch (e: unknown) {
      console.error('Invalid regex provided:', e);
      return { regex: null, error: 'Invalid regular expression.' };
    }
  }, [isRegex, searchQuery]);

  const applyBlacklistFilter = useCallback(
    (items: ChromeHistoryItem[]) => {
      return items.filter((item) => {
        const domain = getHostnameFromUrl(item.url);
        return !domain || !isBlacklisted(domain);
      });
    },
    [isBlacklisted],
  );

  useEffect(() => {
    setHistory(applyBlacklistFilter(rawHistoryRef.current));
  }, [blacklistedItems, applyBlacklistFilter]);

  const fetchInitialDailyHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHistory([]);
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
      rawHistoryRef.current = newItems;
      setHistory(applyBlacklistFilter(newItems));
    } catch (err: unknown) {
      console.error('Failed to fetch initial daily history:', err);
      setError('Failed to fetch history data.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, applyBlacklistFilter]);

  const fetchInitialSearchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHistory([]);
    setHasMoreSearchResults(true);

    try {
      const textForSearch = isRegex ? '' : searchQuery;
      const newItems = await search({
        maxResults: SEARCH_PAGE_SIZE,
        text: textForSearch,
      });

      let filteredItems = newItems;
      if (isRegex) {
        if (compiledRegex.error) {
          setError(compiledRegex.error);
          filteredItems = [];
        } else if (compiledRegex.regex) {
          const regex = compiledRegex.regex;
          filteredItems = newItems.filter((item) => regex.test(item.title) || regex.test(item.url));
        } else {
          filteredItems = [];
        }
      }

      rawHistoryRef.current = filteredItems;
      setHistory(applyBlacklistFilter(filteredItems));

      if (newItems.length < SEARCH_PAGE_SIZE) {
        setHasMoreSearchResults(false);
      }
    } catch (err: unknown) {
      console.error('Failed to fetch initial search history:', err);
      setError('Failed to fetch history data.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, isRegex, applyBlacklistFilter, compiledRegex]);

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
          rawHistoryRef.current = rawHistoryRef.current.filter((item) => item.id !== newItem.id);
          setHistory((prev) => prev.filter((item) => item.id !== newItem.id));
          return;
        }

        const isMatch = (() => {
          if (searchQuery) {
            if (isRegex) {
              if (compiledRegex.error || !compiledRegex.regex) return false;
              return compiledRegex.regex.test(newItem.title) || compiledRegex.regex.test(newItem.url);
            }
            const query = searchQuery.toLowerCase();
            return (newItem.title ?? '').toLowerCase().includes(query) || (newItem.url ?? '').toLowerCase().includes(query);
          }
          return isSameDay(selectedDate, new Date(newItem.lastVisitTime));
        })();

        rawHistoryRef.current = [newItem, ...rawHistoryRef.current.filter((item) => item.id !== newItem.id)];

        if (isMatch) {
          setHistory((prev) => [newItem, ...prev.filter((item) => item.id !== newItem.id)]);
        } else {
          setHistory((prev) => prev.filter((item) => item.id !== newItem.id));
        }
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [searchQuery, isRegex, selectedDate, isBlacklisted, compiledRegex]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore) {
      return;
    }
    setIsLoadingMore(true);

    try {
      const existingIds = new Set(rawHistoryRef.current.map((i) => i.id));
      if (searchQuery) {
        const lastItem = rawHistoryRef.current[rawHistoryRef.current.length - 1];
        if (!lastItem || !hasMoreSearchResults) {
          setIsLoadingMore(false);
          return;
        }

        const textForSearch = isRegex ? '' : searchQuery;
        const newItems = await search({
          endTime: lastItem.lastVisitTime,
          maxResults: SEARCH_PAGE_SIZE,
          text: textForSearch,
        });

        if (newItems.length < SEARCH_PAGE_SIZE) {
          setHasMoreSearchResults(false);
        }

        let itemsToAdd = newItems.filter((i) => !existingIds.has(i.id));
        if (isRegex) {
          if (compiledRegex.error) {
            if (!error) setError(compiledRegex.error);
            itemsToAdd = [];
          } else if (compiledRegex.regex) {
            const regex = compiledRegex.regex;
            itemsToAdd = itemsToAdd.filter((item) => regex.test(item.title) || regex.test(item.url));
          } else {
            itemsToAdd = [];
          }
        }

        rawHistoryRef.current.push(...itemsToAdd);
        setHistory((prev) => [...prev, ...applyBlacklistFilter(itemsToAdd)]);
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
        const uniqueNewItems = newItems.filter((i) => !existingIds.has(i.id));
        rawHistoryRef.current.push(...uniqueNewItems);
        setHistory((prev) => [...prev, ...applyBlacklistFilter(uniqueNewItems)]);
        setLastLoadedDate(nextDate);
      }
    } catch (err: unknown) {
      console.error('Failed to load more history:', err);
      setError('Failed to fetch more history data.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, searchQuery, lastLoadedDate, hasMoreSearchResults, isRegex, error, applyBlacklistFilter, compiledRegex]);

  const deleteHistoryItem = useCallback(async (id: string): Promise<void> => {
    try {
      const urlToDelete = rawHistoryRef.current.find((item) => item.id === id)?.url;
      if (urlToDelete) {
        await deleteUrl({ url: urlToDelete });
        rawHistoryRef.current = rawHistoryRef.current.filter((item) => item.id !== id);
        setHistory((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err: unknown) {
      console.error('Failed to delete history item:', err);
      setError('Failed to delete history item.');
    }
  }, []);

  const deleteHistoryItems = useCallback(async (ids: string[]): Promise<void> => {
    try {
      const idsToDelete = new Set(ids);
      const deletePromises = rawHistoryRef.current
        .filter((item) => idsToDelete.has(item.id) && item.url)
        .map((item) => deleteUrl({ url: item.url as string }));

      await Promise.all(deletePromises);
      rawHistoryRef.current = rawHistoryRef.current.filter((item) => !idsToDelete.has(item.id));
      setHistory((prev) => prev.filter((item) => !idsToDelete.has(item.id)));
    } catch (err: unknown) {
      console.error('Failed to delete history items:', err);
      setError('Failed to delete history items.');
    }
  }, []);

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
