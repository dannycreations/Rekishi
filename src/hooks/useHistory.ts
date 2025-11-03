import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DAILY_PAGE_SIZE, INIT_CHUNK_SIZE, SEARCH_PAGE_SIZE } from '../app/constants';
import { deleteUrl, search } from '../services/chromeApi';
import { useBlacklistStore } from '../stores/useBlacklistStore';
import { useHistoryStore } from '../stores/useHistoryStore';
import { isPotentialRegex } from '../utilities/blacklistUtil';
import { isSameDay } from '../utilities/dateUtil';
import { getHostnameFromUrl } from '../utilities/urlUtil';

import type { ChromeHistoryItem } from '../app/types';

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
  history: readonly ChromeHistoryItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
}

export const useHistory = (): UseHistoryReturn => {
  const [rawHistory, setRawHistory] = useState<readonly ChromeHistoryItem[]>([]);
  const historyItemMap = useRef<Map<string, ChromeHistoryItem>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreSearchResults, setHasMoreSearchResults] = useState(true);
  const [lastLoadedDate, setLastLoadedDate] = useState(() => new Date());

  const { isBlacklisted, blacklistedItems } = useBlacklistStore((state) => ({
    isBlacklisted: state.isBlacklisted,
    blacklistedItems: state.blacklistedItems,
  }));
  const { searchQuery, selectedDate } = useHistoryStore((state) => ({
    searchQuery: state.searchQuery,
    selectedDate: state.selectedDate,
  }));
  const isRegex = useMemo(() => isPotentialRegex(searchQuery), [searchQuery]);

  const applyBlacklistFilter = useCallback(
    (items: readonly ChromeHistoryItem[]) => {
      if (blacklistedItems.length === 0) return items;
      return items.filter((item) => {
        const domain = getHostnameFromUrl(item.url);
        return !domain || !isBlacklisted(domain);
      });
    },
    [isBlacklisted, blacklistedItems],
  );

  const history = useMemo(() => applyBlacklistFilter(rawHistory), [rawHistory, applyBlacklistFilter]);

  useEffect(() => {
    historyItemMap.current.clear();
    rawHistory.forEach((item) => historyItemMap.current.set(item.id, item));
  }, [rawHistory]);

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
    } catch (error: unknown) {
      console.error('Invalid regex provided:', error);
      return { regex: null, error: 'Invalid regular expression.' };
    }
  }, [isRegex, searchQuery]);

  const fetchInitialDailyHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setRawHistory([]);
    setLastLoadedDate(selectedDate);

    const dateToFetch = selectedDate;

    const startTime = new Date(dateToFetch);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(dateToFetch);
    endTime.setHours(23, 59, 59, 999);

    let initialItems: ChromeHistoryItem[] = [];
    try {
      initialItems = await search({
        endTime: endTime.getTime(),
        maxResults: INIT_CHUNK_SIZE,
        startTime: startTime.getTime(),
        text: '',
      });

      if (isSameDay(dateToFetch, useHistoryStore.getState().selectedDate)) {
        setRawHistory(initialItems);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch initial daily history:', error);
      if (isSameDay(dateToFetch, useHistoryStore.getState().selectedDate)) {
        setError('Failed to fetch history data.');
      }
    } finally {
      if (isSameDay(dateToFetch, useHistoryStore.getState().selectedDate)) {
        setIsLoading(false);
      }
    }

    if (initialItems.length < INIT_CHUNK_SIZE) {
      return;
    }

    (async () => {
      try {
        const allItemsForDay = await search({
          endTime: endTime.getTime(),
          maxResults: DAILY_PAGE_SIZE,
          startTime: startTime.getTime(),
          text: '',
        });

        if (isSameDay(dateToFetch, useHistoryStore.getState().selectedDate)) {
          setRawHistory(allItemsForDay);
        }
      } catch (error: unknown) {
        console.error('Failed to fetch rest of daily history in background:', error);
      }
    })();
  }, [selectedDate]);

  const fetchInitialSearchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setRawHistory([]);
    setHasMoreSearchResults(true);

    const textForSearch = isRegex ? '' : searchQuery;
    let initialItems: ChromeHistoryItem[] = [];

    try {
      initialItems = await search({
        maxResults: INIT_CHUNK_SIZE,
        text: textForSearch,
      });

      let filteredInitialItems = initialItems;
      if (isRegex) {
        if (compiledRegex.error) {
          setError(compiledRegex.error);
          filteredInitialItems = [];
        } else if (compiledRegex.regex) {
          const regex = compiledRegex.regex;
          filteredInitialItems = initialItems.filter((item) => regex.test(item.title) || regex.test(item.url));
        } else {
          filteredInitialItems = [];
        }
      }
      setRawHistory(filteredInitialItems);
    } catch (error: unknown) {
      console.error('Failed to fetch initial search history:', error);
      setError('Failed to fetch history data.');
    } finally {
      setIsLoading(false);
    }

    if (initialItems.length < INIT_CHUNK_SIZE) {
      setHasMoreSearchResults(false);
      return;
    }

    (async () => {
      try {
        const moreItems = await search({
          maxResults: SEARCH_PAGE_SIZE,
          text: textForSearch,
        });

        let filteredMoreItems = moreItems;
        if (isRegex) {
          if (compiledRegex.error) {
            filteredMoreItems = [];
          } else if (compiledRegex.regex) {
            const regex = compiledRegex.regex;
            filteredMoreItems = moreItems.filter((item) => regex.test(item.title) || regex.test(item.url));
          } else {
            filteredMoreItems = [];
          }
        }

        if (searchQuery === useHistoryStore.getState().searchQuery) {
          setRawHistory(filteredMoreItems);
          if (moreItems.length < SEARCH_PAGE_SIZE) {
            setHasMoreSearchResults(false);
          }
        }
      } catch (error: unknown) {
        console.error('Failed to fetch rest of search history in background:', error);
      }
    })();
  }, [searchQuery, isRegex, compiledRegex]);

  useEffect(() => {
    if (searchQuery) {
      fetchInitialSearchHistory();
    } else {
      fetchInitialDailyHistory();
    }
  }, [searchQuery, selectedDate, isRegex, fetchInitialDailyHistory, fetchInitialSearchHistory]);

  const messageListener = useCallback(
    (message: unknown): void => {
      if (isNewHistoryItemMessage(message)) {
        const newItem = message.payload;
        const domain = getHostnameFromUrl(newItem.url);

        if (isBlacklisted(domain)) {
          setRawHistory((prev) => prev.filter((item) => item.id !== newItem.id));
          return;
        }

        let isMatch: boolean;
        if (searchQuery) {
          if (isRegex) {
            if (compiledRegex.error || !compiledRegex.regex) {
              isMatch = false;
            } else {
              isMatch = compiledRegex.regex.test(newItem.title) || compiledRegex.regex.test(newItem.url);
            }
          } else {
            const query = searchQuery.toLowerCase();
            isMatch = (newItem.title ?? '').toLowerCase().includes(query) || (newItem.url ?? '').toLowerCase().includes(query);
          }
        } else {
          isMatch = isSameDay(selectedDate, new Date(newItem.lastVisitTime));
        }

        setRawHistory((prev) => {
          const filtered = prev.filter((item) => item.id !== newItem.id);
          if (isMatch) {
            return [newItem, ...filtered];
          }
          return filtered;
        });
      }
    },
    [isBlacklisted, searchQuery, isRegex, compiledRegex, selectedDate],
  );

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) {
      return undefined;
    }

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [messageListener]);

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

        const textForSearch = isRegex ? '' : searchQuery;
        const newItems = await search({
          endTime: lastItem.lastVisitTime,
          maxResults: SEARCH_PAGE_SIZE,
          text: textForSearch,
        });

        if (newItems.length < SEARCH_PAGE_SIZE) {
          setHasMoreSearchResults(false);
        }

        const uniqueNewItems = newItems.filter((i) => !historyItemMap.current.has(i.id));
        let itemsToAdd = uniqueNewItems;
        if (isRegex) {
          if (compiledRegex.error) {
            if (!error) setError(compiledRegex.error);
            itemsToAdd = [];
          } else if (compiledRegex.regex) {
            const regex = compiledRegex.regex;
            itemsToAdd = uniqueNewItems.filter((item) => regex.test(item.title) || regex.test(item.url));
          } else {
            itemsToAdd = [];
          }
        }
        setRawHistory((prev) => [...prev, ...itemsToAdd]);
      } else {
        const nextDate = new Date(lastLoadedDate);
        nextDate.setDate(lastLoadedDate.getDate() - 1);

        const startTime = new Date(nextDate);
        startTime.setHours(0, 0, 0, 0);
        const endTime = new Date(nextDate);
        endTime.setHours(23, 59, 59, 999);

        const newItems = await search({
          endTime: endTime.getTime(),
          maxResults: DAILY_PAGE_SIZE,
          startTime: startTime.getTime(),
          text: '',
        });
        const uniqueNewItems = newItems.filter((i) => !historyItemMap.current.has(i.id));
        setRawHistory((prev) => [...prev, ...uniqueNewItems]);
        setLastLoadedDate(nextDate);
      }
    } catch (error: unknown) {
      console.error('Failed to load more history:', error);
      setError('Failed to fetch more history data.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, searchQuery, lastLoadedDate, hasMoreSearchResults, isRegex, error, compiledRegex, rawHistory]);

  const deleteHistoryItem = useCallback(async (id: string): Promise<void> => {
    try {
      const itemToDelete = historyItemMap.current.get(id);
      if (itemToDelete?.url) {
        await deleteUrl({ url: itemToDelete.url });
        setRawHistory((prev) => prev.filter((item) => item.url !== itemToDelete.url));
      }
    } catch (error: unknown) {
      console.error('Failed to delete history item:', error);
      setError('Failed to delete history item.');
    }
  }, []);

  const deleteHistoryItems = useCallback(async (ids: string[]): Promise<void> => {
    try {
      const urlsToDelete = new Set<string>();
      for (const id of ids) {
        const item = historyItemMap.current.get(id);
        if (item?.url) {
          urlsToDelete.add(item.url);
        }
      }

      const deletePromises = Array.from(urlsToDelete).map((url) => deleteUrl({ url }));
      await Promise.all(deletePromises);

      setRawHistory((prev) => prev.filter((item) => !urlsToDelete.has(item.url)));
    } catch (error: unknown) {
      console.error('Failed to delete history items:', error);
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
