import { useCallback, useEffect, useMemo, useState } from 'react';

import { DAILY_PAGE_SIZE, SEARCH_PAGE_SIZE } from '../app/constants';
import { deleteUrl, search } from '../services/chromeApi';
import { useBlacklistStore } from '../stores/useBlacklistStore';
import { useHistoryStore } from '../stores/useHistoryStore';
import { createBlacklistMatchers, isUrlBlacklisted } from '../utilities/blacklist';
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

interface HistoryQuery {
  readonly endTime?: number;
  readonly startTime: number;
  readonly text: string;
}

interface UseHistoryReturn {
  readonly deleteHistoryItems: (ids: readonly string[]) => Promise<void>;
  readonly error: string | null;
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

  const blacklistedItems = useBlacklistStore((state) => state.blacklistedItems);
  const { searchQuery, selectedDate } = useHistoryStore((state) => ({
    searchQuery: state.searchQuery,
    selectedDate: state.selectedDate,
  }));

  // Every history item is matched against the blacklist, and compiling the patterns is the expensive
  // part, so the compiled form is derived once per item list instead of once per URL.
  const matchers = useMemo(() => createBlacklistMatchers(blacklistedItems), [blacklistedItems]);

  const fetchHistoryData = useCallback(
    async (params: HistoryQuery): Promise<void> => {
      // A non-empty text means the caller wants search results rather than one day of history.
      const isSearch = params.text !== '';
      const clientSearch = isSearch && shouldSearchClientSide(params.text);

      setIsLoading(true);
      setError(null);
      setRawHistory([]);
      if (isSearch) {
        setHasMoreSearchResults(true);
      } else {
        setLastLoadedDate(new Date(params.startTime));
      }

      try {
        const results = await search({
          endTime: params.endTime,
          maxResults: isSearch ? SEARCH_PAGE_SIZE : DAILY_PAGE_SIZE,
          startTime: params.startTime,
          text: clientSearch ? '' : params.text,
        });

        let items: readonly ChromeHistoryItem[] = results.filter((item) => !isUrlBlacklisted(item.url, matchers));
        if (clientSearch) {
          const searched = applyClientSideSearch(items, params.text);
          if (searched.error) {
            setError(searched.error);
          }
          items = searched.items;
        }

        const currentState = useHistoryStore.getState();
        const isStillRelevant = isSearch
          ? currentState.searchQuery === params.text
          : isSameDay(new Date(params.startTime), currentState.selectedDate);

        if (isStillRelevant) {
          setRawHistory(items);
          setIsLoading(false);
          if (isSearch && results.length < SEARCH_PAGE_SIZE) {
            setHasMoreSearchResults(false);
          }
        }
      } catch (err: unknown) {
        console.error('Failed to fetch history:', err);
        setError('Failed to fetch history data.');
        setIsLoading(false);
      }
    },
    [matchers],
  );

  useEffect(() => {
    if (searchQuery) {
      void fetchHistoryData({ startTime: 0, text: searchQuery });
      return;
    }

    const { startTime, endTime } = getDayBoundaries(selectedDate);
    void fetchHistoryData({ endTime, startTime, text: '' });
  }, [searchQuery, selectedDate, fetchHistoryData]);

  const messageListener = useCallback(
    (message: unknown): void => {
      if (isNewHistoryItemMessage(message)) {
        const newItem = message.payload;

        if (isUrlBlacklisted(newItem.url, matchers)) {
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
    [matchers, searchQuery, selectedDate],
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
    if (searchQuery && (rawHistory.length === 0 || !hasMoreSearchResults)) {
      return;
    }

    setIsLoadingMore(true);
    const existingIds = new Set(rawHistory.map((item) => item.id));

    try {
      if (searchQuery) {
        const lastItem = rawHistory[rawHistory.length - 1];
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

        let itemsToAdd: readonly ChromeHistoryItem[] = newItems.filter((item) => !existingIds.has(item.id) && !isUrlBlacklisted(item.url, matchers));

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
        nextDate.setDate(nextDate.getDate() - 1);

        const { startTime, endTime } = getDayBoundaries(nextDate);

        const newItems = await search({
          endTime,
          maxResults: DAILY_PAGE_SIZE,
          startTime,
          text: '',
        });
        const itemsToAdd = newItems.filter((item) => !existingIds.has(item.id) && !isUrlBlacklisted(item.url, matchers));
        setRawHistory((prev) => [...prev, ...itemsToAdd]);
        setLastLoadedDate(nextDate);
      }
    } catch (error: unknown) {
      console.error('Failed to load more history:', error);
      setError('Failed to fetch more history data.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoading, isLoadingMore, searchQuery, lastLoadedDate, hasMoreSearchResults, error, rawHistory, matchers]);

  const deleteHistoryItems = useCallback(
    async (ids: readonly string[]): Promise<void> => {
      try {
        const idsToDelete = new Set(ids);
        const urlsToDelete = new Set<string>();
        for (const item of rawHistory) {
          if (idsToDelete.has(item.id)) {
            urlsToDelete.add(item.url);
          }
        }

        if (urlsToDelete.size === 0) {
          return;
        }

        await Promise.all(Array.from(urlsToDelete, (url) => deleteUrl({ url })));

        setRawHistory((prev) => prev.filter((item) => !urlsToDelete.has(item.url)));
      } catch (error: unknown) {
        const label = ids.length > 1 ? 'items' : 'item';
        console.error(`Failed to delete history ${label}:`, error);
        setError(`Failed to delete history ${label}.`);
      }
    },
    [rawHistory],
  );

  return {
    deleteHistoryItems,
    error,
    history: rawHistory,
    isLoading,
    isLoadingMore,
    loadMore,
  };
};
