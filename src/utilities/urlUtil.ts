export function getHostnameFromUrl(url: string): string {
  if (!url) {
    return '';
  }

  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch (error: unknown) {
    const matches = url.match(/:\/\/([^/?#:]+)/);
    if (matches?.[1]) {
      return matches[1].replace(/^www\./, '');
    }
    return '';
  }
}
