import { clsx } from 'clsx';
import { memo, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useToastStore } from '../../stores/useToastStore';
import { Icon } from './Icon';

import type { JSX } from 'react';
import type { Toast as ToastItem } from '../../stores/useToastStore';

const TOAST_ICONS: Record<ToastItem['type'], JSX.Element> = {
  success: <Icon name="CheckCircle" className="icon-md icon-success" />,
  error: <Icon name="AlertCircle" className="icon-md icon-error" />,
  info: <Icon name="Info" className="icon-md icon-info" />,
};

const Toast = memo(({ toast, onRemove }: { readonly toast: ToastItem; readonly onRemove: (id: number) => void }): JSX.Element => {
  const [isExiting, setIsExiting] = useState(false);

  const handleRemove = useCallback((): void => {
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
    <div className={clsx('toast-card', isExiting ? 'toast-animate-exit' : 'toast-animate-enter')}>
      <div className="p-3">
        <div className="flex items-start">
          <div className="shrink-0">{TOAST_ICONS[toast.type]}</div>
          <div className="ml-3 w-0 flex-1 pt-1">
            <p className="txt-title-sm">{toast.message}</p>
          </div>
          <div className="ml-3 shrink-0">
            <button className="btn-ghost" onClick={handleRemove}>
              <Icon name="X" className="icon-md" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export const ToastContainer = memo((): JSX.Element | null => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) {
    return null;
  }

  const portalContent = (
    <div className="toast-container">
      <div className="flex w-full flex-col items-center layout-stack-sm sm:items-end">
        {toasts.map((toast) => (
          <Toast key={toast.id} onRemove={removeToast} toast={toast} />
        ))}
      </div>
    </div>
  );

  return createPortal(portalContent, document.body);
});
