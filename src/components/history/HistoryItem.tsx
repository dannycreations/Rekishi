import { memo, useCallback, useMemo, useState } from 'react';

import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../hooks/useToast';
import { useBlacklistStore } from '../../stores/useBlacklistStore';
import { useHistoryStore } from '../../stores/useHistoryStore';
import { getHostnameFromUrl } from '../../utilities/urlUtil';
import { BlacklistDomainIcon, CheckIcon, CopyIcon, ExternalLinkIcon, GlobeIcon, SearchIcon, TrashIcon } from '../shared/Icons';

import type { JSX, MouseEvent } from 'react';
import type { ChromeHistoryItem } from '../../app/types';

interface HistoryItemProps {
  isChecked: boolean;
  item: ChromeHistoryItem;
  onDelete: (id: string) => Promise<void>;
  onToggleSelection: (id: string) => void;
}

const Highlight = memo(({ text, highlight }: { text: string; highlight: string }) => {
  const highlightRegex = useMemo(() => {
    if (!highlight) {
      return null;
    }
    const escapedHighlight = highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`(${escapedHighlight})`, 'gi');
  }, [highlight]);

  const parts = useMemo(() => {
    if (!highlightRegex) {
      return [text];
    }
    return text.split(highlightRegex);
  }, [text, highlightRegex]);

  if (!highlight || parts.length <= 1) {
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="rounded-sm bg-yellow-200 px-0.5 py-px">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
});

export const HistoryItem = memo(({ item, onDelete, isChecked, onToggleSelection }: HistoryItemProps): JSX.Element => {
  const { id, lastVisitTime, title, url } = item;
  const { addDomain } = useBlacklistStore();
  const { searchQuery, isRegex, setSearchQuery } = useHistoryStore();
  const [faviconError, setFaviconError] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState(false);
  const { Modal: BlacklistModal, openModal: openBlacklistModal } = useConfirm();
  const { Modal: DeleteModal, openModal: openDeleteModal } = useConfirm();
  const { addToast } = useToast();

  const hostname = useMemo(() => getHostnameFromUrl(url), [url]);
  const shouldHighlight = searchQuery && !isRegex;

  const visitTime = useMemo(
    () =>
      new Date(lastVisitTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    [lastVisitTime],
  );

  const handleFaviconError = useCallback(() => {
    setFaviconError(true);
  }, []);

  const handleToggle = useCallback((): void => {
    onToggleSelection(id);
  }, [id, onToggleSelection]);

  const handleConfirmDelete = useCallback(async (): Promise<void> => {
    await onDelete(id);
    addToast('History item deleted.', 'success');
  }, [id, onDelete, addToast]);

  const handleOpenDeleteModal = useCallback(
    (e: MouseEvent): void => {
      e.stopPropagation();
      openDeleteModal({
        confirmButtonClass: 'bg-red-600 hover:bg-red-700',
        confirmText: 'Delete',
        message: (
          <>
            Are you sure you want to permanently delete <strong>{title || url}</strong> from your history? This action cannot be undone.
          </>
        ),
        onConfirm: handleConfirmDelete,
        title: 'Delete History Item',
      });
    },
    [openDeleteModal, title, url, handleConfirmDelete],
  );

  const handleConfirmBlacklist = useCallback((): void => {
    if (hostname) {
      addDomain(hostname, false);
      addToast(`'${hostname}' has been blacklisted.`, 'success');
    }
  }, [hostname, addDomain, addToast]);

  const handleOpenBlacklistModal = useCallback(
    (e: MouseEvent): void => {
      e.stopPropagation();
      if (hostname) {
        openBlacklistModal({
          confirmButtonClass: 'bg-red-600 hover:bg-red-700',
          confirmText: 'Blacklist',
          message: (
            <>
              Are you sure you want to blacklist <strong>{hostname}</strong>? This will hide all current and future history items from this domain.
              You can manage your blacklist in the &quot;Blacklist Domain&quot; section.
            </>
          ),
          onConfirm: handleConfirmBlacklist,
          title: 'Blacklist Domain',
        });
      }
    },
    [hostname, openBlacklistModal, handleConfirmBlacklist],
  );

  const handleSearchSimilar = useCallback(
    (e: MouseEvent): void => {
      e.stopPropagation();
      if (hostname) {
        setSearchQuery(hostname);
      }
    },
    [hostname, setSearchQuery],
  );

  const handleCopyUrl = useCallback(
    (e: MouseEvent): void => {
      e.stopPropagation();
      navigator.clipboard.writeText(url).then(() => {
        addToast('URL copied to clipboard', 'success');
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500);
      });
    },
    [url, addToast],
  );

  return (
    <>
      <div
        className={`group flex cursor-pointer items-center rounded-md p-2 transition-colors duration-200 ${
          isChecked ? 'bg-slate-100' : 'hover:bg-white'
        }`}
        onClick={handleToggle}
      >
        <div className="relative mr-2 flex h-4 w-4 shrink-0 select-none items-center justify-center">
          <div
            className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors duration-200 ${
              isChecked ? 'border-slate-800 bg-slate-800' : 'border-slate-300 group-hover:border-slate-400'
            }`}
          >
            {isChecked && <CheckIcon className="h-2.5 w-2.5 text-white" />}
          </div>
        </div>
        {faviconError ? (
          <GlobeIcon className="mr-2 h-5 w-5 shrink-0 text-slate-400" />
        ) : (
          <img
            alt=""
            className="mr-2 h-5 w-5 shrink-0"
            loading="lazy"
            onError={handleFaviconError}
            src={`https://www.google.com/s2/favicons?sz=32&domain_url=${hostname}`}
          />
        )}
        <div className="min-w-0 flex-1 truncate" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center">
            <a
              className="truncate text-sm font-semibold text-slate-700 hover:underline"
              href={url}
              onClick={(e) => e.stopPropagation()}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Highlight text={title || url} highlight={shouldHighlight ? searchQuery : ''} />
            </a>
            <ExternalLinkIcon className="ml-1 h-3.5 w-3.5 shrink-0 text-slate-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </div>
          <p className="truncate text-xs text-slate-500">
            <Highlight text={url} highlight={shouldHighlight ? searchQuery : ''} />
          </p>
        </div>
        <div className="relative ml-2 flex h-6 w-32 shrink-0 items-center justify-end">
          <span className="text-right text-xs text-slate-500 group-hover:hidden">{visitTime}</span>
          <div className="absolute inset-0 hidden items-center justify-end space-x-1 group-hover:flex">
            <button
              className="cursor-pointer rounded-md p-1 text-slate-400 transition-all duration-200 ease-in-out hover:scale-110 hover:bg-slate-100 hover:text-slate-800 active:scale-95"
              onClick={handleCopyUrl}
              title={isCopied ? 'Copied!' : 'Copy URL'}
            >
              {isCopied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <CopyIcon className="h-4 w-4" />}
            </button>
            <button
              className="cursor-pointer rounded-md p-1 text-slate-400 transition-all duration-200 ease-in-out hover:scale-110 hover:bg-slate-100 hover:text-slate-800 active:scale-95"
              onClick={handleSearchSimilar}
              title="Search for similar items"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
            <button
              className="cursor-pointer rounded-md p-1 text-slate-400 transition-all duration-200 ease-in-out hover:scale-110 hover:bg-slate-100 hover:text-slate-800 active:scale-95"
              onClick={handleOpenBlacklistModal}
              title="Blacklist this domain"
            >
              <BlacklistDomainIcon className="h-4 w-4" />
            </button>
            <button
              className="cursor-pointer rounded-md p-1 text-slate-400 transition-all duration-200 ease-in-out hover:scale-110 hover:bg-red-100 hover:text-red-500 active:scale-95"
              onClick={handleOpenDeleteModal}
              title="Delete from history"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <BlacklistModal />
      <DeleteModal />
    </>
  );
});
