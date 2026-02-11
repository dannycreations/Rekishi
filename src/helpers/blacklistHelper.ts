import { escapeRegex, getHostnameFromUrl, isPotentialRegex } from '../utilities/commonUtil';

export interface BlacklistItem {
  readonly isRegex: boolean;
  readonly value: string;
}

export interface BlacklistMatchers {
  readonly plain: ReadonlySet<string>;
  readonly domainRegex: RegExp | null;
  readonly urlRegex: RegExp | null;
}

const wildcardToRegex = (pattern: string): string => {
  const escaped = escapeRegex(pattern);
  return escaped.replace(/\\\*/g, '.*');
};

export const createBlacklistMatchers = (items: readonly BlacklistItem[]): BlacklistMatchers => {
  const plain = new Set<string>();
  const domainRegexSources: string[] = [];
  const urlRegexSources: string[] = [];

  for (const item of items) {
    if (item.isRegex) {
      try {
        new RegExp(item.value);
        urlRegexSources.push(`(${item.value})`);
      } catch (error: unknown) {
        console.error(`Invalid regex in blacklist, skipping: ${item.value}`, error);
      }
    } else if (item.value.includes('*')) {
      const wildcardRegex = wildcardToRegex(item.value);
      if (item.value.includes('/')) {
        if (wildcardRegex.endsWith('/.*')) {
          const base = wildcardRegex.slice(0, -3);
          urlRegexSources.push(`(^${base}(\\/.*)?$)`);
        } else {
          urlRegexSources.push(`(^${wildcardRegex})`);
        }
      } else {
        domainRegexSources.push(`(^${wildcardRegex}$)`);
      }
    } else {
      plain.add(item.value);
    }
  }

  const domainRegex = domainRegexSources.length > 0 ? new RegExp(domainRegexSources.join('|'), 'i') : null;
  const urlRegex = urlRegexSources.length > 0 ? new RegExp(urlRegexSources.join('|'), 'i') : null;

  return { plain, domainRegex, urlRegex };
};

export const isUrlBlacklisted = (url: string, matchers: BlacklistMatchers): boolean => {
  if (!url) {
    return false;
  }

  const hostname = getHostnameFromUrl(url);

  if (matchers.plain.has(hostname)) {
    return true;
  }

  if (matchers.domainRegex && matchers.domainRegex.test(hostname)) {
    return true;
  }

  if (matchers.urlRegex) {
    let path = '/';
    try {
      path = new URL(url).pathname;
    } catch {
      const match = url.match(/^[^/:]+([/][^?#]*)/);
      path = match ? match[1] : '/';
    }
    const urlToTest = hostname + path;
    if (matchers.urlRegex.test(urlToTest)) {
      return true;
    }
  }

  return false;
};

export const parseInput = (input: string): { readonly value: string; readonly isRegex: boolean } | { readonly error: string } | null => {
  const trimmedValue = input.trim();
  if (!trimmedValue) {
    return null;
  }

  const isRegex = isPotentialRegex(trimmedValue);
  const value = isRegex ? trimmedValue.slice(1, -1) : trimmedValue;

  if (!value) {
    return null;
  }

  if (isRegex) {
    try {
      new RegExp(value);
    } catch {
      return { error: 'Invalid Regular Expression' };
    }
  }

  return { value, isRegex };
};

interface StoredBlacklist {
  readonly state?: {
    readonly blacklistedItems?: readonly BlacklistItem[];
  };
}

export const parseBlacklistFromJSON = (json: string | null): readonly BlacklistItem[] => {
  if (!json) {
    return [];
  }
  try {
    const parsed: StoredBlacklist = JSON.parse(json);
    return parsed.state?.blacklistedItems ?? [];
  } catch (error) {
    console.error('Failed to parse blacklist from storage', error);
    return [];
  }
};
