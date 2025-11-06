import { memo } from 'react';

import { BlacklistDomainIcon, CheckIcon, CopyIcon, SearchIcon, TrashIcon } from '../shared/Icons';

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
      <button
        className="cursor-pointer rounded-md p-1 text-slate-400 transition-all duration-200 ease-in-out hover:scale-110 hover:bg-slate-100 hover:text-slate-800 active:scale-95"
        onClick={onCopy}
      >
        {isCopied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <CopyIcon className="h-4 w-4" />}
      </button>
      <button
        className="cursor-pointer rounded-md p-1 text-slate-400 transition-all duration-200 ease-in-out hover:scale-110 hover:bg-slate-100 hover:text-slate-800 active:scale-95"
        onClick={onSearchSimilar}
      >
        <SearchIcon className="h-4 w-4" />
      </button>
      <button
        className="cursor-pointer rounded-md p-1 text-slate-400 transition-all duration-200 ease-in-out hover:scale-110 hover:bg-slate-100 hover:text-slate-800 active:scale-95"
        onClick={onBlacklist}
      >
        <BlacklistDomainIcon className="h-4 w-4" />
      </button>
      <button
        className="cursor-pointer rounded-md p-1 text-slate-400 transition-all duration-200 ease-in-out hover:scale-110 hover:bg-red-100 hover:text-red-500 active:scale-95"
        onClick={onDelete}
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
});
