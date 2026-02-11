import { memo } from 'react';

import { Icon } from '../shared/Icon';

import type { JSX, MouseEvent } from 'react';

interface HistoryItemActionProps {
  readonly isCopied: boolean;
  readonly onBlacklist: (e: MouseEvent) => void;
  readonly onCopy: (e: MouseEvent) => void;
  readonly onDelete: (e: MouseEvent) => void;
  readonly onSearchSimilar: (e: MouseEvent) => void;
}

export const HistoryItemAction = memo(({ isCopied, onCopy, onSearchSimilar, onBlacklist, onDelete }: HistoryItemActionProps): JSX.Element => {
  return (
    <div className="absolute inset-0 hidden items-center justify-end space-x-1 group-hover:flex">
      <button className="btn-ghost" onClick={onCopy}>
        {isCopied ? <Icon name="Check" className="icon-sm text-green-500" /> : <Icon name="Copy" className="icon-sm" />}
      </button>
      <button className="btn-ghost" onClick={onSearchSimilar}>
        <Icon name="Search" className="icon-sm" />
      </button>
      <button className="btn-ghost" onClick={onBlacklist}>
        <Icon name="Link2Off" className="icon-sm" />
      </button>
      <button className="btn-ghost hover:bg-red-100 hover:text-red-500" onClick={onDelete}>
        <Icon name="Trash2" className="icon-sm" />
      </button>
    </div>
  );
});
