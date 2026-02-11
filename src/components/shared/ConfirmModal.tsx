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
      <div className={`modal-backdrop ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose}>
        <div
          ref={modalRef}
          className={`modal-container max-w-md p-3 ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between">
            <h3 className="modal-title">{title}</h3>
            <button className="btn-ghost" onClick={onClose}>
              <Icon name="X" className="icon-md" />
            </button>
          </div>
          <div className="mt-2">
            <div className="txt-main text-slate-600">{message}</div>
          </div>
          <div className="mt-3 flex justify-end space-x-2">
            <button className="btn-secondary" onClick={onClose}>
              {cancelText}
            </button>
            <button className={`btn-primary ${confirmButtonClass}`} onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    );

    return createPortal(modalContent, document.body);
  },
);
