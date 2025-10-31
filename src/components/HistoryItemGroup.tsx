import { memo, useCallback, useState } from 'react';

import { ConfirmationModal } from './ConfirmationModal';
import { HistoryItem } from './HistoryItem';
import { TrashIcon } from './Icons';

import type { JSX } from 'react';
import type { HistoryItemGroup as HistoryItemGroupType } from '../app/types';

interface HistoryItemGroupProps {
  deleteHistoryItems: (ids: string[]) => void;
  group: HistoryItemGroupType;
  onDelete: (id: string) => void;
  onToggleSelection: (id: string) => void;
  selectedItems: Set<string>;
}

function HistoryItemGroupFn({ deleteHistoryItems, group, onDelete, onToggleSelection, selectedItems }: HistoryItemGroupProps): JSX.Element {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleOpenDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    const idsToDelete = group.items.map((item) => item.id);
    deleteHistoryItems(idsToDelete);
    setIsDeleteModalOpen(false);
  }, [group.items, deleteHistoryItems]);

  return (
    <>
      <section aria-labelledby={`group-header-${group.time.replace(/[^a-zA-Z0-9]/g, '')}`}>
        <div className="flex items-center justify-between mb-1">
          <h2 id={`group-header-${group.time.replace(/[^a-zA-Z0-9]/g, '')}`} className="text-sm font-semibold text-slate-800">
            {group.time}
          </h2>
          <button
            className="flex items-center px-2 py-1 text-xs font-medium text-red-600 transition-colors bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
            onClick={handleOpenDeleteModal}
            aria-label={`Delete all items from ${group.time}`}
          >
            <TrashIcon className="w-3 h-3 mr-1" />
            Delete
          </button>
        </div>
        <div className="flex flex-col">
          {group.items.map((item) => (
            <HistoryItem key={item.id} isChecked={selectedItems.has(item.id)} item={item} onDelete={onDelete} onToggleSelection={onToggleSelection} />
          ))}
        </div>
      </section>
      <ConfirmationModal
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        confirmText={`Delete ${group.items.length} items`}
        isOpen={isDeleteModalOpen}
        message={
          <>
            Are you sure you want to permanently delete all <strong>{group.items.length}</strong> history items from this time block? This action
            cannot be undone.
          </>
        }
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete History Items"
      />
    </>
  );
}

export const HistoryItemGroup = memo(HistoryItemGroupFn);
