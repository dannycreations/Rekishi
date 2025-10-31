import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useConfirm } from '../../hooks/useConfirm';
import { formatDayHeader } from '../../utilities/dateUtil';
import { SearchIcon } from '../shared/Icons';
import { Skeleton } from '../shared/Skeleton';
import { HistoryGroupHeader } from './HistoryGroupHeader';
import { HistoryGroupItem as HistoryItemGroupComponent } from './HistoryGroupItem';

import type { JSX, RefObject } from 'react';
import type { ChromeHistoryItem, HistoryItemGroup } from '../../app/types';

interface HistoryViewProps {
  deleteHistoryItems: (ids: string[]) => void;
  hasMore: boolean;
  historyItems: ChromeHistoryItem[];
  isLoadingMore: boolean;
  loadMore: () => void;
  onDelete: (id: string) => void;
  scrollContainerRef: RefObject<HTMLElement | null>;
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

const HistoryViewItemSkeleton = memo(() => {
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

HistoryViewItemSkeleton.displayName = 'HistoryViewItemSkeleton';

const HistoryViewGroupSkeleton = memo(() => {
  return (
    <section>
      <div className="flex items-center justify-between mb-1">
        <Skeleton className="w-24 h-5 rounded" />
        <Skeleton className="w-20 h-8 rounded-md" />
      </div>
      <div className="flex flex-col">
        <HistoryViewItemSkeleton />
        <HistoryViewItemSkeleton />
        <HistoryViewItemSkeleton />
      </div>
    </section>
  );
});

HistoryViewGroupSkeleton.displayName = 'HistoryViewGroupSkeleton';

const DailyGroupHeaderSkeleton = memo(() => {
  return (
    <div className="flex items-center justify-between px-2 mb-3">
      <div className="flex items-center gap-2">
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="w-32 h-6 rounded" />
      </div>
    </div>
  );
});

DailyGroupHeaderSkeleton.displayName = 'DailyGroupHeaderSkeleton';

export const HistoryViewSkeleton = memo(() => {
  return (
    <div className="p-3 space-y-3">
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

HistoryViewSkeleton.displayName = 'HistoryViewSkeleton';

export const HistoryView = memo(
  ({ deleteHistoryItems, hasMore, historyItems, isLoadingMore, loadMore, onDelete, scrollContainerRef }: HistoryViewProps): JSX.Element => {
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const { Modal: DeleteModal, openModal: openDeleteModal } = useConfirm();
    const [stickyState, setStickyState] = useState<{
      dayKey: string | null;
      hourText: string | null;
    }>({ dayKey: null, hourText: null });
    const headerRefs = useRef<Map<string, HTMLElement>>(new Map());

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

    const handleConfirmDeleteSelected = useCallback(() => {
      if (selectedItems.size > 0) {
        deleteHistoryItems(Array.from(selectedItems));
        setSelectedItems(new Set());
      }
    }, [selectedItems, deleteHistoryItems]);

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
            onConfirm: () => deleteHistoryItems(items.map((i) => i.id)),
            title: `Delete Entire ${type === 'day' ? 'Day' : 'Hour'}`,
          });
        }
      },
      [openDeleteModal, deleteHistoryItems],
    );

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

    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const handleScroll = (): void => {
        const containerTop = container.getBoundingClientRect().top;
        let activeDayKey: string | null = null;
        let activeHourText: string | null = null;

        const sortedRefs = Array.from(headerRefs.current.entries()).sort((a, b) => a[1].offsetTop - b[1].offsetTop);

        for (const [key, el] of sortedRefs) {
          if (!el) continue;

          const { top } = el.getBoundingClientRect();

          if (top <= containerTop) {
            if (key.includes('_')) {
              const [dayKey, hourText] = key.split('_');
              activeDayKey = dayKey;
              activeHourText = hourText;
            } else {
              activeDayKey = key;
              activeHourText = null;
            }
          }
        }

        if (!activeDayKey && processedDailyGroups.length > 0) {
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
      return processedDailyGroups.find((g) => g.date.toISOString() === stickyState.dayKey);
    }, [stickyState.dayKey, processedDailyGroups]);

    const stickyHeaderData = useMemo(() => {
      if (!stickyDayGroup) {
        return { items: [], selectedCount: 0 };
      }

      if (stickyState.hourText) {
        const hourlyGroup = stickyDayGroup.hourlyGroups.find((hg) => hg.time === stickyState.hourText);
        if (hourlyGroup) {
          const selectedCount = hourlyGroup.items.reduce((count, item) => count + (selectedItems.has(item.id) ? 1 : 0), 0);
          return { items: hourlyGroup.items, selectedCount };
        }
      }

      return { items: stickyDayGroup.items, selectedCount: stickyDayGroup.selectedInDayCount };
    }, [stickyDayGroup, stickyState.hourText, selectedItems]);

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
        <div className="flex flex-col items-center justify-center h-full p-3 pt-12 text-center text-slate-500">
          <SearchIcon className="w-12 h-12 mb-4 text-slate-400" />
          <h2 className="text-xl font-semibold">No History Found</h2>
          <p className="mt-2">Your browsing history for the selected period is empty.</p>
        </div>
      );
    }

    return (
      <div className="relative">
        {stickyDayGroup && (
          <div className="sticky top-0 z-10 px-3 pt-3 bg-slate-50/95 backdrop-blur-sm">
            <HistoryGroupHeader
              dayHeaderText={`${formatDayHeader(stickyDayGroup.date)}${stickyState.hourText ? ` - ${stickyState.hourText}` : ''}`}
              dayItems={stickyHeaderData.items}
              onDeleteAll={() => handleOpenDeleteAllModal(stickyHeaderData.items, stickyState.hourText ? 'hour' : 'day')}
              onDeleteSelected={handleOpenDeleteSelectedModal}
              onToggleDaySelection={() => handleToggleDaySelection(stickyHeaderData.items)}
              selectedItemsCount={stickyHeaderData.selectedCount}
              totalSelectedCount={selectedItems.size}
            />
            <hr className="mt-3 border-slate-200" />
          </div>
        )}
        <div className="p-3 space-y-3">
          {processedDailyGroups.map((dayGroup) => {
            const dayKey = dayGroup.date.toISOString();
            const dayHeaderText = formatDayHeader(dayGroup.date);
            const isDayHeaderCovered = stickyState.dayKey === dayKey;

            return (
              <section key={dayKey}>
                <div
                  ref={(el) => {
                    if (el) {
                      headerRefs.current.set(dayKey, el);
                    } else {
                      headerRefs.current.delete(dayKey);
                    }
                  }}
                  style={{
                    visibility: isDayHeaderCovered ? 'hidden' : 'visible',
                    height: isDayHeaderCovered ? 0 : 'auto',
                    overflow: 'hidden',
                  }}
                >
                  <HistoryGroupHeader
                    dayHeaderText={dayHeaderText}
                    dayItems={dayGroup.items}
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
                    const hourKey = `${dayKey}_${group.time}`;
                    const isHourHeaderCovered = isDayHeaderCovered && stickyState.hourText === group.time;

                    return (
                      <div
                        key={group.time}
                        ref={(el) => {
                          if (el) {
                            headerRefs.current.set(hourKey, el);
                          } else {
                            headerRefs.current.delete(hourKey);
                          }
                        }}
                      >
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

HistoryView.displayName = 'HistoryView';
