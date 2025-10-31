import { createBlacklistMatchers, isDomainBlacklisted } from '../utilities/blacklistUtil';
import { getHostnameFromUrl } from '../utilities/urlUtil';

import type { BlacklistItem, BlacklistMatchers } from '../utilities/blacklistUtil';

declare const chrome: any;

interface ChromeHistoryItem {
  id: string;
  url?: string;
  title?: string;
  lastVisitTime?: number;
  visitCount?: number;
}

interface BlacklistData {
  items: BlacklistItem[];
  json: string | null;
}

function getBlacklistFromStorage(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['rekishi-blacklist'], (result: { [key: string]: string | undefined }) => {
        resolve(result['rekishi-blacklist'] ?? null);
      });
    } else {
      try {
        resolve(localStorage.getItem('rekishi-blacklist'));
      } catch (e) {
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
      const parsed = JSON.parse(storageValue);
      if (parsed.state?.blacklistedItems) {
        return { items: parsed.state.blacklistedItems, json: storageValue };
      }
    } catch (e) {
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

async function handleVisited(historyItem: ChromeHistoryItem): Promise<void> {
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
    chrome.runtime.sendMessage({
      payload: historyItem,
      type: 'NEW_HISTORY_ITEM',
    });
  }
}

if (typeof chrome !== 'undefined' && chrome.history?.onVisited) {
  chrome.history.onVisited.addListener(handleVisited);
}
