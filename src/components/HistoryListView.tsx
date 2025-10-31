import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { formatDayHeader } from '../utilities/date';
import { ConfirmationModal } from './ConfirmationModal';
import { DailyGroupHeader } from './DailyGroupHeader';
import { HistoryItemGroup as HistoryItemGroupComponent } from './HistoryItemGroup';
import { SearchIcon } from './Icons';
import { Skeleton } from './Skeleton';

import type { JSX, RefObject } from 'react';
import type { ChromeHistoryItem, HistoryItemGroup } from '../app/types';

interface HistoryListViewProps {
  deleteHistoryItems: (ids: string[]) => void;
  hasMore: boolean;
  historyItems: ChromeHistoryItem[];
  isLoadingMore: boolean;
  loadMore: () => void;
  onDelete: (id: string) => void;
  scrollContainerRef: RefObject<HTMLElement>;
}

const groupHistoryByHour = (items: ChromeHistoryItem[]): HistoryItemGroup[] => {
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
    .sort(([hourA], [hourB]) => Number(hourB) - Number(hourA))
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

const groupHistoryByDay = (
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

  return Object.values(groups).sort((a, b) => b.date.getTime() - a.date.getTime());
};

const HistoryItemSkeleton = memo(function HistoryItemSkeleton() {
  return (
    <div className="flex items-center p-2">
      <Skeleton className="flex-shrink-0 w-4 h-4 mr-2 rounded" />
      <Skeleton className="flex-shrink-0 w-4 h-4 mr-2 rounded-full" />
      <div className="flex-1 min-w-0">
        <Skeleton className="w-3/4 h-4 rounded" />
        <Skeleton className="w-1/2 h-3 mt-2 rounded" />
      </div>
      <Skeleton className="flex-shrink-0 w-20 h-4 ml-2 rounded" />
    </div>
  );
});

const HistoryItemGroupSkeleton = memo(function HistoryItemGroupSkeleton() {
  return (
    <section>
      <div className="flex items-center justify-between mb-1">
        <Skeleton className="w-24 h-5 rounded" />
        <Skeleton className="w-20 h-8 rounded-md" />
      </div>
      <div className="flex flex-col">
        <HistoryItemSkeleton />
        <HistoryItemSkeleton />
        <HistoryItemSkeleton />
      </div>
    </section>
  );
});

const DailyGroupHeaderSkeleton = memo(function DailyGroupHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between px-2 mb-3">
      <div className="flex items-center gap-2">
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="w-32 h-6 rounded" />
      </div>
    </div>
  );
});

export const HistoryListViewSkeleton = memo(function HistoryListViewSkeleton() {
  return (
    <div className="space-y-3">
      <section>
        <DailyGroupHeaderSkeleton />
        <hr className="mb-3 border-slate-200" />
        <div className="space-y-2">
          <HistoryItemGroupSkeleton />
          <HistoryItemGroupSkeleton />
        </div>
      </section>
      <section>
        <DailyGroupHeaderSkeleton />
        <hr className="mb-3 border-slate-200" />
        <div className="space-y-2">
          <HistoryItemGroupSkeleton />
        </div>
      </section>
    </div>
  );
});

function HistoryListViewFn({
  deleteHistoryItems,
  hasMore,
  historyItems,
  isLoadingMore,
  loadMore,
  onDelete,
  scrollContainerRef,
}: HistoryListViewProps): JSX.Element {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleToggleSelection = useCallback((id: string): void => {
    setSelectedItems((prev) => {
      const newSelectedItems = new Set(prev);
      if (newSelectedItems.has(id)) {
        newSelectedItems.delete(id);
      } else {
        newSelectedItems.add(id);
      }
      return newSelectedItems;
    });
  }, []);

  const handleOpenDeleteModal = useCallback(() => {
    if (selectedItems.size > 0) {
      setIsDeleteModalOpen(true);
    }
  }, [selectedItems.size]);

  const handleConfirmDelete = useCallback(() => {
    if (selectedItems.size > 0) {
      deleteHistoryItems(Array.from(selectedItems));
      setSelectedItems(new Set());
    }
    setIsDeleteModalOpen(false);
  }, [selectedItems, deleteHistoryItems]);

  const handleToggleDaySelection = useCallback(
    (dayItems: ChromeHistoryItem[]) => {
      const dayItemIds = dayItems.map((item) => item.id);
      const allCurrentlySelected = dayItemIds.length > 0 && dayItemIds.every((id) => selectedItems.has(id));

      setSelectedItems((prev) => {
        const newSelectedItems = new Set(prev);
        if (allCurrentlySelected) {
          dayItemIds.forEach((id) => newSelectedItems.delete(id));
        } else {
          dayItemIds.forEach((id) => newSelectedItems.add(id));
        }
        return newSelectedItems;
      });
    },
    [selectedItems],
  );

  const dailyGroupsWithHourlySubgroups = useMemo(() => {
    const dayGroups = groupHistoryByDay(historyItems);
    return dayGroups.map((dayGroup) => ({
      ...dayGroup,
      hourlyGroups: groupHistoryByHour(dayGroup.items),
    }));
  }, [historyItems]);

  const itemIdToDayKeyMap = useMemo(() => {
    const map = new Map<string, string>();
    dailyGroupsWithHourlySubgroups.forEach((group) => {
      const dayKey = group.date.toISOString();
      group.items.forEach((item) => {
        map.set(item.id, dayKey);
      });
    });
    return map;
  }, [dailyGroupsWithHourlySubgroups]);

  const selectedCountByDay = useMemo(() => {
    const counts = new Map<string, number>();
    for (const itemId of selectedItems) {
      const dayKey = itemIdToDayKeyMap.get(itemId);
      if (dayKey) {
        counts.set(dayKey, (counts.get(dayKey) || 0) + 1);
      }
    }
    return counts;
  }, [selectedItems, itemIdToDayKeyMap]);

  const processedDailyGroups = useMemo(
    () =>
      dailyGroupsWithHourlySubgroups.map((dayGroup) => ({
        ...dayGroup,
        selectedInDayCount: selectedCountByDay.get(dayGroup.date.toISOString()) || 0,
      })),
    [dailyGroupsWithHourlySubgroups, selectedCountByDay],
  );

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingMore) {
        return;
      }
      if (observer.current) {
        observer.current.disconnect();
      }

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadMore();
          }
        },
        {
          root: scrollContainerRef.current,
          // Trigger when the last element is 500px away from the bottom of the viewport.
          // This makes loading feel faster as new content is fetched before the user
          // scrolls to the very end.
          rootMargin: '0px 0px 500px 0px',
        },
      );

      if (node) {
        observer.current.observe(node);
      }
    },
    [isLoadingMore, hasMore, loadMore, scrollContainerRef],
  );

  if (processedDailyGroups.length === 0 && !isLoadingMore) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-12 text-center text-slate-500">
        <SearchIcon className="w-12 h-12 mb-4 text-slate-400" />
        <h2 className="text-xl font-semibold">No History Found</h2>
        <p className="mt-2">Your browsing history for the selected period is empty.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        {processedDailyGroups.map((dayGroup) => {
          const dayHeaderText = formatDayHeader(dayGroup.date);

          return (
            <section key={dayGroup.date.toISOString()} aria-labelledby={`daily-group-header-${dayGroup.date.toISOString()}`}>
              <DailyGroupHeader
                dayHeaderText={dayHeaderText}
                dayItems={dayGroup.items}
                onDeleteSelected={handleOpenDeleteModal}
                onToggleDaySelection={handleToggleDaySelection}
                selectedItemsCount={dayGroup.selectedInDayCount}
                totalSelectedCount={selectedItems.size}
              />
              <hr className="mb-3 border-slate-200" />
              <div className="space-y-2">
                {dayGroup.hourlyGroups.map((group) => (
                  <HistoryItemGroupComponent
                    key={group.time}
                    deleteHistoryItems={deleteHistoryItems}
                    group={group}
                    onDelete={onDelete}
                    onToggleSelection={handleToggleSelection}
                    selectedItems={selectedItems}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div ref={lastElementRef} className="h-1" />

      {isLoadingMore && (
        <div className="py-3">
          <HistoryItemGroupSkeleton />
        </div>
      )}
      <ConfirmationModal
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        confirmText={`Delete ${selectedItems.size} items`}
        isOpen={isDeleteModalOpen}
        message={
          <>
            Are you sure you want to permanently delete the <strong>{selectedItems.size}</strong> selected history items? This action cannot be
            undone.
          </>
        }
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Selected Items"
      />
    </div>
  );
}

export const HistoryListView = memo(HistoryListViewFn);
