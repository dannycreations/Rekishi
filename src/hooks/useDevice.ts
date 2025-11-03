import { useEffect, useState } from 'react';

import { getDevices } from '../services/chromeApi';
import { formatTimeAgo } from '../utilities/dateUtil';

import type { ChromeDevice, Device } from '../app/types';

interface UseDeviceReturn {
  devices: Device[];
  isLoading: boolean;
  error: string | null;
}

function getDeviceTypeFromName(name: string): Device['type'] {
  const lowerName = name.toLowerCase();
  if (['pixel', 'iphone', 'galaxy', 'android', 'phone'].some((s) => lowerName.includes(s))) {
    return 'phone';
  }
  if (['macbook', 'pixelbook', 'chromebook', 'laptop'].some((s) => lowerName.includes(s))) {
    return 'laptop';
  }
  return 'desktop';
}

export const useDevice = (): UseDeviceReturn => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const rawDevices = await getDevices();
        const mappedDevices = rawDevices.map((d: ChromeDevice) => {
          const mostRecent = d.sessions.reduce((latest, session) => {
            return Math.max(latest, session.lastModified * 1000);
          }, 0);

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
