export interface BlacklistItem {
  isRegex: boolean;
  value: string;
}

export interface BlacklistMatchers {
  plain: Set<string>;
  combinedRegex: RegExp | null;
}

export function isPotentialRegex(input: string): boolean {
  const trimmed = input.trim();
  return trimmed.length > 2 && trimmed.startsWith('/') && trimmed.endsWith('/');
}

export function createBlacklistMatchers(items: readonly BlacklistItem[]): BlacklistMatchers {
  const plain = new Set<string>();
  const regexSources: string[] = [];

  for (const item of items) {
    if (item.isRegex) {
      try {
        new RegExp(item.value);
        regexSources.push(item.value);
      } catch (error: unknown) {
        console.error(`Invalid regex in blacklist, skipping: ${item.value}`, error);
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
