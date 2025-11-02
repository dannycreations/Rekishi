import { createBlacklistMatchers, isDomainBlacklisted } from '../utilities/blacklistUtil';
import { getHostnameFromUrl } from '../utilities/urlUtil';
import { BLACKLIST_STORAGE_KEY, CLEANER_ALARM_KEY, CLEANUP_STORAGE_KEY, RETENTION_STORAGE_KEY, SETTINGS_STORAGE_KEY } from './constants';

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
let blacklistMatchers: BlacklistMatchers = { plain: new Set(), combinedRegex: null };

function updateBlacklistCache(items: BlacklistItem[], json: string | null) {
  blacklistData = { items, json };
  blacklistMatchers = createBlacklistMatchers(items);
}

function getBlacklistFromStorage(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get([BLACKLIST_STORAGE_KEY], (result: { [key: string]: string | undefined }) => {
        resolve(result[BLACKLIST_STORAGE_KEY] ?? null);
      });
    } else {
      try {
        resolve(localStorage.getItem(BLACKLIST_STORAGE_KEY));
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
    if (areaName === 'local' && changes[BLACKLIST_STORAGE_KEY]) {
      const newStorageValue = changes[BLACKLIST_STORAGE_KEY].newValue ?? null;
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

async function runBlacklistCleanup() {
  if (typeof chrome === 'undefined' || !chrome.history?.search || !chrome.history?.deleteUrl) {
    return;
  }

  if (blacklistData.items.length === 0) {
    return;
  }

  const result = await new Promise<{ [key: string]: number }>((resolve) =>
    chrome.storage.local.get(CLEANUP_STORAGE_KEY, (res) => resolve(res as { [key: string]: number })),
  );
  const lastCleanupTime = result[CLEANUP_STORAGE_KEY] || 0;
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
      chrome.storage.local.set({ [CLEANUP_STORAGE_KEY]: now }, () => {
        if (chrome.runtime.lastError) {
          console.error('Failed to set last cleanup time:', chrome.runtime.lastError.message);
        }
      });
    });
  });
}

type StoredSettings = {
  state?: {
    dataRetention?: string;
    syncEnabled?: boolean;
  };
};

function getSettingsFromStorage(): Promise<{ dataRetention: string; syncEnabled: boolean }> {
  const defaults = { dataRetention: 'disabled', syncEnabled: true };
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      chrome.storage.sync.get([SETTINGS_STORAGE_KEY], (result) => {
        const storageValue = result[SETTINGS_STORAGE_KEY];
        if (typeof storageValue === 'string') {
          try {
            const parsed: StoredSettings = JSON.parse(storageValue);
            resolve({
              dataRetention: parsed.state?.dataRetention ?? defaults.dataRetention,
              syncEnabled: parsed.state?.syncEnabled ?? defaults.syncEnabled,
            });
            return;
          } catch (e) {
            console.error('Failed to parse settings from storage', e);
          }
        }
        resolve(defaults);
      });
    } else {
      resolve(defaults);
    }
  });
}

async function runRetentionCleanup() {
  if (typeof chrome === 'undefined' || !chrome.history?.deleteRange) {
    return;
  }

  const result = await new Promise<{ [key: string]: number | undefined }>((resolve) =>
    chrome.storage.local.get(RETENTION_STORAGE_KEY, (res) => resolve(res as { [key: string]: number | undefined })),
  );

  const lastCleanupTime = result[RETENTION_STORAGE_KEY] || 0;
  const now = Date.now();
  if (now - lastCleanupTime < 24 * 60 * 60 * 1000) {
    return;
  }

  const settings = await getSettingsFromStorage();
  const { dataRetention } = settings;

  if (dataRetention === 'disabled') {
    return;
  }

  const retentionDays = parseInt(dataRetention, 10);
  if (isNaN(retentionDays)) {
    return;
  }

  const endDate = new Date();
  endDate.setDate(endDate.getDate() - retentionDays);
  endDate.setHours(0, 0, 0, 0);

  chrome.history.deleteRange({ startTime: 0, endTime: endDate.getTime() }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error cleaning up old history:', chrome.runtime.lastError.message);
    } else {
      chrome.storage.local.set({ [RETENTION_STORAGE_KEY]: now }, () => {
        if (chrome.runtime.lastError) {
          console.error('Failed to set last history cleanup time:', chrome.runtime.lastError.message);
        }
      });
    }
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
  chrome.alarms.create(CLEANER_ALARM_KEY, {
    delayInMinutes: 1,
    periodInMinutes: 15,
  });

  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === CLEANER_ALARM_KEY) {
      await runBlacklistCleanup();
      await runRetentionCleanup();
    }
  });
}

runRetentionCleanup();
