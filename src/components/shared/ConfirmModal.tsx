import { clsx } from 'clsx';
import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Icon } from './Icon';

import type { MouseEvent, ReactNode, ReactPortal } from 'react';

interface ConfirmModalProps {
  readonly cancelText?: string;
  readonly confirmButtonClass?: string;
  readonly confirmText?: string;
  readonly isOpen: boolean;
  readonly message: ReactNode;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly title: string;
}

export const ConfirmModal = memo(
  ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmButtonClass = '',
  }: ConfirmModalProps): ReactPortal | null => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(isOpen);

    useEffect(() => {
      if (isOpen) {
        setIsMounted(true);
      } else {
        const timer = setTimeout(() => setIsMounted(false), 200);
        return () => clearTimeout(timer);
      }
    }, [isOpen]);

    if (!isMounted) {
      return null;
    }

    const modalContent = (
      <div className={clsx('modal-backdrop', isOpen ? 'modal-backdrop-open' : 'modal-backdrop-closed')} onClick={onClose}>
        <div
          ref={modalRef}
          className={clsx('modal-container max-w-md', isOpen ? 'modal-container-open' : 'modal-container-closed')}
          onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          <header className="modal-header">
            <h3 className="modal-title">{title}</h3>
            <button className="btn-ghost" onClick={onClose}>
              <Icon name="X" className="icon-md" />
            </button>
          </header>
          <div className="modal-body layout-stack-md">
            <div className="txt-main">{message}</div>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={onClose}>
                {cancelText}
              </button>
              <button className={clsx('btn-primary', confirmButtonClass)} onClick={onConfirm}>
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    return createPortal(modalContent, document.body);
  },
);
