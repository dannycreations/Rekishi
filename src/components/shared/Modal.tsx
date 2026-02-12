import { clsx } from 'clsx';
import { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { Icon } from './Icon';

import type { MouseEvent, ReactNode, ReactPortal } from 'react';

export interface ModalProps {
  readonly children: ReactNode;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly containerClassName?: string;
}

export const Modal = memo(({ isOpen, onClose, title, children, containerClassName }: ModalProps): ReactPortal | null => {
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

  return createPortal(
    <div className={clsx('modal-backdrop', isOpen ? 'modal-backdrop-open' : 'modal-backdrop-closed')} onClick={onClose}>
      <div
        className={clsx('modal-container', containerClassName, isOpen ? 'modal-container-open' : 'modal-container-closed')}
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn-ghost" onClick={onClose}>
            <Icon name="X" className="icon-md" />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
});
