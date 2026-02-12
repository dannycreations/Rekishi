import { useDevice } from '../../hooks/useDevice';
import { Icon } from '../shared/Icon';
import { Skeleton } from '../shared/Skeleton';

import type { JSX } from 'react';
import type { IconName } from '../shared/Icon';

const DEVICE_ICONS: Record<string, IconName> = {
  laptop: 'Laptop',
  phone: 'Smartphone',
  desktop: 'Monitor',
} as const;

const DeviceCardSkeleton = (): JSX.Element => {
  return (
    <div className="card flex items-center space-x-2 p-2">
      <Skeleton className="h-14 w-14 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
      </div>
    </div>
  );
};

export const DeviceView = (): JSX.Element => {
  const { devices, isLoading, error } = useDevice();

  return (
    <div className="layout-stack-md">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <DeviceCardSkeleton />
          <DeviceCardSkeleton />
          <DeviceCardSkeleton />
        </div>
      ) : error ? (
        <div className="btn-danger p-3 text-center">{error}</div>
      ) : devices.length === 0 ? (
        <div className="centered-view">
          <Icon name="Smartphone" className="icon-xxl text-text-tertiary" />
          <h3 className="txt-title-lg">No Other Devices Found</h3>
          <p className="txt-muted">It looks like you're not signed into Chrome on any other devices. Sign in on another device to sync history.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => {
            const iconName = DEVICE_ICONS[device.type] || 'Monitor';
            return (
              <div key={device.name} className="card flex items-center space-x-2 p-2">
                <div className="rounded-full bg-surface-hover p-2">
                  <Icon name={iconName} className="icon-xl text-text-secondary" />
                </div>
                <div>
                  <h3 className="txt-highlight">{device.name}</h3>
                  <p className="txt-muted">Last synced: {device.lastSync}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
