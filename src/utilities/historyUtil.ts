import type { ChromeHistoryItem, HistoryItemGroup } from '../app/types';

export const groupHistoryByHour = (items: ChromeHistoryItem[]): HistoryItemGroup[] => {
  if (!items || items.length === 0) {
    return [];
  }

  const groups: HistoryItemGroup[] = [];
  let currentHour = -1;
  let currentGroup: HistoryItemGroup | null = null;

  for (const item of items) {
    const itemDate = new Date(item.lastVisitTime);
    const hour = itemDate.getHours();

    if (hour !== currentHour) {
      currentHour = hour;
      itemDate.setMinutes(0, 0, 0);
      currentGroup = {
        time: itemDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        items: [],
      };
      groups.push(currentGroup);
    }
    currentGroup!.items.push(item);
  }

  return groups;
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

  const groups: { date: Date; items: ChromeHistoryItem[] }[] = [];
  let currentGroup: { date: Date; items: ChromeHistoryItem[] } | null = null;

  for (const item of items) {
    const itemDate = new Date(item.lastVisitTime);
    itemDate.setHours(0, 0, 0, 0);

    if (!currentGroup || currentGroup.date.getTime() !== itemDate.getTime()) {
      currentGroup = { date: itemDate, items: [] };
      groups.push(currentGroup);
    }
    currentGroup.items.push(item);
  }

  return groups;
};
