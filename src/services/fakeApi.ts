import { BLACKLIST_STORAGE_KEY, SETTINGS_STORAGE_KEY } from '../app/constants';
import { createBlacklistMatchers, isUrlBlacklisted, parseBlacklistFromJSON } from '../utilities/blacklist';
import { getDayBoundaries } from '../utilities/date';
import { mapToChromeHistoryItem } from '../utilities/history';
import { parseRetentionDays, parseSettingsFromJSON } from '../utilities/setting';

import type { ChromeHistoryItem, SearchParams } from '../app/types';
import type { BlacklistMatchers } from '../utilities/blacklist';

const FAKE_DATA_STORE: Record<string, chrome.history.HistoryItem> = {};
let FAKE_DATA_INITIALIZED = false;

let blacklistMatchers: BlacklistMatchers = createBlacklistMatchers([]);

const runFakeBlacklistCleanup = (): void => {
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
};

const SEARCH_RESULT_PATH = '/search';

const SEARCH_QUERIES = ['react hooks', 'typescript tutorial', 'css grid', 'zustand vs redux', 'esbuild performance', 'how to center a div'];

// Search engines are picked by path and get a query-driven title; the rest carry their own title.
const FAKE_SITES: readonly { readonly domain: string; readonly path: string; readonly title?: string }[] = [
  { domain: 'google.com', path: SEARCH_RESULT_PATH },
  { domain: 'bing.com', path: SEARCH_RESULT_PATH },
  { domain: 'duckduckgo.com', path: SEARCH_RESULT_PATH },
  { domain: 'yahoo.com', path: SEARCH_RESULT_PATH },
  { domain: 'github.com', path: '/issues/123', title: 'Project Repository' },
  { domain: 'vercel.com', path: '/dashboard/project-x', title: 'Deployment Dashboard' },
  { domain: 'stackoverflow.com', path: '/questions/12345', title: 'Q&A for programmers' },
  { domain: 'developer.mozilla.org', path: '/en-US/docs/Web/JavaScript', title: 'MDN Web Docs' },
  { domain: 'tailwindcss.com', path: '/docs/utility-first', title: 'CSS Framework' },
  { domain: 'react.dev', path: '/learn', title: 'New React Docs' },
  { domain: 'youtube.com', path: '/watch?v=dQw4w9WgXcQ', title: 'Viral Video' },
  { domain: 'wikipedia.org', path: '/wiki/History_of_Rome', title: 'History of Rome' },
  { domain: 'amazon.com', path: '/bestsellers', title: 'Best Sellers' },
];

const generateFakeHistoryItem = (timestamp: number): chrome.history.HistoryItem => {
  const site = FAKE_SITES[Math.floor(Math.random() * FAKE_SITES.length)];
  const query = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];

  const url =
    site.path === SEARCH_RESULT_PATH ? `https://${site.domain}${site.path}?q=${encodeURIComponent(query)}` : `https://${site.domain}${site.path}`;

  return {
    id: url,
    url,
    title: site.title ?? `Search results for ${query}`,
    lastVisitTime: timestamp,
    visitCount: Math.floor(Math.random() * 10) + 1,
  };
};

const runFakeRetentionCleanup = (): void => {
  if (!FAKE_DATA_INITIALIZED) {
    return;
  }
  const settingsJson = localStorage.getItem(SETTINGS_STORAGE_KEY);
  const settings = parseSettingsFromJSON(settingsJson);
  const retentionDays = parseRetentionDays(settings.dataRetention);

  if (retentionDays === null) {
    return;
  }

  const retentionCutoff = new Date();
  retentionCutoff.setDate(retentionCutoff.getDate() - retentionDays);
  const { startTime: cutoffTime } = getDayBoundaries(retentionCutoff);

  Object.keys(FAKE_DATA_STORE).forEach((key) => {
    if (FAKE_DATA_STORE[key].lastVisitTime! < cutoffTime) {
      delete FAKE_DATA_STORE[key];
    }
  });
};

const initializeFakeData = (): void => {
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
};

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

const getFakeHistory = (params: SearchParams): readonly chrome.history.HistoryItem[] => {
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
};

const deleteFakeHistoryUrl = (details: { readonly url: string }): void => {
  initializeFakeData();
  const idsToDelete = Object.keys(FAKE_DATA_STORE).filter((id) => {
    return FAKE_DATA_STORE[id].url === details.url;
  });
  for (const id of idsToDelete) {
    delete FAKE_DATA_STORE[id];
  }
};

export const search = (params: SearchParams): Promise<readonly ChromeHistoryItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const historyItems = getFakeHistory(params);
      const mappedResults: readonly ChromeHistoryItem[] = historyItems.map(mapToChromeHistoryItem);
      resolve(mappedResults);
    }, 150);
  });
};

export const deleteUrl = (details: { readonly url: string }): Promise<void> => {
  return new Promise((resolve) => {
    deleteFakeHistoryUrl(details);
    setTimeout(() => {
      resolve();
    }, 50);
  });
};

export const deleteAllHistory = (): Promise<void> => {
  return new Promise((resolve) => {
    Object.keys(FAKE_DATA_STORE).forEach((key) => {
      delete FAKE_DATA_STORE[key];
    });
    FAKE_DATA_INITIALIZED = false;
    setTimeout(() => {
      resolve();
    }, 50);
  });
};
