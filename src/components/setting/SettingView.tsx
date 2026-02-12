import { memo, useCallback } from 'react';

import { useConfirm } from '../../hooks/useConfirm';
import { deleteAllHistory } from '../../services/chromeApi';
import { useSettingStore } from '../../stores/useSettingStore';
import { useToastStore } from '../../stores/useToastStore';

import type { ChangeEvent, JSX, ReactNode } from 'react';
import type { Theme } from '../../app/types';

interface SettingRowProps {
  readonly children: ReactNode;
  readonly description: string;
  readonly title: string;
}

const SettingRow = memo(({ title, description, children }: SettingRowProps): JSX.Element => {
  return (
    <div className="layout-flex-between card">
      <div>
        <h4 className="txt-highlight">{title}</h4>
        <p className="txt-muted">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  );
});

interface SettingSectionProps {
  readonly children: ReactNode;
  readonly title: string;
}

const SettingSection = memo(({ title, children }: SettingSectionProps): JSX.Element => {
  return (
    <div>
      <h3 className="mb-2 txt-title-lg">{title}</h3>
      <div className="layout-stack-sm">{children}</div>
    </div>
  );
});

export const SettingView = (): JSX.Element => {
  const { dataRetention, setDataRetention, theme, setTheme } = useSettingStore((state) => ({
    dataRetention: state.dataRetention,
    setDataRetention: state.setDataRetention,
    theme: state.theme,
    setTheme: state.setTheme,
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

  const handleOpenClearHistoryModal = useCallback((): void => {
    openClearHistoryModal({
      confirmButtonClass: 'btn-danger-large',
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
      <div className="layout-stack-md">
        <SettingSection title="Appearance">
          <SettingRow description="Choose how Rekishi looks to you." title="Theme">
            <select
              className="input-base w-32 px-2 py-1"
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setTheme(e.target.value as Theme)}
              value={theme}
            >
              <option className="bg-surface" value="system">
                System
              </option>
              <option className="bg-surface" value="light">
                Light
              </option>
              <option className="bg-surface" value="dark">
                Dark
              </option>
            </select>
          </SettingRow>
        </SettingSection>

        <SettingSection title="Data">
          <SettingRow description="How long to keep your browsing history." title="History Retention">
            <select
              className="input-base w-32 px-2 py-1"
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setDataRetention(e.target.value)}
              value={dataRetention}
            >
              <option className="bg-surface" value="disabled">
                Disabled
              </option>
              <option className="bg-surface" value="90">
                90 days
              </option>
              <option className="bg-surface" value="30">
                30 days
              </option>
              <option className="bg-surface" value="14">
                14 days
              </option>
              <option className="bg-surface" value="7">
                7 days
              </option>
            </select>
          </SettingRow>
        </SettingSection>

        <SettingSection title="Actions">
          <div className="layout-flex-between card border-danger/10">
            <div>
              <h4 className="txt-highlight text-danger">Clear All History</h4>
              <p className="txt-main text-danger/80">Permanently delete all your browsing data.</p>
            </div>
            <div>
              <button className="btn-danger-large" onClick={handleOpenClearHistoryModal}>
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
