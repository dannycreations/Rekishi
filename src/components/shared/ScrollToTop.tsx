import { memo } from 'react';

import { ArrowUpIcon } from './Icons';

import type { JSX } from 'react';

interface ScrollToTopProps {
  readonly isVisible: boolean;
  readonly onClick: () => void;
}

export const ScrollToTop = memo(({ isVisible, onClick }: ScrollToTopProps): JSX.Element => {
  return (
    <button
      className={`fixed bottom-3 right-3 z-10 cursor-pointer rounded-full bg-slate-800 p-3 text-white shadow-lg transition-transform duration-300 ease-in-out hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 ${
        isVisible ? 'scale-100' : 'scale-0'
      }`}
      onClick={onClick}
      type="button"
    >
      <ArrowUpIcon className="h-6 w-6" />
    </button>
  );
});
