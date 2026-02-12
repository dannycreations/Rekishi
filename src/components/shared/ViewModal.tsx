import { clsx } from 'clsx';
import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Icon } from './Icon';

import type { MouseEvent, ReactNode, ReactPortal } from 'react';

interface ViewModalProps {
  readonly children: ReactNode;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  readonly title: string;
}

export const ViewModal = memo(({ isOpen, onClose, title, children, size = '3xl' }: ViewModalProps): ReactPortal | null => {
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

  const sizeClass = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  }[size];

  const modalContent = (
    <div className={clsx('modal-backdrop', isOpen ? 'modal-backdrop-open' : 'modal-backdrop-closed')} onClick={onClose}>
      <div
        ref={modalRef}
        className={clsx('modal-container', sizeClass, 'max-h-[90vh]', isOpen ? 'modal-container-open' : 'modal-container-closed')}
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
    </div>
  );

  return createPortal(modalContent, document.body);
});
