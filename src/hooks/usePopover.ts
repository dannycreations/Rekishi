import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import type { CSSProperties, RefObject } from 'react';

interface UsePopoverReturn {
  readonly popoverRef: RefObject<HTMLDivElement | null>;
  readonly style: CSSProperties;
}

export const usePopover = (anchorEl: HTMLElement | null): UsePopoverReturn => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({
    position: 'fixed',
    top: '-9999px',
    left: '-9999px',
  });

  const updatePosition = useCallback(() => {
    if (anchorEl && popoverRef.current) {
      const anchorRect = anchorEl.getBoundingClientRect();
      const popoverEl = popoverRef.current;
      const popoverWidth = popoverEl.offsetWidth;
      const popoverHeight = popoverEl.offsetHeight;

      let left = anchorRect.right - popoverWidth;
      if (left < 8) {
        left = 8;
      }
      if (left + popoverWidth > window.innerWidth - 8) {
        left = window.innerWidth - popoverWidth - 8;
      }

      let top = anchorRect.bottom + 8;
      if (top + popoverHeight > window.innerHeight && anchorRect.top > popoverHeight + 8) {
        top = anchorRect.top - popoverHeight - 8;
      }

      if (top < 0) {
        top = 8;
      }

      setStyle((prevStyle) => {
        const newTop = `${top}px`;
        const newLeft = `${left}px`;
        if (prevStyle.top === newTop && prevStyle.left === newLeft) {
          return prevStyle;
        }
        return {
          position: 'fixed',
          top: newTop,
          left: newLeft,
        };
      });
    } else {
      setStyle({
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
      });
    }
  }, [anchorEl]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition]);

  useEffect(() => {
    if (!anchorEl) {
      return;
    }

    const observer = new ResizeObserver(updatePosition);
    if (popoverRef.current) {
      observer.observe(popoverRef.current);
    }
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorEl, updatePosition]);

  return { popoverRef, style };
};
