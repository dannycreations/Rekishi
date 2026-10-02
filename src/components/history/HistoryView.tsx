import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { useConfirm } from '../../hooks/useConfirm';
import { useSelection } from '../../hooks/useSelection';
import { useBlacklistStore } from '../../stores/useBlacklistStore';
import { useToastStore } from '../../stores/useToastStore';
import { getHostnameFromUrl } from '../../utilities/common';
import { formatDayHeader } from '../../utilities/date';
import { groupHistoryByDayAndHour } from '../../utilities/history';
import { Icon } from '../shared/Icon';
import { HistoryItemGroup } from './HistoryItemGroup';
import { HistoryItemHeader } from './HistoryItemHeader';
import { HistoryViewGroupSkeleton } from './HistoryViewSkeleton';

import type { JSX, RefObject } from 'react';
import type { ChromeHistoryItem } from '../../app/types';

interface HistoryViewProps {
  readonly deleteHistoryItems: (ids: string[]) => Promise<void>;
  readonly historyItems: readonly ChromeHistoryItem[];
  readonly isLoadingMore: boolean;
  readonly loadMore: () => void;
  readonly onDelete: (id: string) => Promise<void>;
  readonly scrollContainerRef: RefObject<HTMLElement | null>;
}

export const HistoryView = memo(
  ({ deleteHistoryItems, historyItems, isLoadingMore, loadMore, onDelete, scrollContainerRef }: HistoryViewProps): JSX.Element => {
    const { selectedItems, toggleSelection, toggleDaySelection, clearSelection } = useSelection();
    const { modal: deleteModal, openModal: openDeleteModal } = useConfirm();
    const { modal: blacklistModal, openModal: openBlacklistModal } = useConfirm();
    const addToast = useToastStore((state) => state.addToast);
    const addDomain = useBlacklistStore((state) => state.addDomain);

    const dailyGroups = useMemo(() => groupHistoryByDayAndHour(historyItems), [historyItems]);

    const selectedCountByDayKey = useMemo(() => {
      const counts = new Map<string, number>();
      for (const dayGroup of dailyGroups) {
        let count = 0;
        for (const item of dayGroup.items) {
          if (selectedItems.has(item.id)) {
            count++;
          }
        }
        if (count > 0) {
          counts.set(dayGroup.date.toISOString(), count);
        }
      }
      return counts;
    }, [dailyGroups, selectedItems]);

    const openDeleteConfirm = useCallback(
      (config: { count: number; title: string; typeText: string; onConfirm: () => Promise<void> }): void => {
        if (config.count === 0) {
          return;
        }
        openDeleteModal({
          confirmButtonClass: 'btn-danger-large',
          confirmText: `Delete ${config.count > 1 ? `${config.count} items` : 'Item'}`,
          message: (
            <>
              Are you sure you want to permanently delete <strong>{config.typeText}</strong>? This action cannot be undone.
            </>
          ),
          onConfirm: async () => {
            await config.onConfirm();
            addToast(`${config.count} item${config.count > 1 ? 's' : ''} deleted.`, 'success');
          },
          title: config.title,
        });
      },
      [openDeleteModal, addToast],
    );

    const handleOpenDeleteAllModal = useCallback(
      (items: readonly ChromeHistoryItem[], type: 'day' | 'hour'): void => {
        openDeleteConfirm({
          count: items.length,
          onConfirm: () => deleteHistoryItems(items.map((i) => i.id)),
          title: `Delete Entire ${type === 'day' ? 'Day' : 'Hour'}`,
          typeText: `all ${items.length} history items for this ${type}`,
        });
      },
      [deleteHistoryItems, openDeleteConfirm],
    );

    const handleOpenDeleteSelectedModal = useCallback((): void => {
      openDeleteConfirm({
        count: selectedItems.size,
        onConfirm: async () => {
          await deleteHistoryItems(Array.from(selectedItems));
          clearSelection();
        },
        title: 'Delete Selected Items',
        typeText: `the ${selectedItems.size} selected history items`,
      });
    }, [selectedItems, deleteHistoryItems, clearSelection, openDeleteConfirm]);

    const handleDeleteItemRequest = useCallback(
      (item: ChromeHistoryItem): void => {
        openDeleteConfirm({
          count: 1,
          onConfirm: () => onDelete(item.id),
          title: 'Delete History Item',
          typeText: item.title || item.url,
        });
      },
      [onDelete, openDeleteConfirm],
    );

    const handleBlacklistRequest = useCallback(
      (item: ChromeHistoryItem): void => {
        const hostname = getHostnameFromUrl(item.url);
        if (hostname) {
          openBlacklistModal({
            confirmButtonClass: 'btn-danger-large',
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

    // One observer for the sentinel: loadMore guards itself, but its identity changes on every history
    // update, so the callback is read through a ref instead of re-creating the observer.
    const loadMoreRef = useRef(loadMore);
    useEffect(() => {
      loadMoreRef.current = loadMore;
    }, [loadMore]);

    const observerRef = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback(
      (node: HTMLDivElement | null): void => {
        observerRef.current?.disconnect();
        observerRef.current = null;

        if (!node) {
          return;
        }

        const observer = new IntersectionObserver(
          (entries: IntersectionObserverEntry[]) => {
            if (entries[0].isIntersecting) {
              loadMoreRef.current();
            }
          },
          {
            root: scrollContainerRef.current,
            rootMargin: '0px 0px 500px 0px',
          },
        );
        observer.observe(node);
        observerRef.current = observer;
      },
      [scrollContainerRef],
    );

    if (dailyGroups.length === 0 && !isLoadingMore) {
      return (
        <div className="centered-view">
          <Icon name="Search" className="centered-view-icon" />
          <h2 className="txt-title-lg">No History Found</h2>
          <p className="txt-main">Your browsing history for the selected period is empty.</p>
        </div>
      );
    }

    return (
      <>
        <div className="main-content-padded">
          {dailyGroups.map((dayGroup) => {
            const dayKey = dayGroup.date.toISOString();
            const dayHeaderText = formatDayHeader(dayGroup.date);

            return (
              <section key={dayKey}>
                <div data-day-key={dayKey} className="sticky-header pt-3">
                  <HistoryItemHeader
                    dayHeaderText={dayHeaderText}
                    dayItems={dayGroup.items}
                    onDeleteAll={() => handleOpenDeleteAllModal(dayGroup.items, 'day')}
                    onDeleteSelected={handleOpenDeleteSelectedModal}
                    onToggleDaySelection={() => toggleDaySelection(dayGroup.items)}
                    selectedItemsCount={selectedCountByDayKey.get(dayKey) || 0}
                    totalSelectedCount={selectedItems.size}
                  />
                  <hr className="mx-2 mt-3 border-line" />
                </div>
                <div className="layout-stack-md mt-3">
                  {dayGroup.hourlyGroups.map((group) => (
                    <div key={group.time} data-day-key={dayKey} data-hour-key={group.time}>
                      <HistoryItemGroup
                        group={group}
                        onBlacklistRequest={handleBlacklistRequest}
                        onDeleteHourRequest={(items) => handleOpenDeleteAllModal(items, 'hour')}
                        onDeleteRequest={handleDeleteItemRequest}
                        onToggleSelection={toggleSelection}
                        selectedItems={selectedItems}
                      />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          <div ref={lastElementRef} className="h-1" />

          {isLoadingMore && (
            <div className="p-3">
              <HistoryViewGroupSkeleton />
            </div>
          )}
        </div>
        {deleteModal}
        {blacklistModal}
      </>
    );
  },
);
