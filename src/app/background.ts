import { createBlacklistMatchers, isUrlBlacklisted, parseBlacklistFromJSON } from '../helpers/blacklistHelper';
import { mapToChromeHistoryItem } from '../helpers/historyHelper';
import { defaultSettings, parseSettingsFromJSON } from '../helpers/settingHelper';
import { chromeSyncStorage } from '../helpers/storageHelper';
import { BLACKLIST_STORAGE_KEY, CLEANER_ALARM_KEY, CLEANUP_STORAGE_KEY, RETENTION_STORAGE_KEY, SETTINGS_STORAGE_KEY } from './constants';

import type { BlacklistItem, BlacklistMatchers } from '../helpers/blacklistHelper';
import type { Settings } from '../helpers/settingHelper';

let blacklistMatchers: BlacklistMatchers = { plain: new Set(), domainRegex: null, urlRegex: null };
let blacklistedItems: readonly BlacklistItem[] = [];
let currentSettings: Settings = { ...defaultSettings };

const updateBlacklistCache = (items: readonly BlacklistItem[]): void => {
  blacklistedItems = items;
  blacklistMatchers = createBlacklistMatchers(items);
};

const updateSettingsCache = (settings: Settings): void => {
  currentSettings = settings;
};

const initializeCaches = async (): Promise<void> => {
  const blacklistJson = await chromeSyncStorage.getItem(BLACKLIST_STORAGE_KEY);
  updateBlacklistCache(parseBlacklistFromJSON(blacklistJson));

  const settingsJson = await chromeSyncStorage.getItem(SETTINGS_STORAGE_KEY);
  updateSettingsCache(parseSettingsFromJSON(settingsJson));
};

const isBlacklisted = (url: string): boolean => {
  return isUrlBlacklisted(url, blacklistMatchers);
};

const runBlacklistCleanup = async (): Promise<void> => {
  if (typeof chrome === 'undefined' || !chrome.history?.search || !chrome.history?.deleteUrl || blacklistedItems.length === 0) {
    return;
  }

  try {
    const result = await chrome.storage.local.get(CLEANUP_STORAGE_KEY);
    const lastCleanupTime = (result[CLEANUP_STORAGE_KEY] as number) || 0;
    const now = Date.now();

    const historyItems = await chrome.history.search({ text: '', maxResults: 0, startTime: lastCleanupTime });

    const blacklistedUrlsToDelete = new Set(historyItems.filter((item) => item.url && isBlacklisted(item.url)).map((item) => item.url!));

    if (blacklistedUrlsToDelete.size > 0) {
      const deletionPromises = Array.from(blacklistedUrlsToDelete).map((url) =>
        chrome.history.deleteUrl({ url }).catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Error deleting blacklisted URL during cleanup (${url}):`, message);
        }),
      );
      await Promise.all(deletionPromises);
    }

    await chrome.storage.local.set({ [CLEANUP_STORAGE_KEY]: now });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in blacklist cleanup:', message);
  }
};

const runRetentionCleanup = async (): Promise<void> => {
  if (typeof chrome === 'undefined' || !chrome.history?.deleteRange) {
    return;
  }

  try {
    const result = await chrome.storage.local.get(RETENTION_STORAGE_KEY);
    const lastCleanupTime = (result[RETENTION_STORAGE_KEY] as number) || 0;
    const now = Date.now();
    if (now - lastCleanupTime < 24 * 60 * 60 * 1000) {
      return;
    }

    const { dataRetention } = currentSettings;

    if (dataRetention === 'disabled') {
      return;
    }

    const retentionDays = parseInt(dataRetention, 10);
    if (isNaN(retentionDays) || retentionDays <= 0) {
      return;
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() - retentionDays);
    endDate.setHours(0, 0, 0, 0);

    await chrome.history.deleteRange({ startTime: 0, endTime: endDate.getTime() });
    await chrome.storage.local.set({ [RETENTION_STORAGE_KEY]: now });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error cleaning up old history:', message);
  }
};

const handleVisited = async (historyItem: chrome.history.HistoryItem): Promise<void> => {
  if (!historyItem.url) {
    return;
  }

  if (isBlacklisted(historyItem.url)) {
    if (typeof chrome !== 'undefined' && chrome.history?.deleteUrl) {
      try {
        await chrome.history.deleteUrl({ url: historyItem.url });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error deleting blacklisted URL (${historyItem.url}):`, message);
      }
    }
  } else if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage({
      payload: mapToChromeHistoryItem(historyItem),
      type: 'NEW_HISTORY_ITEM',
    });
  }
};

if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes[BLACKLIST_STORAGE_KEY]) {
      const json = (changes[BLACKLIST_STORAGE_KEY].newValue as string) ?? null;
      updateBlacklistCache(parseBlacklistFromJSON(json));
    }
    if (areaName === 'sync' && changes[SETTINGS_STORAGE_KEY]) {
      const json = (changes[SETTINGS_STORAGE_KEY].newValue as string) ?? null;
      updateSettingsCache(parseSettingsFromJSON(json));
    }
  });
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

initializeCaches();
runRetentionCleanup();
