import { memo } from 'react';

import type { JSX } from 'react';

interface ToggleSwitchProps {
  readonly disabled?: boolean;
  readonly enabled: boolean;
  readonly setEnabled: (enabled: boolean) => void;
}

export const ToggleSwitch = memo(({ enabled, setEnabled, disabled = false }: ToggleSwitchProps): JSX.Element => {
  return (
    <div
      className={`toggle-switch ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      onClick={() => !disabled && setEnabled(!enabled)}
    >
      <div className="relative">
        <div className={`toggle-switch-track ${enabled ? 'bg-primary' : 'bg-line'}`} />
        <div className={`toggle-switch-thumb ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </div>
  );
});
