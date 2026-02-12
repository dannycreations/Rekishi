import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DAILY_PAGE_SIZE, INIT_CHUNK_SIZE, SEARCH_PAGE_SIZE } from '../app/constants';
import { applyClientSideSearch } from '../helpers/historyHelper';
import { deleteUrl, search } from '../services/chromeApi';
import { useBlacklistStore } from '../stores/useBlacklistStore';
import { useHistoryStore } from '../stores/useHistoryStore';
import { compileRegex, isPotentialRegex } from '../utilities/commonUtil';
import { getDayBoundaries, isSameDay } from '../utilities/dateUtil';

import type { ChromeHistoryItem } from '../app/types';

interface NewHistoryItemMessage {
  readonly type: 'NEW_HISTORY_ITEM';
  readonly payload: ChromeHistoryItem;
}

const isNewHistoryItemMessage = (message: unknown): message is NewHistoryItemMessage => {
  const msg = message as NewHistoryItemMessage;
  return !!msg && msg.type === 'NEW_HISTORY_ITEM' && !!msg.payload;
};

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

  const compiledRegex = useMemo(() => {
    if (!isRegex) {
      return { regex: null, error: null };
    }
    return compileRegex(searchQuery);
  }, [isRegex, searchQuery]);

  const history = rawHistory;

  useEffect(() => {
    historyItemMap.current.clear();
    rawHistory.forEach((item) => historyItemMap.current.set(item.id, item));
  }, [rawHistory]);

  const fetchHistoryData = useCallback(
    async (params: {
      readonly isSearch: boolean;
      readonly startTime: number;
      readonly endTime?: number;
      readonly text: string;
      readonly isClientSearch: boolean;
    }): Promise<void> => {
      setIsLoading(true);
      setError(null);
      setRawHistory([]);
      if (!params.isSearch) {
        setLastLoadedDate(new Date(params.startTime));
      } else {
        setHasMoreSearchResults(true);
      }

      const fetchItems = async (maxResults: number): Promise<readonly ChromeHistoryItem[]> => {
        const results = await search({
          endTime: params.endTime,
          maxResults,
          startTime: params.startTime,
          text: params.isClientSearch ? '' : params.text,
        });

        const filtered = results.filter((item) => !isBlacklisted(item.url));

        if (params.isClientSearch) {
          const { items, error: filterError } = applyClientSideSearch(filtered, params.text, isRegex, compiledRegex);
          if (filterError) {
            setError(filterError);
          }
          return items;
        }
        return filtered;
      };

      try {
        const initialItems = await fetchItems(INIT_CHUNK_SIZE);

        const isStillRelevant = (): boolean => {
          const currentState = useHistoryStore.getState();
          return params.isSearch ? currentState.searchQuery === params.text : isSameDay(new Date(params.startTime), currentState.selectedDate);
        };

        if (isStillRelevant()) {
          setRawHistory(initialItems);
          setIsLoading(false);

          if (params.isSearch && initialItems.length < INIT_CHUNK_SIZE) {
            setHasMoreSearchResults(false);
          }
        }

        if (initialItems.length >= INIT_CHUNK_SIZE) {
          const pageSize = params.isSearch ? SEARCH_PAGE_SIZE : DAILY_PAGE_SIZE;
          const moreItems = await fetchItems(pageSize);

          if (isStillRelevant()) {
            setRawHistory(moreItems);
            if (params.isSearch && moreItems.length < pageSize) {
              setHasMoreSearchResults(false);
            }
          }
        }
      } catch (err: unknown) {
        console.error('Failed to fetch history:', err);
        setError('Failed to fetch history data.');
        setIsLoading(false);
      }
    },
    [isBlacklisted, isRegex, compiledRegex],
  );

  const fetchInitialDailyHistory = useCallback((): void => {
    const { startTime, endTime } = getDayBoundaries(selectedDate);

    void fetchHistoryData({
      endTime,
      isClientSearch: false,
      isSearch: false,
      startTime,
      text: '',
    });
  }, [selectedDate, fetchHistoryData]);

  const fetchInitialSearchHistory = useCallback((): void => {
    void fetchHistoryData({
      isClientSearch: isRegex || searchQuery.length < 3,
      isSearch: true,
      startTime: 0,
      text: searchQuery,
    });
  }, [searchQuery, isRegex, fetchHistoryData]);

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

        const { startTime, endTime } = getDayBoundaries(nextDate);

        const newItems = await search({
          endTime,
          maxResults: DAILY_PAGE_SIZE,
          startTime,
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
