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
