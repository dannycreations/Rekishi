import { memo } from 'react';

import { Skeleton } from '../shared/Skeleton';

import type { JSX } from 'react';

const HistoryViewItemSkeleton = memo((): JSX.Element => {
  return (
    <div className="item-list pointer-events-none">
      <div className="layout-flex-center">
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="icon-md rounded" />
      <div className="min-w-0 flex-1">
        <div>
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
        <div className="mt-1">
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      </div>
      <div className="ml-2 flex h-6 w-32 shrink-0 items-center justify-end">
        <Skeleton className="h-3 w-12 rounded" />
      </div>
    </div>
  );
});

export const HistoryViewGroupSkeleton = memo((): JSX.Element => {
  return (
    <section>
      <div className="section-header">
        <Skeleton className="h-4 w-12 rounded" />
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
        <div className="checkbox-custom rounded" />
        <Skeleton className="h-5 w-48 rounded" />
      </div>
      <div className="flex items-center space-x-2">
        <div className="btn-danger opacity-50 pointer-events-none">
          <Skeleton className="icon-xs mr-1 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </div>
    </div>
  );
});

export const HistoryViewSkeleton = memo((): JSX.Element => {
  return (
    <div className="layout-stack-md main-content-padded pointer-events-none">
      <section>
        <DailyGroupHeaderSkeleton />
        <hr className="my-2 border-line" />
        <div className="layout-stack-sm">
          <HistoryViewGroupSkeleton />
          <HistoryViewGroupSkeleton />
        </div>
      </section>
      <section>
        <DailyGroupHeaderSkeleton />
        <hr className="my-2 border-line" />
        <div className="layout-stack-sm">
          <HistoryViewGroupSkeleton />
        </div>
      </section>
    </div>
  );
});
