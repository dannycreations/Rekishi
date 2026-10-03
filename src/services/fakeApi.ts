import { BLACKLIST_STORAGE_KEY, SETTINGS_STORAGE_KEY } from '../app/constants';
import { createBlacklistMatchers, isUrlBlacklisted, parseBlacklistFromJSON } from '../utilities/blacklist';
import { getDayBoundaries } from '../utilities/date';
import { parseRetentionDays, parseSettingsFromJSON } from '../utilities/setting';

import type { ChromeHistoryItem, SearchParams } from '../app/types';

const FAKE_DATA_STORE: Record<string, ChromeHistoryItem> = {};
let FAKE_DATA_INITIALIZED = false;

// Every deletion path goes through here so the store is only ever mutated in one place. Entries are
// keyed by their own id, which is what keeps a stored item reachable from its key.
const deleteFakeHistoryWhere = (predicate: (item: ChromeHistoryItem) => boolean): void => {
  for (const item of Object.values(FAKE_DATA_STORE)) {
    if (predicate(item)) {
      delete FAKE_DATA_STORE[item.id];
    }
  }
};

const runFakeBlacklistCleanup = (): void => {
  if (!FAKE_DATA_INITIALIZED) {
    return;
  }

  const blacklistJson = localStorage.getItem(BLACKLIST_STORAGE_KEY);
  const blacklistMatchers = createBlacklistMatchers(parseBlacklistFromJSON(blacklistJson));

  deleteFakeHistoryWhere((item) => isUrlBlacklisted(item.url, blacklistMatchers));
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

const generateFakeHistoryItem = (timestamp: number): ChromeHistoryItem => {
  const site = FAKE_SITES[Math.floor(Math.random() * FAKE_SITES.length)];
  const query = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];

  const url =
    site.path === SEARCH_RESULT_PATH ? `https://${site.domain}${site.path}?q=${encodeURIComponent(query)}` : `https://${site.domain}${site.path}`;

  return {
    id: `${url}-${timestamp}`,
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

  deleteFakeHistoryWhere((item) => item.lastVisitTime < cutoffTime);
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
    FAKE_DATA_STORE[item.id] = item;
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

const getFakeHistory = (params: SearchParams): readonly ChromeHistoryItem[] => {
  initializeFakeData();
  runFakeRetentionCleanup();
  runFakeBlacklistCleanup();
  let items = Object.values(FAKE_DATA_STORE);

  if (params.startTime) {
    const startTime = params.startTime;
    items = items.filter((item) => {
      return item.lastVisitTime >= startTime;
    });
  }
  if (params.endTime) {
    const endTime = params.endTime;
    items = items.filter((item) => {
      return item.lastVisitTime < endTime;
    });
  }

  if (params.text) {
    const query = params.text.toLowerCase();
    items = items.filter((item) => {
      return item.title.toLowerCase().includes(query) || item.url.toLowerCase().includes(query);
    });
  }

  items.sort((a, b) => {
    return b.lastVisitTime - a.lastVisitTime;
  });

  if (params.maxResults && params.maxResults > 0) {
    return items.slice(0, params.maxResults);
  }

  return items;
};

const deleteFakeHistoryUrl = (details: { readonly url: string }): void => {
  initializeFakeData();
  deleteFakeHistoryWhere((item) => item.url === details.url);
};

export const search = (params: SearchParams): Promise<readonly ChromeHistoryItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getFakeHistory(params));
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
    deleteFakeHistoryWhere(() => true);
    FAKE_DATA_INITIALIZED = false;
    setTimeout(() => {
      resolve();
    }, 50);
  });
};
