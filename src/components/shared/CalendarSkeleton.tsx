import { memo } from 'react';

import { DAYS_OF_WEEK } from '../../app/constants';
import { Skeleton } from './Skeleton';

import type { JSX } from 'react';

export const CalendarSkeleton = memo((): JSX.Element => {
  return (
    <div>
      <div className="section-header">
        <Skeleton className="icon-xl rounded-full" />
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="icon-xl rounded-full" />
      </div>
      <div className="grid-calendar gap-y-1">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="txt-label">
            {day}
          </div>
        ))}
        {Array.from({ length: 35 }).map((_, index) => (
          <div key={`skeleton-day-${index}`} className="flex items-center justify-center py-1">
            <Skeleton className="icon-xl rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
});
