import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  Eye,
  MousePointerClick,
  Plus,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Booking, Room } from '@/types/index';
import { ApiError, getBookings, getRooms } from '@/api/bookingApi';
import { todayInputValue } from '@/lib/date';
import { DatePicker } from '@/components/DatePicker';
import { ScheduleSkeleton } from '@/components/SkeletonLoader';
import { Timeline } from '@/components/Timeline';
import type { SlotSelection } from '@/components/Timeline';
import { CreateBookingModal } from '@/components/CreateBookingModal';
import type { BookingSlot, PendingBooking } from '@/components/CreateBookingModal';

interface Feature {
  icon: LucideIcon;
  title: string;
  text: string;
}

const features: Feature[] = [
  {
    icon: CalendarCheck,
    title: 'Простой выбор времени',
    text: 'День, комната, час — три клика, и встреча запланирована. Шаг сетки — 1 час, с 08:00 до 20:00.',
  },
  {
    icon: Eye,
    title: 'Наглядная загруженность',
    text: 'Занятые слоты видны сразу: тема встречи и время — прямо на шкале, без открытия карточек.',
  },
  {
    icon: Zap,
    title: 'Мгновенное подтверждение',
    text: 'Бронь создаётся сразу и появляется в расписании. Пересечения по времени исключены.',
  },
  {
    icon: MousePointerClick,
    title: 'Без лишних шагов',
    text: 'Гость смотрит расписание без регистрации. Войти нужно только в момент бронирования.',
  },
];

const steps: string[] = [
  'Выберите день и свободный слот на шкале — клик открывает форму бронирования.',
  'Укажите тему встречи и точное время с шагом 15 минут.',
  'Подтвердите — встреча сразу появится в общем расписании.',
];

function combineDateAndTime(dateStr: string, timeStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !/^\d{2}:\d{2}$/.test(timeStr)) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Decorative static preview of the schedule for the hero (not interactive). */
function HeroPreview() {
  const rows = [
    { room: 'Атлас · 12 чел.', blocks: [{ left: '12%', width: '22%' }, { left: '58%', width: '16%' }] },
    { room: 'Меридиан · 6 чел.', blocks: [{ left: '30%', width: '25%' }] },
    { room: 'Компас · 4 чел.', blocks: [{ left: '48%', width: '32%' }] },
  ];
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-2xl border border-hairline bg-white dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="flex items-center gap-1.5 border-b border-hairline px-4 py-3 dark:border-slate-800">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 hidden rounded-full bg-ivory px-3 py-1 text-xs text-graphite sm:inline dark:bg-slate-800 dark:text-slate-400">
          booking.team/schedule
        </span>
      </div>
      <div className="space-y-3 p-4">
        {rows.map((row) => (
          <div key={row.room} className="flex items-center gap-3">
            <div className="w-28 shrink-0">
              <div className="h-2.5 w-20 rounded-full bg-ink/80 dark:bg-white/80" />
              <div className="mt-1.5 h-2 w-14 rounded-full bg-hairline dark:bg-slate-800" />
            </div>
            <div className="relative h-9 flex-1 rounded-lg bg-ivory dark:bg-slate-900">
              {row.blocks.map((block, index) => (
                <div
                  key={index}
                  style={{ left: block.left, width: block.width }}
                  className="absolute top-1.5 bottom-1.5 rounded-md bg-cobalt/80"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarPage() {
  // Selected day owns the schedule block.
  const [selectedDate, setSelectedDate] = useState<string>(() => todayInputValue());

  // Remote data for the selected date.
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking modal state, fed by Timeline slot clicks.
  const [modalOpen, setModalOpen] = useState(false);
  const [slot, setSlot] = useState<BookingSlot | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Restore the slot a guest picked before being sent to /login.
  useEffect(() => {
    const pending = (location.state as { pendingBooking?: PendingBooking } | null)?.pendingBooking;
    if (!pending) return;
    const start = combineDateAndTime(pending.date, pending.start);
    const end = combineDateAndTime(pending.date, pending.end);
    if (pending.date && start && end) {
      setSelectedDate(pending.date);
      setSlot({ roomId: pending.roomId, start, end, title: pending.title });
      setModalOpen(true);
    }
    navigate(location.pathname, { replace: true });
    // Mount-only: consumes one-shot router state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestId = useRef(0);

  const load = useCallback(async (date: string) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const [loadedRooms, loadedBookings] = await Promise.all([getRooms(), getBookings(date)]);
      if (requestId.current !== id) return;
      setRooms(loadedRooms);
      setBookings(loadedBookings);
    } catch (err) {
      if (requestId.current !== id) return;
      setError(
        err instanceof ApiError && err.body
          ? err.body.message
          : 'Не удалось загрузить расписание. Проверьте, что бэкенд запущен.',
      );
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(selectedDate);
  }, [selectedDate, load]);

  const handleSlotClick = useCallback((selection: SlotSelection) => {
    setSlot(selection);
    setModalOpen(true);
  }, []);

  const handleBookButton = useCallback(() => {
    setSlot(null);
    setModalOpen(true);
  }, []);

  // Append the created booking locally — no reload.
  const handleCreated = useCallback((booking: Booking) => {
    setBookings((prev) => [...prev, booking]);
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-14 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center rounded-full bg-lavender px-3.5 py-1.5 text-[13px] font-medium text-cobalt dark:bg-indigo-500/10 dark:text-indigo-300">
            Бронирование переговорных без накладок
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.09] tracking-tight text-ink sm:text-5xl dark:text-white">
            Переговорные без хаоса в&nbsp;расписании
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-graphite dark:text-slate-400">
            Room Booking показывает занятость комнат и бронирует встречи за пару кликов —
            без пересечений по времени и лишней переписки.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <a
              href="#schedule"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-cobalt px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-cobalt-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 sm:w-auto"
            >
              Перейти к расписанию
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="#how"
              className="flex w-full items-center justify-center rounded-full border border-hairline bg-white px-6 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt sm:w-auto dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
            >
              Как это работает
            </a>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-4xl">
          <HeroPreview />
        </div>
      </section>

      {/* Value props */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-hairline bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lavender dark:bg-indigo-500/10">
                <feature.icon className="h-5 w-5 text-cobalt dark:text-indigo-300" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-[15px] font-semibold tracking-tight text-ink dark:text-white">
                {feature.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-graphite dark:text-slate-400">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-16">
        <div className="rounded-2xl border border-hairline bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-2xl font-semibold tracking-tight text-ink dark:text-white">Как это работает</h2>
          <p className="mt-1 text-sm text-graphite dark:text-slate-400">
            Три шага от пустого календаря до подтверждённой встречи.
          </p>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cobalt text-sm font-semibold text-white"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-ink dark:text-slate-200">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Interactive schedule */}
      <section id="schedule" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-20">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-ink dark:text-white">Расписание</h2>
            <p className="mt-1 text-sm text-graphite dark:text-slate-400">
              Свободный слот — клик для бронирования. Гостю понадобится войти только в момент брони.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DatePicker date={selectedDate} onDateChange={setSelectedDate} />
            <button
              type="button"
              onClick={handleBookButton}
              className="flex shrink-0 items-center gap-2 rounded-full bg-cobalt px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cobalt-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Забронировать
            </button>
          </div>
        </div>

        {loading && <ScheduleSkeleton rooms={4} />}

        {!loading && error && (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center dark:border-rose-400/20 dark:bg-rose-500/10"
          >
            <AlertCircle className="h-8 w-8 text-rose-500" aria-hidden="true" />
            <p className="text-sm font-medium text-rose-800 dark:text-rose-200">{error}</p>
            <button
              type="button"
              onClick={() => void load(selectedDate)}
              className="rounded-full border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-rose-400/30 dark:text-rose-200 dark:hover:bg-rose-500/10"
            >
              Повторить
            </button>
          </div>
        )}

        {!loading && !error && (
          <Timeline rooms={rooms} bookings={bookings} date={selectedDate} onSlotClick={handleSlotClick} />
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-hairline bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 sm:flex-row">
          <p className="text-sm font-medium text-ink dark:text-white">Room Booking</p>
          <p className="text-[13px] text-graphite dark:text-slate-400">
            © {new Date().getFullYear()} · Спокойное расписание для команд
          </p>
        </div>
      </footer>

      <CreateBookingModal
        open={modalOpen}
        date={selectedDate}
        rooms={rooms}
        slot={slot}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
