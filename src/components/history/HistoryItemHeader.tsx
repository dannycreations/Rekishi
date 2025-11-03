import { memo, useMemo } from 'react';

import { DeleteButton } from '../shared/DeleteButton';
import { CheckIcon } from '../shared/Icons';

import type { JSX } from 'react';
import type { ChromeHistoryItem } from '../../app/types';

interface HistoryItemHeaderProps {
  dayHeaderText: string;
  dayItems: readonly ChromeHistoryItem[];
  isHourHeader: boolean;
  isSearchMode?: boolean;
  onDeleteAll: () => void;
  onDeleteSearch?: () => void;
  onDeleteSelected: () => void;
  onToggleDaySelection: (items: readonly ChromeHistoryItem[]) => void;
  selectedItemsCount: number;
  totalSearchItemsCount?: number;
  totalSelectedCount: number;
}

export const HistoryItemHeader = memo(
  ({
    dayHeaderText,
    dayItems,
    isHourHeader,
    selectedItemsCount,
    onToggleDaySelection,
    onDeleteSelected,
    onDeleteAll,
    totalSelectedCount,
    isSearchMode,
    onDeleteSearch,
    totalSearchItemsCount,
  }: HistoryItemHeaderProps): JSX.Element => {
    const allForDaySelected = useMemo(() => selectedItemsCount === dayItems.length && dayItems.length > 0, [selectedItemsCount, dayItems.length]);
    const someForDaySelected = useMemo(() => selectedItemsCount > 0 && !allForDaySelected, [selectedItemsCount, allForDaySelected]);

    const buttonText = useMemo(() => {
      if (totalSelectedCount > 0) {
        return `Delete (${totalSelectedCount})`;
      }
      return isHourHeader ? 'Delete entire hour' : 'Delete entire day';
    }, [totalSelectedCount, isHourHeader]);

    const handleButtonClick = totalSelectedCount > 0 ? onDeleteSelected : onDeleteAll;

    return (
      <div className="mb-1 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="flex cursor-pointer select-none items-center justify-center" onClick={() => onToggleDaySelection(dayItems)}>
            <div
              className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                allForDaySelected || someForDaySelected ? 'border-slate-800 bg-slate-800' : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              {allForDaySelected && <CheckIcon className="h-2.5 w-2.5 text-white" />}
              {someForDaySelected && <div className="h-0.5 w-2 rounded-sm bg-white" />}
            </div>
          </div>
          <h2 className="text-lg font-bold text-slate-800">{dayHeaderText}</h2>
        </div>
        <div className="flex items-center space-x-2">
          {isSearchMode && onDeleteSearch && (
            <DeleteButton disabled={!totalSearchItemsCount || totalSearchItemsCount === 0} onClick={onDeleteSearch}>
              Delete entire search
            </DeleteButton>
          )}
          <DeleteButton disabled={totalSelectedCount === 0 && dayItems.length === 0} onClick={handleButtonClick}>
            {buttonText}
          </DeleteButton>
        </div>
      </div>
    );
  },
);
