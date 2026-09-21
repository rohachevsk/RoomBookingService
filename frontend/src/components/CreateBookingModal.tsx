import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Clock, LogIn, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { Booking, Room } from '@/types/index';
import { ApiError, createBooking } from '@/api/bookingApi';

export interface BookingSlot {
  roomId: string;
  start: Date;
  end: Date;
  title?: string;
}

/** Slot preserved across the login redirect so guest input is not lost. */
export interface PendingBooking {
  date: string;
  roomId: string;
  title: string;
  start: string;
  end: string;
}

interface CreateBookingModalProps {
  open: boolean;
  /** Day context in YYYY-MM-DD format. */
  date: string;
  rooms: Room[];
  /** Preselected slot from Timeline click; null when opened via "Забронировать". */
  slot: BookingSlot | null;
  onClose: () => void;
  onCreated: (booking: Booking) => void;
}

const MIN_DURATION_MIN = 15;
const MAX_DURATION_MIN = 4 * 60;

function toHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function combineDateAndTime(dateStr: string, timeStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !/^\d{2}:\d{2}$/.test(timeStr)) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isQuarterHour(date: Date): boolean {
  return date.getSeconds() === 0 && date.getMilliseconds() === 0 && date.getMinutes() % 15 === 0;
}

/** Next quarter-hour from now, clamped to working hours; fallback 10:00. */
function defaultStart(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + (15 - (now.getMinutes() % 15)) % 15, 0, 0);
  const label = toHHMM(now);
  if (label < '08:00' || label >= '19:00') return '10:00';
  return label;
}

function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const total = hours * 60 + mins + minutes;
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
}

function plural(value: number, forms: [string, string, string]): string {
  const mod100 = value % 100;
  const mod10 = value % 10;
  if (mod100 > 10 && mod100 < 20) return forms[2];
  if (mod10 > 1 && mod10 < 5) return forms[1];
  if (mod10 === 1) return forms[0];
  return forms[2];
}

function formatDuration(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '—';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} ${plural(hours, ['час', 'часа', 'часов'])}`);
  if (minutes > 0) parts.push(`${minutes} ${plural(minutes, ['минута', 'минуты', 'минут'])}`);
  return `Длительность: ${parts.join(' ')}`;
}

function formatHumanDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const formatted = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' }).format(
    new Date(year, month - 1, day),
  );
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors ' +
  'focus:border-cobalt focus:outline-none focus:ring-2 focus:ring-cobalt/30 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:[color-scheme:dark]';

export function CreateBookingModal({ open, date, rooms, slot, onClose, onCreated }: CreateBookingModalProps) {
  const activeRooms = rooms.filter((room) => room.isActive);
  const [roomId, setRoomId] = useState('');
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('10:00');
  const [end, setEnd] = useState('11:00');
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // (Re)initialize form every time the modal opens.
  useEffect(() => {
    if (!open) return;
    const fallbackRoom = activeRooms[0]?.id ?? '';
    if (slot) {
      setRoomId(activeRooms.some((room) => room.id === slot.roomId) ? slot.roomId : fallbackRoom);
      setStart(toHHMM(slot.start));
      setEnd(toHHMM(slot.end));
      setTitle(slot.title ?? '');
    } else {
      const initial = defaultStart();
      setRoomId(fallbackRoom);
      setStart(initial);
      setEnd(addMinutes(initial, 60));
      setTitle('');
    }
    setServerError(null);
    setSubmitting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on Escape + autofocus title.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    titleRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const startDate = combineDateAndTime(date, start);
  const endDate = combineDateAndTime(date, end);
  const durationMin =
    startDate && endDate ? Math.round((endDate.getTime() - startDate.getTime()) / 60000) : NaN;

  let timeWarning: string | null = null;
  if (!startDate || !endDate) {
    timeWarning = 'Некорректное время. Используйте формат ЧЧ:ММ.';
  } else if (endDate <= startDate) {
    timeWarning = 'Время окончания должно быть позже времени начала.';
  } else if (durationMin < MIN_DURATION_MIN) {
    timeWarning = `Минимальная длительность — ${MIN_DURATION_MIN} минут.`;
  } else if (durationMin > MAX_DURATION_MIN) {
    timeWarning = 'Интервал превышает лимит — максимум 4 часа.';
  } else if (!isQuarterHour(startDate) || !isQuarterHour(endDate)) {
    timeWarning = 'Время должно быть с шагом 15 минут (например 10:00, 10:15, 10:30).';
  } else if (startDate.getTime() < Date.now()) {
    timeWarning = 'Нельзя создать бронирование в прошлом.';
  }

  const titleError = title.trim() === '' ? 'Введите тему встречи.' : null;
  const roomError = roomId === '' ? 'Выберите комнату.' : null;
  const canSubmit = isAuthenticated && !titleError && !roomError && timeWarning === null && !submitting;

  const handleLoginRedirect = () => {
    const pending: PendingBooking = { date, roomId, title: title.trim(), start, end };
    onClose();
    navigate('/login', { state: { from: location.pathname, pendingBooking: pending } });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !startDate || !endDate) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const booking = await createBooking({
        roomId,
        title: title.trim(),
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      });
      onCreated(booking);
      onClose();
    } catch (error) {
      setServerError(
        error instanceof ApiError && error.body
          ? error.body.message
          : 'Не удалось создать бронирование. Попробуйте ещё раз.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        onClick={(event) => event.stopPropagation()}
        className="animate-slide-up w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="booking-modal-title" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Новое бронирование
            </h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{formatHumanDate(date)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Закрыть"
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          <div>
            <label htmlFor="booking-room" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Комната
            </label>
            <select
              id="booking-room"
              value={roomId}
              disabled={submitting || activeRooms.length === 0}
              onChange={(event) => setRoomId(event.target.value)}
              aria-invalid={roomError !== null}
              className={inputClass}
            >
              <option value="">— Выберите комнату —</option>
              {activeRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} · {room.capacity} чел.
                </option>
              ))}
            </select>
            {roomError && (
              <p role="alert" className="mt-1.5 text-[13px] text-rose-600 dark:text-rose-400">
                {roomError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="booking-title" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Тема встречи
            </label>
            <input
              ref={titleRef}
              id="booking-title"
              type="text"
              value={title}
              maxLength={200}
              disabled={submitting}
              placeholder="Например: Планирование спринта"
              onChange={(event) => setTitle(event.target.value)}
              aria-invalid={titleError !== null}
              className={inputClass}
            />
            {titleError && (
              <p role="alert" className="mt-1.5 text-[13px] text-rose-600 dark:text-rose-400">
                {titleError}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="booking-start" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Начало
              </label>
              <input
                id="booking-start"
                type="time"
                step={900}
                value={start}
                disabled={submitting}
                onChange={(event) => {
                  const next = event.target.value;
                  setStart(next);
                  const nextStart = combineDateAndTime(date, next);
                  const currentEnd = combineDateAndTime(date, end);
                  if (nextStart && currentEnd && currentEnd <= nextStart) {
                    setEnd(addMinutes(next, 60));
                  }
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="booking-end" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Окончание
              </label>
              <input
                id="booking-end"
                type="time"
                step={900}
                value={end}
                disabled={submitting}
                onChange={(event) => setEnd(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-lavender px-3 py-2.5 text-sm font-medium text-cobalt dark:bg-indigo-500/10 dark:text-indigo-200">
            <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
            {formatDuration(durationMin)}
          </div>

          {timeWarning && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {timeWarning}
            </div>
          )}

          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-800 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {serverError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-full border border-hairline px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Отмена
            </button>
            {isAuthenticated ? (
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex items-center gap-2 rounded-full bg-cobalt px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cobalt-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {submitting ? 'Бронируем…' : 'Подтвердить бронирование'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLoginRedirect}
                className="flex items-center gap-2 rounded-full bg-cobalt px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cobalt-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Войти, чтобы забронировать
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
