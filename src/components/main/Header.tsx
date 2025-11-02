import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CalendarPopover } from '../shared/CalendarPopover';
import { BlacklistDomainIcon, CalendarIcon, CloseIcon, DevicesIcon, ExportIcon, LogoIcon, SearchIcon, SettingsIcon } from '../shared/Icons';

import type { ChangeEvent, JSX, ReactNode } from 'react';
import type { ViewType } from '../../app/types';

interface NavButtonProps {
  icon: ReactNode;
  onClick: () => void;
  title: string;
}

export const NavButton = memo(({ icon, onClick, title }: NavButtonProps): JSX.Element => {
  return (
    <button
      className="p-2 text-slate-500 transition-all duration-200 ease-in-out rounded-lg cursor-pointer hover:bg-slate-100 hover:text-slate-800 hover:scale-110 active:scale-95"
      onClick={onClick}
      title={title}
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

    const calendarContainerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchTimeout = useRef<number | null>(null);

    useEffect(() => {
      searchInputRef.current?.focus();
    }, []);

    useEffect(() => {
      setLocalSearchQuery(searchQuery);
    }, [searchQuery]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent): void => {
        if (calendarContainerRef.current && event.target instanceof Node && !calendarContainerRef.current.contains(event.target)) {
          setIsCalendarOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
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
      <header className="relative z-20 flex items-center justify-between md:justify-center shrink-0 p-3 bg-white border-b border-slate-200 gap-3 flex-wrap md:flex-nowrap">
        <div className="flex items-center space-x-2 md:absolute md:left-3 md:top-1/2 md:-translate-y-1/2">
          <LogoIcon className="w-6 h-6 text-slate-800" />
          <h1 className="text-xl font-bold text-slate-800">Rekishi</h1>
        </div>

        <div className="flex items-center grow w-full order-last gap-2 md:w-auto md:order-0 md:grow-0">
          <div className="relative grow max-w-lg">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <SearchIcon className="w-4 h-4 text-slate-400" />
            </div>
            <input
              ref={searchInputRef}
              className="w-full py-2 pl-8 pr-10 text-sm text-slate-900 bg-white border rounded-lg outline-none transition-colors border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
              onChange={handleSearchChange}
              placeholder="Search title or URL"
              type="text"
              value={localSearchQuery}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              {localSearchQuery && (
                <button
                  className="p-1 rounded-md transition-colors cursor-pointer text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                  onClick={handleClearSearch}
                  title="Clear search"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="relative" ref={calendarContainerRef}>
            <button
              className="flex items-center px-2 py-2 space-x-2 border rounded-lg transition-colors cursor-pointer border-slate-200 hover:bg-slate-100"
              onClick={handleToggleCalendar}
              title="Select date"
            >
              <span className="text-sm text-slate-800">{formattedDate}</span>
              <CalendarIcon className="w-4 h-4 text-slate-400" />
            </button>
            {isCalendarOpen && (
              <CalendarPopover
                datesWithHistory={datesWithHistory}
                fetchDatesForMonth={fetchDatesForMonth}
                isLoading={isLoadingDates}
                onDateSelect={(date) => {
                  setSelectedDate(date);
                  setIsCalendarOpen(false);
                }}
                selectedDate={selectedDate}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 md:absolute md:right-3 md:top-1/2 md:-translate-y-1/2">
          <NavButton icon={<DevicesIcon className="w-5 h-5" />} onClick={handleOpenDevices} title="Synced Devices" />
          <NavButton icon={<BlacklistDomainIcon className="w-5 h-5" />} onClick={handleOpenBlacklist} title="Manage Blacklist" />
          <NavButton icon={<ExportIcon className="w-5 h-5" />} onClick={handleOpenExport} title="Export History" />
          <NavButton icon={<SettingsIcon className="w-5 h-5" />} onClick={handleOpenSettings} title="Settings" />
        </div>
      </header>
    );
  },
);
