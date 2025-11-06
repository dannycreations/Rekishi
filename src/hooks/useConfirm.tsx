import { memo, useCallback, useState } from 'react';

import { ConfirmModal } from '../components/shared/ConfirmModal';

import type { JSX, MemoExoticComponent, ReactNode } from 'react';

interface ConfirmOptions {
  readonly cancelText?: string;
  readonly confirmButtonClass?: string;
  readonly confirmText?: string;
  readonly message: ReactNode;
  readonly onConfirm: () => void;
  readonly title: string;
}

interface UseConfirmReturn {
  readonly Modal: MemoExoticComponent<() => JSX.Element | null>;
  readonly openModal: (opts: ConfirmOptions) => void;
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

  const Modal = memo((): JSX.Element | null => {
    if (!options) {
      return null;
    }

    return (
      <ConfirmModal
        cancelText={options.cancelText}
        confirmButtonClass={options.confirmButtonClass}
        confirmText={options.confirmText}
        isOpen={!!options}
        message={options.message}
        onClose={closeModal}
        onConfirm={handleConfirm}
        title={options.title}
      />
    );
  });

  return { Modal, openModal };
};
