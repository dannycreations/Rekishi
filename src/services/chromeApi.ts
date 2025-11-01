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

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const seconds = Math.round((now - timestamp) / 1000);

  if (seconds < 60) {
    return `a moment ago`;
  }

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  const days = Math.round(hours / 24);
  if (days === 1) {
    return 'Yesterday';
  }
  if (days < 7) {
    return `${days} days ago`;
  }

  const weeks = Math.round(days / 7);
  if (weeks < 5) {
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }

  const months = Math.round(days / 30);
  if (months < 12) {
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }

  const years = Math.round(days / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
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
