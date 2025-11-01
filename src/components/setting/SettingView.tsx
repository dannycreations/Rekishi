import { memo, useCallback } from 'react';

import { useConfirm } from '../../hooks/useConfirm';
import { deleteAllHistory } from '../../services/chromeApi';
import { useSettingStore } from '../../stores/useSettingStore';
import { ToggleSwitch } from '../shared/ToggleSwitch';

import type { ChangeEvent, JSX, ReactNode } from 'react';

interface SettingRowProps {
  children: ReactNode;
  description: string;
  title: string;
}

export const SettingRow = memo(({ title, description, children }: SettingRowProps): JSX.Element => {
  return (
    <div className="flex items-center justify-between p-3 bg-white border rounded-lg border-slate-200">
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

export const SettingSection = memo(({ title, children }: SettingSectionProps): JSX.Element => {
  return (
    <div>
      <h3 className="mb-2 text-lg font-bold text-slate-800">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
});

export const SettingView = memo((): JSX.Element => {
  const { syncEnabled, dataRetention, setSyncEnabled, setDataRetention } = useSettingStore();
  const { Modal: ClearHistoryModal, openModal: openClearHistoryModal } = useConfirm();

  const handleConfirmClearHistory = useCallback(async (): Promise<void> => {
    try {
      await deleteAllHistory();
      alert('All history has been cleared.');
      window.location.reload();
    } catch (e: unknown) {
      alert('Failed to clear history. Please try again.');
      console.error(e);
    }
  }, []);

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
        <SettingSection title="Data & Sync">
          <SettingRow description="Sync settings across your signed-in devices." title="Sync settings">
            <ToggleSwitch enabled={syncEnabled} setEnabled={setSyncEnabled} />
          </SettingRow>
          <SettingRow description="How long to keep your browsing history." title="History Retention">
            <select
              className="p-2 text-sm bg-white text-slate-900 border rounded-lg outline-none transition-colors border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setDataRetention(e.target.value)}
              value={dataRetention}
            >
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
              <option value="forever">Forever</option>
            </select>
          </SettingRow>
        </SettingSection>

        <SettingSection title="Actions">
          <div className="flex items-center justify-between p-3 bg-white border border-red-200 rounded-lg">
            <div>
              <h4 className="font-semibold text-red-800">Clear All History</h4>
              <p className="text-sm text-red-600">Permanently delete all your browsing data.</p>
            </div>
            <div>
              <button
                className="px-2 py-2 text-sm font-semibold text-white transition-colors bg-red-600 rounded-lg cursor-pointer hover:bg-red-700"
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
});
