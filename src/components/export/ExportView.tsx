import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { useHistoryDate } from '../../hooks/useHistoryDate';
import { search } from '../../services/chromeApi';
import { useToastStore } from '../../stores/useToastStore';
import { formatDateForInput } from '../../utilities/dateUtil';
import { downloadFile, generateFileContent } from '../../utilities/exportUtil';
import { CalendarPopover } from '../shared/CalendarPopover';
import { CalendarIcon, LoadingSpinnerIcon } from '../shared/Icons';

import type { JSX } from 'react';
import type { ExportFormat } from '../../utilities/exportUtil';

interface RadioCardProps {
  checked: boolean;
  description: string;
  label: string;
  onChange: (value: ExportFormat) => void;
  value: ExportFormat;
}

const RadioCard = memo(({ checked, value, label, description, onChange }: RadioCardProps) => (
  <label className="flex flex-1 cursor-pointer items-center space-x-2 rounded-lg border border-slate-200 p-3 has-checked:border-slate-400 has-checked:bg-slate-50">
    <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
      <input checked={checked} className="peer sr-only" name="format" onChange={() => onChange(value)} type="radio" value={value} />
      <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-300 transition-colors peer-checked:border-slate-800">
        <div className="h-2 w-2 rounded-full transition-colors peer-checked:bg-slate-800" />
      </div>
    </div>
    <div>
      <span className="font-semibold text-slate-700">{label}</span>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  </label>
));

export const ExportView = (): JSX.Element => {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [isLoading, setIsLoading] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  const [endDate, setEndDate] = useState(() => {
    return formatDateForInput(new Date());
  });
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateForInput(d);
  });

  const [activeCalendar, setActiveCalendar] = useState<'start' | 'end' | null>(null);
  const startDateTriggerRef = useRef<HTMLButtonElement>(null);
  const endDateTriggerRef = useRef<HTMLButtonElement>(null);

  const { datesWithHistory, fetchDatesForMonth, isLoading: isLoadingDates } = useHistoryDate();

  const handleExport = useCallback(async () => {
    setIsLoading(true);

    try {
      const start = new Date(`${startDate.replace(/\//g, '-')}T00:00:00`);
      const end = new Date(`${endDate.replace(/\//g, '-')}T23:59:59.999`);

      if (start > end) {
        addToast('Start date cannot be after end date.', 'error');
        return;
      }

      const historyItems = await search({
        endTime: end.getTime(),
        maxResults: 0,
        startTime: start.getTime(),
        text: '',
      });

      if (historyItems.length === 0) {
        addToast('No history found for the selected date range.', 'info');
        return;
      }

      const fileContent = generateFileContent(historyItems, format);
      downloadFile(fileContent, format, startDate.replace(/\//g, '-'), endDate.replace(/\//g, '-'));
      addToast('History export started.', 'success');
    } catch (error: unknown) {
      addToast('An error occurred during export. Please try again.', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, format, addToast]);

  const activeAnchorEl = useMemo(() => {
    if (activeCalendar === 'start') return startDateTriggerRef.current;
    if (activeCalendar === 'end') return endDateTriggerRef.current;
    return null;
  }, [activeCalendar]);

  const activeSelectedDate = useMemo(() => {
    const dateStr = activeCalendar === 'start' ? startDate : endDate;
    return new Date(`${dateStr.replace(/\//g, '-')}T00:00:00`);
  }, [activeCalendar, startDate, endDate]);

  const handleDateSelect = useCallback(
    (date: Date) => {
      const formatted = formatDateForInput(date);
      if (activeCalendar === 'start') {
        setStartDate(formatted);
      } else if (activeCalendar === 'end') {
        setEndDate(formatted);
      }
      setActiveCalendar(null);
    },
    [activeCalendar],
  );

  const minCalendarDate = useMemo(() => {
    if (activeCalendar === 'end') {
      return new Date(`${startDate.replace(/\//g, '-')}T00:00:00`);
    }
    return undefined;
  }, [activeCalendar, startDate]);

  const maxCalendarDate = useMemo(() => {
    if (activeCalendar === 'start') {
      return new Date(`${endDate.replace(/\//g, '-')}T00:00:00`);
    }
    return new Date();
  }, [activeCalendar, endDate]);

  return (
    <>
      <div className="space-y-3">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Date Range</h3>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium text-slate-600" htmlFor="start-date">
                  Start Date
                </label>
                <button
                  ref={startDateTriggerRef}
                  id="start-date"
                  className="mt-1 flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-white px-2 py-2 text-left transition-colors hover:bg-slate-100"
                  onClick={() => setActiveCalendar(activeCalendar === 'start' ? null : 'start')}
                >
                  <span className="text-sm text-slate-800">{startDate}</span>
                  <CalendarIcon className="h-4 w-4 text-slate-400" />
                </button>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600" htmlFor="end-date">
                  End Date
                </label>
                <button
                  ref={endDateTriggerRef}
                  id="end-date"
                  className="mt-1 flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-200 bg-white px-2 py-2 text-left transition-colors hover:bg-slate-100"
                  onClick={() => setActiveCalendar(activeCalendar === 'end' ? null : 'end')}
                >
                  <span className="text-sm text-slate-800">{endDate}</span>
                  <CalendarIcon className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800">Format</h3>
            <div className="mt-1 flex space-x-2">
              <RadioCard checked={format === 'json'} description="JavaScript Object Notation" label="JSON" onChange={setFormat} value="json" />
              <RadioCard checked={format === 'csv'} description="Comma-Separated Values" label="CSV" onChange={setFormat} value="csv" />
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
        </div>
      </div>
      <CalendarPopover
        anchorEl={activeAnchorEl}
        datesWithHistory={datesWithHistory}
        fetchDatesForMonth={fetchDatesForMonth}
        isLoading={isLoadingDates}
        maxDate={maxCalendarDate}
        minDate={minCalendarDate}
        onClose={() => setActiveCalendar(null)}
        onDateSelect={handleDateSelect}
        selectedDate={activeSelectedDate}
      />
    </>
  );
};
