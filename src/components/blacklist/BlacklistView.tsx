import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { parseInput } from '../../helpers/blacklistHelper';
import { usePopover } from '../../hooks/usePopover';
import { useBlacklistStore } from '../../stores/useBlacklistStore';
import { useToastStore } from '../../stores/useToastStore';
import { Icon } from '../shared/Icon';
import { BlacklistItem } from './BlacklistItem';

import type { FormEvent, JSX, ReactNode } from 'react';

interface TooltipProps {
  readonly anchorEl: HTMLElement | null;
  readonly children: ReactNode;
  readonly onMouseEnter: () => void;
  readonly onMouseLeave: () => void;
}

const Tooltip = memo(({ anchorEl, children, onMouseEnter, onMouseLeave }: TooltipProps): JSX.Element | null => {
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
      className="fixed z-[101] w-72 rounded-lg border border-slate-200 bg-white p-3 txt-main shadow-lg popover-animate-enter"
    >
      {children}
    </div>,
    document.body,
  );
});

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
    (oldValue: string, newValue: string, newIsRegex: boolean): void => {
      if (oldValue !== newValue && blacklistedValues.has(newValue)) {
        addToast('This item already exists in the blacklist.', 'error');
        return;
      }
      editDomain(oldValue, newValue, newIsRegex);
      addToast('Blacklist item updated.', 'success');
    },
    [blacklistedValues, editDomain, addToast],
  );

  const handleTooltipOpen = useCallback((): void => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setIsTooltipOpen(true);
  }, []);

  const handleTooltipClose = useCallback((): void => {
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsTooltipOpen(false);
    }, 200);
  }, []);

  return (
    <div className="layout-stack-md">
      <div>
        <form className="flex items-center space-x-2" onSubmit={handleAddDomain}>
          <div className="relative grow">
            <input
              autoFocus
              className="input-base pl-2 pr-7"
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
                <button className="btn-ghost" onClick={() => setNewDomain('')} type="button">
                  <Icon name="X" className="icon-sm" />
                </button>
              )}
            </div>
          </div>
          <button className="btn-primary" disabled={!newDomain.trim()} type="submit">
            Add
          </button>
        </form>
        {error && <p className="mt-2 txt-error">{error}</p>}
      </div>

      <div className="card p-2">
        <div className="mb-2 layout-flex-between">
          <div className="flex items-center gap-2">
            <h3 className="txt-title-sm">Blacklisted Items ({sortedItems.length})</h3>
            <button
              ref={tooltipAnchorRef}
              className="btn-base text-slate-400 hover:text-slate-600"
              onMouseEnter={handleTooltipOpen}
              onMouseLeave={handleTooltipClose}
            >
              <Icon name="HelpCircle" className="icon-md" />
            </button>
          </div>
        </div>
        {sortedItems.length > 0 ? (
          <ul className="layout-stack-sm">
            {sortedItems.map((item) => (
              <BlacklistItem key={item.value} item={item} onEdit={handleEditDomain} onRemove={handleRemoveDomain} />
            ))}
          </ul>
        ) : (
          <p className="py-3 text-center txt-muted">Your blacklist is empty. Add domains using the form above.</p>
        )}
      </div>

      {isTooltipOpen && (
        <Tooltip anchorEl={tooltipAnchorRef.current} onMouseEnter={handleTooltipOpen} onMouseLeave={handleTooltipClose}>
          <h4 className="mb-2 txt-title-sm">Supported Patterns</h4>
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
          <p className="mt-2 txt-muted">Regex and path patterns match against the full URL (e.g., `domain.com/path`).</p>
        </Tooltip>
      )}
    </div>
  );
};
