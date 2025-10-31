import { useEffect, useMemo, useRef, useState } from 'react';

import { AdvancedExportView } from '../components/AdvancedExportView';
import { BlacklistDomainView } from '../components/BlacklistDomainView';
import { DevicesView } from '../components/DevicesView';
import { Header } from '../components/Header';
import { HistoryListView, HistoryListViewSkeleton } from '../components/HistoryListView';
import { SettingsView } from '../components/SettingsView';
import { ViewModal } from '../components/ViewModal';
import { useHistory } from '../hooks/useHistory';
import { useHistoryDates } from '../hooks/useHistoryDates';
import { useHistorySettingsStore } from '../hooks/useHistorySettingsStore';

import type { JSX } from 'react';
import type { ViewType } from './types';

const VIEW_TITLES: Record<ViewType, string> = {
  activity: 'Activity',
  devices: 'Devices',
  blacklist: 'Blacklist Domain',
  export: 'Advanced Export',
  settings: 'Settings',
};

const VIEW_MODAL_SIZES: Partial<Record<ViewType, 'md' | 'lg' | 'xl' | '2xl' | '3xl'>> = {
  devices: '3xl',
  blacklist: 'lg',
  export: 'md',
  settings: 'lg',
};

function ModalContent({ view }: { view: ViewType }): JSX.Element | null {
  switch (view) {
    case 'devices':
      return <DevicesView />;
    case 'blacklist':
      return <BlacklistDomainView />;
    case 'export':
      return <AdvancedExportView />;
    case 'settings':
      return <SettingsView />;
    case 'activity':
    default:
      return null;
  }
}

export function App(): JSX.Element {
  const [activeModal, setActiveModal] = useState<ViewType | null>(null);
  const mainContentRef = useRef<HTMLElement>(null);

  const { isRegex, searchQuery, selectedDate, setIsRegex, setSearchQuery, setSelectedDate } = useHistorySettingsStore();
  const { deleteHistoryItem, deleteHistoryItems, error, hasMore, history, isLoading, isLoadingMore, loadMore } = useHistory();
  const { datesWithHistory, isLoading: isLoadingDates } = useHistoryDates();

  useEffect(() => {
    mainContentRef.current?.scrollTo(0, 0);
  }, [searchQuery, selectedDate]);

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

  return (
    <div className="h-screen bg-slate-100 text-slate-900">
      <div className="absolute inset-0 flex flex-col max-w-6xl mx-auto overflow-hidden bg-slate-50 shadow-xl sm:inset-6 sm:rounded-lg">
        <Header
          datesWithHistory={datesWithHistory}
          isLoadingDates={isLoadingDates}
          isRegex={isRegex}
          onOpenModal={setActiveModal}
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
          selectedDate={selectedDate}
          setIsRegex={setIsRegex}
          setSelectedDate={setSelectedDate}
        />
        <main ref={mainContentRef} className="flex-1 min-h-0 p-3 overflow-y-auto">
          {isLoading ? (
            <HistoryListViewSkeleton />
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">
              <p>Error loading history: {error}</p>
            </div>
          ) : (
            <HistoryListView {...activityViewProps} />
          )}
        </main>

        {activeModal && (
          <ViewModal
            isOpen={!!activeModal}
            onClose={() => setActiveModal(null)}
            size={VIEW_MODAL_SIZES[activeModal]}
            title={VIEW_TITLES[activeModal] ?? ''}
          >
            <ModalContent view={activeModal} />
          </ViewModal>
        )}
      </div>
    </div>
  );
}
