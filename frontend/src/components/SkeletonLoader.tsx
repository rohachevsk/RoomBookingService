/**
 * Skeleton loaders with a shimmer effect for the rooms grid and day schedule.
 * They mirror the real layout dimensions so the UI doesn't jump during fetch.
 */

interface SkeletonProps {
  className?: string;
}

/** Base shimmer block. */
function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden rounded-xl bg-slate-200/80 dark:bg-slate-800 ${className}`}
    >
      <div className="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10" />
    </div>
  );
}

/** Placeholder for a single room card (title, capacity, equipment badges). */
export function RoomCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <Skeleton className="h-5 w-2/3 rounded-lg" />
      <Skeleton className="mt-2 h-4 w-1/3 rounded-lg" />
      <div className="mt-3 flex flex-wrap gap-2">
        <Skeleton className="h-6 w-16 !rounded-full" />
        <Skeleton className="h-6 w-20 !rounded-full" />
        <Skeleton className="h-6 w-24 !rounded-full" />
      </div>
    </div>
  );
}

interface RoomsGridSkeletonProps {
  count?: number;
}

/** Grid of room card placeholders. */
export function RoomsGridSkeleton({ count = 6 }: RoomsGridSkeletonProps) {
  return (
    <div role="status" aria-label="Загрузка комнат" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <span className="sr-only">Загрузка комнат…</span>
      {Array.from({ length: count }).map((_, index) => (
        <RoomCardSkeleton key={index} />
      ))}
    </div>
  );
}

interface ScheduleSkeletonProps {
  /** Number of room rows to render. */
  rooms?: number;
  /** Number of time-slot cells per row (08:00–20:00 hourly = 12). */
  slots?: number;
}

/**
 * Placeholder for the day timeline: hour-tick header plus one row per room
 * with a deterministic mix of "free" and "booked-looking" cells.
 */
export function ScheduleSkeleton({ rooms = 4, slots = 12 }: ScheduleSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Загрузка расписания"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
    >
      <span className="sr-only">Загрузка расписания…</span>

      {/* Hour-tick header */}
      <div className="flex gap-2 border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="w-36 shrink-0 sm:w-44" />
        <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))` }}>
          {Array.from({ length: slots }).map((_, index) => (
            <Skeleton key={index} className="h-4 !rounded-md" />
          ))}
        </div>
      </div>

      {/* Room rows */}
      {Array.from({ length: rooms }).map((_, row) => (
        <div key={row} className="flex gap-2 border-b border-slate-100 p-4 last:border-b-0 dark:border-slate-800/60">
          <div className="w-36 shrink-0 sm:w-44">
            <Skeleton className="h-5 w-3/4 rounded-lg" />
            <Skeleton className="mt-2 h-3.5 w-1/2 rounded-lg" />
          </div>
          <div className="grid flex-1 gap-2" style={{ gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))` }}>
            {Array.from({ length: slots }).map((_, col) => (
              <Skeleton
                key={col}
                className={`h-10 ${col % 2 === 0 ? 'opacity-70' : ''} ${(row * 5 + col) % 7 < 2 ? '!bg-slate-300/70 dark:!bg-slate-700' : ''}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface SkeletonLoaderProps {
  variant?: 'schedule' | 'rooms';
  rows?: number;
}

/**
 * Convenience loader: picks the schedule or rooms skeleton.
 * `rows` controls room-row count (schedule) or card count (rooms).
 */
export function SkeletonLoader({ variant = 'schedule', rows }: SkeletonLoaderProps) {
  if (variant === 'rooms') {
    return <RoomsGridSkeleton count={rows ?? 6} />;
  }
  return <ScheduleSkeleton rooms={rows ?? 4} />;
}
