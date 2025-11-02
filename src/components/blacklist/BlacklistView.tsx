import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
      alert(parsed.error);
      return;
    }

    const { value: newValue, isRegex: newIsRegex } = parsed;
    if (item.value === newValue && item.isRegex === newIsRegex) {
      setIsEditing(false);
      return;
    }

    onEdit(item.value, newValue, newIsRegex);
    setIsEditing(false);
  }, [editValue, item, onEdit]);

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
      <li className="flex items-center justify-between p-2 rounded-md bg-slate-100">
        <input
          autoFocus
          className="w-full px-2 py-1 text-sm bg-white border rounded-md outline-none text-slate-900 transition-colors border-slate-200 focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          type="text"
          value={editValue}
        />
        <div className="flex items-center ml-2 space-x-1">
          <button className="p-1 rounded-md cursor-pointer text-slate-400 hover:bg-green-100 hover:text-green-600" onClick={handleSave} title="Save">
            <CheckIcon className="w-4 h-4" />
          </button>
          <button
            className="p-1 rounded-md cursor-pointer text-slate-400 hover:bg-slate-200 hover:text-slate-800"
            onClick={handleCancel}
            title="Cancel"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between p-2 transition-colors rounded-md group hover:bg-slate-50">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-slate-600">{item.value}</span>
        {item.isRegex && <span className="px-2 py-1 text-xs font-mono font-semibold rounded-md bg-slate-200 text-slate-600">REGEX</span>}
      </div>
      <div className="flex items-center space-x-1">
        <button
          className="p-1 transition-all rounded-md cursor-pointer text-slate-400 hover:bg-slate-100 hover:text-slate-800"
          onClick={handleEdit}
          title={`Edit ${item.value}`}
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          className="p-1 transition-all rounded-md cursor-pointer text-slate-400 hover:bg-red-100 hover:text-red-500"
          onClick={handleRemove}
          title={`Remove ${item.value}`}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
});

export const BlacklistView = memo((): JSX.Element => {
  const { addDomain, blacklistedItems, removeDomain, editDomain } = useBlacklistStore();
  const [newDomain, setNewDomain] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
      const parsed = parseInput(newDomain);

      if (!parsed) {
        return;
      }

      if ('error' in parsed) {
        alert(parsed.error);
        return;
      }

      const { value, isRegex } = parsed;

      if (blacklistedValues.has(value)) {
        alert('This item already exists in the blacklist.');
        return;
      }

      addDomain(value, isRegex);
      setNewDomain('');
    },
    [newDomain, addDomain, blacklistedValues],
  );

  const handleRemoveDomain = useCallback(
    (valueToRemove: string): void => {
      removeDomain(valueToRemove);
    },
    [removeDomain],
  );

  const handleEditDomain = useCallback(
    (oldValue: string, newValue: string, newIsRegex: boolean) => {
      if (oldValue !== newValue && blacklistedValues.has(newValue)) {
        alert('This item already exists in the blacklist.');
        return;
      }
      editDomain(oldValue, newValue, newIsRegex);
    },
    [blacklistedValues, editDomain],
  );

  return (
    <div className="space-y-4">
      <form className="flex items-center space-x-2" onSubmit={handleAddDomain}>
        <div className="relative grow">
          <input
            ref={inputRef}
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
                title="Clear input"
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
              <BlacklistItem key={item.value} item={item} onEdit={handleEditDomain} onRemove={handleRemoveDomain} />
            ))}
          </ul>
        ) : (
          <p className="py-4 text-sm text-center text-slate-500">Your blacklist is empty. Add domains using the form above.</p>
        )}
      </div>
    </div>
  );
});
