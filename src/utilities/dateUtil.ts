export function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export function formatDayHeader(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${weekday}, ${year}/${month}/${day}`;
}
