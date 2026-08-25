import { cn } from 'cnfast';
import { memo, useMemo } from 'react';

import { DeleteButton } from '../shared/DeleteButton';
import { Icon } from '../shared/Icon';

import type { JSX } from 'react';
import type { ChromeHistoryItem } from '../../app/types';

interface HistoryItemHeaderProps {
  readonly dayHeaderText: string;
  readonly dayItems: readonly ChromeHistoryItem[];
  readonly onDeleteAll: () => void;
  readonly onDeleteSelected: () => void;
  readonly onToggleDaySelection: () => void;
  readonly selectedItemsCount: number;
  readonly totalSelectedCount: number;
}

export const HistoryItemHeader = memo(
  ({
    dayHeaderText,
    dayItems,
    selectedItemsCount,
    onToggleDaySelection,
    onDeleteSelected,
    onDeleteAll,
    totalSelectedCount,
  }: HistoryItemHeaderProps): JSX.Element => {
    const allForDaySelected = useMemo(() => selectedItemsCount === dayItems.length && dayItems.length > 0, [selectedItemsCount, dayItems.length]);
    const someForDaySelected = useMemo(() => selectedItemsCount > 0 && !allForDaySelected, [selectedItemsCount, allForDaySelected]);

    const buttonText = totalSelectedCount > 0 ? `Delete (${totalSelectedCount})` : 'Delete entire day';
    const handleButtonClick = totalSelectedCount > 0 ? onDeleteSelected : onDeleteAll;

    return (
      <div className="section-header">
        <div className="flex items-center gap-2">
          <div className="cursor-pointer group/header" onClick={onToggleDaySelection}>
            <div className={cn('checkbox-custom', (allForDaySelected || someForDaySelected) && 'checkbox-checked')}>
              {allForDaySelected && <Icon name="Check" className="icon-xs text-primary" />}
              {someForDaySelected && <div className="h-0.5 w-2 rounded-sm bg-primary" />}
            </div>
          </div>
          <h2 className="section-title-lg">{dayHeaderText}</h2>
        </div>
        <div className="flex items-center gap-2">
          <DeleteButton disabled={totalSelectedCount === 0 && dayItems.length === 0} onClick={handleButtonClick}>
            {buttonText}
          </DeleteButton>
        </div>
      </div>
    );
  },
);
