import { getHostnameFromUrl } from './urlUtil';

export interface BlacklistItem {
  isRegex: boolean;
  value: string;
}

export interface BlacklistMatchers {
  plain: Set<string>;
  domainRegex: RegExp | null;
  urlRegex: RegExp | null;
}

export function isPotentialRegex(input: string): boolean {
  const trimmed = input.trim();
  return trimmed.length > 2 && trimmed.startsWith('/') && trimmed.endsWith('/');
}

function wildcardToRegex(pattern: string): string {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  return escaped.replace(/\\\*/g, '.*');
}

export function createBlacklistMatchers(items: readonly BlacklistItem[]): BlacklistMatchers {
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
}

export function isUrlBlacklisted(url: string, matchers: BlacklistMatchers): boolean {
  if (!url) return false;

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
    } catch (e) {
      const match = url.match(/^[^/:]+([/][^?#]*)/);
      path = match ? match[1] : '/';
    }
    const urlToTest = hostname + path;
    if (matchers.urlRegex.test(urlToTest)) {
      return true;
    }
  }

  return false;
}

export function parseInput(input: string): { value: string; isRegex: boolean } | { error: string } | null {
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
    } catch (error: unknown) {
      return { error: 'Invalid Regular Expression' };
    }
  }

  return { value, isRegex };
}
