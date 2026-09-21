import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CalendarDays, Clock, Trash2 } from 'lucide-react';
import type { Booking } from '@/types/index';
import { ApiError, cancelBooking, getMyBookings } from '@/api/bookingApi';

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
}

function isUpcoming(booking: Booking): boolean {
  return booking.status === 'CONFIRMED' && new Date(booking.startTime).getTime() > Date.now();
}

export function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBookings(await getMyBookings());
    } catch (err) {
      setError(
        err instanceof ApiError && err.body ? err.body.message : 'Не удалось загрузить бронирования.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCancel = async (booking: Booking) => {
    if (!window.confirm(`Отменить бронирование «${booking.title}»?`)) return;
    setCancellingId(booking.id);
    try {
      const updated = await cancelBooking(booking.id);
      setBookings((prev) => prev.map((item) => (item.id === booking.id ? updated : item)));
    } catch (err) {
      setError(err instanceof ApiError && err.body ? err.body.message : 'Не удалось отменить бронирование.');
    } finally {
      setCancellingId(null);
    }
  };

  const upcoming = bookings.filter(isUpcoming);
  const past = bookings.filter((booking) => !isUpcoming(booking));

  const renderBooking = (booking: Booking) => {
    const cancellable = isUpcoming(booking);
    const cancelling = cancellingId === booking.id;
    return (
      <li
        key={booking.id}
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-slate-900 dark:text-white">{booking.title}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              {formatDateTime(booking.startTime)}
            </span>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {new Date(booking.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {booking.room && <span className="truncate">{booking.room.name}</span>}
          </p>
          <p className="mt-1.5 text-xs font-medium">
            {booking.status === 'CONFIRMED' ? (
              <span className="text-emerald-600 dark:text-emerald-400">Подтверждена</span>
            ) : (
              <span className="text-slate-400">Отменена</span>
            )}
          </p>
        </div>
        {cancellable && (
          <button
            type="button"
            disabled={cancelling}
            onClick={() => void handleCancel(booking)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-400/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {cancelling ? 'Отменяем…' : 'Отменить'}
          </button>
        )}
      </li>
    );
  };

  return (
    <div className="min-h-screen dark:bg-slate-950">
      <main className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Мои бронирования</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Предстоящие встречи можно отменить, прошедшие остаются для истории.
        </p>

        {loading && (
          <div className="mt-5 space-y-3" role="status" aria-label="Загрузка бронирований">
            <span className="sr-only">Загрузка бронирований…</span>
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                aria-hidden="true"
                className="relative h-24 overflow-hidden rounded-2xl bg-slate-200/80 dark:bg-slate-800"
              >
                <div className="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div
            role="alert"
            className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-400/20 dark:bg-rose-500/10"
          >
            <AlertCircle className="h-8 w-8 text-rose-500" aria-hidden="true" />
            <p className="text-sm font-medium text-rose-800 dark:text-rose-200">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-rose-400/30 dark:text-rose-200 dark:hover:bg-rose-500/10"
            >
              Повторить
            </button>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
            <p className="text-sm font-medium text-slate-900 dark:text-white">Пока нет бронирований</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Выберите свободный слот в расписании.</p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-full bg-cobalt px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cobalt-deep"
            >
              К расписанию
            </Link>
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="mt-5 space-y-6">
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Предстоящие · {upcoming.length}
              </h2>
              {upcoming.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Нет предстоящих встреч.</p>
              ) : (
                <ul className="space-y-3">{upcoming.map(renderBooking)}</ul>
              )}
            </section>
            {past.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Прошедшие и отменённые · {past.length}
                </h2>
                <ul className="space-y-3">{past.map(renderBooking)}</ul>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
