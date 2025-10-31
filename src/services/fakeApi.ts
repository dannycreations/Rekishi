import type { ChromeHistoryItem, Device } from '../app/types';

interface SearchParams {
  readonly text: string;
  readonly startTime?: number;
  readonly endTime?: number;
  readonly maxResults?: number;
}

const FAKE_DATA_STORE: Record<string, ChromeHistoryItem> = {};
let FAKE_DATA_INITIALIZED = false;

const generateFakeHistoryItem = (timestamp: number, index: number): ChromeHistoryItem => {
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

  const id = `${timestamp}-${index}`;

  return {
    id,
    url,
    title: `${title}`,
    lastVisitTime: timestamp,
    visitCount: Math.floor(Math.random() * 10) + 1,
  };
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

    const item = generateFakeHistoryItem(currentTimestamp, i);
    FAKE_DATA_STORE[item.id] = item;
  }
  FAKE_DATA_INITIALIZED = true;
};

const getFakeHistory = (params: SearchParams): ChromeHistoryItem[] => {
  initializeFakeData();
  let items = Object.values(FAKE_DATA_STORE);

  if (params.startTime) {
    items = items.filter((item) => item.lastVisitTime >= params.startTime!);
  }
  if (params.endTime) {
    items = items.filter((item) => item.lastVisitTime < params.endTime!);
  }

  if (params.text) {
    const query = params.text.toLowerCase();
    items = items.filter((item) => (item.title?.toLowerCase() ?? '').includes(query) || (item.url?.toLowerCase() ?? '').includes(query));
  }

  items.sort((a, b) => b.lastVisitTime - a.lastVisitTime);

  if (params.maxResults) {
    return items.slice(0, params.maxResults);
  }

  return items;
};

const deleteFakeHistoryUrl = (details: { url: string }): void => {
  initializeFakeData();
  const idsToDelete = Object.keys(FAKE_DATA_STORE).filter((id) => FAKE_DATA_STORE[id].url === details.url);
  for (const id of idsToDelete) {
    delete FAKE_DATA_STORE[id];
  }
};

export const search = (params: SearchParams): Promise<ChromeHistoryItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getFakeHistory(params));
    }, 150);
  });
};

export const deleteUrl = (details: { url: string }): Promise<void> => {
  return new Promise((resolve) => {
    deleteFakeHistoryUrl(details);
    setTimeout(() => {
      resolve();
    }, 50);
  });
};

export const getDevices = (): Promise<Device[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          lastSync: '2 minutes ago',
          name: 'My MacBook Pro',
          type: 'laptop',
        },
        {
          lastSync: '1 hour ago',
          name: 'Pixel 8 Pro',
          type: 'phone',
        },
        {
          lastSync: 'Yesterday',
          name: 'Windows Gaming PC',
          type: 'desktop',
        },
        {
          lastSync: '3 days ago',
          name: 'Living Room iMac',
          type: 'desktop',
        },
      ]);
    }, 150);
  });
};

export const deleteAllHistory = (): Promise<void> => {
  return new Promise((resolve) => {
    Object.keys(FAKE_DATA_STORE).forEach((key) => delete FAKE_DATA_STORE[key]);
    FAKE_DATA_INITIALIZED = false;
    setTimeout(() => {
      resolve();
    }, 50);
  });
};
