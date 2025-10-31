import { memo, useCallback, useMemo, useState } from 'react';

import { isSameDay } from '../utilities/date';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { Skeleton } from './Skeleton';

import type { JSX } from 'react';

interface CalendarPopoverProps {
  datesWithHistory: Set<string>;
  isLoading: boolean;
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function CalendarSkeletonFn() {
  return (
    <div className="absolute right-0 z-10 p-2 mt-2 bg-white border rounded-lg shadow-lg top-full w-72 border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="w-32 h-5 rounded" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
      <div className="grid grid-cols-7 text-center gap-y-1">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="text-xs font-medium text-slate-500">
            {day}
          </div>
        ))}
        {Array.from({ length: 35 }).map((_, index) => (
          <div key={`skeleton-day-${index}`} className="flex items-center justify-center py-1">
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
const CalendarSkeleton = memo(CalendarSkeletonFn);

function CalendarPopoverFn({ selectedDate, onDateSelect, datesWithHistory, isLoading }: CalendarPopoverProps): JSX.Element {
  const [displayDate, setDisplayDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const monthName = useMemo(() => displayDate.toLocaleString('default', { month: 'long', year: 'numeric' }), [displayDate]);

  const calendarGrid = useMemo(() => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = Array.from({ length: firstDayOfMonth }, () => null);

    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      dayDate.setHours(0, 0, 0, 0);
      days.push(dayDate);
    }

    return days;
  }, [displayDate]);

  const handlePrevMonth = useCallback(() => {
    setDisplayDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setDisplayDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="absolute right-0 z-10 p-2 mt-2 bg-white border rounded-lg shadow-lg top-full w-72 border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <button className="p-2 transition-colors rounded-full hover:bg-slate-100" onClick={handlePrevMonth}>
          <ChevronLeftIcon className="w-5 h-5 text-slate-500" />
        </button>
        <span className="text-sm font-semibold text-slate-700">{monthName}</span>
        <button className="p-2 transition-colors rounded-full hover:bg-slate-100" onClick={handleNextMonth}>
          <ChevronRightIcon className="w-5 h-5 text-slate-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center gap-y-1">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="text-xs font-medium text-slate-500">
            {day}
          </div>
        ))}
        {calendarGrid.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} />;
          }

          const dateString = date.toISOString().split('T')[0];
          const hasHistory = datesWithHistory.has(dateString);
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);

          return (
            <div key={date.toISOString()} className="flex items-center justify-center py-1">
              <button
                disabled={!hasHistory}
                className={`
                    w-8 h-8 rounded-full text-sm transition-colors
                    ${
                      isSelected
                        ? 'bg-slate-800 text-white font-semibold hover:bg-slate-700'
                        : hasHistory
                          ? 'text-slate-600 hover:bg-slate-100'
                          : 'text-slate-300 cursor-not-allowed'
                    }
                    ${!isSelected && isToday && hasHistory ? 'ring-1 ring-slate-400' : ''}
                  `}
                onClick={() => onDateSelect(date)}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const CalendarPopover = memo(CalendarPopoverFn);
