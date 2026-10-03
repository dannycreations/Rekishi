import { cn } from 'cn';
import { memo } from 'react';

import type { HTMLAttributes, JSX } from 'react';

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export const Skeleton = memo(({ className, ...props }: SkeletonProps): JSX.Element => {
  return <div className={cn('skeleton-base', className)} {...props} />;
});
