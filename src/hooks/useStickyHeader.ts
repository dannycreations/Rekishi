import { useLayoutEffect, useRef, useState } from 'react';

import type { RefObject } from 'react';

interface ProcessedDayGroupForHook {
  readonly date: Date;
}

interface StickyState {
  readonly dayKey: string | null;
  readonly hourText: string | null;
}

export const useStickyHeader = (
  scrollContainerRef: RefObject<HTMLElement | null>,
  processedDailyGroups: readonly ProcessedDayGroupForHook[],
): StickyState => {
  const [stickyState, setStickyState] = useState<StickyState>({
    dayKey: null,
    hourText: null,
  });
  const headerPositions = useRef<{ readonly top: number; readonly dayKey: string; readonly hourText: string | null }[]>([]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const positions: { top: number; dayKey: string; hourText: string | null }[] = [];
    const headerElements = container.querySelectorAll<HTMLElement>('[data-day-key]');

    headerElements.forEach((el) => {
      positions.push({
        top: el.offsetTop,
        dayKey: el.dataset.dayKey!,
        hourText: el.dataset.hourKey || null,
      });
    });
    headerPositions.current = positions;

    const handleScroll = (): void => {
      const scrollTop = container.scrollTop;
      const currentPositions = headerPositions.current;
      let activeIndex = -1;

      let low = 0;
      let high = currentPositions.length - 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (currentPositions[mid].top <= scrollTop) {
          activeIndex = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      let activeDayKey: string | null = null;
      let activeHourText: string | null = null;

      if (activeIndex !== -1) {
        activeDayKey = currentPositions[activeIndex].dayKey;
        activeHourText = currentPositions[activeIndex].hourText;
      }

      setStickyState((prev) => {
        if (prev.dayKey === activeDayKey && prev.hourText === activeHourText) {
          return prev;
        }
        return { dayKey: activeDayKey, hourText: activeHourText };
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [processedDailyGroups, scrollContainerRef]);

  return stickyState;
};
