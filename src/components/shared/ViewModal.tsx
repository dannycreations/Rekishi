import { clsx } from 'clsx';
import { memo } from 'react';

import { Modal } from './Modal';

import type { JSX, ReactNode } from 'react';

interface ViewModalProps {
  readonly children: ReactNode;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  readonly title: string;
}

const SIZE_CLASSES = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
} as const;

export const ViewModal = memo(({ isOpen, onClose, title, children, size = '3xl' }: ViewModalProps): JSX.Element | null => {
  return (
    <Modal containerClassName={clsx(SIZE_CLASSES[size], 'max-h-[90vh]')} isOpen={isOpen} onClose={onClose} title={title}>
      {children}
    </Modal>
  );
});
