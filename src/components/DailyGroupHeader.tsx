import { memo, useCallback, useEffect, useMemo, useRef } from 'react';

import { CheckIcon, TrashIcon } from './Icons';

import type { JSX } from 'react';
import type { ChromeHistoryItem } from '../app/types';

interface DailyGroupHeaderProps {
  dayHeaderText: string;
  dayItems: ChromeHistoryItem[];
  onDeleteSelected: () => void;
  onToggleDaySelection: (items: ChromeHistoryItem[]) => void;
  selectedItemsCount: number;
  totalSelectedCount: number;
}

function DailyGroupHeaderFn({
  dayHeaderText,
  dayItems,
  selectedItemsCount,
  onToggleDaySelection,
  onDeleteSelected,
  totalSelectedCount,
}: DailyGroupHeaderProps): JSX.Element {
  const checkboxRef = useRef<HTMLInputElement>(null);

  const allForDaySelected = useMemo(() => selectedItemsCount === dayItems.length && dayItems.length > 0, [selectedItemsCount, dayItems.length]);
  const someForDaySelected = useMemo(() => selectedItemsCount > 0 && !allForDaySelected, [selectedItemsCount, allForDaySelected]);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = someForDaySelected;
    }
  }, [someForDaySelected]);

  const handleToggle = useCallback(() => {
    onToggleDaySelection(dayItems);
  }, [onToggleDaySelection, dayItems]);

  return (
    <div className="flex items-center justify-between px-2 mb-3">
      <div className="flex items-center gap-2">
        <label className="flex items-center justify-center cursor-pointer" htmlFor={`select-day-${dayHeaderText.replace(/\s/g, '-')}`}>
          <input
            ref={checkboxRef}
            type="checkbox"
            id={`select-day-${dayHeaderText.replace(/\s/g, '-')}`}
            checked={allForDaySelected}
            onChange={handleToggle}
            className="sr-only"
          />
          <div
            className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
              allForDaySelected || someForDaySelected ? 'border-slate-800 bg-slate-800' : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            {allForDaySelected && <CheckIcon className="w-2.5 h-2.5 text-white" />}
            {someForDaySelected && <div className="w-2 h-0.5 bg-white rounded-sm" />}
          </div>
        </label>
        <h2 className="text-lg font-bold text-slate-800">{dayHeaderText}</h2>
      </div>
      <button
        className={`flex items-center px-2 py-1 text-xs font-medium text-red-600 transition-colors bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:pointer-events-none ${
          totalSelectedCount > 0 ? 'visible' : 'invisible'
        }`}
        disabled={totalSelectedCount === 0}
        onClick={onDeleteSelected}
      >
        <TrashIcon className="w-3 h-3 mr-1" />
        Delete ({totalSelectedCount})
      </button>
    </div>
  );
}

export const DailyGroupHeader = memo(DailyGroupHeaderFn);
