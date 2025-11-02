import { memo, useCallback, useState } from 'react';

import { search } from '../../services/chromeApi';
import { LoadingSpinnerIcon } from '../shared/Icons';

import type { JSX } from 'react';
import type { ChromeHistoryItem } from '../../app/types';

type ExportFormat = 'json' | 'csv';

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

function generateFileContent(items: ChromeHistoryItem[], format: ExportFormat): string {
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

function downloadFile(content: string, format: ExportFormat, startDate: string, endDate: string): void {
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

export const ExportView = memo((): JSX.Element => {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'info' } | null>(null);

  const [endDate, setEndDate] = useState(() => {
    return formatDateForInput(new Date());
  });
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateForInput(d);
  });

  const handleExport = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      if (start > end) {
        setMessage({ type: 'error', text: 'Start date cannot be after end date.' });
        return;
      }

      const historyItems = await search({
        startTime: start.getTime(),
        endTime: end.getTime(),
        text: '',
      });

      if (historyItems.length === 0) {
        setMessage({ type: 'info', text: 'No history found for the selected date range.' });
        return;
      }

      const fileContent = generateFileContent(historyItems, format);
      downloadFile(fileContent, format, startDate, endDate);
    } catch (err: unknown) {
      setMessage({ type: 'error', text: 'An error occurred during export. Please try again.' });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, format]);

  return (
    <div className="space-y-3">
      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Date Range</h3>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-slate-600">Start Date</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-400"
                id="start-date"
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                type="date"
                value={startDate}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">End Date</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-400"
                id="end-date"
                max={formatDateForInput(new Date())}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                type="date"
                value={endDate}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-800">Format</h3>
          <div className="mt-1 flex space-x-2">
            <label className="flex flex-1 cursor-pointer items-center space-x-2 rounded-lg border border-slate-200 p-3 has-checked:border-slate-400 has-checked:bg-slate-50">
              <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                <input
                  checked={format === 'json'}
                  className="peer sr-only"
                  name="format"
                  onChange={() => setFormat('json')}
                  type="radio"
                  value="json"
                />
                <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-300 transition-colors peer-checked:border-slate-800">
                  <div className="h-2 w-2 rounded-full transition-colors peer-checked:bg-slate-800" />
                </div>
              </div>
              <div>
                <span className="font-semibold text-slate-700">JSON</span>
                <p className="text-xs text-slate-500">JavaScript Object Notation</p>
              </div>
            </label>
            <label className="flex flex-1 cursor-pointer items-center space-x-2 rounded-lg border border-slate-200 p-3 has-checked:border-slate-400 has-checked:bg-slate-50">
              <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                <input checked={format === 'csv'} className="peer sr-only" name="format" onChange={() => setFormat('csv')} type="radio" value="csv" />
                <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-300 transition-colors peer-checked:border-slate-800">
                  <div className="h-2 w-2 rounded-full transition-colors peer-checked:bg-slate-800" />
                </div>
              </div>
              <div>
                <span className="font-semibold text-slate-700">CSV</span>
                <p className="text-xs text-slate-500">Comma-Separated Values</p>
              </div>
            </label>
          </div>
        </div>

        <button
          className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-slate-800 px-2 py-2 font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-wait disabled:bg-slate-500"
          disabled={isLoading}
          onClick={handleExport}
        >
          {isLoading ? (
            <>
              <LoadingSpinnerIcon className="mr-2 h-5 w-5 animate-spin" />
              Exporting...
            </>
          ) : (
            'Export History'
          )}
        </button>

        {message && <p className={`text-center text-sm ${message.type === 'error' ? 'text-red-600' : 'text-slate-600'}`}>{message.text}</p>}
      </div>
    </div>
  );
});
