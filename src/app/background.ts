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

async function getBlacklist(): Promise<BlacklistData> {
  const storageValue = await getBlacklistFromStorage();
  if (storageValue) {
    try {
      const parsed: StoredBlacklist = JSON.parse(storageValue);
      if (parsed.state?.blacklistedItems) {
        return { items: parsed.state.blacklistedItems, json: storageValue };
      }
    } catch (e: unknown) {
      console.error('Failed to parse blacklist from storage', e);
    }
  }
  return { items: [], json: storageValue };
}

let lastBlacklistedItemsJSON: string | null = null;
let cachedMatchers: BlacklistMatchers;

function isBlacklisted(domain: string, blacklistedItems: BlacklistItem[], json: string | null): boolean {
  if (json !== lastBlacklistedItemsJSON) {
    cachedMatchers = createBlacklistMatchers(blacklistedItems);
    lastBlacklistedItemsJSON = json;
  }
  return isDomainBlacklisted(domain, cachedMatchers);
}

const LAST_CLEANUP_KEY = 'rekishi-last-cleanup';

async function runBlacklistCleanup() {
  if (typeof chrome === 'undefined' || !chrome.history?.search || !chrome.history?.deleteUrl) {
    return;
  }

  const { items: blacklistedItems, json } = await getBlacklist();

  if (blacklistedItems.length === 0) {
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
        return domain && isBlacklisted(domain, blacklistedItems, json);
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

async function handleVisited(historyItem: chrome.history.HistoryItem): Promise<void> {
  if (!historyItem.url) {
    return;
  }

  const domain = getHostnameFromUrl(historyItem.url);
  if (!domain) {
    return;
  }

  const { items: blacklistedItems, json } = await getBlacklist();

  if (isBlacklisted(domain, blacklistedItems, json)) {
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
