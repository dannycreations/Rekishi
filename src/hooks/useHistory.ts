import { useCallback, useEffect, useState } from 'react';

import { DAILY_PAGE_SIZE, SEARCH_PAGE_SIZE } from '../app/constants';
import { deleteUrl, search } from '../services/chromeApi';
import { useBlacklistStore } from '../stores/useBlacklistStore';
import { useHistoryStore } from '../stores/useHistoryStore';
import { getDayBoundaries, isSameDay } from '../utilities/date';
import { applyClientSideSearch, shouldSearchClientSide } from '../utilities/history';

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

  const fetchHistoryData = useCallback(
    async (params: {
      readonly clientSearch: boolean;
      readonly endTime?: number;
      readonly isSearch: boolean;
      readonly startTime: number;
      readonly text: string;
    }): Promise<void> => {
      setIsLoading(true);
      setError(null);
      setRawHistory([]);
      if (params.isSearch) {
        setHasMoreSearchResults(true);
      } else {
        setLastLoadedDate(new Date(params.startTime));
      }

      try {
        const results = await search({
          endTime: params.endTime,
          maxResults: params.isSearch ? SEARCH_PAGE_SIZE : DAILY_PAGE_SIZE,
          startTime: params.startTime,
          text: params.clientSearch ? '' : params.text,
        });

        let items: readonly ChromeHistoryItem[] = results.filter((item) => !isBlacklisted(item.url));
        if (params.clientSearch) {
          const searched = applyClientSideSearch(items, params.text);
          if (searched.error) {
            setError(searched.error);
          }
          items = searched.items;
        }

        const currentState = useHistoryStore.getState();
        const isStillRelevant = params.isSearch
          ? currentState.searchQuery === params.text
          : isSameDay(new Date(params.startTime), currentState.selectedDate);

        if (isStillRelevant) {
          setRawHistory(items);
          setIsLoading(false);
          if (params.isSearch && results.length < SEARCH_PAGE_SIZE) {
            setHasMoreSearchResults(false);
          }
        }
      } catch (err: unknown) {
        console.error('Failed to fetch history:', err);
        setError('Failed to fetch history data.');
        setIsLoading(false);
      }
    },
    [isBlacklisted],
  );

  const fetchInitialDailyHistory = useCallback((): void => {
    const { startTime, endTime } = getDayBoundaries(selectedDate);

    void fetchHistoryData({
      clientSearch: false,
      endTime,
      isSearch: false,
      startTime,
      text: '',
    });
  }, [selectedDate, fetchHistoryData]);

  const fetchInitialSearchHistory = useCallback((): void => {
    void fetchHistoryData({
      clientSearch: shouldSearchClientSide(searchQuery),
      isSearch: true,
      startTime: 0,
      text: searchQuery,
    });
  }, [searchQuery, fetchHistoryData]);

  useEffect(() => {
    if (searchQuery) {
      fetchInitialSearchHistory();
    } else {
      fetchInitialDailyHistory();
    }
  }, [searchQuery, selectedDate, fetchInitialDailyHistory, fetchInitialSearchHistory, blacklistedItems]);

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
          const { items } = applyClientSideSearch([newItem], searchQuery);
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
    [isBlacklisted, searchQuery, selectedDate],
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
    const existingIds = new Set(rawHistory.map((item) => item.id));

    try {
      if (searchQuery) {
        const lastItem = rawHistory[rawHistory.length - 1];
        if (!lastItem || !hasMoreSearchResults) {
          setIsLoadingMore(false);
          return;
        }

        const clientSearch = shouldSearchClientSide(searchQuery);

        const newItems = await search({
          endTime: lastItem.lastVisitTime,
          maxResults: SEARCH_PAGE_SIZE,
          startTime: 0,
          text: clientSearch ? '' : searchQuery,
        });

        if (newItems.length < SEARCH_PAGE_SIZE) {
          setHasMoreSearchResults(false);
        }

        const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));
        let itemsToAdd: readonly ChromeHistoryItem[] = uniqueNewItems.filter((item) => !isBlacklisted(item.url));

        if (clientSearch) {
          const searched = applyClientSideSearch(itemsToAdd, searchQuery);
          if (searched.error && !error) {
            setError(searched.error);
          }
          itemsToAdd = searched.items;
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
        const uniqueNewItems = newItems.filter((item) => !existingIds.has(item.id));
        setRawHistory((prev) => [...prev, ...uniqueNewItems.filter((item) => !isBlacklisted(item.url))]);
        setLastLoadedDate(nextDate);
      }
    } catch (error: unknown) {
      console.error('Failed to load more history:', error);
      setError('Failed to fetch more history data.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, searchQuery, lastLoadedDate, hasMoreSearchResults, error, rawHistory, isBlacklisted]);

  const deleteHistoryItem = useCallback(
    async (id: string): Promise<void> => {
      try {
        const itemToDelete = rawHistory.find((entry) => entry.id === id);
        if (itemToDelete?.url) {
          await deleteUrl({ url: itemToDelete.url });
          setRawHistory((prev) => prev.filter((item) => item.url !== itemToDelete.url));
        }
      } catch (error: unknown) {
        console.error('Failed to delete history item:', error);
        setError('Failed to delete history item.');
      }
    },
    [rawHistory],
  );

  const deleteHistoryItems = useCallback(
    async (ids: readonly string[]): Promise<void> => {
      try {
        const urlsToDelete = new Set<string>();
        for (const id of ids) {
          const item = rawHistory.find((entry) => entry.id === id);
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
    },
    [rawHistory],
  );

  const hasMore = searchQuery ? hasMoreSearchResults : true;

  return {
    deleteHistoryItem,
    deleteHistoryItems,
    error,
    hasMore,
    history: rawHistory,
    isLoading,
    isLoadingMore,
    loadMore,
  };
};
