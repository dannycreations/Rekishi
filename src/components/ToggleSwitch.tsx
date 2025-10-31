import { memo } from 'react';

import type { JSX } from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  id: string;
  setEnabled: (enabled: boolean) => void;
}

function ToggleSwitchFn({ enabled, setEnabled, id }: ToggleSwitchProps): JSX.Element {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer">
      <div className="relative">
        <input checked={enabled} className="sr-only" id={id} onChange={() => setEnabled(!enabled)} type="checkbox" />
        <div className={`block h-8 w-14 rounded-full transition-colors ${enabled ? 'bg-slate-800' : 'bg-slate-200'}`} />
        <div className={`dot absolute top-1 left-1 h-6 w-6 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : ''}`} />
      </div>
    </label>
  );
}

export const ToggleSwitch = memo(ToggleSwitchFn);
