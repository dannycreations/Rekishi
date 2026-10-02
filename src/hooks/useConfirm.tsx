import { useCallback, useState } from 'react';

import { ConfirmModal } from '../components/shared/ConfirmModal';

import type { JSX, ReactNode } from 'react';

interface ConfirmOptions {
  readonly cancelText?: string;
  readonly confirmButtonClass?: string;
  readonly confirmText?: string;
  readonly message: ReactNode;
  readonly onConfirm: () => void;
  readonly title: string;
}

interface UseConfirmReturn {
  readonly modal: JSX.Element | null;
  readonly openModal: (options: ConfirmOptions) => void;
}

export const useConfirm = (): UseConfirmReturn => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const openModal = useCallback((opts: ConfirmOptions): void => {
    setOptions(opts);
  }, []);

  const closeModal = useCallback((): void => {
    setOptions(null);
  }, []);

  const handleConfirm = useCallback((): void => {
    if (options) {
      options.onConfirm();
      closeModal();
    }
  }, [options, closeModal]);

  const modal = options ? (
    <ConfirmModal
      cancelText={options.cancelText}
      confirmButtonClass={options.confirmButtonClass}
      confirmText={options.confirmText}
      message={options.message}
      onClose={closeModal}
      onConfirm={handleConfirm}
      title={options.title}
    />
  ) : null;

  return { modal, openModal };
};
