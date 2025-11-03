import { useCallback, useMemo, useState } from 'react';

import { useBlacklistStore } from '../../stores/useBlacklistStore';
import { useToastStore } from '../../stores/useToastStore';
import { parseInput } from '../../utilities/blacklistUtil';
import { CloseIcon } from '../shared/Icons';
import { BlacklistItem } from './BlacklistItem';

import type { FormEvent, JSX } from 'react';

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

  return (
    <div className="space-y-4">
      <div>
        <form className="flex items-center space-x-2" onSubmit={handleAddDomain}>
          <div className="relative grow">
            <input
              autoFocus
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-4 pr-10 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-400"
              onChange={(e) => {
                setNewDomain(e.target.value);
                setError(null);
              }}
              placeholder="e.g., example.com or /.*\\.bad-site\\.com/"
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
            className="cursor-pointer rounded-lg bg-slate-800 px-2 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
            disabled={!newDomain.trim()}
            type="submit"
          >
            Add
          </button>
        </form>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <h3 className="mb-2 font-semibold text-slate-800">Blacklisted Items ({sortedItems.length})</h3>
        {sortedItems.length > 0 ? (
          <ul className="space-y-1">
            {sortedItems.map((item) => (
              <BlacklistItem key={item.value} item={item} onEdit={handleEditDomain} onRemove={handleRemoveDomain} />
            ))}
          </ul>
        ) : (
          <p className="py-4 text-center text-sm text-slate-500">Your blacklist is empty. Add domains using the form above.</p>
        )}
      </div>
    </div>
  );
};
