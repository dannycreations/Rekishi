import { createBlacklistMatchers, isDomainBlacklisted } from '../utilities/blacklistUtil';
import { getHostnameFromUrl } from '../utilities/urlUtil';
import { BLACKLIST_STORAGE_KEY, CLEANER_ALARM_KEY, CLEANUP_STORAGE_KEY, RETENTION_STORAGE_KEY, SETTINGS_STORAGE_KEY } from './constants';

import type { BlacklistItem, BlacklistMatchers } from '../utilities/blacklistUtil';
import type { ChromeHistoryItem } from './types';

interface StoredBlacklist {
  state?: { blacklistedItems?: BlacklistItem[] };
}
let blacklistMatchers: BlacklistMatchers = { plain: new Set(), combinedRegex: null };
let blacklistedItems: BlacklistItem[] = [];

interface StoredSettings {
  state?: { dataRetention?: string; syncEnabled?: boolean };
}
interface Settings {
  dataRetention: string;
  syncEnabled: boolean;
}
const defaultSettings: Settings = { dataRetention: 'disabled', syncEnabled: true };
let currentSettings: Settings = { ...defaultSettings };

function parseBlacklistFromJSON(json: string | null): BlacklistItem[] {
  if (!json) return [];
  try {
    const parsed: StoredBlacklist = JSON.parse(json);
    return parsed.state?.blacklistedItems ?? [];
  } catch (error) {
    console.error('Failed to parse blacklist from storage', error);
    return [];
  }
}

function parseSettingsFromJSON(json: string | null): Settings {
  if (!json) return { ...defaultSettings };
  try {
    const parsed: StoredSettings = JSON.parse(json);
    return {
      dataRetention: parsed.state?.dataRetention ?? defaultSettings.dataRetention,
      syncEnabled: parsed.state?.syncEnabled ?? defaultSettings.syncEnabled,
    };
  } catch (error) {
    console.error('Failed to parse settings from storage', error);
    return { ...defaultSettings };
  }
}

function updateBlacklistCache(items: BlacklistItem[]) {
  blacklistedItems = items;
  blacklistMatchers = createBlacklistMatchers(items);
}

function updateSettingsCache(settings: Settings) {
  currentSettings = settings;
}

async function getFromStorage(key: string, area: 'local' | 'sync'): Promise<string | null> {
  if (typeof chrome !== 'undefined' && chrome.storage?.[area]) {
    try {
      const result = await chrome.storage[area].get([key]);
      return (result[key] as string) ?? null;
    } catch (error) {
      console.error(`Failed to read from chrome.storage.${area}`, error);
      return null;
    }
  }
  try {
    if (area === 'local') {
      return localStorage.getItem(key);
    }
    return null;
  } catch (error) {
    console.error('Could not access localStorage', error);
    return null;
  }
}

async function initializeCaches(): Promise<void> {
  const blacklistJson = await getFromStorage(BLACKLIST_STORAGE_KEY, 'local');
  updateBlacklistCache(parseBlacklistFromJSON(blacklistJson));

  const settingsJson = await getFromStorage(SETTINGS_STORAGE_KEY, 'sync');
  updateSettingsCache(parseSettingsFromJSON(settingsJson));
}

if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[BLACKLIST_STORAGE_KEY]) {
      const json = (changes[BLACKLIST_STORAGE_KEY].newValue as string) ?? null;
      updateBlacklistCache(parseBlacklistFromJSON(json));
    }
    if (areaName === 'sync' && changes[SETTINGS_STORAGE_KEY]) {
      const json = (changes[SETTINGS_STORAGE_KEY].newValue as string) ?? null;
      updateSettingsCache(parseSettingsFromJSON(json));
    }
  });
}

function isBlacklisted(domain: string): boolean {
  return isDomainBlacklisted(domain, blacklistMatchers);
}

async function runBlacklistCleanup() {
  if (typeof chrome === 'undefined' || !chrome.history?.search || !chrome.history?.deleteUrl || blacklistedItems.length === 0) {
    return;
  }

  try {
    const result = await chrome.storage.local.get(CLEANUP_STORAGE_KEY);
    const lastCleanupTime = (result[CLEANUP_STORAGE_KEY] as number) || 0;
    const now = Date.now();

    const historyItems = await chrome.history.search({ text: '', maxResults: 0, startTime: lastCleanupTime });

    const deletions = historyItems
      .filter((item) => item.url && isBlacklisted(getHostnameFromUrl(item.url)))
      .map((item) =>
        chrome.history.deleteUrl({ url: item.url! }).catch((error) => {
          console.error(`Error deleting blacklisted URL during cleanup (${item.url!}):`, error.message);
        }),
      );

    if (deletions.length > 0) {
      await Promise.all(deletions);
    }
    await chrome.storage.local.set({ [CLEANUP_STORAGE_KEY]: now });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in blacklist cleanup:', message);
  }
}

async function runRetentionCleanup() {
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
}

async function handleVisited(historyItem: chrome.history.HistoryItem): Promise<void> {
  if (!historyItem.url) {
    return;
  }

  const domain = getHostnameFromUrl(historyItem.url);

  if (isBlacklisted(domain)) {
    if (typeof chrome !== 'undefined' && chrome.history?.deleteUrl) {
      try {
        await chrome.history.deleteUrl({ url: historyItem.url });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error deleting blacklisted URL (${historyItem.url}):`, message);
      }
    }
  } else if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    const { id, url, title, lastVisitTime, visitCount, typedCount } = historyItem;
    const payload: ChromeHistoryItem = {
      id: `${id}-${lastVisitTime}`,
      url: url ?? '',
      title: title ?? url ?? '',
      lastVisitTime: lastVisitTime ?? Date.now(),
      visitCount: visitCount ?? 0,
      typedCount: typedCount ?? 0,
    };

    chrome.runtime.sendMessage({
      payload,
      type: 'NEW_HISTORY_ITEM',
    });
  }
}

initializeCaches();

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
