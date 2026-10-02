import { createBlacklistMatchers, isUrlBlacklisted, parseBlacklistFromJSON } from '../utilities/blacklist';
import { mapToChromeHistoryItem } from '../utilities/history';
import { defaultSettings, parseRetentionDays, parseSettingsFromJSON } from '../utilities/setting';
import { chromeSyncStorage } from '../utilities/storage';
import { BLACKLIST_STORAGE_KEY, CLEANER_ALARM_KEY, CLEANUP_STORAGE_KEY, RETENTION_STORAGE_KEY, SETTINGS_STORAGE_KEY } from './constants';

import type { BlacklistItem } from '../utilities/blacklist';
import type { Settings } from '../utilities/setting';

const toErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

let blacklistMatchers = createBlacklistMatchers([]);
let blacklistedItems: readonly BlacklistItem[] = [];
let currentSettings: Settings = { ...defaultSettings };

const updateBlacklistCache = (items: readonly BlacklistItem[]): void => {
  blacklistedItems = items;
  blacklistMatchers = createBlacklistMatchers(items);
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

    const blacklistedUrls = new Set<string>();
    for (const item of historyItems) {
      if (item.url && isBlacklisted(item.url)) {
        blacklistedUrls.add(item.url);
      }
    }

    await Promise.all(
      Array.from(blacklistedUrls, (url) =>
        chrome.history.deleteUrl({ url }).catch((error: unknown) => {
          console.error(`Error deleting blacklisted URL during cleanup (${url}):`, toErrorMessage(error));
        }),
      ),
    );

    await chrome.storage.local.set({ [CLEANUP_STORAGE_KEY]: now });
  } catch (error: unknown) {
    console.error('Error in blacklist cleanup:', toErrorMessage(error));
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

    const retentionDays = parseRetentionDays(currentSettings.dataRetention);

    if (retentionDays === null) {
      return;
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() - retentionDays);
    endDate.setHours(0, 0, 0, 0);

    await chrome.history.deleteRange({ startTime: 0, endTime: endDate.getTime() });
    await chrome.storage.local.set({ [RETENTION_STORAGE_KEY]: now });
  } catch (error: unknown) {
    console.error('Error cleaning up old history:', toErrorMessage(error));
  }
};

const handleVisited = async (historyItem: chrome.history.HistoryItem): Promise<void> => {
  const url = historyItem.url;
  if (!url) {
    return;
  }

  if (isBlacklisted(url)) {
    try {
      await chrome.history.deleteUrl({ url });
    } catch (error: unknown) {
      console.error(`Error deleting blacklisted URL (${url}):`, toErrorMessage(error));
    }
    return;
  }

  chrome.runtime
    .sendMessage({
      payload: mapToChromeHistoryItem(historyItem),
      type: 'NEW_HISTORY_ITEM',
    })
    .catch((error: unknown) => {
      console.error(`Error forwarding history item (${url}):`, toErrorMessage(error));
    });
};

if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes[BLACKLIST_STORAGE_KEY]) {
      const json = (changes[BLACKLIST_STORAGE_KEY].newValue as string) ?? null;
      updateBlacklistCache(parseBlacklistFromJSON(json));
    }
    if (areaName === 'sync' && changes[SETTINGS_STORAGE_KEY]) {
      const json = (changes[SETTINGS_STORAGE_KEY].newValue as string) ?? null;
      currentSettings = parseSettingsFromJSON(json);
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

async function main(): Promise<void> {
  const blacklistJson = await chromeSyncStorage.getItem(BLACKLIST_STORAGE_KEY);
  updateBlacklistCache(parseBlacklistFromJSON(blacklistJson));

  currentSettings = parseSettingsFromJSON(await chromeSyncStorage.getItem(SETTINGS_STORAGE_KEY));
}

void main().catch((err) => {
  console.error(err);
});
