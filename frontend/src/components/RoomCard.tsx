import { Coffee, Monitor, Presentation, Projector, Tv, Users, Video, Wifi } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Room } from '@/types/index';

function equipmentIcon(label: string): LucideIcon {
  const key = label.trim().toLowerCase();
  if (key.includes('проектор') || key.includes('projector')) return Projector;
  if (key.includes('тв') || key.includes('телевизор') || key === 'tv') return Tv;
  if (key.includes('монитор') || key.includes('monitor') || key.includes('экран')) return Monitor;
  if (key.includes('wi-fi') || key.includes('wifi') || key.includes('вай')) return Wifi;
  if (key.includes('видео') || key.includes('video') || key.includes('конференц')) return Video;
  if (key.includes('кофе') || key.includes('coffee')) return Coffee;
  if (key.includes('доска') || key.includes('board') || key.includes('флипчарт')) return Presentation;
  return Monitor;
}

export function EquipmentBadge({ label }: { label: string }) {
  const Icon = equipmentIcon(label);
  return (
    <span
      title={label}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-ivory px-2.5 py-1 text-xs font-medium text-graphite ring-1 ring-hairline dark:bg-slate-800 dark:text-slate-300 dark:ring-0"
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-cobalt" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
  );
}

interface RoomCardProps {
  room: Room;
  className?: string;
}

export function RoomCard({ room, className = '' }: RoomCardProps) {
  return (
    <div
      className={`rounded-2xl border border-hairline bg-white p-4 dark:border-slate-800 dark:bg-slate-950 ${
        room.isActive ? '' : 'opacity-60'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate text-[15px] font-semibold tracking-tight text-ink dark:text-white">
          {room.name}
        </h3>
        {!room.isActive && (
          <span className="shrink-0 rounded-full bg-ivory px-2 py-0.5 text-[11px] font-medium text-graphite ring-1 ring-hairline dark:bg-slate-800 dark:text-slate-400 dark:ring-0">
            Неактивна
          </span>
        )}
      </div>

      <p className="mt-2 flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-lavender px-2 py-0.5 text-xs font-medium text-cobalt dark:bg-slate-800 dark:text-slate-300">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {room.capacity} чел.
        </span>
      </p>

      {room.equipment.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {room.equipment.map((item) => (
            <EquipmentBadge key={item} label={item} />
          ))}
        </div>
      )}
    </div>
  );
}
