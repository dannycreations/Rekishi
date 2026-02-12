import { memo, useCallback, useState } from 'react';

import { parseInput } from '../../helpers/blacklistHelper';
import { useToastStore } from '../../stores/useToastStore';
import { Icon } from '../shared/Icon';

import type { JSX, KeyboardEvent } from 'react';
import type { BlacklistItem as BlacklistItemType } from '../../helpers/blacklistHelper';

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
      <li className="layout-flex-between item-list-selected rounded-md px-2 py-1">
        <input
          autoFocus
          className="input-base px-2 py-1"
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          type="text"
          value={editValue}
        />
        <div className="ml-2 flex items-center space-x-1">
          <button className="btn-success-ghost" onClick={handleSave}>
            <Icon name="Check" className="icon-sm" />
          </button>
          <button className="btn-ghost" onClick={handleCancel}>
            <Icon name="X" className="icon-sm" />
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="group item-list layout-flex-between">
      <div className="flex items-center space-x-2">
        <span className="txt-main">{item.value}</span>
        {item.isRegex && <span className="rounded-md bg-line p-1 font-mono txt-highlight txt-muted">REGEX</span>}
      </div>
      <div className="flex items-center space-x-1">
        <button className="btn-ghost" onClick={handleEdit}>
          <Icon name="Pencil" className="icon-sm" />
        </button>
        <button className="btn-danger-ghost" onClick={handleRemove}>
          <Icon name="Trash2" className="icon-sm" />
        </button>
      </div>
    </li>
  );
});
