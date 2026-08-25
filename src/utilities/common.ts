export const escapeRegex = (text: string): string => {
  return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

export const safeRegExp = (source: string, flags?: string): RegExp | null => {
  try {
    return new RegExp(source, flags);
  } catch {
    return null;
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
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    const matches = url.match(/:\/\/([^/?#:]+)/);
    return matches?.[1]?.replace(/^www\./, '') ?? '';
  }
};

export const parseStoredJSON = <T>(json: string | null): T | null => {
  if (!json) {
    return null;
  }
  try {
    const parsed = JSON.parse(json) as { state?: T };
    return parsed.state ?? null;
  } catch (error) {
    console.error('Failed to parse state from storage', error);
    return null;
  }
};
