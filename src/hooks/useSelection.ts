import { useCallback, useState } from 'react';

import type { ChromeHistoryItem } from '../app/types';

interface UseSelectionReturn {
  selectedItems: Set<string>;
  toggleSelection: (id: string) => void;
  toggleDaySelection: (dayItems: readonly ChromeHistoryItem[]) => void;
  clearSelection: () => void;
}

export const useSelection = (): UseSelectionReturn => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleSelection = useCallback((id: string) => {
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
    (dayItems: readonly ChromeHistoryItem[]) => {
      if (dayItems.length === 0) return;
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

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  return {
    selectedItems,
    toggleSelection,
    toggleDaySelection,
    clearSelection,
  };
};
