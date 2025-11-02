export interface BlacklistItem {
  isRegex: boolean;
  value: string;
}

export interface BlacklistMatchers {
  plain: Set<string>;
  regex: RegExp[];
}

export function createBlacklistMatchers(items: BlacklistItem[]): BlacklistMatchers {
  const plain = new Set<string>();
  const regex: RegExp[] = [];

  for (const item of items) {
    if (item.isRegex) {
      try {
        regex.push(new RegExp(item.value, 'i'));
      } catch (e: unknown) {
        console.error(`Invalid regex in blacklist: ${item.value}`, e);
      }
    } else {
      plain.add(item.value);
    }
  }
  return { plain, regex };
}

export function isDomainBlacklisted(domain: string, matchers: BlacklistMatchers): boolean {
  if (matchers.plain.has(domain)) {
    return true;
  }

  for (const re of matchers.regex) {
    if (re.test(domain)) {
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
