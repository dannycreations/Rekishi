import { cn } from 'cn';
import { memo } from 'react';

import { Modal } from './Modal';

import type { JSX, ReactNode } from 'react';

interface ConfirmModalProps {
  readonly cancelText?: string;
  readonly confirmButtonClass?: string;
  readonly confirmText?: string;
  readonly message: ReactNode;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly title: string;
}

export const ConfirmModal = memo(
  ({
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmButtonClass = '',
  }: ConfirmModalProps): JSX.Element => {
    return (
      <Modal containerClassName="max-w-md" onClose={onClose} title={title}>
        <div className="modal-body-stack">
          <div className="txt-main">{message}</div>
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={onClose}>
              {cancelText}
            </button>
            <button className={cn('btn-primary', confirmButtonClass)} onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </Modal>
    );
  },
);
