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

export async function search(params: SearchParams): Promise<ChromeHistoryItem[]> {
  if (typeof chrome !== 'undefined' && chrome.history?.search) {
    const results = await chrome.history.search({
      text: params.text,
      startTime: params.startTime,
      endTime: params.endTime,
      maxResults: params.maxResults ?? 0,
    });
    const mappedResults = results.map((item) => {
      return {
        id: item.id,
        url: item.url ?? '',
        title: item.title ?? item.url ?? '',
        lastVisitTime: item.lastVisitTime ?? 0,
        visitCount: item.visitCount ?? 0,
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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'An unknown error occurred';
      console.error('Error deleting history item:', message);
      throw new Error(message);
    }
  }
  return fakeDeleteUrl(details);
}

export async function getDevices(): Promise<Device[]> {
  if (typeof chrome !== 'undefined' && chrome.sessions?.getDevices) {
    const devices = await chrome.sessions.getDevices();
    if (!devices) {
      return [];
    }
    return devices.map((d) => {
      const mostRecent = d.sessions.reduce((latest, session) => {
        return Math.max(latest, session.lastModified * 1000);
      }, 0);

      return {
        lastSync: mostRecent > 0 ? formatTimeAgo(mostRecent) : 'Unknown',
        name: d.deviceName,
        type: getDeviceTypeFromName(d.deviceName),
      };
    });
  }
  return fakeGetDevices();
}

export async function deleteAllHistory(): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.history?.deleteAll) {
    try {
      await chrome.history.deleteAll();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'An unknown error occurred';
      console.error('Error deleting all history:', message);
      throw new Error(message);
    }
  }
  return fakeDeleteAllHistory();
}
