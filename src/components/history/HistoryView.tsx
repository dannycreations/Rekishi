import { memo, useCallback, useMemo, useRef } from 'react';

import { useConfirm } from '../../hooks/useConfirm';
import { useHistoryGroup } from '../../hooks/useHistoryGroup';
import { useSelection } from '../../hooks/useSelection';
import { useStickyHeader } from '../../hooks/useStickyHeader';
import { useBlacklistStore } from '../../stores/useBlacklistStore';
import { useToastStore } from '../../stores/useToastStore';
import { formatDayHeader } from '../../utilities/dateUtil';
import { getHostnameFromUrl } from '../../utilities/urlUtil';
import { SearchIcon } from '../shared/Icons';
import { HistoryItemGroup } from './HistoryItemGroup';
import { HistoryItemHeader } from './HistoryItemHeader';
import { HistoryViewGroupSkeleton } from './HistoryViewSkeleton';

import type { JSX, RefObject } from 'react';
import type { ChromeHistoryItem } from '../../app/types';

interface HistoryViewProps {
  deleteHistoryItems: (ids: string[]) => Promise<void>;
  hasMore: boolean;
  historyItems: ChromeHistoryItem[];
  isLoadingMore: boolean;
  loadMore: () => void;
  onDelete: (id: string) => Promise<void>;
  scrollContainerRef: RefObject<HTMLElement | null>;
}

export const HistoryView = memo(
  ({ deleteHistoryItems, hasMore, historyItems, isLoadingMore, loadMore, onDelete, scrollContainerRef }: HistoryViewProps): JSX.Element => {
    const { selectedItems, toggleSelection, toggleDaySelection, clearSelection } = useSelection();
    const { Modal: DeleteModal, openModal: openDeleteModal } = useConfirm();
    const { Modal: BlacklistModal, openModal: openBlacklistModal } = useConfirm();
    const addToast = useToastStore((state) => state.addToast);
    const { addDomain } = useBlacklistStore();

    const { dailyGroups, dailyGroupsMap, itemLocator } = useHistoryGroup(historyItems);

    const selectionCounts = useMemo(() => {
      const counts = {
        byDay: new Map<string, number>(),
        byHour: new Map<string, number>(),
      };
      selectedItems.forEach((itemId) => {
        const location = itemLocator.get(itemId);
        if (location) {
          counts.byDay.set(location.dayKey, (counts.byDay.get(location.dayKey) || 0) + 1);
          counts.byHour.set(location.hourKey, (counts.byHour.get(location.hourKey) || 0) + 1);
        }
      });
      return counts;
    }, [selectedItems, itemLocator]);

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
          onConfirm: async () => {
            const count = selectedItems.size;
            await deleteHistoryItems(Array.from(selectedItems));
            clearSelection();
            addToast(`${count} item${count > 1 ? 's' : ''} deleted.`, 'success');
          },
          title: 'Delete Selected Items',
        });
      }
    }, [selectedItems, deleteHistoryItems, addToast, openDeleteModal, clearSelection]);

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

    const handleDeleteItemRequest = useCallback(
      (item: ChromeHistoryItem) => {
        openDeleteModal({
          confirmButtonClass: 'bg-red-600 hover:bg-red-700',
          confirmText: 'Delete',
          message: (
            <>
              Are you sure you want to permanently delete <strong>{item.title || item.url}</strong> from your history? This action cannot be undone.
            </>
          ),
          onConfirm: async () => {
            await onDelete(item.id);
            addToast('History item deleted.', 'success');
          },
          title: 'Delete History Item',
        });
      },
      [onDelete, openDeleteModal, addToast],
    );

    const handleBlacklistRequest = useCallback(
      (item: ChromeHistoryItem) => {
        const hostname = getHostnameFromUrl(item.url);
        if (hostname) {
          openBlacklistModal({
            confirmButtonClass: 'bg-red-600 hover:bg-red-700',
            confirmText: 'Blacklist',
            message: (
              <>
                Are you sure you want to blacklist <strong>{hostname}</strong>? This will hide all current and future history items from this domain.
                You can manage your blacklist in the &quot;Blacklist Domain&quot; section.
              </>
            ),
            onConfirm: () => {
              addDomain(hostname, false);
              addToast(`'${hostname}' has been blacklisted.`, 'success');
            },
            title: 'Blacklist Domain',
          });
        }
      },
      [addDomain, addToast, openBlacklistModal],
    );

    const stickyState = useStickyHeader(scrollContainerRef, dailyGroups);

    const stickyDayGroup = useMemo(() => {
      if (!stickyState.dayKey) return null;
      return dailyGroupsMap.get(stickyState.dayKey) ?? null;
    }, [stickyState.dayKey, dailyGroupsMap]);

    const stickyHeaderData = useMemo(() => {
      if (!stickyDayGroup) {
        return { items: [], selectedCount: 0 };
      }
      const dayKey = stickyDayGroup.date.toISOString();

      if (stickyState.hourText) {
        const hourlyGroup = stickyDayGroup.hourlyGroupsMap.get(stickyState.hourText);
        if (hourlyGroup) {
          const hourKey = `${dayKey}_${stickyState.hourText}`;
          return {
            items: hourlyGroup.items,
            selectedCount: selectionCounts.byHour.get(hourKey) || 0,
          };
        }
      }

      return {
        items: stickyDayGroup.items,
        selectedCount: selectionCounts.byDay.get(dayKey) || 0,
      };
    }, [stickyDayGroup, stickyState.hourText, selectionCounts]);

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

    if (dailyGroups.length === 0 && !isLoadingMore) {
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
            <HistoryItemHeader
              dayHeaderText={`${formatDayHeader(stickyDayGroup.date)}${stickyState.hourText ? ` ${stickyState.hourText}` : ''}`}
              dayItems={stickyHeaderData.items}
              isHourHeader={!!stickyState.hourText}
              onDeleteAll={() => handleOpenDeleteAllModal(stickyHeaderData.items, stickyState.hourText ? 'hour' : 'day')}
              onDeleteSelected={handleOpenDeleteSelectedModal}
              onToggleDaySelection={() => toggleDaySelection(stickyHeaderData.items)}
              selectedItemsCount={stickyHeaderData.selectedCount}
              totalSelectedCount={selectedItems.size}
            />
            <hr className="mt-3 border-slate-200" />
          </div>
        )}
        <div className="space-y-3 p-3">
          {dailyGroups.map((dayGroup) => {
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
                  <HistoryItemHeader
                    dayHeaderText={dayHeaderText}
                    dayItems={dayGroup.items}
                    isHourHeader={false}
                    onDeleteAll={() => handleOpenDeleteAllModal(dayGroup.items, 'day')}
                    onDeleteSelected={handleOpenDeleteSelectedModal}
                    onToggleDaySelection={() => toggleDaySelection(dayGroup.items)}
                    selectedItemsCount={selectionCounts.byDay.get(dayKey) || 0}
                    totalSelectedCount={selectedItems.size}
                  />
                  <hr className="mt-3 mb-3 border-slate-200" />
                </div>
                <div className="space-y-2">
                  {dayGroup.hourlyGroups.map((group) => {
                    const isHourHeaderCovered = stickyState.dayKey === dayKey && stickyState.hourText === group.time;

                    return (
                      <div key={group.time} data-day-key={dayKey} data-hour-key={group.time}>
                        <HistoryItemGroup
                          group={{ ...group, items: group.items }}
                          isSticky={isHourHeaderCovered}
                          onBlacklistRequest={handleBlacklistRequest}
                          onDeleteHourRequest={(items) => handleOpenDeleteAllModal(items, 'hour')}
                          onDeleteRequest={handleDeleteItemRequest}
                          onToggleSelection={toggleSelection}
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
        <BlacklistModal />
      </div>
    );
  },
);
