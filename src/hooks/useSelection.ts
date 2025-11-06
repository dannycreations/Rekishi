import { useCallback, useState } from 'react';

import type { ChromeHistoryItem } from '../app/types';

interface UseSelectionReturn {
  readonly selectedItems: ReadonlySet<string>;
  readonly toggleSelection: (id: string) => void;
  readonly toggleDaySelection: (dayItems: readonly ChromeHistoryItem[]) => void;
  readonly clearSelection: () => void;
}

export const useSelection = (): UseSelectionReturn => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleSelection = useCallback((id: string): void => {
    setSelectedItems((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  const toggleDaySelection = useCallback(
    (dayItems: readonly ChromeHistoryItem[]): void => {
      if (dayItems.length === 0) {
        return;
      }
      const dayItemIds = dayItems.map((item) => item.id);
      const allSelected = dayItems.every((item) => selectedItems.has(item.id));

      setSelectedItems((prev) => {
        const newSelected = new Set(prev);
        if (allSelected) {
          dayItemIds.forEach((id) => newSelected.delete(id));
        } else {
          dayItemIds.forEach((id) => newSelected.add(id));
        }
        return newSelected;
      });
    },
    [selectedItems],
  );

  const clearSelection = useCallback((): void => {
    setSelectedItems(new Set());
  }, []);

  return {
    selectedItems,
    toggleSelection,
    toggleDaySelection,
    clearSelection,
  };
};
