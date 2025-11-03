import { deleteAllHistory as fakeDeleteAllHistory, deleteUrl as fakeDeleteUrl, getDevices as fakeGetDevices, search as fakeSearch } from './fakeApi';

import type { ChromeDevice, ChromeHistoryItem } from '../app/types';

interface SearchParams {
  readonly text: string;
  readonly startTime?: number;
  readonly endTime?: number;
  readonly maxResults?: number;
}

export async function search(params: SearchParams): Promise<ChromeHistoryItem[]> {
  if (typeof chrome !== 'undefined' && chrome.history?.search) {
    const results = await chrome.history.search({
      endTime: params.endTime,
      maxResults: params.maxResults,
      startTime: params.startTime,
      text: params.text,
    });
    const mappedResults = results.map((item) => {
      return {
        id: `${item.id}-${item.lastVisitTime}`,
        url: item.url ?? '',
        title: item.title ?? item.url ?? '',
        lastVisitTime: item.lastVisitTime ?? 0,
        visitCount: item.visitCount ?? 0,
        typedCount: item.typedCount ?? 0,
      };
    });
    return mappedResults.filter((item) => {
      return item.url;
    });
  }
  return fakeSearch(params);
}

export async function deleteUrl(details: { url: string }): Promise<void> {
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
}

export async function getDevices(): Promise<ChromeDevice[]> {
  if (typeof chrome !== 'undefined' && chrome.sessions?.getDevices) {
    const devices = await chrome.sessions.getDevices();
    return devices || [];
  }
  return fakeGetDevices();
}

export async function deleteAllHistory(): Promise<void> {
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
}
