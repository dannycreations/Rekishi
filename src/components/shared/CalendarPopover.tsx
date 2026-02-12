import { clsx } from 'clsx';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { DAYS_OF_WEEK } from '../../app/constants';
import { usePopover } from '../../hooks/usePopover';
import { isSameDay } from '../../utilities/dateUtil';
import { CalendarSkeleton } from './CalendarSkeleton';
import { Icon } from './Icon';

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
      <div ref={popoverRef} style={style} className="popover-container popover-animate-enter">
        {isLoading && datesWithHistory.size === 0 ? (
          <CalendarSkeleton />
        ) : (
          <>
            <div className="section-header">
              <button className="btn-ghost" onClick={handlePrevMonth}>
                <Icon name="ChevronLeft" className="icon-md" />
              </button>
              <div className="flex items-center gap-2">
                <span className="txt-title-sm">{monthName}</span>
                <button className="btn-secondary btn-nav-today" onClick={handleGoToToday}>
                  Today
                </button>
              </div>
              <button className="btn-ghost" disabled={isCurrentMonth} onClick={handleNextMonth}>
                <Icon name="ChevronRight" className="icon-md" />
              </button>
            </div>
            <div className="grid-calendar">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="txt-label">
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
                      <button
                        disabled
                        className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full text-sm leading-none text-text-tertiary/50"
                      >
                        <span className="translate-y-[0.5px]">{date.getDate()}</span>
                      </button>
                    </div>
                  );
                }

                const dateString = date.toISOString().split('T')[0];
                const hasHistory = datesWithHistory.has(dateString);
                const isSelected = isSameDay(date, selectedDate);
                const isToday = isSameDay(date, today);

                return (
                  <div key={date.toISOString()} className="layout-flex-center py-1">
                    <button
                      disabled={!hasHistory}
                      className={clsx(
                        'flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-sm leading-none transition-colors',
                        isSelected
                          ? 'border border-line bg-background-soft font-semibold text-primary hover:opacity-90'
                          : hasHistory
                            ? 'text-text-secondary hover:bg-surface-hover'
                            : 'cursor-not-allowed text-text-tertiary/50',
                        !isSelected && isToday && hasHistory && 'border border-line',
                      )}
                      onClick={() => onDateSelect(date)}
                    >
                      <span className="translate-y-[0.5px]">{date.getDate()}</span>
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
