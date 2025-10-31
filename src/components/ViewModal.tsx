import { memo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { CloseIcon } from './Icons';

import type { ReactNode, ReactPortal } from 'react';

interface ViewModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  title: string;
}

function ViewModalFn({ isOpen, onClose, title, children, size = '3xl' }: ViewModalProps): ReactPortal | null {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      modalRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`relative flex flex-col w-full ${sizeClass} max-h-[90vh] mx-3 bg-slate-50 rounded-lg shadow-xl outline-none`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="flex items-start justify-between flex-shrink-0 p-3 bg-white border-b border-slate-200 rounded-t-lg">
          <h3 id="modal-title" className="text-lg font-bold text-slate-800">
            {title}
          </h3>
          <button className="p-1 text-slate-400 rounded-md hover:bg-slate-100 hover:text-slate-800" onClick={onClose} aria-label="Close modal">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 p-3 overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export const ViewModal = memo(ViewModalFn);
