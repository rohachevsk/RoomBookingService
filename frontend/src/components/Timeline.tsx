import { useMemo } from 'react';
import type { MouseEvent } from 'react';
import { Plus } from 'lucide-react';
import type { Booking, Room } from '@/types/index';
import { RoomCard } from './RoomCard';
import { mockBookings, mockRooms } from '@/mocks';

export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 20;
const DAY_START_MIN = DAY_START_HOUR * 60;
const DAY_TOTAL_MIN = (DAY_END_HOUR - DAY_START_HOUR) * 60;
const HOURS = DAY_END_HOUR - DAY_START_HOUR; // 12
const MIN_BOOKING_MINUTES = 15; // mirrors the backend minimum duration

export interface FreeInterval {
  start: Date;
  end: Date;
}

/**
 * Free sub-intervals of one hour cell that fit at least one booking,
 * i.e. the cell minus CONFIRMED bookings overlapping it.
 */
function freePartsInHour(roomBookings: Booking[], targetDay: Date, hour: number): FreeInterval[] {
  const hourStart = new Date(targetDay);
  hourStart.setHours(hour, 0, 0, 0);
  const hourEnd = new Date(targetDay);
  hourEnd.setHours(hour + 1, 0, 0, 0);

  const busy = roomBookings
    .map((booking) => {
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);
      return {
        start: start < hourStart ? hourStart : start,
        end: end > hourEnd ? hourEnd : end,
      };
    })
    .filter((range) => range.end > range.start)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const minimumMs = MIN_BOOKING_MINUTES * 60 * 1000;
  const parts: FreeInterval[] = [];
  let cursor = hourStart;
  for (const range of busy) {
    if (range.start.getTime() - cursor.getTime() >= minimumMs) {
      parts.push({ start: new Date(cursor), end: new Date(range.start) });
    }
    if (range.end > cursor) {
      cursor = range.end;
    }
  }
  if (hourEnd.getTime() - cursor.getTime() >= minimumMs) {
    parts.push({ start: new Date(cursor), end: hourEnd });
  }
  return parts;
}

export interface SlotSelection {
  roomId: string;
  start: Date;
  end: Date;
}

interface TimelineProps {
  rooms?: Room[];
  bookings?: Booking[];
  /** Selected day in YYYY-MM-DD format. Defaults to today. */
  date?: string;
  /** Called with a free interval (whole hour or its free part) when a cell is clicked. Parent opens the booking modal. */
  onSlotClick?: (slot: SlotSelection) => void;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatHour(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Horizontal position of a booking inside the 08:00–20:00 lane, in percent. */
function bookingLayout(startTime: string, endTime: string): { left: string; width: string } | null {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const startMin = start.getHours() * 60 + start.getMinutes();
  const endMin = end.getHours() * 60 + end.getMinutes();
  const clampedStart = Math.max(startMin, DAY_START_MIN);
  const clampedEnd = Math.min(endMin, DAY_START_MIN + DAY_TOTAL_MIN);
  if (clampedEnd <= clampedStart) return null;
  return {
    left: `${((clampedStart - DAY_START_MIN) / DAY_TOTAL_MIN) * 100}%`,
    width: `${((clampedEnd - clampedStart) / DAY_TOTAL_MIN) * 100}%`,
  };
}

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

export function Timeline({ rooms = mockRooms, bookings = mockBookings, date, onSlotClick }: TimelineProps) {
  const selectedDate = date ?? toDateInputValue(new Date());
  const targetDay = parseLocalDate(selectedDate);
  const isToday = selectedDate === toDateInputValue(new Date());

  const bookingsByRoom = useMemo(() => {
    const targetDay = parseLocalDate(selectedDate);
    const map = new Map<string, Booking[]>();
    for (const booking of bookings) {
      if (booking.status !== 'CONFIRMED') continue;
      if (!isSameDay(new Date(booking.startTime), targetDay)) continue;
      const list = map.get(booking.roomId) ?? [];
      list.push(booking);
      map.set(booking.roomId, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [bookings, selectedDate]);

  const nowPosition = useMemo(() => {
    if (!isToday) return null;
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    if (minutes < DAY_START_MIN || minutes > DAY_START_MIN + DAY_TOTAL_MIN) return null;
    return `${((minutes - DAY_START_MIN) / DAY_TOTAL_MIN) * 100}%`;
  }, [isToday]);

  const handleCellClick = (roomId: string, hour: number, event: MouseEvent<HTMLButtonElement>) => {
    if (!onSlotClick) return;
    const parts = freePartsInHour(bookingsByRoom.get(roomId) ?? [], targetDay, hour);
    if (parts.length === 0) return;
    // Propose the free part containing the click point (the visibly free area),
    // falling back to the first bookable interval (e.g. keyboard activation).
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
    const clicked = new Date(targetDay);
    clicked.setHours(hour, Math.max(0, Math.min(59, Math.floor(ratio * 60))), 0, 0);
    const containing = parts.find((part) => clicked >= part.start && clicked < part.end);
    const selected = containing ?? parts[0];
    onSlotClick({ roomId, start: selected.start, end: selected.end });
  };

  if (rooms.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
        <p className="text-sm font-medium text-slate-900 dark:text-white">Нет доступных комнат</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Попробуйте изменить фильтры или дату</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-hairline bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="min-w-[1024px]">
          {/* Hour header */}
          <div className="flex border-b border-hairline dark:border-slate-800">
            <div className="w-60 shrink-0 border-r border-hairline px-4 py-3 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-[0.077em] text-graphite dark:text-slate-500">
                Комната / Время
              </span>
            </div>
            <div className="grid flex-1 grid-cols-12">
              {Array.from({ length: HOURS }).map((_, index) => (
                <div
                  key={index}
                  className="px-1 py-3 text-center text-[11px] font-medium tabular-nums text-slate-400 dark:text-slate-500"
                >
                  {String(DAY_START_HOUR + index).padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* Room rows */}
          {rooms.map((room) => {
            const roomBookings = bookingsByRoom.get(room.id) ?? [];
            return (
              <div
                key={room.id}
                className="flex border-b border-hairline last:border-b-0 dark:border-slate-800/60"
              >
                {/* Y axis: room card */}
                <div className="sticky left-0 z-10 w-60 shrink-0 border-r border-hairline bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
                  <RoomCard room={room} className="!border-0 !bg-transparent !p-1 !shadow-none hover:!shadow-none" />
                </div>

                {/* X axis: hour lane */}
                <div className="relative flex-1">
                  <div className="grid h-full grid-cols-12 divide-x divide-hairline dark:divide-slate-800/60">
                    {Array.from({ length: HOURS }).map((_, index) => {
                      const hour = DAY_START_HOUR + index;
                      const parts = freePartsInHour(roomBookings, targetDay, hour);
                      const clickable = room.isActive && onSlotClick !== undefined && parts.length > 0;
                      const hourLabel = `${String(hour).padStart(2, '0')}:00`;
                      return (
                        <button
                          key={index}
                          type="button"
                          disabled={!clickable}
                          onClick={(event) => handleCellClick(room.id, hour, event)}
                          aria-label={`Забронировать ${room.name} в ${hourLabel}`}
                          title={
                            clickable
                              ? `${room.name} · ${hourLabel}–${String(hour + 1).padStart(2, '0')}:00`
                              : room.isActive
                                ? `${room.name} · ${hourLabel} — нет свободного интервала`
                                : undefined
                          }
                          className={`group flex h-[76px] items-center justify-center transition-colors ${
                            clickable
                              ? 'cursor-pointer hover:bg-ivory dark:hover:bg-indigo-500/10'
                              : 'cursor-default'
                          }`}
                        >
                          {clickable && (
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white opacity-0 ring-1 ring-hairline transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-slate-900 dark:ring-slate-700">
                              <Plus className="h-4 w-4 text-cobalt" aria-hidden="true" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Booked blocks */}
                  {roomBookings.map((booking) => {
                    const layout = bookingLayout(booking.startTime, booking.endTime);
                    if (!layout) return null;
                    const start = new Date(booking.startTime);
                    const end = new Date(booking.endTime);
                    return (
                      <div
                        key={booking.id}
                        style={{ left: layout.left, width: layout.width }}
                        className="absolute bottom-2 top-2 overflow-hidden rounded-xl border border-cobalt/25 bg-cobalt/[0.07] px-2 py-1.5 dark:border-indigo-400/30 dark:bg-indigo-500/15"
                        title={`${booking.title} · ${formatHour(start)}–${formatHour(end)}${booking.user ? ` · ${booking.user.fullName}` : ''}`}
                        aria-label={`Занято: ${booking.title}, ${formatHour(start)}–${formatHour(end)}`}
                      >
                        <p className="truncate text-[13px] font-semibold leading-tight text-ink dark:text-indigo-100">
                          {booking.title}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs tabular-nums text-graphite dark:text-indigo-300/70">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cobalt" aria-hidden="true" />
                          {formatHour(start)}–{formatHour(end)}
                          {booking.user ? ` · ${booking.user.fullName}` : null}
                        </p>
                      </div>
                    );
                  })}

                  {/* Current time: elegant marker with dot */}
                  {nowPosition !== null && (
                    <div
                      className="pointer-events-none absolute bottom-0 top-0 z-10 w-0.5 -translate-x-1/4 bg-gradient-to-b from-cobalt via-cobalt to-cobalt/50"
                      style={{ left: nowPosition }}
                      aria-hidden="true"
                    >
                      <span className="absolute -left-[3px] -top-0 h-2 w-2 rounded-full bg-cobalt ring-4 ring-cobalt/15" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-graphite dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-white ring-1 ring-hairline dark:bg-slate-900 dark:ring-slate-700" />
          Свободно — клик открывает бронирование
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-cobalt/10 ring-1 ring-cobalt/25 dark:bg-indigo-500/20 dark:ring-indigo-400/30" />
          Занято
        </span>
        <span className="tabular-nums">08:00–20:00 · шаг 1 час</span>
      </div>
    </div>
  );
}
