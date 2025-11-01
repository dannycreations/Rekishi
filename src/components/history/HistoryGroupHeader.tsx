import { memo, useMemo } from 'react';

import { CheckIcon, TrashIcon } from '../shared/Icons';

import type { JSX } from 'react';
import type { ChromeHistoryItem } from '../../app/types';

interface HistoryGroupHeaderProps {
  dayHeaderText: string;
  dayItems: ChromeHistoryItem[];
  isHourHeader: boolean;
  onDeleteAll: () => void;
  onDeleteSelected: () => void;
  onToggleDaySelection: (items: ChromeHistoryItem[]) => void;
  selectedItemsCount: number;
  totalSelectedCount: number;
}

export const HistoryGroupHeader = memo(
  ({
    dayHeaderText,
    dayItems,
    isHourHeader,
    selectedItemsCount,
    onToggleDaySelection,
    onDeleteSelected,
    onDeleteAll,
    totalSelectedCount,
  }: HistoryGroupHeaderProps): JSX.Element => {
    const allForDaySelected = useMemo(() => selectedItemsCount === dayItems.length && dayItems.length > 0, [selectedItemsCount, dayItems.length]);
    const someForDaySelected = useMemo(() => selectedItemsCount > 0 && !allForDaySelected, [selectedItemsCount, allForDaySelected]);

    const buttonText = useMemo(() => {
      if (totalSelectedCount > 0) {
        return `Delete (${totalSelectedCount})`;
      }
      return isHourHeader ? 'Delete entire hour' : 'Delete entire day';
    }, [totalSelectedCount, isHourHeader]);

    const buttonTooltip = useMemo(() => {
      if (totalSelectedCount > 0) {
        return `Delete ${totalSelectedCount} selected item(s)`;
      }
      return isHourHeader ? 'Delete all items in this hour' : 'Delete all items in this day';
    }, [totalSelectedCount, isHourHeader]);

    const handleButtonClick = totalSelectedCount > 0 ? onDeleteSelected : onDeleteAll;

    return (
      <div className="flex items-center justify-between px-2 mb-1">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center cursor-pointer select-none"
            onClick={() => onToggleDaySelection(dayItems)}
            title={allForDaySelected ? 'Deselect all' : 'Select all'}
          >
            <div
              className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
                allForDaySelected || someForDaySelected ? 'border-slate-800 bg-slate-800' : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              {allForDaySelected && <CheckIcon className="w-2.5 h-2.5 text-white" />}
              {someForDaySelected && <div className="w-2 h-0.5 bg-white rounded-sm" />}
            </div>
          </div>
          <h2 className="text-lg font-bold text-slate-800">{dayHeaderText}</h2>
        </div>
        <button
          className="flex items-center px-2 py-1 text-xs font-medium text-red-600 transition-colors bg-red-50 border border-red-200 rounded-md cursor-pointer hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={totalSelectedCount === 0 && dayItems.length === 0}
          onClick={handleButtonClick}
          title={buttonTooltip}
        >
          <TrashIcon className="w-3 h-3 mr-1" />
          {buttonText}
        </button>
      </div>
    );
  },
);
