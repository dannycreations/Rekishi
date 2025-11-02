import { formatTimeAgo } from '../utilities/dateUtil';
import { deleteAllHistory as fakeDeleteAllHistory, deleteUrl as fakeDeleteUrl, getDevices as fakeGetDevices, search as fakeSearch } from './fakeApi';

import type { ChromeHistoryItem, Device } from '../app/types';

interface SearchParams {
  readonly text: string;
  readonly startTime?: number;
  readonly endTime?: number;
  readonly maxResults?: number;
}

function getDeviceTypeFromName(name: string): Device['type'] {
  const lowerName = name.toLowerCase();
  if (
    ['pixel', 'iphone', 'galaxy', 'android', 'phone'].some((s) => {
      return lowerName.includes(s);
    })
  ) {
    return 'phone';
  }
  if (
    ['macbook', 'pixelbook', 'chromebook', 'laptop'].some((s) => {
      return lowerName.includes(s);
    })
  ) {
    return 'laptop';
  }
  return 'desktop';
}

export function search(params: SearchParams): Promise<ChromeHistoryItem[]> {
  if (typeof chrome !== 'undefined' && chrome.history?.search) {
    return new Promise((resolve) => {
      chrome.history.search(
        {
          text: params.text,
          startTime: params.startTime,
          endTime: params.endTime,
          maxResults: params.maxResults ?? 0,
        },
        (results: chrome.history.HistoryItem[]) => {
          const validResults: ChromeHistoryItem[] = results
            .map((item) => ({
              id: item.id,
              url: item.url ?? '',
              title: item.title ?? item.url ?? '',
              lastVisitTime: item.lastVisitTime ?? 0,
              visitCount: item.visitCount ?? 0,
            }))
            .filter((item) => item.url);

          validResults.sort((a, b) => b.lastVisitTime - a.lastVisitTime);
          resolve(validResults);
        },
      );
    });
  }
  return fakeSearch(params);
}

export function deleteUrl(details: { url: string }): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.history?.deleteUrl) {
    return new Promise((resolve, reject) => {
      chrome.history.deleteUrl(details, () => {
        const lastError: chrome.runtime.LastError | undefined = chrome.runtime.lastError;
        if (lastError) {
          console.error('Error deleting history item:', lastError.message);
          reject(new Error(lastError.message));
        } else {
          resolve();
        }
      });
    });
  }
  return fakeDeleteUrl(details);
}

export function getDevices(): Promise<Device[]> {
  if (typeof chrome !== 'undefined' && chrome.sessions?.getDevices) {
    return new Promise((resolve) => {
      chrome.sessions.getDevices((devices: chrome.sessions.Device[] | undefined) => {
        if (!devices) {
          resolve([]);
          return;
        }
        const mappedDevices = devices.map((d) => {
          const mostRecent = d.sessions.reduce((latest, session) => Math.max(latest, session.lastModified * 1000), 0);

          return {
            lastSync: mostRecent > 0 ? formatTimeAgo(mostRecent) : 'Unknown',
            name: d.deviceName,
            type: getDeviceTypeFromName(d.deviceName),
          };
        });
        resolve(mappedDevices);
      });
    });
  }
  return fakeGetDevices();
}

export function deleteAllHistory(): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.history?.deleteAll) {
    return new Promise((resolve, reject) => {
      chrome.history.deleteAll(() => {
        const lastError: chrome.runtime.LastError | undefined = chrome.runtime.lastError;
        if (lastError) {
          console.error('Error deleting all history:', lastError.message);
          reject(new Error(lastError.message));
        } else {
          resolve();
        }
      });
    });
  }
  return fakeDeleteAllHistory();
}
