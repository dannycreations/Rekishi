import { memo } from 'react';

import type { HTMLAttributes, JSX } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  readonly className?: string;
}

export const Skeleton = memo(({ className, ...props }: SkeletonProps): JSX.Element => {
  return <div className={`animate-pulse rounded-md bg-slate-200 ${className ?? ''}`} {...props} />;
});
