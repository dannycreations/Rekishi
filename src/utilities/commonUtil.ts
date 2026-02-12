import type { RegexResult } from '../app/types';

export const escapeRegex = (text: string): string => {
  return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

export const compileRegex = (query: string): RegexResult => {
  if (query.length <= 2) {
    return { regex: null, error: null };
  }
  const pattern = query.slice(1, -1);
  if (!pattern) {
    return { regex: null, error: null };
  }
  try {
    return { regex: new RegExp(pattern, 'i'), error: null };
  } catch (error: unknown) {
    console.error('Invalid regex provided:', error);
    return { regex: null, error: 'Invalid regular expression.' };
  }
};

export const isPotentialRegex = (input: string): boolean => {
  const trimmed = input.trim();
  return trimmed.length > 2 && trimmed.startsWith('/') && trimmed.endsWith('/');
};

export const getHostnameFromUrl = (url: string): string => {
  if (!url) {
    return '';
  }

  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    const matches = url.match(/:\/\/([^/?#:]+)/);
    if (matches?.[1]) {
      return matches[1].replace(/^www\./, '');
    }
    return '';
  }
};

export const parsePersistedState = <T, S>(json: string | null, selector: (state: S) => T, defaultValue: T): T => {
  if (!json) {
    return defaultValue;
  }
  try {
    const parsed = JSON.parse(json) as { state?: S };
    return parsed.state ? selector(parsed.state) : defaultValue;
  } catch (error) {
    console.error('Failed to parse state from storage', error);
    return defaultValue;
  }
};
