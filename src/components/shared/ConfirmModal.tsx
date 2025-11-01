import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { CloseIcon } from './Icons';

import type { MouseEvent, ReactNode, ReactPortal } from 'react';

interface ConfirmModalProps {
  cancelText?: string;
  confirmButtonClass?: string;
  confirmText?: string;
  isOpen: boolean;
  message: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
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
    confirmButtonClass = 'bg-slate-800 hover:bg-slate-700',
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
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      >
        <div
          ref={modalRef}
          className={`relative w-full max-w-md p-3 mx-3 bg-white rounded-lg shadow-xl outline-none transition-all duration-200 ${
            isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
          onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <button className="p-1 text-slate-400 rounded-md cursor-pointer hover:bg-slate-100 hover:text-slate-800" onClick={onClose}>
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-2">
            <div className="text-sm text-slate-600">{message}</div>
          </div>
          <div className="flex justify-end mt-3 space-x-2">
            <button
              className="px-2 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg cursor-pointer transition-colors hover:bg-slate-50"
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button
              className={`px-2 py-2 text-sm font-semibold text-white rounded-lg transition-colors cursor-pointer ${confirmButtonClass}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    );

    return createPortal(modalContent, document.body);
  },
);
