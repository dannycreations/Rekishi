export const formatNumericDate = (date: Date, separator: string): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}${separator}${month}${separator}${day}`;
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
};

export const formatDayHeader = (date: Date): string => {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  return `${weekday}, ${formatNumericDate(date, '/')}`;
};

export const startOfDay = (date: Date): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

export const getDayBoundaries = (date: Date): { startTime: number; endTime: number } => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { startTime: startOfDay(date).getTime(), endTime: end.getTime() };
};

export const parseDateFromInput = (value: string): Date => {
  return new Date(`${value.replace(/\//g, '-')}T00:00:00`);
};

export const formatTimeShort = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
