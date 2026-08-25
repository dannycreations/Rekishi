import { memo } from 'react';

import { Skeleton } from '../shared/Skeleton';

import type { JSX } from 'react';

const HistoryViewItemSkeleton = memo((): JSX.Element => {
  return (
    <div className="item-list">
      <div className="layout-flex-center">
        <div className="checkbox-custom" />
      </div>
      <Skeleton className="icon-md rounded" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center">
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
        <div className="mt-1">
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      </div>
      <div className="relative ml-2 flex h-6 w-32 shrink-0 items-center justify-end">
        <Skeleton className="h-3 w-12 rounded" />
      </div>
    </div>
  );
});

export const HistoryViewGroupSkeleton = memo((): JSX.Element => {
  return (
    <section>
      <div className="section-header">
        <Skeleton className="h-4 w-16 rounded" />
        <div className="btn-danger opacity-50 pointer-events-none">
          <Skeleton className="icon-xs mr-1 rounded" />
          <Skeleton className="h-3 w-10 rounded" />
        </div>
      </div>
      <div className="layout-stack-sm">
        <HistoryViewItemSkeleton />
        <HistoryViewItemSkeleton />
        <HistoryViewItemSkeleton />
      </div>
    </section>
  );
});

const DailyGroupHeaderSkeleton = memo((): JSX.Element => {
  return (
    <div className="section-header">
      <div className="flex items-center gap-2">
        <div className="checkbox-custom" />
        <Skeleton className="h-5 w-48 rounded" />
      </div>
      <div className="flex items-center gap-2">
        <div className="btn-danger opacity-50 pointer-events-none">
          <Skeleton className="icon-xs mr-1 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      </div>
    </div>
  );
});

export const HistoryViewSkeleton = memo((): JSX.Element => {
  return (
    <div className="main-content-padded pointer-events-none">
      <section>
        <div className="sticky-header pt-3">
          <DailyGroupHeaderSkeleton />
          <hr className="mx-2 mt-3 border-line" />
        </div>
        <div className="layout-stack-md mt-3">
          <HistoryViewGroupSkeleton />
          <HistoryViewGroupSkeleton />
          <HistoryViewGroupSkeleton />
          <HistoryViewGroupSkeleton />
        </div>
      </section>
    </div>
  );
});
