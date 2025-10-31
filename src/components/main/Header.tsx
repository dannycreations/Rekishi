import { memo, useEffect, useMemo, useRef, useState } from 'react';

import { CalendarPopover } from '../shared/CalendarPopover';
import {
  BlacklistDomainIcon,
  CalendarIcon,
  CloseIcon,
  DevicesIcon,
  ExportIcon,
  LogoIcon,
  RegexIcon,
  SearchIcon,
  SettingsIcon,
} from '../shared/Icons';

import type { ChangeEvent, JSX, ReactNode, SetStateAction } from 'react';
import type { ViewType } from '../../app/types';

interface NavButtonProps {
  icon: ReactNode;
  onClick: () => void;
}

const NavButton = memo(({ icon, onClick }: NavButtonProps): JSX.Element => {
  return (
    <button className="p-2 text-slate-500 transition-colors rounded-lg hover:bg-slate-100 hover:text-slate-800" onClick={onClick}>
      {icon}
    </button>
  );
});

NavButton.displayName = 'NavButton';

interface HeaderProps {
  datesWithHistory: Set<string>;
  isLoadingDates: boolean;
  isRegex: boolean;
  onOpenModal: (view: ViewType) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  selectedDate: Date;
  setIsRegex: (value: SetStateAction<boolean>) => void;
  setSelectedDate: (date: Date) => void;
}

export const Header = memo(
  ({
    isRegex,
    onOpenModal,
    onSearch,
    searchQuery,
    selectedDate,
    setIsRegex,
    setSelectedDate,
    datesWithHistory,
    isLoadingDates,
  }: HeaderProps): JSX.Element => {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

    const calendarContainerRef = useRef<HTMLDivElement>(null);
    const searchTimeout = useRef<number | null>(null);

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
    };

    const formattedDate = useMemo(() => {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    }, [selectedDate]);

    return (
      <header className="relative z-20 flex items-center justify-between md:justify-center flex-shrink-0 p-3 bg-white border-b border-slate-200 gap-3 flex-wrap md:flex-nowrap">
        <div className="flex items-center space-x-2 md:absolute md:left-3 md:top-1/2 md:-translate-y-1/2">
          <LogoIcon className="w-6 h-6 text-slate-800" />
          <h1 className="text-xl font-bold text-slate-800">Rekishi</h1>
        </div>

        <div className="flex items-center flex-grow w-full order-last gap-2 md:w-auto md:order-none md:flex-grow-0">
          <div className="relative flex-grow max-w-lg">
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <SearchIcon className="w-4 h-4 text-slate-400" />
            </div>
            <input
              className="w-full py-2 pl-8 pr-12 text-sm text-slate-900 bg-white border rounded-lg outline-none transition-colors border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
              onChange={handleSearchChange}
              placeholder={isRegex ? 'Search with Regex' : 'Search with Regex'}
              type="text"
              value={localSearchQuery}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              {localSearchQuery ? (
                <button
                  className="p-1 rounded-md transition-colors text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                  onClick={handleClearSearch}
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              ) : (
                <button
                  className={`p-1 rounded-md transition-colors ${
                    isRegex ? 'bg-slate-800 text-white hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                  }`}
                  onClick={() => setIsRegex((prev) => !prev)}
                >
                  <RegexIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="relative" ref={calendarContainerRef}>
            <button
              className="flex items-center px-2 py-2 space-x-2 border rounded-lg transition-colors border-slate-200 hover:bg-slate-100"
              onClick={() => setIsCalendarOpen((o) => !o)}
            >
              <span className="text-sm text-slate-800">{formattedDate}</span>
              <CalendarIcon className="w-4 h-4 text-slate-400" />
            </button>
            {isCalendarOpen && (
              <CalendarPopover
                datesWithHistory={datesWithHistory}
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
          <NavButton icon={<DevicesIcon className="w-5 h-5" />} onClick={() => onOpenModal('devices')} />
          <NavButton icon={<BlacklistDomainIcon className="w-5 h-5" />} onClick={() => onOpenModal('blacklist')} />
          <NavButton icon={<ExportIcon className="w-5 h-5" />} onClick={() => onOpenModal('export')} />
          <NavButton icon={<SettingsIcon className="w-5 h-5" />} onClick={() => onOpenModal('settings')} />
        </div>
      </header>
    );
  },
);

Header.displayName = 'Header';
