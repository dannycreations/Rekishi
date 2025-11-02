export interface BlacklistItem {
  isRegex: boolean;
  value: string;
}

export interface BlacklistMatchers {
  plain: Set<string>;
  combinedRegex: RegExp | null;
}

export function createBlacklistMatchers(items: BlacklistItem[]): BlacklistMatchers {
  const plain = new Set<string>();
  const regexSources: string[] = [];

  for (const item of items) {
    if (item.isRegex) {
      try {
        new RegExp(item.value);
        regexSources.push(item.value);
      } catch (e: unknown) {
        console.error(`Invalid regex in blacklist, skipping: ${item.value}`, e);
      }
    } else {
      plain.add(item.value);
    }
  }

  const combinedRegex = regexSources.length > 0 ? new RegExp(regexSources.map((source) => `(${source})`).join('|'), 'i') : null;

  return { plain, combinedRegex };
}

export function isDomainBlacklisted(domain: string, matchers: BlacklistMatchers): boolean {
  if (matchers.plain.has(domain)) {
    return true;
  }
  return !!matchers.combinedRegex?.test(domain);
}

export function parseInput(input: string): { value: string; isRegex: boolean } | { error: string } | null {
  const trimmedValue = input.trim();
  if (!trimmedValue) {
    return null;
  }

  const isRegex = trimmedValue.length > 2 && trimmedValue.startsWith('/') && trimmedValue.endsWith('/');
  const value = isRegex ? trimmedValue.slice(1, -1) : trimmedValue;

  if (!value) {
    return null;
  }

  if (isRegex) {
    try {
      // eslint-disable-next-line no-new
      new RegExp(value);
    } catch (error: unknown) {
      return { error: 'Invalid Regular Expression' };
    }
  }

  return { value, isRegex };
}
