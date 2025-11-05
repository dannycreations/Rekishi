import { useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { usePopover } from '../../hooks/usePopover';
import { useBlacklistStore } from '../../stores/useBlacklistStore';
import { useToastStore } from '../../stores/useToastStore';
import { parseInput } from '../../utilities/blacklistUtil';
import { CloseIcon, QuestionMarkCircleIcon } from '../shared/Icons';
import { BlacklistItem } from './BlacklistItem';

import type { FormEvent, JSX, ReactNode } from 'react';

const Tooltip = ({
  anchorEl,
  children,
  onMouseEnter,
  onMouseLeave,
}: {
  anchorEl: HTMLElement | null;
  children: ReactNode;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) => {
  const { popoverRef, style } = usePopover(anchorEl);

  if (!anchorEl) {
    return null;
  }

  return createPortal(
    <div
      ref={popoverRef}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="fixed z-[101] w-72 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600 shadow-lg popover-animate-enter"
    >
      {children}
    </div>,
    document.body,
  );
};

export const BlacklistView = (): JSX.Element => {
  const { addDomain, blacklistedItems, removeDomain, editDomain } = useBlacklistStore((state) => ({
    addDomain: state.addDomain,
    blacklistedItems: state.blacklistedItems,
    removeDomain: state.removeDomain,
    editDomain: state.editDomain,
  }));
  const [newDomain, setNewDomain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const addToast = useToastStore((state) => state.addToast);

  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const tooltipAnchorRef = useRef<HTMLButtonElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  const sortedItems = useMemo(() => [...blacklistedItems].sort((a, b) => a.value.localeCompare(b.value)), [blacklistedItems]);
  const blacklistedValues = useMemo(() => new Set(blacklistedItems.map((item) => item.value)), [blacklistedItems]);

  const handleAddDomain = useCallback(
    (e: FormEvent): void => {
      e.preventDefault();
      setError(null);
      const parsed = parseInput(newDomain);

      if (!parsed) {
        return;
      }

      if ('error' in parsed) {
        setError(parsed.error);
        return;
      }

      const { value, isRegex } = parsed;

      if (blacklistedValues.has(value)) {
        setError('This item already exists in the blacklist.');
        return;
      }

      addDomain(value, isRegex);
      addToast(`'${value}' added to blacklist.`, 'success');
      setNewDomain('');
    },
    [newDomain, addDomain, blacklistedValues, addToast],
  );

  const handleRemoveDomain = useCallback(
    (valueToRemove: string): void => {
      removeDomain(valueToRemove);
      addToast(`'${valueToRemove}' removed from blacklist.`, 'success');
    },
    [removeDomain, addToast],
  );

  const handleEditDomain = useCallback(
    (oldValue: string, newValue: string, newIsRegex: boolean) => {
      if (oldValue !== newValue && blacklistedValues.has(newValue)) {
        addToast('This item already exists in the blacklist.', 'error');
        return;
      }
      editDomain(oldValue, newValue, newIsRegex);
      addToast('Blacklist item updated.', 'success');
    },
    [blacklistedValues, editDomain, addToast],
  );

  const handleTooltipOpen = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsTooltipOpen(true);
  }, []);

  const handleTooltipClose = useCallback(() => {
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsTooltipOpen(false);
    }, 200);
  }, []);

  return (
    <div className="space-y-3">
      <div>
        <form className="flex items-center space-x-2" onSubmit={handleAddDomain}>
          <div className="relative grow">
            <input
              autoFocus
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-2 pr-7 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-400"
              onChange={(e) => {
                setNewDomain(e.target.value);
                setError(null);
              }}
              placeholder="e.g., example.com or *.bad-site.com"
              type="text"
              value={newDomain}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              {newDomain && (
                <button
                  className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
                  onClick={() => setNewDomain('')}
                  type="button"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <button
            className="cursor-pointer rounded-lg bg-slate-800 p-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
            disabled={!newDomain.trim()}
            type="submit"
          >
            Add
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Blacklisted Items ({sortedItems.length})</h3>
          <div className="flex items-center">
            <button
              ref={tooltipAnchorRef}
              className="cursor-pointer text-slate-400 hover:text-slate-600"
              onMouseEnter={handleTooltipOpen}
              onMouseLeave={handleTooltipClose}
            >
              <QuestionMarkCircleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        {sortedItems.length > 0 ? (
          <ul className="space-y-1">
            {sortedItems.map((item) => (
              <BlacklistItem key={item.value} item={item} onEdit={handleEditDomain} onRemove={handleRemoveDomain} />
            ))}
          </ul>
        ) : (
          <p className="py-3 text-center text-sm text-slate-500">Your blacklist is empty. Add domains using the form above.</p>
        )}
      </div>

      {isTooltipOpen && (
        <Tooltip anchorEl={tooltipAnchorRef.current} onMouseEnter={handleTooltipOpen} onMouseLeave={handleTooltipClose}>
          <h4 className="mb-2 font-semibold text-slate-800">Supported Patterns</h4>
          <ul className="list-inside list-disc space-y-2 text-xs">
            <li>
              <strong>Exact domain:</strong> <code className="rounded bg-slate-100 p-1">example.com</code>
            </li>
            <li>
              <strong>Subdomains:</strong> <code className="rounded bg-slate-100 p-1">*.example.com</code>
            </li>
            <li>
              <strong>URL paths:</strong> <code className="rounded bg-slate-100 p-1">example.com/path/*</code>
            </li>
            <li>
              <strong>Regular expression:</strong> <code className="rounded bg-slate-100 p-1">/google\.com/</code>
            </li>
          </ul>
          <p className="mt-2 text-xs text-slate-500">Regex and path patterns match against the full URL (e.g., `domain.com/path`).</p>
        </Tooltip>
      )}
    </div>
  );
};
