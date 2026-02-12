import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { useHistoryDate } from '../../hooks/useHistoryDate';
import { search } from '../../services/chromeApi';
import { useToastStore } from '../../stores/useToastStore';
import { formatDateForInput } from '../../utilities/dateUtil';
import { downloadFile, generateFileContent } from '../../utilities/exportUtil';
import { CalendarPopover } from '../shared/CalendarPopover';
import { Icon } from '../shared/Icon';

import type { JSX } from 'react';
import type { ExportFormat } from '../../utilities/exportUtil';

interface RadioCardProps {
  readonly checked: boolean;
  readonly description: string;
  readonly label: string;
  readonly onChange: (value: ExportFormat) => void;
  readonly value: ExportFormat;
}

const RadioCard = memo(({ checked, value, label, description, onChange }: RadioCardProps): JSX.Element => {
  return (
    <label className={`radio-card ${checked ? 'radio-card-checked' : ''}`}>
      <div className={`radio-dot-container ${checked ? 'radio-dot-container-checked' : ''}`}>
        <input checked={checked} className="peer sr-only" name="format" onChange={() => onChange(value)} type="radio" value={value} />
        <div className={`radio-dot ${checked ? 'radio-dot-checked' : ''}`} />
      </div>
      <div>
        <span className="txt-highlight">{label}</span>
        <p className="txt-muted">{description}</p>
      </div>
    </label>
  );
});

export const ExportView = (): JSX.Element => {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [isLoading, setIsLoading] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  const [endDate, setEndDate] = useState<string>(() => {
    return formatDateForInput(new Date());
  });
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateForInput(d);
  });

  const [activeCalendar, setActiveCalendar] = useState<'start' | 'end' | null>(null);
  const startDateTriggerRef = useRef<HTMLButtonElement>(null);
  const endDateTriggerRef = useRef<HTMLButtonElement>(null);

  const { datesWithHistory, fetchDatesForMonth, isLoading: isLoadingDates } = useHistoryDate();

  const handleExport = useCallback(async (): Promise<void> => {
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

  const activeAnchorEl = useMemo((): HTMLButtonElement | null => {
    if (activeCalendar === 'start') {
      return startDateTriggerRef.current;
    }
    if (activeCalendar === 'end') {
      return endDateTriggerRef.current;
    }
    return null;
  }, [activeCalendar]);

  const activeSelectedDate = useMemo((): Date => {
    const dateStr = activeCalendar === 'start' ? startDate : endDate;
    return new Date(`${dateStr.replace(/\//g, '-')}T00:00:00`);
  }, [activeCalendar, startDate, endDate]);

  const handleDateSelect = useCallback(
    (date: Date): void => {
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

  const minCalendarDate = useMemo((): Date | undefined => {
    if (activeCalendar === 'end') {
      return new Date(`${startDate.replace(/\//g, '-')}T00:00:00`);
    }
    return undefined;
  }, [activeCalendar, startDate]);

  const maxCalendarDate = useMemo((): Date => {
    if (activeCalendar === 'start') {
      return new Date(`${endDate.replace(/\//g, '-')}T00:00:00`);
    }
    return new Date();
  }, [activeCalendar, endDate]);

  return (
    <>
      <div className="layout-stack-md">
        <div className="card layout-stack-md">
          <div className="layout-stack-sm">
            <h3 className="txt-title-lg">Date Range</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="layout-stack-sm">
                <label className="txt-label" htmlFor="start-date">
                  Start Date
                </label>
                <button
                  ref={startDateTriggerRef}
                  id="start-date"
                  className="btn-secondary flex w-full items-center justify-between text-left"
                  onClick={() => setActiveCalendar(activeCalendar === 'start' ? null : 'start')}
                >
                  <span className="txt-main">{startDate}</span>
                  <Icon name="Calendar" className="icon-sm text-text-tertiary" />
                </button>
              </div>
              <div className="layout-stack-sm">
                <label className="txt-label" htmlFor="end-date">
                  End Date
                </label>
                <button
                  ref={endDateTriggerRef}
                  id="end-date"
                  className="btn-secondary flex w-full items-center justify-between text-left"
                  onClick={() => setActiveCalendar(activeCalendar === 'end' ? null : 'end')}
                >
                  <span className="txt-main">{endDate}</span>
                  <Icon name="Calendar" className="icon-sm text-text-tertiary" />
                </button>
              </div>
            </div>
          </div>

          <div className="layout-stack-sm">
            <h3 className="txt-title-lg">Format</h3>
            <div className="flex space-x-2">
              <RadioCard checked={format === 'json'} description="JavaScript Object Notation" label="JSON" onChange={setFormat} value="json" />
              <RadioCard checked={format === 'csv'} description="Comma-Separated Values" label="CSV" onChange={setFormat} value="csv" />
            </div>
          </div>

          <button className="btn-primary layout-flex-center w-full" disabled={isLoading} onClick={handleExport}>
            {isLoading ? (
              <>
                <Icon name="Loader2" className="icon-md mr-2 animate-spin" />
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
