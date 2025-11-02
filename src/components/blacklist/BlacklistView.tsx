import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useToast } from '../../hooks/useToast';
import { useBlacklistStore } from '../../stores/useBlacklistStore';
import { parseInput } from '../../utilities/blacklistUtil';
import { CheckIcon, CloseIcon, PencilIcon, TrashIcon } from '../shared/Icons';

import type { FormEvent, JSX, KeyboardEvent } from 'react';
import type { BlacklistItem as BlacklistItemType } from '../../utilities/blacklistUtil';

interface BlacklistItemProps {
  item: BlacklistItemType;
  onEdit: (oldValue: string, newValue: string, newIsRegex: boolean) => void;
  onRemove: (value: string) => void;
}

export const BlacklistItem = memo(({ item, onEdit, onRemove }: BlacklistItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.isRegex ? `/${item.value}/` : item.value);
  const { addToast } = useToast();

  const handleRemove = useCallback(() => {
    onRemove(item.value);
  }, [item.value, onRemove]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(item.isRegex ? `/${item.value}/` : item.value);
  }, [item]);

  const handleSave = useCallback(() => {
    const parsed = parseInput(editValue);

    if (!parsed) {
      return;
    }
    if ('error' in parsed) {
      addToast(parsed.error, 'error');
      return;
    }

    const { value: newValue, isRegex: newIsRegex } = parsed;
    if (item.value === newValue && item.isRegex === newIsRegex) {
      setIsEditing(false);
      return;
    }

    onEdit(item.value, newValue, newIsRegex);
    setIsEditing(false);
  }, [editValue, item, onEdit, addToast]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleSave, handleCancel],
  );

  if (isEditing) {
    return (
      <li className="flex items-center justify-between rounded-md bg-slate-100 p-2">
        <input
          autoFocus
          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-400"
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          type="text"
          value={editValue}
        />
        <div className="ml-2 flex items-center space-x-1">
          <button className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-green-100 hover:text-green-600" onClick={handleSave} title="Save">
            <CheckIcon className="h-4 w-4" />
          </button>
          <button
            className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-800"
            onClick={handleCancel}
            title="Cancel"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="group flex items-center justify-between rounded-md p-2 transition-colors hover:bg-slate-50">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-slate-600">{item.value}</span>
        {item.isRegex && <span className="rounded-md bg-slate-200 px-2 py-1 font-mono text-xs font-semibold text-slate-600">REGEX</span>}
      </div>
      <div className="flex items-center space-x-1">
        <button
          className="cursor-pointer rounded-md p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-800"
          onClick={handleEdit}
          title={`Edit ${item.value}`}
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          className="cursor-pointer rounded-md p-1 text-slate-400 transition-all hover:bg-red-100 hover:text-red-500"
          onClick={handleRemove}
          title={`Remove ${item.value}`}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
});

export const BlacklistView = memo((): JSX.Element => {
  const { addDomain, blacklistedItems, removeDomain, editDomain } = useBlacklistStore();
  const [newDomain, setNewDomain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, []);

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
              ref={inputRef}
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
                  title="Clear input"
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
});
