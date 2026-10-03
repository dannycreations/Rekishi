import { describe, expect, test } from 'bun:test';

import { groupHistoryByDayAndHour } from './history';

import type { ChromeHistoryItem } from '../app/types';

const item = (id: string, date: Date): ChromeHistoryItem => ({
  id,
  url: `https://example.com/${id}`,
  title: id,
  lastVisitTime: date.getTime(),
  visitCount: 1,
});

describe('groupHistoryByDayAndHour', () => {
  test('returns nothing for an empty list', () => {
    expect(groupHistoryByDayAndHour([])).toEqual([]);
  });

  test('splits items into days, buckets them by hour, and keeps newest first', () => {
    const items = [
      item('a', new Date(2024, 0, 15, 10, 5)),
      item('b', new Date(2024, 0, 15, 10, 45)),
      item('c', new Date(2024, 0, 15, 9, 15)),
      item('d', new Date(2024, 0, 14, 23, 30)),
    ];

    const [january15, january14] = groupHistoryByDayAndHour(items);

    expect(january15.date).toEqual(new Date(2024, 0, 15, 0, 0, 0, 0));
    expect(january15.items.map((entry) => entry.id)).toEqual(['a', 'b', 'c']);
    expect(january15.hourlyGroups.map((group) => group.time)).toEqual(['10:00 AM', '9:00 AM']);
    expect(january15.hourlyGroups[0].items.map((entry) => entry.id)).toEqual(['a', 'b']);

    expect(january14.date).toEqual(new Date(2024, 0, 14, 0, 0, 0, 0));
    expect(january14.items.map((entry) => entry.id)).toEqual(['d']);
    expect(january14.hourlyGroups.map((group) => group.time)).toEqual(['11:00 PM']);
  });

  test('starts a new day even when the hour repeats', () => {
    const items = [item('a', new Date(2024, 0, 15, 10, 0)), item('b', new Date(2024, 0, 14, 10, 0)), item('c', new Date(2024, 0, 13, 10, 0))];

    const groups = groupHistoryByDayAndHour(items);

    expect(groups).toHaveLength(3);
    expect(groups.map((group) => group.hourlyGroups.length)).toEqual([1, 1, 1]);
    expect(groups.map((group) => group.items[0].id)).toEqual(['a', 'b', 'c']);
  });
});
