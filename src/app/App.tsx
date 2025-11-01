import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BlacklistView } from '../components/blacklist/BlacklistView';
import { DeviceView } from '../components/device/DeviceView';
import { ExportView } from '../components/export/ExportView';
import { HistoryView, HistoryViewSkeleton } from '../components/history/HistoryView';
import { Header } from '../components/main/Header';
import { SettingView } from '../components/setting/SettingView';
import { LogoIcon } from '../components/shared/Icons';
import { ScrollToTop } from '../components/shared/ScrollToTop';
import { ViewModal } from '../components/shared/ViewModal';
import { useHistory } from '../hooks/useHistory';
import { useHistoryDate } from '../hooks/useHistoryDate';
import { useHistoryStore } from '../stores/useHistoryStore';

import type { JSX } from 'react';
import type { ViewType } from './types';

const VIEW_TITLES: Record<ViewType, string> = {
  activity: 'Activity',
  devices: 'Devices',
  blacklist: 'Blacklist',
  export: 'Export',
  settings: 'Settings',
};

const VIEW_MODAL_SIZES: Partial<Record<ViewType, 'md' | 'lg' | 'xl' | '2xl' | '3xl'>> = {
  devices: '3xl',
  blacklist: 'lg',
  export: 'md',
  settings: 'lg',
};

interface ModalContentProps {
  view: ViewType;
}

export const ModalContent = ({ view }: ModalContentProps): JSX.Element | null => {
  switch (view) {
    case 'devices':
      return <DeviceView />;
    case 'blacklist':
      return <BlacklistView />;
    case 'export':
      return <ExportView />;
    case 'settings':
      return <SettingView />;
    case 'activity':
    default:
      return null;
  }
};

export const App = (): JSX.Element => {
  const [activeModal, setActiveModal] = useState<ViewType | null>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const mainContentRef = useRef<HTMLElement>(null);

  const { searchQuery, selectedDate, setSearchQuery, setSelectedDate } = useHistoryStore();
  const { deleteHistoryItem, deleteHistoryItems, error, hasMore, history, isLoading, isLoadingMore, loadMore } = useHistory();
  const { datesWithHistory, isLoading: isLoadingDates } = useHistoryDate();

  useEffect(() => {
    mainContentRef.current?.scrollTo(0, 0);
  }, [searchQuery, selectedDate]);

  useEffect(() => {
    const mainContent = mainContentRef.current;
    if (!mainContent) {
      return;
    }

    const handleScroll = (): void => {
      setShowScrollToTop(mainContent.scrollTop > 300);
    };

    mainContent.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      mainContent.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleScrollToTop = useCallback(() => {
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const activityViewProps = useMemo(
    () => ({
      deleteHistoryItems,
      hasMore,
      historyItems: history,
      isLoadingMore,
      loadMore,
      onDelete: deleteHistoryItem,
    }),
    [history, deleteHistoryItem, deleteHistoryItems, loadMore, hasMore, isLoadingMore],
  );

  const noHistoryEver = history.length === 0 && datesWithHistory.size === 0;

  return (
    <div className="h-screen bg-slate-100 text-slate-900">
      <div className="absolute inset-0 flex flex-col max-w-6xl mx-auto overflow-hidden bg-slate-50 shadow-xl sm:inset-6 sm:rounded-lg">
        <Header
          datesWithHistory={datesWithHistory}
          isLoadingDates={isLoadingDates}
          onOpenModal={setActiveModal}
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

        <main ref={mainContentRef} className="flex-1 min-h-0 overflow-y-auto">
          {isLoading || isLoadingDates ? (
            <HistoryViewSkeleton />
          ) : error ? (
            <div className="flex items-center justify-center h-full p-3 text-red-500">
              <p>Error loading history: {error}</p>
            </div>
          ) : noHistoryEver ? (
            <div className="flex flex-col items-center justify-center h-full p-3 text-center text-slate-500">
              <LogoIcon className="w-16 h-16 mb-4 text-slate-400" />
              <h2 className="text-2xl font-bold text-slate-800">Welcome to Rekishi!</h2>
              <p className="mt-2">Start browsing the web to see your history here.</p>
            </div>
          ) : (
            <HistoryView {...activityViewProps} scrollContainerRef={mainContentRef} />
          )}
        </main>

        {activeModal && (
          <ViewModal isOpen={!!activeModal} onClose={handleCloseModal} size={VIEW_MODAL_SIZES[activeModal]} title={VIEW_TITLES[activeModal] ?? ''}>
            <ModalContent view={activeModal} />
          </ViewModal>
        )}
      </div>

      <ScrollToTop isVisible={showScrollToTop} onClick={handleScrollToTop} />
    </div>
  );
};
