import { clsx } from 'clsx';
import { memo } from 'react';

import { Icon } from './Icon';

import type { JSX } from 'react';

interface ScrollToTopProps {
  readonly isVisible: boolean;
  readonly onClick: () => void;
}

export const ScrollToTop = memo(({ isVisible, onClick }: ScrollToTopProps): JSX.Element => {
  return (
    <button
      className={clsx('scroll-to-top transition-transform duration-300 ease-in-out', isVisible ? 'scale-100' : 'scale-0')}
      onClick={onClick}
      type="button"
    >
      <Icon name="ArrowUp" className="icon-lg" />
    </button>
  );
});
