import { memo } from 'react';

import { Skeleton } from '../shared/Skeleton';

import type { JSX } from 'react';

const HistoryViewItemSkeleton = memo((): JSX.Element => {
  return (
    <div className="item-list">
      <Skeleton className="mr-2 icon-sm rounded" />
      <Skeleton className="mr-2 icon-sm rounded-full" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="mt-2 h-3 w-1/2 rounded" />
      </div>
      <Skeleton className="ml-2 h-4 w-20 shrink-0 rounded" />
    </div>
  );
});

export const HistoryViewGroupSkeleton = memo((): JSX.Element => {
  return (
    <section>
      <div className="layout-flex-between">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>
      <div className="flex flex-col">
        <HistoryViewItemSkeleton />
        <HistoryViewItemSkeleton />
        <HistoryViewItemSkeleton />
      </div>
    </section>
  );
});

const DailyGroupHeaderSkeleton = memo((): JSX.Element => {
  return (
    <div className="mb-3 layout-flex-between px-2">
      <div className="flex items-center gap-2">
        <Skeleton className="icon-sm rounded" />
        <Skeleton className="h-7 w-40 rounded" />
      </div>
      <Skeleton className="h-6 w-32 rounded-md" />
    </div>
  );
});

export const HistoryViewSkeleton = memo((): JSX.Element => {
  return (
    <div className="layout-stack-md p-3">
      <section>
        <DailyGroupHeaderSkeleton />
        <hr className="mb-3 border-slate-200" />
        <div className="layout-stack-sm">
          <HistoryViewGroupSkeleton />
          <HistoryViewGroupSkeleton />
        </div>
      </section>
      <section>
        <DailyGroupHeaderSkeleton />
        <hr className="mb-3 border-slate-200" />
        <div className="layout-stack-sm">
          <HistoryViewGroupSkeleton />
        </div>
      </section>
    </div>
  );
});
