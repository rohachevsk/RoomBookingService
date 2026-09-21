/**
 * Canonical domain types for Room Booking Service frontend.
 * Field shapes mirror the backend REST API (Express + Prisma).
 */

export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  isActive: boolean;
}

export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface Booking {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  roomId: string;
  userId: string;
  user?: Pick<User, 'id' | 'fullName'>;
  room?: Room;
}

/** Payload for POST /api/bookings. Dates are ISO 8601 strings in UTC. */
export interface CreateBookingPayload {
  roomId: string;
  title: string;
  startTime: string;
  endTime: string;
}

/** Error body shape returned by the backend ({ message: string }). */
export interface ApiErrorResponse {
  message: string;
}

/** POST /api/auth/login response: JWT token + user. */
export interface AuthResponse {
  token: string;
  user: User;
}

/** POST /api/auth/register response (no token — the client logs in afterwards). */
export interface RegisterResponse {
  message: string;
  user: User;
}
