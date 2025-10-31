import { memo, useCallback, useMemo, useState } from 'react';

import { useConfirm } from '../../hooks/useConfirm';
import { useBlacklistStore } from '../../stores/useBlacklistStore';
import { useHistoryStore } from '../../stores/useHistoryStore';
import { getHostnameFromUrl } from '../../utilities/urlUtil';
import { BlacklistDomainIcon, CheckIcon, ExternalLinkIcon, GlobeIcon, SearchIcon, TrashIcon } from '../shared/Icons';

import type { JSX, MouseEvent } from 'react';
import type { ChromeHistoryItem } from '../../app/types';

interface HistoryItemProps {
  isChecked: boolean;
  item: ChromeHistoryItem;
  onDelete: (id: string) => void;
  onToggleSelection: (id: string) => void;
}

export const HistoryItem = memo(({ item, onDelete, isChecked, onToggleSelection }: HistoryItemProps): JSX.Element => {
  const { id, lastVisitTime, title, url } = item;
  const { addDomain } = useBlacklistStore();
  const { setSearchQuery } = useHistoryStore();
  const [faviconError, setFaviconError] = useState(false);
  const { Modal: BlacklistModal, openModal: openBlacklistModal } = useConfirm();
  const { Modal: DeleteModal, openModal: openDeleteModal } = useConfirm();

  const hostname = useMemo(() => getHostnameFromUrl(url), [url]);

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

  const stopPropagation = useCallback((e: MouseEvent): void => {
    e.stopPropagation();
  }, []);

  const handleConfirmDelete = useCallback((): void => {
    onDelete(id);
  }, [id, onDelete]);

  const handleOpenDeleteModal = useCallback(
    (e: MouseEvent): void => {
      stopPropagation(e);
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
    [stopPropagation, openDeleteModal, title, url, handleConfirmDelete],
  );

  const handleConfirmBlacklist = useCallback((): void => {
    if (hostname) {
      addDomain(hostname, false);
    }
  }, [hostname, addDomain]);

  const handleOpenBlacklistModal = useCallback(
    (e: MouseEvent): void => {
      stopPropagation(e);
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
    [hostname, stopPropagation, openBlacklistModal, handleConfirmBlacklist],
  );

  const handleSearchSimilar = useCallback(
    (e: MouseEvent): void => {
      stopPropagation(e);
      if (hostname) {
        setSearchQuery(hostname);
      }
    },
    [hostname, setSearchQuery, stopPropagation],
  );

  return (
    <>
      <div
        className={`
        group flex cursor-pointer items-center rounded-md p-2 transition-colors
        ${isChecked ? 'bg-slate-100' : 'hover:bg-white'}
      `}
        onClick={handleToggle}
      >
        <div className="relative mr-2 flex h-4 w-4 shrink-0 items-center justify-center">
          <div
            className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${
              isChecked ? 'border-slate-800 bg-slate-800' : 'border-slate-300 group-hover:border-slate-400'
            }`}
          >
            {isChecked && <CheckIcon className="h-2.5 w-2.5 text-white" />}
          </div>
        </div>
        {faviconError ? (
          <GlobeIcon className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
        ) : (
          <img
            alt=""
            className="mr-2 h-4 w-4 shrink-0"
            loading="lazy"
            onError={handleFaviconError}
            src={`https://www.google.com/s2/favicons?sz=32&domain_url=${hostname}`}
          />
        )}
        <div className="min-w-0 flex-1 truncate" onClick={stopPropagation}>
          <div className="flex items-center">
            <a
              className="truncate text-sm text-slate-700 hover:underline"
              href={url}
              onClick={stopPropagation}
              rel="noopener noreferrer"
              target="_blank"
            >
              {title || url}
            </a>
            <ExternalLinkIcon className="ml-1 h-3.5 w-3.5 shrink-0 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <p className="truncate text-xs text-slate-500">{url}</p>
        </div>
        <div className="relative flex items-center justify-end shrink-0 w-24 h-6 ml-2">
          <span className="text-xs text-right text-slate-500 transition-opacity duration-200 opacity-100 group-hover:opacity-0">{visitTime}</span>
          <div className="absolute inset-0 flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button className="p-1 text-slate-400 rounded-md hover:bg-slate-100 hover:text-slate-800" onClick={handleSearchSimilar}>
              <SearchIcon className="w-4 h-4" />
            </button>
            <button className="p-1 text-slate-400 rounded-md hover:bg-slate-100 hover:text-slate-800" onClick={handleOpenBlacklistModal}>
              <BlacklistDomainIcon className="w-4 h-4" />
            </button>
            <button className="p-1 text-slate-400 rounded-md hover:bg-slate-100 hover:text-slate-800" onClick={handleOpenDeleteModal}>
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <BlacklistModal />
      <DeleteModal />
    </>
  );
});
