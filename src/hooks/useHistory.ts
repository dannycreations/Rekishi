import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DAILY_PAGE_SIZE, INIT_CHUNK_SIZE, SEARCH_PAGE_SIZE } from '../app/constants';
import { isPotentialRegex } from '../helpers/blacklistHelper';
import { deleteUrl, search } from '../services/chromeApi';
import { useBlacklistStore } from '../stores/useBlacklistStore';
import { useHistoryStore } from '../stores/useHistoryStore';
import { isSameDay } from '../utilities/dateUtil';

import type { ChromeHistoryItem } from '../app/types';

interface NewHistoryItemMessage {
  readonly type: 'NEW_HISTORY_ITEM';
  readonly payload: ChromeHistoryItem;
}

function isNewHistoryItemMessage(message: unknown): message is NewHistoryItemMessage {
  const msg = message as NewHistoryItemMessage;
  return !!msg && msg.type === 'NEW_HISTORY_ITEM' && !!msg.payload;
}

interface UseHistoryReturn {
  readonly deleteHistoryItem: (id: string) => Promise<void>;
  readonly deleteHistoryItems: (ids: readonly string[]) => Promise<void>;
  readonly error: string | null;
  readonly hasMore: boolean;
  readonly history: readonly ChromeHistoryItem[];
  readonly isLoading: boolean;
  readonly isLoadingMore: boolean;
  readonly loadMore: () => void;
}

function applyClientSideSearch(
  items: readonly ChromeHistoryItem[],
  searchQuery: string,
  isRegex: boolean,
  compiledRegex: {
    readonly regex: RegExp | null;
    readonly error: string | null;
  },
): {
  readonly items: readonly ChromeHistoryItem[];
  readonly error?: string;
} {
  if (isRegex) {
    if (compiledRegex.error) {
      return { items: [], error: compiledRegex.error };
    }
    if (compiledRegex.regex) {
      const regex = compiledRegex.regex;
      return { items: items.filter((item) => regex.test(item.title) || regex.test(item.url)) };
    }
    return { items: [] };
  }

  const query = searchQuery.toLowerCase();
  return {
    items: items.filter((item) => (item.title ?? '').toLowerCase().includes(query) || (item.url ?? '').toLowerCase().includes(query)),
  };
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

  const history = rawHistory;

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

  const fetchInitialDailyHistory = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setRawHistory([]);
    setLastLoadedDate(selectedDate);

    const dateToFetch = selectedDate;
    const startTime = new Date(dateToFetch);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(dateToFetch);
    endTime.setHours(23, 59, 59, 999);

    let initialItems: readonly ChromeHistoryItem[] = [];
    try {
      initialItems = await search({
        endTime: endTime.getTime(),
        maxResults: INIT_CHUNK_SIZE,
        startTime: startTime.getTime(),
        text: '',
      });

      if (isSameDay(dateToFetch, useHistoryStore.getState().selectedDate)) {
        setRawHistory(initialItems.filter((item) => !isBlacklisted(item.url)));
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
          setRawHistory(allItemsForDay.filter((item) => !isBlacklisted(item.url)));
        }
      } catch (error: unknown) {
        console.error('Failed to fetch rest of daily history in background:', error);
      }
    })();
  }, [selectedDate, isBlacklisted]);

  const fetchInitialSearchHistory = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setRawHistory([]);
    setHasMoreSearchResults(true);

    const clientSideSearch = isRegex || searchQuery.length < 3;
    const textForSearch = clientSideSearch ? '' : searchQuery;
    let initialItems: readonly ChromeHistoryItem[] = [];

    try {
      initialItems = await search({
        maxResults: INIT_CHUNK_SIZE,
        startTime: 0,
        text: textForSearch,
      });

      // FIX: Ensure filteredItems is a readonly array to match return type of applyClientSideSearch
      let filteredItems: readonly ChromeHistoryItem[] = initialItems.filter((item) => !isBlacklisted(item.url));
      if (clientSideSearch) {
        const { items, error: filterError } = applyClientSideSearch(filteredItems, searchQuery, isRegex, compiledRegex);
        if (filterError) {
          setError(filterError);
        }
        // FIX: Remove unsafe type assertion. `items` is already the correct readonly type.
        filteredItems = items;
      }
      setRawHistory(filteredItems);
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
          startTime: 0,
          text: textForSearch,
        });

        // FIX: Ensure filteredMoreItems is a readonly array to match return type of applyClientSideSearch
        let filteredMoreItems: readonly ChromeHistoryItem[] = moreItems.filter((item) => !isBlacklisted(item.url));
        if (clientSideSearch) {
          const { items, error: filterError } = applyClientSideSearch(filteredMoreItems, searchQuery, isRegex, compiledRegex);
          if (filterError && !error) {
            setError(filterError);
          }
          // FIX: Remove unsafe type assertion. `items` is already the correct readonly type.
          filteredMoreItems = items;
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
  }, [searchQuery, isRegex, compiledRegex, isBlacklisted, error]);

  useEffect(() => {
    if (searchQuery) {
      fetchInitialSearchHistory();
    } else {
      fetchInitialDailyHistory();
    }
  }, [searchQuery, selectedDate, isRegex, fetchInitialDailyHistory, fetchInitialSearchHistory, blacklistedItems]);

  const messageListener = useCallback(
    (message: unknown): void => {
      if (isNewHistoryItemMessage(message)) {
        const newItem = message.payload;

        if (isBlacklisted(newItem.url)) {
          setRawHistory((prev) => prev.filter((item) => item.id !== newItem.id));
          return;
        }

        let isMatch: boolean;
        if (searchQuery) {
          const { items } = applyClientSideSearch([newItem], searchQuery, isRegex, compiledRegex);
          isMatch = items.length > 0;
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
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(messageListener);

      return () => {
        chrome.runtime.onMessage.removeListener(messageListener);
      };
    }
  }, [messageListener]);

  const loadMore = useCallback(async (): Promise<void> => {
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

        const clientSideSearch = isRegex || searchQuery.length < 3;
        const textForSearch = clientSideSearch ? '' : searchQuery;

        const newItems = await search({
          endTime: lastItem.lastVisitTime,
          maxResults: SEARCH_PAGE_SIZE,
          startTime: 0,
          text: textForSearch,
        });

        if (newItems.length < SEARCH_PAGE_SIZE) {
          setHasMoreSearchResults(false);
        }

        const uniqueNewItems = newItems.filter((i) => !historyItemMap.current.has(i.id));
        let itemsToAdd: readonly ChromeHistoryItem[] = uniqueNewItems.filter((item) => !isBlacklisted(item.url));

        if (clientSideSearch) {
          const { items, error: filterError } = applyClientSideSearch(itemsToAdd, searchQuery, isRegex, compiledRegex);
          if (filterError && !error) {
            setError(filterError);
          }
          itemsToAdd = items;
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
        setRawHistory((prev) => [...prev, ...uniqueNewItems.filter((item) => !isBlacklisted(item.url))]);
        setLastLoadedDate(nextDate);
      }
    } catch (error: unknown) {
      console.error('Failed to load more history:', error);
      setError('Failed to fetch more history data.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, searchQuery, lastLoadedDate, hasMoreSearchResults, isRegex, error, compiledRegex, rawHistory, isBlacklisted]);

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

  const deleteHistoryItems = useCallback(async (ids: readonly string[]): Promise<void> => {
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

  const hasMore = useMemo((): boolean => {
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
