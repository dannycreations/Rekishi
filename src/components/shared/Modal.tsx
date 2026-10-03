import { cn } from 'cn';
import { memo } from 'react';
import { createPortal } from 'react-dom';

import { Icon } from './Icon';

import type { MouseEvent, ReactNode, ReactPortal } from 'react';

interface ModalProps {
  readonly children: ReactNode;
  readonly onClose: () => void;
  readonly title: string;
  readonly containerClassName?: string;
}

export const Modal = memo(({ onClose, title, children, containerClassName }: ModalProps): ReactPortal => {
  return createPortal(
    <div className="modal-backdrop modal-backdrop-open" onClick={onClose}>
      <div
        className={cn('modal-container modal-container-open', containerClassName)}
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
