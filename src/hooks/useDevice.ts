import { useEffect, useState } from 'react';

import { getDevices } from '../services/chromeApi';
import { formatTimeAgo } from '../utilities/dateUtil';

import type { ChromeDevice, Device } from '../app/types';

interface UseDeviceReturn {
  readonly devices: readonly Device[];
  readonly isLoading: boolean;
  readonly error: string | null;
}

const getDeviceTypeFromName = (name: string): Device['type'] => {
  const lowerName = name.toLowerCase();
  if (['pixel', 'iphone', 'galaxy', 'android', 'phone'].some((s) => lowerName.includes(s))) {
    return 'phone';
  }
  if (['macbook', 'pixelbook', 'chromebook', 'laptop'].some((s) => lowerName.includes(s))) {
    return 'laptop';
  }
  return 'desktop';
};

export const useDevice = (): UseDeviceReturn => {
  const [devices, setDevices] = useState<readonly Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const rawDevices = await getDevices();
        const mappedDevices = rawDevices.map((d: ChromeDevice) => {
          const mostRecent = Math.max(0, ...d.sessions.map((session) => session.lastModified * 1000));

          return {
            lastSync: mostRecent > 0 ? formatTimeAgo(mostRecent) : 'Unknown',
            name: d.deviceName,
            type: getDeviceTypeFromName(d.deviceName),
          };
        });
        setDevices(mappedDevices);
      } catch (error: unknown) {
        console.error('Failed to fetch devices:', error);
        setError('Could not load device information.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();
  }, []);

  return { devices, isLoading, error };
};
