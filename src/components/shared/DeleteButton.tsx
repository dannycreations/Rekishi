import { memo } from 'react';

import { Icon } from './Icon';

import type { JSX, ReactNode } from 'react';

interface DeleteButtonProps {
  readonly children?: ReactNode;
  readonly disabled?: boolean;
  readonly onClick: () => void;
}

export const DeleteButton = memo(({ onClick, children, disabled }: DeleteButtonProps): JSX.Element => {
  return (
    <button className="btn-danger" disabled={disabled} onClick={onClick}>
      <Icon name="Trash2" className="mr-1 icon-xs" />
      {children}
    </button>
  );
});
