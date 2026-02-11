import { mapToChromeHistoryItem } from '../helpers/historyHelper';
import { deleteAllHistory as fakeDeleteAllHistory, deleteUrl as fakeDeleteUrl, getDevices as fakeGetDevices, search as fakeSearch } from './fakeApi';

import type { ChromeDevice, ChromeHistoryItem } from '../app/types';

interface SearchParams {
  readonly text: string;
  readonly startTime?: number;
  readonly endTime?: number;
  readonly maxResults?: number;
}

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
    try {
      await chrome.history.deleteUrl(details);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error deleting history item:', message);
      throw new Error(message);
    }
  }
  return fakeDeleteUrl(details);
};

export const getDevices = async (): Promise<readonly ChromeDevice[]> => {
  if (typeof chrome !== 'undefined' && chrome.sessions?.getDevices) {
    return chrome.sessions.getDevices();
  }
  return fakeGetDevices();
};

export const deleteAllHistory = async (): Promise<void> => {
  if (typeof chrome !== 'undefined' && chrome.history?.deleteAll) {
    try {
      await chrome.history.deleteAll();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error deleting all history:', message);
      throw new Error(message);
    }
  }
  return fakeDeleteAllHistory();
};
