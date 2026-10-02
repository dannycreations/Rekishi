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

  const toggleDaySelection = useCallback((dayItems: readonly ChromeHistoryItem[]): void => {
    if (dayItems.length === 0) {
      return;
    }

    setSelectedItems((prev) => {
      const newSelected = new Set(prev);
      const allSelected = dayItems.every((item) => newSelected.has(item.id));

      for (const item of dayItems) {
        if (allSelected) {
          newSelected.delete(item.id);
        } else {
          newSelected.add(item.id);
        }
      }
      return newSelected;
    });
  }, []);

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
