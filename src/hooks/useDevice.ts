import { useEffect, useState } from 'react';

import { getDevices } from '../services/chromeApi';

import type { Device } from '../app/types';

interface UseDeviceReturn {
  devices: Device[];
  isLoading: boolean;
  error: string | null;
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
        const deviceList = await getDevices();
        setDevices(deviceList);
      } catch (err: unknown) {
        console.error('Failed to fetch devices:', err);
        setError('Could not load device information.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();
  }, []);

  return { devices, isLoading, error };
};
