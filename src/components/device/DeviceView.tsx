import { useDevice } from '../../hooks/useDevice';
import { DesktopIcon, DevicesIcon, LaptopIcon } from '../shared/Icons';
import { Skeleton } from '../shared/Skeleton';

import type { JSX } from 'react';

const DEVICE_ICONS = {
  laptop: LaptopIcon,
  phone: DevicesIcon,
  desktop: DesktopIcon,
} as const;

const DeviceCardSkeleton = (): JSX.Element => {
  return (
    <div className="flex items-center space-x-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
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
    <div className="space-y-3">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <DeviceCardSkeleton />
          <DeviceCardSkeleton />
          <DeviceCardSkeleton />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 p-3 text-center text-red-600">{error}</div>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-3 text-center">
          <DevicesIcon className="mb-2 h-16 w-16 text-slate-400" />
          <h3 className="text-xl font-semibold text-slate-700">No Other Devices Found</h3>
          <p className="mt-2 text-slate-500">
            It looks like you're not signed into Chrome on any other devices. Sign in on another device to sync history.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => {
            const IconComponent = DEVICE_ICONS[device.type] || DesktopIcon;
            return (
              <div key={device.name} className="flex items-center space-x-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
                <div className="rounded-full bg-slate-100 p-2">
                  <IconComponent className="h-8 w-8 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{device.name}</h3>
                  <p className="text-sm text-slate-500">Last synced: {device.lastSync}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
