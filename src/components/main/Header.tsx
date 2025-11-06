import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CalendarPopover } from '../shared/CalendarPopover';
import { BlacklistDomainIcon, CalendarIcon, CloseIcon, DevicesIcon, ExportIcon, LogoIcon, SearchIcon, SettingsIcon } from '../shared/Icons';

import type { ChangeEvent, JSX, ReactNode } from 'react';
import type { ViewType } from '../../app/types';

interface NavButtonProps {
  icon: ReactNode;
  onClick: () => void;
}

const NavButton = memo(({ icon, onClick }: NavButtonProps): JSX.Element => {
  return (
    <button
      className="cursor-pointer rounded-lg p-2 text-slate-500 transition-all duration-200 ease-in-out hover:scale-110 hover:bg-slate-100 hover:text-slate-800 active:scale-95"
      onClick={onClick}
    >
      {icon}
    </button>
  );
});

interface HeaderProps {
  datesWithHistory: Set<string>;
  fetchDatesForMonth: (date: Date) => void;
  isLoadingDates: boolean;
  onOpenModal: (view: ViewType) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
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

    const formattedDate = useMemo(() => {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    }, [selectedDate]);

    const handleToggleCalendar = useCallback(() => {
      setIsCalendarOpen((o) => !o);
    }, []);

    const handleCloseCalendar = useCallback(() => {
      setIsCalendarOpen(false);
    }, []);

    const handleOpenDevices = useCallback(() => {
      onOpenModal('devices');
    }, [onOpenModal]);
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
      <header className="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white p-3 md:flex-nowrap md:justify-center">
        <div className="flex items-center space-x-2 md:absolute md:left-3 md:top-1/2 md:-translate-y-1/2">
          <LogoIcon className="h-6 w-6 text-slate-800" />
          <h1 className="text-xl font-bold text-slate-800">Rekishi</h1>
        </div>

        <div className="order-last flex w-full grow items-center gap-2 md:order-0 md:w-auto md:grow-0">
          <div className="relative max-w-lg grow">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
              <SearchIcon className="h-4 w-4 text-slate-400" />
            </div>
            <input
              ref={searchInputRef}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-7 pr-7 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-400"
              onChange={handleSearchChange}
              placeholder="Search title or URL"
              type="text"
              value={localSearchQuery}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              {localSearchQuery && (
                <button
                  className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
                  onClick={handleClearSearch}
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div>
            <button
              ref={calendarButtonRef}
              className="flex cursor-pointer items-center space-x-2 rounded-lg border border-slate-200 p-2 transition-colors hover:bg-slate-100"
              onClick={handleToggleCalendar}
            >
              <span className="text-sm text-slate-800">{formattedDate}</span>
              <CalendarIcon className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 md:absolute md:right-3 md:top-1/2 md:-translate-y-1/2">
          <NavButton icon={<DevicesIcon className="h-5 w-5" />} onClick={handleOpenDevices} />
          <NavButton icon={<BlacklistDomainIcon className="h-5 w-5" />} onClick={handleOpenBlacklist} />
          <NavButton icon={<ExportIcon className="h-5 w-5" />} onClick={handleOpenExport} />
          <NavButton icon={<SettingsIcon className="h-5 w-5" />} onClick={handleOpenSettings} />
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
