import type { ChromeHistoryItem, HistoryItemGroup } from '../app/types';

export const groupHistoryByHour = (items: ChromeHistoryItem[]): HistoryItemGroup[] => {
  if (!items) {
    return [];
  }

  const groups = items.reduce<Record<number, ChromeHistoryItem[]>>((acc, item) => {
    const hour = new Date(item.lastVisitTime).getHours();
    if (!acc[hour]) {
      acc[hour] = [];
    }
    acc[hour].push(item);
    return acc;
  }, {});

  const dateForFormatting = new Date();
  dateForFormatting.setMinutes(0, 0, 0);

  return Object.entries(groups)
    .sort(([hourA], [hourB]) => {
      return Number(hourB) - Number(hourA);
    })
    .map(([hour, itemsInGroup]) => {
      dateForFormatting.setHours(Number(hour));
      return {
        items: itemsInGroup,
        time: dateForFormatting.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
      };
    });
};

export const groupHistoryByDay = (
  items: ChromeHistoryItem[],
): {
  date: Date;
  items: ChromeHistoryItem[];
}[] => {
  if (!items || items.length === 0) {
    return [];
  }

  const groups = items.reduce<Record<string, { date: Date; items: ChromeHistoryItem[] }>>((acc, item) => {
    const date = new Date(item.lastVisitTime);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split('T')[0];

    if (!acc[dateStr]) {
      acc[dateStr] = { date: date, items: [] };
    }
    acc[dateStr].items.push(item);
    return acc;
  }, {});

  return Object.values(groups).sort((a, b) => {
    return b.date.getTime() - a.date.getTime();
  });
};
