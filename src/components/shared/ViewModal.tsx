import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { CloseIcon } from './Icons';

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
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className={`relative mx-3 flex w-full ${sizeClass} max-h-[90vh] flex-col rounded-lg bg-slate-50 shadow-xl outline-none transition-all duration-200 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between rounded-t-lg border-b border-slate-200 bg-white p-3">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800" onClick={onClose}>
            <CloseIcon className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-3">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
});
