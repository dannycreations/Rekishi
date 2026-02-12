export const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
};

export const formatDayHeader = (date: Date): string => {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${weekday}, ${year}/${month}/${day}`;
};

export const getDayBoundaries = (date: Date): { startTime: number; endTime: number } => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { startTime: start.getTime(), endTime: end.getTime() };
};

export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}/${month}/${day}`;
};

export const formatTimeShort = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const seconds = Math.round((now - timestamp) / 1000);

  if (seconds < 60) {
    return `a moment ago`;
  }

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    const plural = minutes > 1 ? 's' : '';
    return `${minutes} minute${plural} ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    const plural = hours > 1 ? 's' : '';
    return `${hours} hour${plural} ago`;
  }

  const days = Math.round(hours / 24);
  if (days === 1) {
    return 'Yesterday';
  }
  if (days < 7) {
    return `${days} days ago`;
  }

  const weeks = Math.round(days / 7);
  if (weeks < 5) {
    const plural = weeks > 1 ? 's' : '';
    return `${weeks} week${plural} ago`;
  }

  const months = Math.round(days / 30);
  if (months < 12) {
    const plural = months > 1 ? 's' : '';
    return `${months} month${plural} ago`;
  }

  const years = Math.round(days / 365);
  const plural = years > 1 ? 's' : '';
  return `${years} year${plural} ago`;
};
