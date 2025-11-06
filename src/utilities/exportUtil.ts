import type { ChromeHistoryItem } from '../app/types';

export type ExportFormat = 'json' | 'csv';

export function generateFileContent(items: readonly ChromeHistoryItem[], format: ExportFormat): string {
  if (format === 'json') {
    return JSON.stringify(items, null, 2);
  }

  const header = ['id', 'url', 'title', 'lastVisitTime', 'visitCount'];
  const escapeCsvField = (field: string | number | undefined): string => {
    const str = String(field ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvRows = [header.join(',')];
  for (const item of items) {
    const row = [
      escapeCsvField(item.id),
      escapeCsvField(item.url),
      escapeCsvField(item.title),
      escapeCsvField(item.lastVisitTime),
      escapeCsvField(item.visitCount),
    ];
    csvRows.push(row.join(','));
  }
  return csvRows.join('\n');
}

export function downloadFile(content: string, format: ExportFormat, startDate: string, endDate: string): void {
  const mimeType = format === 'json' ? 'application/json' : 'text/csv';
  const fileExtension = format;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rekishi_export_${startDate}_to_${endDate}.${fileExtension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
