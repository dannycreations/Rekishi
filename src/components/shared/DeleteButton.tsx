import { memo } from 'react';

import { TrashIcon } from './Icons';

import type { JSX, ReactNode } from 'react';

interface DeleteButtonProps {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}

export const DeleteButton = memo(({ onClick, children, disabled }: DeleteButtonProps): JSX.Element => {
  return (
    <button
      className="flex cursor-pointer items-center rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
    >
      <TrashIcon className="mr-1 h-3 w-3" />
      {children}
    </button>
  );
});
