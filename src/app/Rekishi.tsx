import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BlacklistView } from '../components/blacklist/BlacklistView';
import { DeviceView } from '../components/device/DeviceView';
import { ExportView } from '../components/export/ExportView';
import { HistoryView } from '../components/history/HistoryView';
import { HistoryViewSkeleton } from '../components/history/HistoryViewSkeleton';
import { Header } from '../components/main/Header';
import { SettingView } from '../components/setting/SettingView';
import { LogoIcon } from '../components/shared/Icons';
import { ScrollToTop } from '../components/shared/ScrollToTop';
import { ToastContainer } from '../components/shared/Toast';
import { ViewModal } from '../components/shared/ViewModal';
import { useHistory } from '../hooks/useHistory';
import { useHistoryDate } from '../hooks/useHistoryDate';
import { useHistoryStore } from '../stores/useHistoryStore';
import { VIEW_MODAL_SIZES, VIEW_TITLES } from './constants';

import type { JSX } from 'react';
import type { ModalViewType } from './types';

export const Rekishi = (): JSX.Element => {
  const [activeModal, setActiveModal] = useState<ModalViewType | null>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const mainContentRef = useRef<HTMLElement>(null);

  const { searchQuery, selectedDate, setSearchQuery, setSelectedDate } = useHistoryStore((state) => ({
    searchQuery: state.searchQuery,
    selectedDate: state.selectedDate,
    setSearchQuery: state.setSearchQuery,
    setSelectedDate: state.setSelectedDate,
  }));
  const { deleteHistoryItem, deleteHistoryItems, error, hasMore, history, isLoading, isLoadingMore, loadMore } = useHistory();
  const { datesWithHistory, fetchDatesForMonth, isLoading: isLoadingDates } = useHistoryDate();

  useEffect(() => {
    mainContentRef.current?.scrollTo(0, 0);
  }, [searchQuery, selectedDate]);

  useEffect(() => {
    fetchDatesForMonth(selectedDate);
  }, [fetchDatesForMonth, selectedDate]);

  const handleScroll = useCallback(() => {
    if (mainContentRef.current) {
      setShowScrollToTop(mainContentRef.current.scrollTop > 300);
    }
  }, []);

  useEffect(() => {
    const mainContent = mainContentRef.current;
    if (!mainContent) {
      return;
    }

    mainContent.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      mainContent.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  const handleScrollToTop = useCallback(() => {
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const noHistoryEver = useMemo(
    () => history.length === 0 && datesWithHistory.size === 0 && !isLoading && !isLoadingDates,
    [history, datesWithHistory, isLoading, isLoadingDates],
  );

  return (
    <div className="h-screen bg-slate-100 font-sans text-slate-900">
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
            <HistoryView
              deleteHistoryItems={deleteHistoryItems}
              hasMore={hasMore}
              historyItems={history}
              isLoadingMore={isLoadingMore}
              loadMore={loadMore}
              onDelete={deleteHistoryItem}
              scrollContainerRef={mainContentRef}
            />
          )}
        </main>

        {activeModal && (
          <ViewModal isOpen={!!activeModal} onClose={handleCloseModal} size={VIEW_MODAL_SIZES[activeModal]} title={VIEW_TITLES[activeModal] ?? ''}>
            {activeModal === 'devices' && <DeviceView />}
            {activeModal === 'blacklist' && <BlacklistView />}
            {activeModal === 'export' && <ExportView />}
            {activeModal === 'settings' && <SettingView />}
          </ViewModal>
        )}
      </div>

      <ScrollToTop isVisible={showScrollToTop} onClick={handleScrollToTop} />
      <ToastContainer />
    </div>
  );
};
