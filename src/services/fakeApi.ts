import { BLACKLIST_STORAGE_KEY, SETTINGS_STORAGE_KEY } from '../app/constants';
import { createBlacklistMatchers, isUrlBlacklisted } from '../utilities/blacklistUtil';
import { parseSettingsFromJSON } from '../utilities/settingUtil';

import type { ChromeDevice, ChromeHistoryItem } from '../app/types';
import type { BlacklistItem, BlacklistMatchers } from '../utilities/blacklistUtil';

interface SearchParams {
  readonly text: string;
  readonly startTime?: number;
  readonly endTime?: number;
  readonly maxResults?: number;
}

const FAKE_DATA_STORE: Record<string, chrome.history.HistoryItem> = {};
let FAKE_DATA_INITIALIZED = false;

interface StoredBlacklist {
  readonly state?: {
    readonly blacklistedItems?: readonly BlacklistItem[];
  };
}

let blacklistMatchers: BlacklistMatchers = createBlacklistMatchers([]);

function parseBlacklistFromJSON(json: string | null): readonly BlacklistItem[] {
  if (!json) {
    return [];
  }
  try {
    const parsed: StoredBlacklist = JSON.parse(json);
    return parsed.state?.blacklistedItems ?? [];
  } catch (error) {
    console.error('Failed to parse blacklist from storage', error);
    return [];
  }
}

function runFakeBlacklistCleanup(): void {
  const blacklistJson = localStorage.getItem(BLACKLIST_STORAGE_KEY);
  const blacklistedItems = parseBlacklistFromJSON(blacklistJson);
  blacklistMatchers = createBlacklistMatchers(blacklistedItems);

  if (!FAKE_DATA_INITIALIZED) {
    return;
  }

  Object.keys(FAKE_DATA_STORE).forEach((key) => {
    const item = FAKE_DATA_STORE[key];
    if (item.url && isUrlBlacklisted(item.url, blacklistMatchers)) {
      delete FAKE_DATA_STORE[key];
    }
  });
}

function generateFakeHistoryItem(timestamp: number): chrome.history.HistoryItem {
  const domains = [
    'google.com',
    'bing.com',
    'duckduckgo.com',
    'yahoo.com',
    'github.com',
    'vercel.com',
    'stackoverflow.com',
    'developer.mozilla.org',
    'tailwindcss.com',
    'react.dev',
    'youtube.com',
    'wikipedia.org',
    'amazon.com',
  ];
  const searchQueries = ['react hooks', 'typescript tutorial', 'css grid', 'zustand vs redux', 'esbuild performance', 'how to center a div'];
  const titles = [
    `Search results for ${searchQueries[Math.floor(Math.random() * searchQueries.length)]}`,
    `Search results for ${searchQueries[Math.floor(Math.random() * searchQueries.length)]}`,
    `Search results for ${searchQueries[Math.floor(Math.random() * searchQueries.length)]}`,
    `Search results for ${searchQueries[Math.floor(Math.random() * searchQueries.length)]}`,
    'Project Repository',
    'Deployment Dashboard',
    'Q&A for programmers',
    'MDN Web Docs',
    'CSS Framework',
    'New React Docs',
    'Viral Video',
    'History of Rome',
    'Best Sellers',
  ];
  const paths = [
    '/search',
    '/search',
    '/search',
    '/search',
    '/docs/main',
    '/issues/123',
    '/dashboard/project-x',
    '/questions/12345',
    '/en-US/docs/Web/JavaScript',
    '/docs/utility-first',
    '/learn',
    '/watch?v=dQw4w9WgXcQ',
    '/wiki/History_of_Rome',
    '/bestsellers',
  ];

  const domainIndex = Math.floor(Math.random() * domains.length);
  const title = titles[domainIndex];
  const domain = domains[domainIndex];
  const path = paths[domainIndex];

  let url = `https://${domain}${path}`;
  if (path === '/search') {
    const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
    url += `?q=${encodeURIComponent(query)}`;
  }

  const id = url;

  return {
    id,
    url,
    title,
    lastVisitTime: timestamp,
    visitCount: Math.floor(Math.random() * 10) + 1,
    typedCount: Math.random() > 0.8 ? 1 : 0,
  };
}

function runFakeRetentionCleanup(): void {
  if (!FAKE_DATA_INITIALIZED) {
    return;
  }
  const settingsJson = localStorage.getItem(SETTINGS_STORAGE_KEY);
  const settings = parseSettingsFromJSON(settingsJson);
  const { dataRetention } = settings;

  if (dataRetention !== 'disabled') {
    const retentionDays = parseInt(dataRetention, 10);
    if (!isNaN(retentionDays) && retentionDays > 0) {
      const retentionCutoff = new Date();
      retentionCutoff.setDate(retentionCutoff.getDate() - retentionDays);
      retentionCutoff.setHours(0, 0, 0, 0);

      const cutoffTime = retentionCutoff.getTime();
      Object.keys(FAKE_DATA_STORE).forEach((key) => {
        if (FAKE_DATA_STORE[key].lastVisitTime! < cutoffTime) {
          delete FAKE_DATA_STORE[key];
        }
      });
    }
  }
}

function initializeFakeData(): void {
  if (FAKE_DATA_INITIALIZED) {
    return;
  }

  const now = new Date();
  now.setHours(23, 59, 59, 999);
  let currentTimestamp = now.getTime();

  for (let i = 0; i < 9000; i++) {
    const decrement = (1 + Math.random() * 29) * 60 * 1000;
    currentTimestamp -= decrement;

    const item = generateFakeHistoryItem(currentTimestamp);
    FAKE_DATA_STORE[`${item.id}-${item.lastVisitTime}`] = item;
  }
  FAKE_DATA_INITIALIZED = true;
  runFakeBlacklistCleanup();
}

if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) {
  setInterval(
    () => {
      runFakeRetentionCleanup();
      runFakeBlacklistCleanup();
    },
    15 * 60 * 1000,
  );

  window.addEventListener('storage', (event) => {
    if (event.key === BLACKLIST_STORAGE_KEY) {
      runFakeBlacklistCleanup();
    }
  });
}

function getFakeHistory(params: SearchParams): readonly chrome.history.HistoryItem[] {
  initializeFakeData();
  runFakeRetentionCleanup();
  runFakeBlacklistCleanup();
  let items = Object.values(FAKE_DATA_STORE);

  if (params.startTime) {
    items = items.filter((item) => {
      return item.lastVisitTime! >= params.startTime!;
    });
  }
  if (params.endTime) {
    items = items.filter((item) => {
      return item.lastVisitTime! < params.endTime!;
    });
  }

  if (params.text) {
    const query = params.text.toLowerCase();
    items = items.filter((item) => {
      return (item.title?.toLowerCase() ?? '').includes(query) || (item.url?.toLowerCase() ?? '').includes(query);
    });
  }

  items.sort((a, b) => {
    return b.lastVisitTime! - a.lastVisitTime!;
  });

  if (params.maxResults && params.maxResults > 0) {
    return items.slice(0, params.maxResults);
  }

  return items;
}

function deleteFakeHistoryUrl(details: { readonly url: string }): void {
  initializeFakeData();
  const idsToDelete = Object.keys(FAKE_DATA_STORE).filter((id) => {
    return FAKE_DATA_STORE[id].url === details.url;
  });
  for (const id of idsToDelete) {
    delete FAKE_DATA_STORE[id];
  }
}

export function search(params: SearchParams): Promise<readonly ChromeHistoryItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const historyItems = getFakeHistory(params);
      const mappedResults: readonly ChromeHistoryItem[] = historyItems.map((item) => {
        return {
          id: `${item.id}-${item.lastVisitTime}`,
          url: item.url ?? '',
          title: item.title ?? item.url ?? '',
          lastVisitTime: item.lastVisitTime ?? 0,
          visitCount: item.visitCount ?? 0,
          typedCount: item.typedCount ?? 0,
        };
      });
      resolve(mappedResults);
    }, 150);
  });
}

export function deleteUrl(details: { readonly url: string }): Promise<void> {
  return new Promise((resolve) => {
    deleteFakeHistoryUrl(details);
    setTimeout(() => {
      resolve();
    }, 50);
  });
}

export function getDevices(): Promise<readonly ChromeDevice[]> {
  return new Promise((resolve) => {
    const now = Date.now();
    setTimeout(() => {
      resolve([
        { deviceName: 'My MacBook Pro', sessions: [{ lastModified: (now - 2 * 60 * 1000) / 1000 }] },
        { deviceName: 'Pixel 8 Pro', sessions: [{ lastModified: (now - 60 * 60 * 1000) / 1000 }] },
        { deviceName: 'Windows Gaming PC', sessions: [{ lastModified: (now - 24 * 60 * 60 * 1000) / 1000 }] },
        { deviceName: 'Living Room iMac', sessions: [{ lastModified: (now - 3 * 24 * 60 * 60 * 1000) / 1000 }] },
      ]);
    }, 150);
  });
}

export function deleteAllHistory(): Promise<void> {
  return new Promise((resolve) => {
    Object.keys(FAKE_DATA_STORE).forEach((key) => {
      delete FAKE_DATA_STORE[key];
    });
    FAKE_DATA_INITIALIZED = false;
    setTimeout(() => {
      resolve();
    }, 50);
  });
}
