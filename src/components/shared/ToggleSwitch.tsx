import { memo } from 'react';

import type { JSX } from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const ToggleSwitch = memo(({ enabled, setEnabled }: ToggleSwitchProps): JSX.Element => {
  return (
    <div className="flex items-center cursor-pointer" onClick={() => setEnabled(!enabled)}>
      <div className="relative">
        <div className={`block h-8 w-14 rounded-full transition-colors ${enabled ? 'bg-slate-800' : 'bg-slate-200'}`} />
        <div className={`dot absolute top-1 left-1 h-6 w-6 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : ''}`} />
      </div>
    </div>
  );
});
