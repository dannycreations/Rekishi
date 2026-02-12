import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { formatDateForInput } from '../../utilities/dateUtil';
import { CalendarPopover } from '../shared/CalendarPopover';
import { Icon } from '../shared/Icon';

import type { ChangeEvent, JSX, ReactNode } from 'react';
import type { ViewType } from '../../app/types';

interface NavButtonProps {
  readonly icon: ReactNode;
  readonly onClick: () => void;
}

const NavButton = memo(({ icon, onClick }: NavButtonProps): JSX.Element => {
  return (
    <button className="btn-nav" onClick={onClick}>
      {icon}
    </button>
  );
});

interface HeaderProps {
  readonly datesWithHistory: Set<string>;
  readonly fetchDatesForMonth: (date: Date) => void;
  readonly isLoadingDates: boolean;
  readonly onOpenModal: (view: ViewType) => void;
  readonly onSearch: (query: string) => void;
  readonly searchQuery: string;
  readonly selectedDate: Date;
  readonly setSelectedDate: (date: Date) => void;
}

export const Header = memo(
  ({
    onOpenModal,
    onSearch,
    searchQuery,
    selectedDate,
    setSelectedDate,
    datesWithHistory,
    isLoadingDates,
    fetchDatesForMonth,
  }: HeaderProps): JSX.Element => {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

    const calendarButtonRef = useRef<HTMLButtonElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchTimeout = useRef<number | null>(null);

    useEffect(() => {
      searchInputRef.current?.focus();
    }, []);

    useEffect(() => {
      setLocalSearchQuery(searchQuery);
    }, [searchQuery]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent): void => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
        if (e.key === '/') {
          const target = e.target as HTMLElement;
          if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
            e.preventDefault();
            searchInputRef.current?.focus();
          }
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, []);

    useEffect(() => {
      return () => {
        if (searchTimeout.current) {
          clearTimeout(searchTimeout.current);
        }
      };
    }, []);

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
      const newQuery = e.target.value;
      setLocalSearchQuery(newQuery);

      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      searchTimeout.current = window.setTimeout(() => {
        onSearch(newQuery);
      }, 300);
    };

    const handleClearSearch = (): void => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      setLocalSearchQuery('');
      onSearch('');
      searchInputRef.current?.focus();
    };

    const formattedDate = useMemo(() => formatDateForInput(selectedDate), [selectedDate]);

    const handleToggleCalendar = useCallback(() => {
      setIsCalendarOpen((o) => !o);
    }, []);

    const handleCloseCalendar = useCallback(() => {
      setIsCalendarOpen(false);
    }, []);

    const handleOpenBlacklist = useCallback(() => {
      onOpenModal('blacklist');
    }, [onOpenModal]);
    const handleOpenExport = useCallback(() => {
      onOpenModal('export');
    }, [onOpenModal]);
    const handleOpenSettings = useCallback(() => {
      onOpenModal('settings');
    }, [onOpenModal]);

    return (
      <header className="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line bg-surface p-3 md:flex-nowrap md:justify-center">
        <div className="logo-group">
          <Icon name="History" className="icon-lg text-text-primary" />
          <h1 className="logo-text">Rekishi</h1>
        </div>

        <div className="order-last flex w-full grow items-center gap-2 md:order-0 md:w-auto md:grow-0">
          <div className="search-container">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
              <Icon name="Search" className="icon-sm text-text-tertiary" />
            </div>
            <input
              ref={searchInputRef}
              className="input-search"
              onChange={handleSearchChange}
              placeholder="Search title or URL"
              type="text"
              value={localSearchQuery}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              {localSearchQuery && (
                <button className="btn-ghost" onClick={handleClearSearch}>
                  <Icon name="X" className="icon-sm" />
                </button>
              )}
            </div>
          </div>
          <div>
            <button ref={calendarButtonRef} className="btn-secondary flex items-center gap-2" onClick={handleToggleCalendar}>
              <span className="txt-main text-text-primary">{formattedDate}</span>
              <Icon name="Calendar" className="icon-sm text-text-tertiary" />
            </button>
          </div>
        </div>

        <div className="nav-group">
          <NavButton icon={<Icon name="Link2Off" className="icon-md" />} onClick={handleOpenBlacklist} />
          <NavButton icon={<Icon name="Download" className="icon-md" />} onClick={handleOpenExport} />
          <NavButton icon={<Icon name="Settings" className="icon-md" />} onClick={handleOpenSettings} />
        </div>

        <CalendarPopover
          anchorEl={isCalendarOpen ? calendarButtonRef.current : null}
          datesWithHistory={datesWithHistory}
          fetchDatesForMonth={fetchDatesForMonth}
          isLoading={isLoadingDates}
          onClose={handleCloseCalendar}
          onDateSelect={(date) => {
            setSelectedDate(date);
            setIsCalendarOpen(false);
          }}
          selectedDate={selectedDate}
        />
      </header>
    );
  },
);
