import { memo, useCallback, useState } from 'react';

import { useToastStore } from '../../stores/useToastStore';
import { parseInput } from '../../utilities/blacklistUtil';
import { CheckIcon, CloseIcon, PencilIcon, TrashIcon } from '../shared/Icons';

import type { JSX, KeyboardEvent } from 'react';
import type { BlacklistItem as BlacklistItemType } from '../../utilities/blacklistUtil';

interface BlacklistItemProps {
  readonly item: BlacklistItemType;
  readonly onEdit: (oldValue: string, newValue: string, newIsRegex: boolean) => void;
  readonly onRemove: (value: string) => void;
}

export const BlacklistItem = memo(({ item, onEdit, onRemove }: BlacklistItemProps): JSX.Element => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.isRegex ? `/${item.value}/` : item.value);
  const addToast = useToastStore((state) => state.addToast);

  const handleRemove = useCallback((): void => {
    onRemove(item.value);
  }, [item.value, onRemove]);

  const handleEdit = useCallback((): void => {
    setIsEditing(true);
  }, []);

  const handleCancel = useCallback((): void => {
    setIsEditing(false);
    setEditValue(item.isRegex ? `/${item.value}/` : item.value);
  }, [item]);

  const handleSave = useCallback((): void => {
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
    (e: KeyboardEvent<HTMLInputElement>): void => {
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
      <li className="flex items-center justify-between rounded-md bg-slate-100 px-2 py-1">
        <input
          autoFocus
          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-2 focus:ring-slate-400"
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          type="text"
          value={editValue}
        />
        <div className="ml-2 flex items-center space-x-1">
          <button className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-green-100 hover:text-green-600" onClick={handleSave}>
            <CheckIcon className="h-4 w-4" />
          </button>
          <button className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-800" onClick={handleCancel}>
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="group flex items-center justify-between rounded-md px-2 py-1 transition-colors hover:bg-slate-50">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-slate-600">{item.value}</span>
        {item.isRegex && <span className="rounded-md bg-slate-200 p-1 font-mono text-xs font-semibold text-slate-600">REGEX</span>}
      </div>
      <div className="flex items-center space-x-1">
        <button className="cursor-pointer rounded-md p-1 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-800" onClick={handleEdit}>
          <PencilIcon className="h-4 w-4" />
        </button>
        <button className="cursor-pointer rounded-md p-1 text-slate-400 transition-all hover:bg-red-100 hover:text-red-500" onClick={handleRemove}>
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
});
