import { mapToChromeHistoryItem } from '../utilities/history';
import { deleteAllHistory as fakeDeleteAllHistory, deleteUrl as fakeDeleteUrl, search as fakeSearch } from './fakeApi';

import type { ChromeHistoryItem, SearchParams } from '../app/types';

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
    return chrome.history.deleteUrl(details);
  }
  return fakeDeleteUrl(details);
};

export const deleteAllHistory = async (): Promise<void> => {
  if (typeof chrome !== 'undefined' && chrome.history?.deleteAll) {
    return chrome.history.deleteAll();
  }
  return fakeDeleteAllHistory();
};
