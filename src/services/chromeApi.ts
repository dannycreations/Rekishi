import { mapToChromeHistoryItem } from '../utilities/history';
import { deleteAllHistory as fakeDeleteAllHistory, deleteUrl as fakeDeleteUrl, search as fakeSearch } from './fakeApi';

import type { ChromeHistoryItem, SearchParams } from '../app/types';

const wrapChromeApi = async <T>(apiCall: () => Promise<T>, errorMessage: string): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`${errorMessage}:`, message);
    throw new Error(message);
  }
};

export const search = async (params: SearchParams): Promise<readonly ChromeHistoryItem[]> => {
  if (typeof chrome !== 'undefined' && chrome.history?.search) {
    const results = await chrome.history.search({
      endTime: params.endTime,
      maxResults: params.maxResults,
      startTime: params.startTime,
      text: params.text,
    });
    return results.filter((item): item is chrome.history.HistoryItem & { url: string } => !!item.url).map(mapToChromeHistoryItem);
  }
  return fakeSearch(params);
};

export const deleteUrl = async (details: { readonly url: string }): Promise<void> => {
  if (typeof chrome !== 'undefined' && chrome.history?.deleteUrl) {
    return wrapChromeApi(() => chrome.history.deleteUrl(details), 'Error deleting history item');
  }
  return fakeDeleteUrl(details);
};

export const deleteAllHistory = async (): Promise<void> => {
  if (typeof chrome !== 'undefined' && chrome.history?.deleteAll) {
    return wrapChromeApi(() => chrome.history.deleteAll(), 'Error deleting all history');
  }
  return fakeDeleteAllHistory();
};
