import { memo, useCallback } from 'react';

import { useConfirm } from '../../hooks/useConfirm';
import { TrashIcon } from '../shared/Icons';
import { HistoryItem } from './HistoryItem';

import type { JSX } from 'react';
import type { HistoryItemGroup as HistoryItemGroupType } from '../../app/types';

interface HistoryGroupItemProps {
  deleteHistoryItems: (ids: string[]) => Promise<void>;
  group: HistoryItemGroupType;
  isSticky?: boolean;
  onDelete: (id: string) => Promise<void>;
  onToggleSelection: (id: string) => void;
  selectedItems: Set<string>;
}

export const HistoryGroupItem = memo(
  ({ deleteHistoryItems, group, onDelete, onToggleSelection, selectedItems, isSticky }: HistoryGroupItemProps): JSX.Element => {
    const { Modal: DeleteModal, openModal: openDeleteModal } = useConfirm();

    const handleConfirmDelete = useCallback(async () => {
      const idsToDelete = group.items.map((item) => item.id);
      await deleteHistoryItems(idsToDelete);
    }, [group.items, deleteHistoryItems]);

    const handleOpenDeleteModal = useCallback(() => {
      openDeleteModal({
        confirmButtonClass: 'bg-red-600 hover:bg-red-700',
        confirmText: `Delete ${group.items.length} items`,
        message: (
          <>
            Are you sure you want to permanently delete all <strong>{group.items.length}</strong> history items from this time block? This action
            cannot be undone.
          </>
        ),
        onConfirm: handleConfirmDelete,
        title: 'Delete History Items',
      });
    }, [openDeleteModal, group.items.length, handleConfirmDelete]);

    return (
      <>
        <section>
          <div
            className="mb-1 flex items-center justify-between px-2"
            style={{
              visibility: isSticky ? 'hidden' : 'visible',
              height: isSticky ? 0 : 'auto',
            }}
          >
            <h2 className="text-sm font-semibold text-slate-800">{group.time}</h2>
            <button
              className="flex cursor-pointer items-center rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
              onClick={handleOpenDeleteModal}
            >
              <TrashIcon className="mr-1 h-3 w-3" />
              Delete
            </button>
          </div>
          <div className="flex flex-col">
            {group.items.map((item) => (
              <HistoryItem
                key={item.id}
                isChecked={selectedItems.has(item.id)}
                item={item}
                onDelete={onDelete}
                onToggleSelection={onToggleSelection}
              />
            ))}
          </div>
        </section>
        <DeleteModal />
      </>
    );
  },
);
