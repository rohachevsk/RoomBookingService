import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { todayInputValue, toDateInputValue } from '@/lib/date';

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function shiftDate(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function formatHuman(dateStr: string): string {
  const formatted = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(parseLocalDate(dateStr));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/* Component */

const iconButtonClass =
  'rounded-full p-2 text-graphite transition-colors hover:bg-ivory hover:text-ink ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt ' +
  'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100';

interface DatePickerProps {
  /** Selected day in YYYY-MM-DD format (controlled). */
  date: string;
  onDateChange: (date: string) => void;
}

export function DatePicker({ date, onDateChange }: DatePickerProps) {
  const isToday = date === todayInputValue();

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-hairline bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
      role="group"
      aria-label="Выбор даты"
    >
      <button
        type="button"
        className={iconButtonClass}
        aria-label="Предыдущий день"
        onClick={() => onDateChange(shiftDate(date, -1))}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>

      <label className="flex cursor-pointer items-center gap-2 rounded-full px-2 py-1.5 transition-colors hover:bg-ivory dark:hover:bg-slate-800">
        <CalendarDays className="h-4 w-4 shrink-0 text-cobalt" aria-hidden="true" />
        <span className="hidden whitespace-nowrap text-sm font-medium text-ink lg:inline dark:text-slate-200">
          {formatHuman(date)}
        </span>
        <input
          type="date"
          value={date}
          onChange={(event) => {
            if (event.target.value) onDateChange(event.target.value);
          }}
          aria-label="Дата расписания"
          className="w-[118px] cursor-pointer bg-transparent text-sm font-medium text-ink focus:outline-none dark:text-slate-200 dark:[color-scheme:dark]"
        />
      </label>

      <button
        type="button"
        className={iconButtonClass}
        aria-label="Следующий день"
        onClick={() => onDateChange(shiftDate(date, 1))}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => onDateChange(todayInputValue())}
        disabled={isToday}
        className={
          'ml-1 hidden whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ' +
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt sm:inline ' +
          (isToday
            ? 'cursor-default bg-lavender text-cobalt dark:bg-indigo-500/10 dark:text-indigo-300'
            : 'text-graphite hover:bg-ivory hover:text-ink dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white')
        }
      >
        Сегодня
      </button>
    </div>
  );
}
