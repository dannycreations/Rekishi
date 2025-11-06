import { memo, useCallback } from 'react';

import { useConfirm } from '../../hooks/useConfirm';
import { deleteAllHistory } from '../../services/chromeApi';
import { useSettingStore } from '../../stores/useSettingStore';
import { useToastStore } from '../../stores/useToastStore';

import type { ChangeEvent, JSX, ReactNode } from 'react';

interface SettingRowProps {
  children: ReactNode;
  description: string;
  title: string;
}

const SettingRow = memo(({ title, description, children }: SettingRowProps): JSX.Element => {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2 py-1">
      <div>
        <h4 className="font-semibold text-slate-800">{title}</h4>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  );
});

interface SettingSectionProps {
  children: ReactNode;
  title: string;
}

const SettingSection = memo(({ title, children }: SettingSectionProps): JSX.Element => {
  return (
    <div>
      <h3 className="mb-2 text-lg font-bold text-slate-800">{title}</h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
});

export const SettingView = (): JSX.Element => {
  const { dataRetention, setDataRetention } = useSettingStore((state) => ({
    dataRetention: state.dataRetention,
    setDataRetention: state.setDataRetention,
  }));
  const { Modal: ClearHistoryModal, openModal: openClearHistoryModal } = useConfirm();
  const addToast = useToastStore((state) => state.addToast);

  const handleConfirmClearHistory = useCallback(async (): Promise<void> => {
    try {
      await deleteAllHistory();
      addToast('All history has been cleared.', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: unknown) {
      addToast('Failed to clear history. Please try again.', 'error');
      console.error(error);
    }
  }, [addToast]);

  const handleOpenClearHistoryModal = useCallback(() => {
    openClearHistoryModal({
      confirmButtonClass: 'bg-red-600 hover:bg-red-700',
      confirmText: 'Yes, Clear All Data',
      message: (
        <>
          Are you sure you want to permanently delete <strong>all</strong> of your browsing history? This action cannot be undone and will affect all
          synced devices.
        </>
      ),
      onConfirm: handleConfirmClearHistory,
      title: 'Clear All History',
    });
  }, [openClearHistoryModal, handleConfirmClearHistory]);

  return (
    <>
      <div className="space-y-3">
        <SettingSection title="Data">
          <SettingRow description="How long to keep your browsing history." title="History Retention">
            <select
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-400"
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setDataRetention(e.target.value)}
              value={dataRetention}
            >
              <option value="disabled">Disabled</option>
              <option value="90">90 days</option>
              <option value="30">30 days</option>
              <option value="14">14 days</option>
              <option value="7">7 days</option>
            </select>
          </SettingRow>
        </SettingSection>

        <SettingSection title="Actions">
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-2">
            <div>
              <h4 className="font-semibold text-red-800">Clear All History</h4>
              <p className="text-sm text-red-600">Permanently delete all your browsing data.</p>
            </div>
            <div>
              <button
                className="cursor-pointer rounded-lg bg-red-600 p-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                onClick={handleOpenClearHistoryModal}
              >
                Clear Data
              </button>
            </div>
          </div>
        </SettingSection>
      </div>
      <ClearHistoryModal />
    </>
  );
};
