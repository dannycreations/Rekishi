import { clsx } from 'clsx';
import { memo, useCallback, useMemo, useState } from 'react';

import { useHistoryStore } from '../../stores/useHistoryStore';
import { useToastStore } from '../../stores/useToastStore';
import { escapeRegex, getHostnameFromUrl, isPotentialRegex } from '../../utilities/commonUtil';
import { formatTimeShort } from '../../utilities/dateUtil';
import { Icon } from '../shared/Icon';
import { HistoryItemAction } from './HistoryItemAction';

import type { JSX, MouseEvent } from 'react';
import type { ChromeHistoryItem } from '../../app/types';

interface HistoryHighlightProps {
  readonly highlight: string;
  readonly text: string;
}

const HistoryHighlight = memo(({ text, highlight }: HistoryHighlightProps): JSX.Element => {
  const highlightRegex = useMemo(() => {
    if (!highlight) {
      return null;
    }
    const escapedHighlight = escapeRegex(highlight);
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
          <mark key={i} className="rounded-sm bg-highlight px-1 text-primary">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
});

interface HistoryItemProps {
  readonly isChecked: boolean;
  readonly item: ChromeHistoryItem;
  readonly onBlacklistRequest: (item: ChromeHistoryItem) => void;
  readonly onDeleteRequest: (item: ChromeHistoryItem) => void;
  readonly onToggleSelection: (id: string) => void;
}

export const HistoryItem = memo(({ item, onDeleteRequest, onBlacklistRequest, isChecked, onToggleSelection }: HistoryItemProps): JSX.Element => {
  const { id, lastVisitTime, title, url } = item;
  const { searchQuery, setSearchQuery } = useHistoryStore((state) => ({
    searchQuery: state.searchQuery,
    setSearchQuery: state.setSearchQuery,
  }));
  const [faviconError, setFaviconError] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  const isRegex = useMemo(() => isPotentialRegex(searchQuery), [searchQuery]);
  const hostname = useMemo(() => getHostnameFromUrl(url), [url]);
  const shouldHighlight = searchQuery && !isRegex;

  const visitTime = useMemo(() => formatTimeShort(lastVisitTime), [lastVisitTime]);

  const handleFaviconError = useCallback((): void => {
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
    <div className={clsx('group item-list', isChecked ? 'item-list-selected' : 'item-list-hover')} onClick={handleToggle}>
      <div className="layout-flex-center">
        <div className={clsx('checkbox-custom', isChecked && 'checkbox-checked')}>
          {isChecked && <Icon name="Check" className="icon-xs text-primary" />}
        </div>
      </div>
      {faviconError ? (
        <Icon name="Globe" className="icon-md text-text-tertiary" />
      ) : (
        <img
          alt=""
          className="icon-md"
          loading="lazy"
          onError={handleFaviconError}
          src={`https://www.google.com/s2/favicons?sz=32&domain_url=${hostname}`}
        />
      )}
      <div className="min-w-0 flex-1 truncate" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center">
          <a className="link-standard" href={url} onClick={(e) => e.stopPropagation()} rel="noopener noreferrer" target="_blank">
            <HistoryHighlight text={title || url} highlight={shouldHighlight ? searchQuery : ''} />
          </a>
          <Icon name="ExternalLink" className="icon-xs ml-1 text-text-tertiary opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        </div>
        <p className="truncate txt-muted">
          <HistoryHighlight text={url} highlight={shouldHighlight ? searchQuery : ''} />
        </p>
      </div>
      <div className="relative ml-2 flex h-6 w-32 shrink-0 items-center justify-end">
        <span className="text-right txt-muted group-hover:hidden">{visitTime}</span>
        <HistoryItemAction
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
