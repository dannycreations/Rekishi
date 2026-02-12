import { memo, useCallback, useMemo, useRef } from 'react';

import { useConfirm } from '../../hooks/useConfirm';
import { useHistoryGroup } from '../../hooks/useHistoryGroup';
import { useSelection } from '../../hooks/useSelection';
import { useBlacklistStore } from '../../stores/useBlacklistStore';
import { useToastStore } from '../../stores/useToastStore';
import { getHostnameFromUrl } from '../../utilities/commonUtil';
import { formatDayHeader } from '../../utilities/dateUtil';
import { Icon } from '../shared/Icon';
import { HistoryItemGroup } from './HistoryItemGroup';
import { HistoryItemHeader } from './HistoryItemHeader';
import { HistoryViewGroupSkeleton } from './HistoryViewSkeleton';

import type { JSX, RefObject } from 'react';
import type { ChromeHistoryItem } from '../../app/types';

interface HistoryViewProps {
  readonly deleteHistoryItems: (ids: string[]) => Promise<void>;
  readonly hasMore: boolean;
  readonly historyItems: readonly ChromeHistoryItem[];
  readonly isLoadingMore: boolean;
  readonly loadMore: () => void;
  readonly onDelete: (id: string) => Promise<void>;
  readonly scrollContainerRef: RefObject<HTMLElement | null>;
}

export const HistoryView = memo(
  ({ deleteHistoryItems, hasMore, historyItems, isLoadingMore, loadMore, onDelete, scrollContainerRef }: HistoryViewProps): JSX.Element => {
    const { selectedItems, toggleSelection, toggleDaySelection, clearSelection } = useSelection();
    const { Modal: DeleteModal, openModal: openDeleteModal } = useConfirm();
    const { Modal: BlacklistModal, openModal: openBlacklistModal } = useConfirm();
    const addToast = useToastStore((state) => state.addToast);
    const { addDomain } = useBlacklistStore();

    const { dailyGroups, itemLocator } = useHistoryGroup(historyItems);

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

    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback(
      (node: HTMLDivElement | null): void => {
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
                    isHourHeader={false}
                    onDeleteAll={() => handleOpenDeleteAllModal(dayGroup.items, 'day')}
                    onDeleteSelected={handleOpenDeleteSelectedModal}
                    onToggleDaySelection={() => toggleDaySelection(dayGroup.items)}
                    selectedItemsCount={selectionCounts.byDay.get(dayKey) || 0}
                    totalSearchItemsCount={historyItems.length}
                    totalSelectedCount={selectedItems.size}
                  />
                  <hr className="mx-2 mt-3 border-line" />
                </div>
                <div className="layout-stack-md mt-3">
                  {dayGroup.hourlyGroups.map((group) => (
                    <div key={group.time} data-day-key={dayKey} data-hour-key={group.time}>
                      <HistoryItemGroup
                        group={{ ...group, items: group.items }}
                        isSticky={false}
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
        <DeleteModal />
        <BlacklistModal />
      </>
    );
  },
);
