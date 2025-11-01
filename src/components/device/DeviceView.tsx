import { memo } from 'react';

import { useDevices } from '../../hooks/useDevices';
import { DesktopIcon, DevicesIcon, LaptopIcon } from '../shared/Icons';
import { Skeleton } from '../shared/Skeleton';

import type { JSX } from 'react';

const ICONS = {
  laptop: LaptopIcon,
  phone: DevicesIcon,
  desktop: DesktopIcon,
} as const;

export const DeviceCardSkeleton = memo((): JSX.Element => {
  return (
    <div className="flex items-center p-3 space-x-3 bg-white border rounded-lg shadow-sm border-slate-200">
      <Skeleton className="w-14 h-14 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="w-3/4 h-5 rounded" />
        <Skeleton className="w-1/2 h-4 rounded" />
      </div>
    </div>
  );
});

export const DeviceView = memo((): JSX.Element => {
  const { devices, isLoading, error } = useDevices();

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <DeviceCardSkeleton />
          <DeviceCardSkeleton />
          <DeviceCardSkeleton />
        </div>
      ) : error ? (
        <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg">{error}</div>
      ) : devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <DevicesIcon className="w-16 h-16 mb-4 text-slate-400" />
          <h3 className="text-xl font-semibold text-slate-700">No Other Devices Found</h3>
          <p className="mt-2 text-slate-500">
            It looks like you're not signed into Chrome on any other devices. Sign in on another device to sync history.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => {
            const IconComponent = ICONS[device.type] || DesktopIcon;
            return (
              <div
                key={device.name}
                className="flex items-center p-3 space-x-3 bg-white border rounded-lg shadow-sm transition-transform duration-200 border-slate-200 hover:scale-105"
              >
                <div className="p-3 rounded-full bg-slate-100">
                  <IconComponent className="w-8 h-8 text-slate-600" />
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
});
