import { memo, useCallback } from 'react';

import { DeleteButton } from '../shared/DeleteButton';
import { HistoryItem } from './HistoryItem';

import type { JSX } from 'react';
import type { ChromeHistoryItem, HistoryItemGroup as HistoryItemGroupType } from '../../app/types';

interface HistoryItemGroupProps {
  readonly group: HistoryItemGroupType;
  readonly isSticky?: boolean;
  readonly onBlacklistRequest: (item: ChromeHistoryItem) => void;
  readonly onDeleteRequest: (item: ChromeHistoryItem) => void;
  readonly onDeleteHourRequest: (items: readonly ChromeHistoryItem[]) => void;
  readonly onToggleSelection: (id: string) => void;
  readonly selectedItems: ReadonlySet<string>;
}

export const HistoryItemGroup = memo(
  ({ group, onBlacklistRequest, onDeleteRequest, onDeleteHourRequest, onToggleSelection, selectedItems }: HistoryItemGroupProps): JSX.Element => {
    const handleOpenDeleteModal = useCallback((): void => {
      onDeleteHourRequest(group.items);
    }, [group.items, onDeleteHourRequest]);

    return (
      <section>
        <div className="section-header">
          <h2 className="section-title-sm">{group.time}</h2>
          <DeleteButton onClick={handleOpenDeleteModal}>Delete</DeleteButton>
        </div>
        <div className="layout-stack-sm">
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
