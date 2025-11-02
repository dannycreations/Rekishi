import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { deleteUrl, search } from '../services/chromeApi';
import { useBlacklistStore } from '../stores/useBlacklistStore';
import { useHistoryStore } from '../stores/useHistoryStore';
import { isSameDay } from '../utilities/dateUtil';
import { getHostnameFromUrl } from '../utilities/urlUtil';

import type { ChromeHistoryItem } from '../app/types';

const SEARCH_PAGE_SIZE = 100;
const SEARCH_CHUNK_SIZE = 20;
const DAILY_PAGE_SIZE = 500;
const DAILY_CHUNK_SIZE = 20;

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
    rawHistoryRef.current = [];
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
        maxResults: DAILY_CHUNK_SIZE,
        startTime: startTime.getTime(),
        text: '',
      });

      if (isSameDay(dateToFetch, useHistoryStore.getState().selectedDate)) {
        rawHistoryRef.current = initialItems;
        setHistory(applyBlacklistFilter(initialItems));
      }
    } catch (err: unknown) {
      console.error('Failed to fetch initial daily history:', err);
      if (isSameDay(dateToFetch, useHistoryStore.getState().selectedDate)) {
        setError('Failed to fetch history data.');
      }
    } finally {
      if (isSameDay(dateToFetch, useHistoryStore.getState().selectedDate)) {
        setIsLoading(false);
      }
    }

    if (initialItems.length < DAILY_CHUNK_SIZE) {
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
          const currentRawItems = rawHistoryRef.current;

          if (allItemsForDay.length > currentRawItems.length) {
            rawHistoryRef.current = allItemsForDay;
            setHistory(applyBlacklistFilter(allItemsForDay));
          }
        }
      } catch (err) {
        console.error('Failed to fetch rest of daily history in background:', err);
      }
    })();
  }, [selectedDate, applyBlacklistFilter]);

  const fetchInitialSearchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHistory([]);
    rawHistoryRef.current = [];
    setHasMoreSearchResults(true);

    const textForSearch = isRegex ? '' : searchQuery;
    let initialItems: ChromeHistoryItem[] = [];

    try {
      initialItems = await search({
        maxResults: SEARCH_CHUNK_SIZE,
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

      rawHistoryRef.current = filteredInitialItems;
      setHistory(applyBlacklistFilter(filteredInitialItems));
    } catch (err: unknown) {
      console.error('Failed to fetch initial search history:', err);
      setError('Failed to fetch history data.');
    } finally {
      setIsLoading(false);
    }

    if (initialItems.length < SEARCH_CHUNK_SIZE) {
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
          rawHistoryRef.current = filteredMoreItems;
          setHistory(applyBlacklistFilter(filteredMoreItems));
          if (moreItems.length < SEARCH_PAGE_SIZE) {
            setHasMoreSearchResults(false);
          }
        }
      } catch (err) {
        console.error('Failed to fetch rest of search history in background:', err);
      }
    })();
  }, [searchQuery, isRegex, applyBlacklistFilter, compiledRegex]);

  useEffect(() => {
    if (searchQuery) {
      fetchInitialSearchHistory();
    } else {
      fetchInitialDailyHistory();
    }
  }, [searchQuery, selectedDate, isRegex, fetchInitialDailyHistory, fetchInitialSearchHistory]);

  const removeItemsByIds = useCallback((idsToRemove: Set<string>) => {
    rawHistoryRef.current = rawHistoryRef.current.filter((item) => !idsToRemove.has(item.id));
    setHistory((prev) => prev.filter((item) => !idsToRemove.has(item.id)));
  }, []);

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) {
      return undefined;
    }

    const messageListener = (message: unknown): void => {
      if (isNewHistoryItemMessage(message)) {
        const newItem = message.payload;

        const domain = getHostnameFromUrl(newItem.url);
        if (isBlacklisted(domain)) {
          removeItemsByIds(new Set([newItem.id]));
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

        const rawIdx = rawHistoryRef.current.findIndex((i) => i.id === newItem.id);
        if (rawIdx !== -1) {
          rawHistoryRef.current.splice(rawIdx, 1);
        }
        rawHistoryRef.current.unshift(newItem);

        setHistory((prev) => {
          const prevIdx = prev.findIndex((i) => i.id === newItem.id);

          if (prevIdx === -1 && !isMatch) {
            return prev;
          }

          const newHistory = [...prev];
          if (prevIdx !== -1) {
            newHistory.splice(prevIdx, 1);
          }
          if (isMatch) {
            newHistory.unshift(newItem);
          }
          return newHistory;
        });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [searchQuery, isRegex, selectedDate, isBlacklisted, compiledRegex, removeItemsByIds]);

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

        const uniqueNewItems = newItems.filter((i) => !existingIds.has(i.id));
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
          maxResults: DAILY_PAGE_SIZE,
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

  const deleteHistoryItem = useCallback(
    async (id: string): Promise<void> => {
      try {
        const itemToDelete = rawHistoryRef.current.find((item) => item.id === id);
        if (itemToDelete?.url) {
          await deleteUrl({ url: itemToDelete.url });
          removeItemsByIds(new Set([id]));
        }
      } catch (err: unknown) {
        console.error('Failed to delete history item:', err);
        setError('Failed to delete history item.');
      }
    },
    [removeItemsByIds],
  );

  const deleteHistoryItems = useCallback(
    async (ids: string[]): Promise<void> => {
      try {
        const idsToDelete = new Set(ids);
        const urlsToDelete = new Set<string>();

        for (const item of rawHistoryRef.current) {
          if (idsToDelete.size === 0) {
            break;
          }
          if (idsToDelete.has(item.id)) {
            if (item.url) {
              urlsToDelete.add(item.url);
            }
            idsToDelete.delete(item.id);
          }
        }

        const deletePromises = Array.from(urlsToDelete).map((url) => deleteUrl({ url }));
        await Promise.all(deletePromises);

        removeItemsByIds(new Set(ids));
      } catch (err: unknown) {
        console.error('Failed to delete history items:', err);
        setError('Failed to delete history items.');
      }
    },
    [removeItemsByIds],
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
