import { memo } from 'react';

import { DAYS_OF_WEEK } from '../../app/constants';
import { Skeleton } from './Skeleton';

import type { JSX } from 'react';

export const CalendarSkeleton = memo((): JSX.Element => {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="text-xs font-medium text-slate-500">
            {day}
          </div>
        ))}
        {Array.from({ length: 35 }).map((_, index) => (
          <div key={`skeleton-day-${index}`} className="flex items-center justify-center py-1">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
});
