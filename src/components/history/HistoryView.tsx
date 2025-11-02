import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../hooks/useToast';
import { formatDayHeader } from '../../utilities/dateUtil';
import { groupHistoryByDayAndHour } from '../../utilities/historyUtil';
import { SearchIcon } from '../shared/Icons';
import { Skeleton } from '../shared/Skeleton';
import { HistoryGroupHeader } from './HistoryGroupHeader';
import { HistoryGroupItem as HistoryItemGroupComponent } from './HistoryGroupItem';

import type { JSX, RefObject } from 'react';
import type { ChromeHistoryItem, HistoryItemGroup } from '../../app/types';

interface HistoryViewProps {
  deleteHistoryItems: (ids: string[]) => Promise<void>;
  hasMore: boolean;
  historyItems: ChromeHistoryItem[];
  isLoadingMore: boolean;
  loadMore: () => void;
  onDelete: (id: string) => Promise<void>;
  scrollContainerRef: RefObject<HTMLElement | null>;
}

interface ProcessedHourGroup extends HistoryItemGroup {
  selectedInHourCount: number;
}

interface ProcessedDayGroup {
  date: Date;
  items: ChromeHistoryItem[];
  hourlyGroups: ProcessedHourGroup[];
  hourlyGroupsMap: Map<string, ProcessedHourGroup>;
  selectedInDayCount: number;
}

export const HistoryViewItemSkeleton = memo(() => {
  return (
    <div className="flex items-center p-2">
      <Skeleton className="mr-2 h-4 w-4 shrink-0 rounded" />
      <Skeleton className="mr-2 h-4 w-4 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="mt-2 h-3 w-1/2 rounded" />
      </div>
      <Skeleton className="ml-2 h-4 w-20 shrink-0 rounded" />
    </div>
  );
});

export const HistoryViewGroupSkeleton = memo(() => {
  return (
    <section>
      <div className="mb-1 flex items-center justify-between px-2">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>
      <div className="flex flex-col">
        <HistoryViewItemSkeleton />
        <HistoryViewItemSkeleton />
        <HistoryViewItemSkeleton />
      </div>
    </section>
  );
});

export const DailyGroupHeaderSkeleton = memo(() => {
  return (
    <div className="mb-3 flex items-center justify-between px-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-7 w-40 rounded" />
      </div>
      <Skeleton className="h-6 w-32 rounded-md" />
    </div>
  );
});

export const HistoryViewSkeleton = memo(() => {
  return (
    <div className="space-y-3 p-3">
      <section>
        <DailyGroupHeaderSkeleton />
        <hr className="mb-3 border-slate-200" />
        <div className="space-y-2">
          <HistoryViewGroupSkeleton />
          <HistoryViewGroupSkeleton />
        </div>
      </section>
      <section>
        <DailyGroupHeaderSkeleton />
        <hr className="mb-3 border-slate-200" />
        <div className="space-y-2">
          <HistoryViewGroupSkeleton />
        </div>
      </section>
    </div>
  );
});

export const HistoryView = memo(
  ({ deleteHistoryItems, hasMore, historyItems, isLoadingMore, loadMore, onDelete, scrollContainerRef }: HistoryViewProps): JSX.Element => {
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const { Modal: DeleteModal, openModal: openDeleteModal } = useConfirm();
    const { addToast } = useToast();
    const [stickyState, setStickyState] = useState<{
      dayKey: string | null;
      hourText: string | null;
    }>({ dayKey: null, hourText: null });
    const headerPositions = useRef<{ top: number; dayKey: string; hourText: string | null }[]>([]);

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

    const handleConfirmDeleteSelected = useCallback(async () => {
      if (selectedItems.size > 0) {
        const count = selectedItems.size;
        await deleteHistoryItems(Array.from(selectedItems));
        setSelectedItems(new Set());
        addToast(`${count} item${count > 1 ? 's' : ''} deleted.`, 'success');
      }
    }, [selectedItems, deleteHistoryItems, addToast]);

    const handleOpenDeleteSelectedModal = useCallback(() => {
      if (selectedItems.size > 0) {
        openDeleteModal({
          confirmButtonClass: 'bg-red-600 hover:bg-red-700',
          confirmText: `Delete ${selectedItems.size} items`,
          message: (
            <>
              Are you sure you want to permanently delete the <strong>{selectedItems.size}</strong> selected history items? This action cannot be
              undone.
            </>
          ),
          onConfirm: handleConfirmDeleteSelected,
          title: 'Delete Selected Items',
        });
      }
    }, [selectedItems, openDeleteModal, handleConfirmDeleteSelected]);

    const handleOpenDeleteAllModal = useCallback(
      (items: ChromeHistoryItem[], type: 'day' | 'hour') => {
        if (items.length > 0) {
          openDeleteModal({
            confirmButtonClass: 'bg-red-600 hover:bg-red-700',
            confirmText: `Delete ${items.length} items`,
            message: (
              <>
                Are you sure you want to permanently delete all <strong>{items.length}</strong> history items for this {type}? This action cannot be
                undone.
              </>
            ),
            onConfirm: async () => {
              await deleteHistoryItems(items.map((i) => i.id));
              addToast(`${items.length} item${items.length > 1 ? 's' : ''} deleted from this ${type}.`, 'success');
            },
            title: `Delete Entire ${type === 'day' ? 'Day' : 'Hour'}`,
          });
        }
      },
      [openDeleteModal, deleteHistoryItems, addToast],
    );

    const itemIdToDayKeyMap = useMemo(() => {
      const map = new Map<string, string>();
      for (const item of historyItems) {
        const itemDate = new Date(item.lastVisitTime);
        itemDate.setHours(0, 0, 0, 0);
        map.set(item.id, itemDate.toISOString());
      }
      return map;
    }, [historyItems]);

    const selectedCountByDay = useMemo(() => {
      const counts = new Map<string, number>();
      selectedItems.forEach((itemId) => {
        const dayKey = itemIdToDayKeyMap.get(itemId);
        if (dayKey) {
          counts.set(dayKey, (counts.get(dayKey) || 0) + 1);
        }
      });
      return counts;
    }, [selectedItems, itemIdToDayKeyMap]);

    const dailyGroups = useMemo(() => groupHistoryByDayAndHour(historyItems), [historyItems]);

    const { processedDailyGroups, dailyGroupsMap } = useMemo(() => {
      const groups: ProcessedDayGroup[] = dailyGroups.map((dayGroup) => {
        const hourlyGroupsArray = dayGroup.hourlyGroups.map((group) => ({
          ...group,
          selectedInHourCount: group.items.reduce((count, item) => (selectedItems.has(item.id) ? count + 1 : count), 0),
        }));

        const hourlyGroupsMap = new Map<string, ProcessedHourGroup>(hourlyGroupsArray.map((hg) => [hg.time, hg]));

        return {
          ...dayGroup,
          hourlyGroups: hourlyGroupsArray,
          hourlyGroupsMap: hourlyGroupsMap,
          selectedInDayCount: selectedCountByDay.get(dayGroup.date.toISOString()) || 0,
        };
      });

      const map = new Map<string, ProcessedDayGroup>(groups.map((g) => [g.date.toISOString(), g]));
      return { processedDailyGroups: groups, dailyGroupsMap: map };
    }, [dailyGroups, selectedCountByDay, selectedItems]);

    const handleToggleDaySelection = useCallback(
      (dayItems: ChromeHistoryItem[]) => {
        if (dayItems.length === 0) return;

        const date = new Date(dayItems[0].lastVisitTime);
        date.setHours(0, 0, 0, 0);
        const dayKey = date.toISOString();
        const selectedCountInDay = selectedCountByDay.get(dayKey) || 0;
        const allCurrentlySelected = dayItems.length > 0 && selectedCountInDay === dayItems.length;

        const dayItemIds = dayItems.map((item) => item.id);

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
      [selectedCountByDay],
    );

    useLayoutEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const positions: { top: number; dayKey: string; hourText: string | null }[] = [];
      const headerElements = container.querySelectorAll<HTMLElement>('[data-day-key]');

      headerElements.forEach((el) => {
        positions.push({
          top: el.offsetTop,
          dayKey: el.dataset.dayKey!,
          hourText: el.dataset.hourKey || null,
        });
      });
      headerPositions.current = positions;

      const handleScroll = (): void => {
        const scrollTop = container.scrollTop;
        const currentPositions = headerPositions.current;

        let low = 0;
        let high = currentPositions.length - 1;
        let activeIndex = -1;

        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          if (currentPositions[mid].top <= scrollTop) {
            activeIndex = mid;
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }

        let activeDayKey: string | null = null;
        let activeHourText: string | null = null;

        if (activeIndex !== -1) {
          activeDayKey = currentPositions[activeIndex].dayKey;
          activeHourText = currentPositions[activeIndex].hourText;
        } else if (processedDailyGroups.length > 0) {
          activeDayKey = processedDailyGroups[0].date.toISOString();
        }

        setStickyState((prev) => {
          if (prev.dayKey === activeDayKey && prev.hourText === activeHourText) {
            return prev;
          }
          return { dayKey: activeDayKey, hourText: activeHourText };
        });
      };

      container.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();

      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }, [processedDailyGroups, scrollContainerRef]);

    const stickyDayGroup = useMemo(() => {
      if (!stickyState.dayKey) return null;
      return dailyGroupsMap.get(stickyState.dayKey) ?? null;
    }, [stickyState.dayKey, dailyGroupsMap]);

    const stickyHeaderData = useMemo(() => {
      if (!stickyDayGroup) {
        return { items: [], selectedCount: 0 };
      }

      if (stickyState.hourText) {
        const hourlyGroup = stickyDayGroup.hourlyGroupsMap.get(stickyState.hourText);
        if (hourlyGroup) {
          return {
            items: hourlyGroup.items,
            selectedCount: hourlyGroup.selectedInHourCount,
          };
        }
      }

      return {
        items: stickyDayGroup.items,
        selectedCount: stickyDayGroup.selectedInDayCount,
      };
    }, [stickyDayGroup, stickyState.hourText]);

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
          (entries: IntersectionObserverEntry[]) => {
            if (entries[0].isIntersecting && hasMore) {
              loadMore();
            }
          },
          {
            root: scrollContainerRef.current,
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
        <div className="flex h-full flex-col items-center justify-center p-3 pt-12 text-center text-slate-500">
          <SearchIcon className="mb-4 h-12 w-12 text-slate-400" />
          <h2 className="text-xl font-semibold">No History Found</h2>
          <p className="mt-2">Your browsing history for the selected period is empty.</p>
        </div>
      );
    }

    return (
      <div className="relative">
        {stickyDayGroup && (
          <div className="sticky top-0 z-10 bg-slate-50/95 px-3 pt-3 backdrop-blur-sm">
            <HistoryGroupHeader
              dayHeaderText={`${formatDayHeader(stickyDayGroup.date)}${stickyState.hourText ? ` ${stickyState.hourText}` : ''}`}
              dayItems={stickyHeaderData.items}
              isHourHeader={!!stickyState.hourText}
              onDeleteAll={() => handleOpenDeleteAllModal(stickyHeaderData.items, stickyState.hourText ? 'hour' : 'day')}
              onDeleteSelected={handleOpenDeleteSelectedModal}
              onToggleDaySelection={() => handleToggleDaySelection(stickyHeaderData.items)}
              selectedItemsCount={stickyHeaderData.selectedCount}
              totalSelectedCount={selectedItems.size}
            />
            <hr className="mt-3 border-slate-200" />
          </div>
        )}
        <div className="space-y-3 p-3">
          {processedDailyGroups.map((dayGroup) => {
            const dayKey = dayGroup.date.toISOString();
            const dayHeaderText = formatDayHeader(dayGroup.date);
            const isDayHeaderCovered = stickyState.dayKey === dayKey && !stickyState.hourText;

            return (
              <section key={dayKey}>
                <div
                  data-day-key={dayKey}
                  style={{
                    visibility: isDayHeaderCovered ? 'hidden' : 'visible',
                    height: isDayHeaderCovered ? 0 : 'auto',
                  }}
                >
                  <HistoryGroupHeader
                    dayHeaderText={dayHeaderText}
                    dayItems={dayGroup.items}
                    isHourHeader={false}
                    onDeleteAll={() => handleOpenDeleteAllModal(dayGroup.items, 'day')}
                    onDeleteSelected={handleOpenDeleteSelectedModal}
                    onToggleDaySelection={() => handleToggleDaySelection(dayGroup.items)}
                    selectedItemsCount={dayGroup.selectedInDayCount}
                    totalSelectedCount={selectedItems.size}
                  />
                  <hr className="mb-3 border-slate-200" />
                </div>
                <div className="space-y-2">
                  {dayGroup.hourlyGroups.map((group) => {
                    const isHourHeaderCovered = stickyState.dayKey === dayKey && stickyState.hourText === group.time;

                    return (
                      <div key={group.time} data-day-key={dayKey} data-hour-key={group.time}>
                        <HistoryItemGroupComponent
                          deleteHistoryItems={deleteHistoryItems}
                          group={group}
                          isSticky={isHourHeaderCovered}
                          onDelete={onDelete}
                          onToggleSelection={handleToggleSelection}
                          selectedItems={selectedItems}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div ref={lastElementRef} className="h-1" />

        {isLoadingMore && (
          <div className="px-3 py-3">
            <HistoryViewGroupSkeleton />
          </div>
        )}
        <DeleteModal />
      </div>
    );
  },
);
