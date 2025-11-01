import { memo, useCallback, useState } from 'react';

import { ConfirmModal } from '../components/shared/ConfirmModal';

import type { JSX, ReactNode } from 'react';

interface ConfirmOptions {
  cancelText?: string;
  confirmButtonClass?: string;
  confirmText?: string;
  message: ReactNode;
  onConfirm: () => void;
  title: string;
}

export const useConfirm = () => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const openModal = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
  }, []);

  const closeModal = useCallback(() => {
    setOptions(null);
  }, []);

  const handleConfirm = useCallback(() => {
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
