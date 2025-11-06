import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { DAYS_OF_WEEK } from '../../app/constants';
import { usePopover } from '../../hooks/usePopover';
import { isSameDay } from '../../utilities/dateUtil';
import { CalendarSkeleton } from './CalendarSkeleton';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

import type { ReactPortal } from 'react';

interface CalendarPopoverProps {
  readonly anchorEl: HTMLElement | null;
  readonly datesWithHistory: Set<string>;
  readonly fetchDatesForMonth: (date: Date) => void;
  readonly isLoading: boolean;
  readonly maxDate?: Date;
  readonly minDate?: Date;
  readonly onClose: () => void;
  readonly onDateSelect: (date: Date) => void;
  readonly selectedDate: Date;
}

export const CalendarPopover = memo(
  ({
    selectedDate,
    onDateSelect,
    datesWithHistory,
    isLoading,
    fetchDatesForMonth,
    anchorEl,
    onClose,
    minDate,
    maxDate,
  }: CalendarPopoverProps): ReactPortal | null => {
    const [displayDate, setDisplayDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    const { popoverRef, style } = usePopover(anchorEl);

    useEffect(() => {
      if (anchorEl) {
        fetchDatesForMonth(displayDate);
      } else {
        const newDisplayDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        if (displayDate.getTime() !== newDisplayDate.getTime()) {
          setDisplayDate(newDisplayDate);
        }
      }
    }, [displayDate, fetchDatesForMonth, anchorEl, selectedDate]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent): void => {
        if (anchorEl && popoverRef.current && !popoverRef.current.contains(event.target as Node) && !anchorEl.contains(event.target as Node)) {
          onClose();
        }
      };
      if (anchorEl) {
        document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [onClose, anchorEl, popoverRef]);

    const today = useMemo((): Date => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    }, []);

    const monthName = useMemo((): string => {
      return displayDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }, [displayDate]);

    const calendarGrid = useMemo((): readonly (Date | null)[] => {
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

    const handlePrevMonth = useCallback((): void => {
      setDisplayDate((d) => {
        return new Date(d.getFullYear(), d.getMonth() - 1, 1);
      });
    }, []);

    const handleNextMonth = useCallback((): void => {
      setDisplayDate((d) => {
        return new Date(d.getFullYear(), d.getMonth() + 1, 1);
      });
    }, []);

    const handleGoToToday = useCallback((): void => {
      onDateSelect(new Date());
    }, [onDateSelect]);

    const isCurrentMonth = useMemo(
      (): boolean => displayDate.getFullYear() === today.getFullYear() && displayDate.getMonth() === today.getMonth(),
      [displayDate, today],
    );

    if (!anchorEl) {
      return null;
    }

    const popoverElement = (
      <div
        ref={popoverRef}
        style={style}
        className="fixed z-[101] w-72 origin-top-right rounded-lg border border-slate-200 bg-white p-3 shadow-lg popover-animate-enter"
      >
        {isLoading && datesWithHistory.size === 0 ? (
          <CalendarSkeleton />
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between">
              <button className="cursor-pointer rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100" onClick={handlePrevMonth}>
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">{monthName}</span>
                <button
                  className="cursor-pointer rounded-md bg-slate-100 p-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                  onClick={handleGoToToday}
                >
                  Today
                </button>
              </div>
              <button
                className="cursor-pointer rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                disabled={isCurrentMonth}
                onClick={handleNextMonth}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="text-xs font-medium text-slate-500">
                  {day}
                </div>
              ))}
              {calendarGrid.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} />;
                }

                const isFuture = date > today;
                const isBeforeMin = minDate && date < new Date(new Date(minDate).setHours(0, 0, 0, 0));
                const isAfterMax = maxDate && date > new Date(new Date(maxDate).setHours(0, 0, 0, 0));

                if (isFuture || isBeforeMin || isAfterMax) {
                  return (
                    <div key={date.toISOString()} className="flex items-center justify-center py-1">
                      <button disabled className="h-8 w-8 cursor-not-allowed rounded-full text-sm text-slate-300">
                        {date.getDate()}
                      </button>
                    </div>
                  );
                }

                const dateString = date.toISOString().split('T')[0];
                const hasHistory = datesWithHistory.has(dateString);
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, today);

                return (
                  <div key={date.toISOString()} className="flex items-center justify-center py-1">
                    <button
                      disabled={!hasHistory}
                      className={`h-8 w-8 cursor-pointer rounded-full text-sm transition-colors ${
                        isSelected
                          ? 'bg-slate-800 font-semibold text-white hover:bg-slate-700'
                          : hasHistory
                            ? 'text-slate-600 hover:bg-slate-100'
                            : 'cursor-not-allowed text-slate-300'
                      } ${!isSelected && isToday && hasHistory ? 'ring-1 ring-slate-400' : ''}`}
                      onClick={() => onDateSelect(date)}
                    >
                      {date.getDate()}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );

    return createPortal(popoverElement, document.body);
  },
);
