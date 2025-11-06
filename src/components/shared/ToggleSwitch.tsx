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
      className={`flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      onClick={() => !disabled && setEnabled(!enabled)}
    >
      <div className="relative">
        <div className={`block h-8 w-14 rounded-full transition-colors ${enabled ? 'bg-slate-800' : 'bg-slate-200'}`} />
        <div className={`dot absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : ''}`} />
      </div>
    </div>
  );
});
