import { memo } from 'react';

import { ArrowUpIcon } from './Icons';

import type { JSX } from 'react';

interface ScrollToTopProps {
  isVisible: boolean;
  onClick: () => void;
}

export const ScrollToTop = memo(({ isVisible, onClick }: ScrollToTopProps): JSX.Element => {
  return (
    <button
      aria-label="Scroll to top"
      className={`
        fixed bottom-6 right-6 z-10 p-3 rounded-full shadow-lg transition-transform duration-300 ease-in-out
        bg-slate-800 text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2
        ${isVisible ? 'scale-100' : 'scale-0'}
      `}
      onClick={onClick}
      title="Scroll to top"
      type="button"
    >
      <ArrowUpIcon className="w-6 h-6" />
    </button>
  );
});

ScrollToTop.displayName = 'ScrollToTop';
