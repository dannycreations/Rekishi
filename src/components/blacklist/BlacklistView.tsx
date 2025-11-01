import { memo, useCallback, useMemo, useState } from 'react';

import { useBlacklistStore } from '../../stores/useBlacklistStore';
import { CloseIcon, TrashIcon } from '../shared/Icons';

import type { FormEvent, JSX } from 'react';
import type { BlacklistItem as BlacklistItemType } from '../../utilities/blacklistUtil';

interface BlacklistItemProps {
  item: BlacklistItemType;
  onRemove: (value: string) => void;
}

export const BlacklistItem = memo(({ item, onRemove }: BlacklistItemProps) => {
  const handleRemove = useCallback(() => {
    onRemove(item.value);
  }, [item.value, onRemove]);

  return (
    <li className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-slate-600">{item.value}</span>
        {item.isRegex && <span className="px-2 py-1 text-xs font-mono font-semibold rounded-md bg-slate-200 text-slate-600">REGEX</span>}
      </div>
      <button className="p-1 rounded-md cursor-pointer text-slate-400 hover:bg-red-100 hover:text-red-500" onClick={handleRemove}>
        <TrashIcon className="w-4 h-4" />
      </button>
    </li>
  );
});

export const BlacklistView = memo((): JSX.Element => {
  const { addDomain, blacklistedItems, removeDomain } = useBlacklistStore();
  const [newDomain, setNewDomain] = useState('');

  const sortedItems = useMemo(() => [...blacklistedItems].sort((a, b) => a.value.localeCompare(b.value)), [blacklistedItems]);

  const handleAddDomain = useCallback(
    (e: FormEvent): void => {
      e.preventDefault();
      const trimmedDomain = newDomain.trim();
      if (!trimmedDomain) {
        return;
      }

      const isRegex = trimmedDomain.length > 2 && trimmedDomain.startsWith('/') && trimmedDomain.endsWith('/');
      const value = isRegex ? trimmedDomain.slice(1, -1) : trimmedDomain;

      if (!value) {
        return;
      }

      if (isRegex) {
        try {
          new RegExp(value);
        } catch (error) {
          alert('Invalid Regular Expression');
          return;
        }
      }

      addDomain(value, isRegex);
      setNewDomain('');
    },
    [newDomain, addDomain],
  );

  const handleRemoveDomain = useCallback(
    (valueToRemove: string): void => {
      removeDomain(valueToRemove);
    },
    [removeDomain],
  );

  return (
    <div className="space-y-3">
      <form className="flex items-center space-x-2" onSubmit={handleAddDomain}>
        <div className="relative grow">
          <input
            className="w-full py-2 pl-4 pr-10 text-sm bg-white text-slate-900 border rounded-lg outline-none transition-colors border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="e.g., example.com or /.*\\.bad-site\\.com/"
            type="text"
            value={newDomain}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            {newDomain && (
              <button
                className="p-1 rounded-md transition-colors cursor-pointer text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                onClick={() => setNewDomain('')}
                type="button"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <button
          className="px-2 py-2 text-sm font-semibold text-white transition-colors rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-700 disabled:bg-slate-500 disabled:cursor-not-allowed"
          disabled={!newDomain.trim()}
          type="submit"
        >
          Add
        </button>
      </form>

      <div className="p-3 bg-white border rounded-lg shadow-sm border-slate-200">
        <h3 className="mb-2 font-semibold text-slate-800">Blacklisted Items ({sortedItems.length})</h3>
        {sortedItems.length > 0 ? (
          <ul className="space-y-1">
            {sortedItems.map((item) => (
              <BlacklistItem key={item.value} item={item} onRemove={handleRemoveDomain} />
            ))}
          </ul>
        ) : (
          <p className="py-4 text-sm text-center text-slate-500">Your blacklist is empty. Add domains using the form above.</p>
        )}
      </div>
    </div>
  );
});
