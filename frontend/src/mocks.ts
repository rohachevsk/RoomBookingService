import type { Booking, Room } from '@/types/index';

/* ------------------------------------------------------------------ */
/* Mock data: renders immediately without a backend                     */
/* ------------------------------------------------------------------ */

function todayAt(hour: number, minute = 0): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export const mockRooms: Room[] = [
  {
    id: 'room-1',
    name: 'Конференц-зал «Атлас»',
    capacity: 12,
    equipment: ['Проектор', 'TV', 'Wi-Fi', 'Видеоконференция'],
    isActive: true,
  },
  {
    id: 'room-2',
    name: 'Переговорная «Меридиан»',
    capacity: 6,
    equipment: ['TV', 'Маркерная доска', 'Wi-Fi'],
    isActive: true,
  },
  {
    id: 'room-3',
    name: 'Хадл-рум «Компас»',
    capacity: 4,
    equipment: ['Монитор', 'Wi-Fi'],
    isActive: true,
  },
  {
    id: 'room-4',
    name: 'Большой зал «Горизонт»',
    capacity: 20,
    equipment: ['Проектор', 'TV', 'Wi-Fi', 'Кофе'],
    isActive: true,
  },
];

export const mockBookings: Booking[] = [
  {
    id: 'booking-1',
    title: 'Планирование спринта',
    startTime: todayAt(9),
    endTime: todayAt(10, 30),
    status: 'CONFIRMED',
    roomId: 'room-1',
    userId: 'user-1',
    user: { id: 'user-1', fullName: 'Иван Петров' },
  },
  {
    id: 'booking-2',
    title: 'Созвон с заказчиком',
    startTime: todayAt(13),
    endTime: todayAt(14),
    status: 'CONFIRMED',
    roomId: 'room-1',
    userId: 'user-2',
    user: { id: 'user-2', fullName: 'Анна Соколова' },
  },
  {
    id: 'booking-3',
    title: 'Ретроспектива',
    startTime: todayAt(16, 30),
    endTime: todayAt(17, 30),
    status: 'CONFIRMED',
    roomId: 'room-1',
    userId: 'user-1',
    user: { id: 'user-1', fullName: 'Иван Петров' },
  },
  {
    id: 'booking-4',
    title: 'Дизайн-ревью',
    startTime: todayAt(10),
    endTime: todayAt(12),
    status: 'CONFIRMED',
    roomId: 'room-2',
    userId: 'user-3',
    user: { id: 'user-3', fullName: 'Мария Ким' },
  },
  {
    id: 'booking-5',
    title: 'Встреча 1:1',
    startTime: todayAt(15),
    endTime: todayAt(16),
    status: 'CONFIRMED',
    roomId: 'room-2',
    userId: 'user-4',
    user: { id: 'user-4', fullName: 'Дмитрий Орлов' },
  },
  {
    id: 'booking-6',
    title: 'Отменённая встреча',
    startTime: todayAt(11),
    endTime: todayAt(12),
    status: 'CANCELLED',
    roomId: 'room-2',
    userId: 'user-4',
    user: { id: 'user-4', fullName: 'Дмитрий Орлов' },
  },
  {
    id: 'booking-7',
    title: 'Утренний дейли',
    startTime: todayAt(11),
    endTime: todayAt(11, 30),
    status: 'CONFIRMED',
    roomId: 'room-3',
    userId: 'user-5',
    user: { id: 'user-5', fullName: 'Ольга Смирнова' },
  },
  {
    id: 'booking-8',
    title: 'Воркшоп по продукту',
    startTime: todayAt(14),
    endTime: todayAt(18),
    status: 'CONFIRMED',
    roomId: 'room-3',
    userId: 'user-2',
    user: { id: 'user-2', fullName: 'Анна Соколова' },
  },
  {
    id: 'booking-9',
    title: 'Стендап',
    startTime: todayAt(8),
    endTime: todayAt(9),
    status: 'CONFIRMED',
    roomId: 'room-4',
    userId: 'user-1',
    user: { id: 'user-1', fullName: 'Иван Петров' },
  },
  {
    id: 'booking-10',
    title: 'Вечерний синк',
    startTime: todayAt(18),
    endTime: todayAt(20),
    status: 'CONFIRMED',
    roomId: 'room-4',
    userId: 'user-3',
    user: { id: 'user-3', fullName: 'Мария Ким' },
  },
];
