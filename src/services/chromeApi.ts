import * as fakeApi from './fakeApi';

import type { ChromeHistoryItem, Device } from '../app/types';

declare const chrome: any;

interface SearchParams {
  readonly text: string;
  readonly startTime?: number;
  readonly endTime?: number;
  readonly maxResults?: number;
}

export function search(params: SearchParams): Promise<ChromeHistoryItem[]> {
  if (typeof chrome !== 'undefined' && chrome.history?.search) {
    return new Promise((resolve) => {
      chrome.history.search(
        {
          text: params.text,
          startTime: params.startTime,
          endTime: params.endTime,
          maxResults: params.maxResults ?? 100,
        },
        (results: ChromeHistoryItem[]) => {
          resolve(results);
        },
      );
    });
  }
  return fakeApi.search(params);
}

export function deleteUrl(details: { url: string }): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.history?.deleteUrl) {
    return new Promise((resolve, reject) => {
      chrome.history.deleteUrl(details, () => {
        if (chrome.runtime.lastError) {
          console.error('Error deleting history item:', chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
  return fakeApi.deleteUrl(details);
}

function getDeviceTypeFromName(name: string): Device['type'] {
  const lowerName = name.toLowerCase();
  if (['pixel', 'iphone', 'galaxy', 'android', 'phone'].some((s) => lowerName.includes(s))) {
    return 'phone';
  }
  if (['macbook', 'pixelbook', 'chromebook', 'laptop'].some((s) => lowerName.includes(s))) {
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

export function getDevices(): Promise<Device[]> {
  if (typeof chrome !== 'undefined' && chrome.sessions?.getDevices) {
    return new Promise((resolve) => {
      chrome.sessions.getDevices((devices: any[]) => {
        if (!devices) {
          resolve([]);
          return;
        }
        const mappedDevices = devices.map((d) => {
          const lastModifiedTimes = d.sessions.flatMap((s: any) => s.window?.tabs.map((t: any) => t.timestamp) ?? []);
          const mostRecent = Math.max(0, ...lastModifiedTimes);

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
  return fakeApi.getDevices();
}

export function deleteAllHistory(): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.history?.deleteAll) {
    return new Promise((resolve, reject) => {
      chrome.history.deleteAll(() => {
        if (chrome.runtime.lastError) {
          console.error('Error deleting all history:', chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
  return fakeApi.deleteAllHistory();
}
