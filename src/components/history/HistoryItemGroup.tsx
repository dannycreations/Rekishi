import { memo, useCallback } from 'react';

import { DeleteButton } from '../shared/DeleteButton';
import { HistoryItem } from './HistoryItem';

import type { JSX } from 'react';
import type { ChromeHistoryItem, HistoryItemGroup as HistoryItemGroupType } from '../../app/types';

interface HistoryItemGroupProps {
  group: HistoryItemGroupType;
  isSticky?: boolean;
  onBlacklistRequest: (item: ChromeHistoryItem) => void;
  onDeleteRequest: (item: ChromeHistoryItem) => void;
  onDeleteHourRequest: (items: readonly ChromeHistoryItem[]) => void;
  onToggleSelection: (id: string) => void;
  selectedItems: Set<string>;
}

export const HistoryItemGroup = memo(
  ({
    group,
    isSticky,
    onBlacklistRequest,
    onDeleteRequest,
    onDeleteHourRequest,
    onToggleSelection,
    selectedItems,
  }: HistoryItemGroupProps): JSX.Element => {
    const handleOpenDeleteModal = useCallback(() => {
      onDeleteHourRequest(group.items);
    }, [group.items, onDeleteHourRequest]);

    return (
      <section>
        <div
          className="mb-2 flex items-center justify-between px-2"
          style={{
            visibility: isSticky ? 'hidden' : 'visible',
            height: isSticky ? 0 : 'auto',
          }}
        >
          <h2 className="text-sm font-semibold text-slate-800">{group.time}</h2>
          <DeleteButton onClick={handleOpenDeleteModal}>Delete</DeleteButton>
        </div>
        <div className="flex flex-col space-y-1">
          {group.items.map((item) => (
            <HistoryItem
              key={item.id}
              isChecked={selectedItems.has(item.id)}
              item={item}
              onBlacklistRequest={onBlacklistRequest}
              onDeleteRequest={onDeleteRequest}
              onToggleSelection={onToggleSelection}
            />
          ))}
        </div>
      </section>
    );
  },
);
