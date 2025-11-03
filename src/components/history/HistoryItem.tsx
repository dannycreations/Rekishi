import { memo, useCallback, useMemo, useState } from 'react';

import { useToast } from '../../hooks/useToast';
import { useHistoryStore } from '../../stores/useHistoryStore';
import { isPotentialRegex } from '../../utilities/blacklistUtil';
import { getHostnameFromUrl } from '../../utilities/urlUtil';
import { CheckIcon, ExternalLinkIcon, GlobeIcon } from '../shared/Icons';
import { HistoryItemActions } from './HistoryItemActions';

import type { JSX, MouseEvent } from 'react';
import type { ChromeHistoryItem } from '../../app/types';

interface HistoryHighlightProps {
  highlight: string;
  text: string;
}

const HistoryHighlight = ({ text, highlight }: HistoryHighlightProps): JSX.Element => {
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
};

interface HistoryItemProps {
  isChecked: boolean;
  item: ChromeHistoryItem;
  onBlacklistRequest: (item: ChromeHistoryItem) => void;
  onDeleteRequest: (item: ChromeHistoryItem) => void;
  onToggleSelection: (id: string) => void;
}

export const HistoryItem = memo(({ item, onDeleteRequest, onBlacklistRequest, isChecked, onToggleSelection }: HistoryItemProps): JSX.Element => {
  const { id, lastVisitTime, title, url } = item;
  const { searchQuery, setSearchQuery } = useHistoryStore((state) => ({
    searchQuery: state.searchQuery,
    setSearchQuery: state.setSearchQuery,
  }));
  const [faviconError, setFaviconError] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState(false);
  const { addToast } = useToast();

  const isRegex = useMemo(() => isPotentialRegex(searchQuery), [searchQuery]);
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

  const handleDelete = useCallback(
    (e: MouseEvent): void => {
      e.stopPropagation();
      onDeleteRequest(item);
    },
    [item, onDeleteRequest],
  );

  const handleBlacklist = useCallback(
    (e: MouseEvent): void => {
      e.stopPropagation();
      onBlacklistRequest(item);
    },
    [item, onBlacklistRequest],
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
            <HistoryHighlight text={title || url} highlight={shouldHighlight ? searchQuery : ''} />
          </a>
          <ExternalLinkIcon className="ml-1 h-3.5 w-3.5 shrink-0 text-slate-400 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        </div>
        <p className="truncate text-xs text-slate-500">
          <HistoryHighlight text={url} highlight={shouldHighlight ? searchQuery : ''} />
        </p>
      </div>
      <div className="relative ml-2 flex h-6 w-32 shrink-0 items-center justify-end">
        <span className="text-right text-xs text-slate-500 group-hover:hidden">{visitTime}</span>
        <HistoryItemActions
          isCopied={isCopied}
          onBlacklist={handleBlacklist}
          onCopy={handleCopyUrl}
          onDelete={handleDelete}
          onSearchSimilar={handleSearchSimilar}
        />
      </div>
    </div>
  );
});
