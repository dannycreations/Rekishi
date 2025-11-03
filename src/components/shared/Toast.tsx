import { memo, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useToastStore } from '../../stores/useToastStore';
import { CloseIcon, ErrorIcon, InfoIcon, SuccessIcon } from './Icons';

import type { Toast as ToastItem } from '../../stores/useToastStore';

const TOAST_ICONS = {
  success: <SuccessIcon className="h-5 w-5 text-green-500" />,
  error: <ErrorIcon className="h-5 w-5 text-red-500" />,
  info: <InfoIcon className="h-5 w-5 text-slate-500" />,
};

const Toast = memo(({ toast, onRemove }: { toast: ToastItem; onRemove: (id: number) => void }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = useCallback(() => {
    setIsExiting(true);
  }, []);

  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, 200);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isExiting, onRemove, toast.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleRemove();
    }, 3000);

    return () => clearTimeout(timer);
  }, [handleRemove]);

  return (
    <div
      className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 ${
        isExiting ? 'toast-animate-exit' : 'toast-animate-enter'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{TOAST_ICONS[toast.type]}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-slate-900">{toast.message}</p>
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              className="inline-flex rounded-md bg-white text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              onClick={handleRemove}
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export const ToastContainer = memo(() => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) {
    return null;
  }

  const portalContent = (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-end px-4 py-6 sm:items-start sm:p-6">
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        {toasts.map((toast) => (
          <Toast key={toast.id} onRemove={removeToast} toast={toast} />
        ))}
      </div>
    </div>
  );

  return createPortal(portalContent, document.body);
});
