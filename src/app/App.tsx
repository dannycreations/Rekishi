import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BlacklistView } from '../components/blacklist/BlacklistView';
import { DeviceView } from '../components/device/DeviceView';
import { ExportView } from '../components/export/ExportView';
import { HistoryView, HistoryViewSkeleton } from '../components/history/HistoryView';
import { Header } from '../components/main/Header';
import { SettingView } from '../components/setting/SettingView';
import { LogoIcon } from '../components/shared/Icons';
import { ScrollToTop } from '../components/shared/ScrollToTop';
import { ToastContainer } from '../components/shared/Toast';
import { ViewModal } from '../components/shared/ViewModal';
import { useHistory } from '../hooks/useHistory';
import { useHistoryDate } from '../hooks/useHistoryDate';
import { useHistoryStore } from '../stores/useHistoryStore';

import type { JSX } from 'react';
import type { ModalViewType } from './types';

const VIEW_TITLES: Record<ModalViewType, string> = {
  devices: 'Devices',
  blacklist: 'Blacklist',
  export: 'Export',
  settings: 'Settings',
};

const VIEW_MODAL_SIZES: Partial<Record<ModalViewType, 'md' | 'lg' | 'xl' | '2xl' | '3xl'>> = {
  devices: '3xl',
  blacklist: 'lg',
  export: 'md',
  settings: 'lg',
};

interface ModalContentProps {
  view: ModalViewType;
}

export const ModalContent = memo(({ view }: ModalContentProps): JSX.Element => {
  switch (view) {
    case 'devices':
      return <DeviceView />;
    case 'blacklist':
      return <BlacklistView />;
    case 'export':
      return <ExportView />;
    case 'settings':
      return <SettingView />;
  }
});

export const App = (): JSX.Element => {
  const [activeModal, setActiveModal] = useState<ModalViewType | null>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const mainContentRef = useRef<HTMLElement>(null);

  const { searchQuery, selectedDate, setSearchQuery, setSelectedDate } = useHistoryStore();
  const { deleteHistoryItem, deleteHistoryItems, error, hasMore, history, isLoading, isLoadingMore, loadMore } = useHistory();
  const { datesWithHistory, fetchDatesForMonth, isLoading: isLoadingDates } = useHistoryDate();

  useEffect(() => {
    mainContentRef.current?.scrollTo(0, 0);
  }, [searchQuery, selectedDate]);

  useEffect(() => {
    fetchDatesForMonth(selectedDate);
  }, [fetchDatesForMonth, selectedDate]);

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

  const noHistoryEver = history.length === 0 && datesWithHistory.size === 0 && !isLoading && !isLoadingDates;

  return (
    <div className="h-screen bg-slate-100 text-slate-900">
      <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col overflow-hidden rounded-lg bg-slate-50 shadow-xl sm:inset-6">
        <Header
          datesWithHistory={datesWithHistory}
          fetchDatesForMonth={fetchDatesForMonth}
          isLoadingDates={isLoadingDates}
          onOpenModal={setActiveModal}
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

        <main ref={mainContentRef} className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <HistoryViewSkeleton />
          ) : error ? (
            <div className="flex h-full items-center justify-center p-3 text-red-500">
              <p>Error loading history: {error}</p>
            </div>
          ) : noHistoryEver ? (
            <div className="flex h-full flex-col items-center justify-center p-3 text-center text-slate-500">
              <LogoIcon className="mb-4 h-16 w-16 text-slate-400" />
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
      <ToastContainer />
    </div>
  );
};
