import './styles.css';

import { cn } from 'cnfast';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { BlacklistView } from '../components/blacklist/BlacklistView';
import { ExportView } from '../components/export/ExportView';
import { HistoryView } from '../components/history/HistoryView';
import { HistoryViewSkeleton } from '../components/history/HistoryViewSkeleton';
import { Header } from '../components/main/Header';
import { SettingView } from '../components/setting/SettingView';
import { Icon } from '../components/shared/Icon';
import { Modal } from '../components/shared/Modal';
import { ScrollToTop } from '../components/shared/ScrollToTop';
import { ToastContainer } from '../components/shared/Toast';
import { useHistory } from '../hooks/useHistory';
import { useHistoryDateStore } from '../stores/useHistoryDateStore';
import { useHistoryStore } from '../stores/useHistoryStore';
import { useSettingStore } from '../stores/useSettingStore';
import { VIEW_TITLES } from './constants';

import type { JSX } from 'react';
import type { ViewType } from './types';

const MODAL_COMPONENTS: Record<ViewType, JSX.Element> = {
  blacklist: <BlacklistView />,
  export: <ExportView />,
  settings: <SettingView />,
} as const;

const MODAL_CONTAINER_CLASSES: Record<ViewType, string> = {
  blacklist: 'max-w-lg',
  export: 'max-w-md',
  settings: 'max-w-lg',
} as const;

export const Rekishi = (): JSX.Element => {
  const [activeModal, setActiveModal] = useState<ViewType | null>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const mainContentRef = useRef<HTMLElement>(null);

  const { searchQuery, selectedDate, setSearchQuery, setSelectedDate } = useHistoryStore((state) => ({
    searchQuery: state.searchQuery,
    selectedDate: state.selectedDate,
    setSearchQuery: state.setSearchQuery,
    setSelectedDate: state.setSelectedDate,
  }));
  const theme = useSettingStore((state) => state.theme);
  const { deleteHistoryItem, deleteHistoryItems, error, hasMore, history, isLoading, isLoadingMore, loadMore } = useHistory();
  const {
    datesWithHistory,
    fetchDatesForMonth,
    isLoading: isLoadingDates,
  } = useHistoryDateStore((state) => ({
    datesWithHistory: state.datesWithHistory,
    fetchDatesForMonth: state.fetchDatesForMonth,
    isLoading: state.isLoading,
  }));

  useEffect(() => {
    mainContentRef.current?.scrollTo(0, 0);
  }, [searchQuery, selectedDate]);

  useEffect(() => {
    fetchDatesForMonth(selectedDate);
  }, [fetchDatesForMonth, selectedDate]);

  useEffect(() => {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

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
    <div className="app-container">
      <div className="main-layout">
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

        <main ref={mainContentRef} className="main-content">
          {isLoading ? (
            <HistoryViewSkeleton />
          ) : error ? (
            <div className="centered-view">
              <Icon name="AlertCircle" className="centered-view-icon icon-error" />
              <div className="layout-stack-sm">
                <h2 className="txt-title-lg">Something went wrong</h2>
                <p className="txt-error">{error}</p>
              </div>
            </div>
          ) : noHistoryEver ? (
            <div className="centered-view">
              <Icon name="History" className="centered-view-icon" />
              <div className="layout-stack-sm">
                <h2 className="txt-title-lg">Welcome to Rekishi!</h2>
                <p className="txt-main">Start browsing the web to see your history here.</p>
              </div>
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
          <Modal
            containerClassName={cn(MODAL_CONTAINER_CLASSES[activeModal], 'max-h-[90vh]')}
            isOpen
            onClose={handleCloseModal}
            title={VIEW_TITLES[activeModal]}
          >
            {MODAL_COMPONENTS[activeModal]}
          </Modal>
        )}
      </div>

      <ScrollToTop isVisible={showScrollToTop} onClick={handleScrollToTop} />
      <ToastContainer />
    </div>
  );
};
