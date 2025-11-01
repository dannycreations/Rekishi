import { createBlacklistMatchers, isDomainBlacklisted } from '../utilities/blacklistUtil';
import { getHostnameFromUrl } from '../utilities/urlUtil';

import type { BlacklistItem, BlacklistMatchers } from '../utilities/blacklistUtil';
import type { ChromeHistoryItem } from './types';

interface BlacklistData {
  items: BlacklistItem[];
  json: string | null;
}

type StoredBlacklist = {
  state?: {
    blacklistedItems?: BlacklistItem[];
  };
};

let blacklistData: BlacklistData = { items: [], json: null };
let blacklistMatchers: BlacklistMatchers = { plain: new Set(), regex: [] };

function updateBlacklistCache(items: BlacklistItem[], json: string | null) {
  blacklistData = { items, json };
  blacklistMatchers = createBlacklistMatchers(items);
}

function getBlacklistFromStorage(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['rekishi-blacklist'], (result: { 'rekishi-blacklist'?: string }) => {
        resolve(result['rekishi-blacklist'] ?? null);
      });
    } else {
      try {
        resolve(localStorage.getItem('rekishi-blacklist'));
      } catch (e: unknown) {
        console.error('Could not access localStorage', e);
        resolve(null);
      }
    }
  });
}

async function initializeBlacklist(): Promise<void> {
  const storageValue = await getBlacklistFromStorage();
  if (storageValue) {
    try {
      const parsed: StoredBlacklist = JSON.parse(storageValue);
      if (parsed.state?.blacklistedItems) {
        updateBlacklistCache(parsed.state.blacklistedItems, storageValue);
        return;
      }
    } catch (e: unknown) {
      console.error('Failed to parse blacklist from storage', e);
    }
  }
  updateBlacklistCache([], storageValue);
}

if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes['rekishi-blacklist']) {
      const newStorageValue = changes['rekishi-blacklist'].newValue ?? null;
      if (typeof newStorageValue === 'string') {
        try {
          const parsed: StoredBlacklist = JSON.parse(newStorageValue);
          if (parsed.state?.blacklistedItems) {
            updateBlacklistCache(parsed.state.blacklistedItems, newStorageValue);
          } else {
            updateBlacklistCache([], newStorageValue);
          }
        } catch (e: unknown) {
          console.error('Failed to parse updated blacklist from storage', e);
          updateBlacklistCache([], newStorageValue);
        }
      } else {
        updateBlacklistCache([], null);
      }
    }
  });
}

initializeBlacklist();

function isBlacklisted(domain: string): boolean {
  return isDomainBlacklisted(domain, blacklistMatchers);
}

const LAST_CLEANUP_KEY = 'rekishi-last-cleanup';

async function runBlacklistCleanup() {
  if (typeof chrome === 'undefined' || !chrome.history?.search || !chrome.history?.deleteUrl) {
    return;
  }

  if (blacklistData.items.length === 0) {
    return;
  }

  const result = await new Promise<{ [key: string]: number }>((resolve) =>
    chrome.storage.local.get(LAST_CLEANUP_KEY, (res) => resolve(res as { [key: string]: number })),
  );
  const lastCleanupTime = result[LAST_CLEANUP_KEY] || 0;
  const now = Date.now();

  chrome.history.search({ text: '', maxResults: 0, startTime: lastCleanupTime }, (historyItems) => {
    if (chrome.runtime.lastError) {
      console.error('Error searching history for cleanup:', chrome.runtime.lastError.message);
      return;
    }

    const deletions = historyItems
      .filter((item) => {
        if (!item.url) {
          return false;
        }
        const domain = getHostnameFromUrl(item.url);
        return domain && isBlacklisted(domain);
      })
      .map(
        (item) =>
          new Promise<void>((resolve) => {
            chrome.history.deleteUrl({ url: item.url! }, () => {
              if (chrome.runtime.lastError) {
                console.error(`Error deleting blacklisted URL during cleanup (${item.url!}):`, chrome.runtime.lastError.message);
              }
              resolve();
            });
          }),
      );

    Promise.all(deletions).then(() => {
      chrome.storage.local.set({ [LAST_CLEANUP_KEY]: now }, () => {
        if (chrome.runtime.lastError) {
          console.error('Failed to set last cleanup time:', chrome.runtime.lastError.message);
        }
      });
    });
  });
}

function handleVisited(historyItem: chrome.history.HistoryItem): void {
  if (!historyItem.url) {
    return;
  }

  const domain = getHostnameFromUrl(historyItem.url);

  if (isBlacklisted(domain)) {
    if (typeof chrome !== 'undefined' && chrome.history?.deleteUrl) {
      chrome.history.deleteUrl({ url: historyItem.url }, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error deleting blacklisted URL (${historyItem.url}):`, chrome.runtime.lastError.message);
        }
      });
    }
  } else if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    const { id, url, title, lastVisitTime, visitCount } = historyItem;
    const payload: ChromeHistoryItem = {
      id,
      url: url ?? '',
      title: title ?? url ?? '',
      lastVisitTime: lastVisitTime ?? Date.now(),
      visitCount: visitCount ?? 0,
    };

    chrome.runtime.sendMessage({
      payload,
      type: 'NEW_HISTORY_ITEM',
    });
  }
}

if (typeof chrome !== 'undefined' && chrome.history?.onVisited) {
  chrome.history.onVisited.addListener(handleVisited);
}

if (typeof chrome !== 'undefined' && chrome.alarms) {
  const ALARM_NAME = 'blacklist-cleaner';

  chrome.alarms.create(ALARM_NAME, {
    delayInMinutes: 1,
    periodInMinutes: 1,
  });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === ALARM_NAME) {
      await runBlacklistCleanup();
    }
  });
}
