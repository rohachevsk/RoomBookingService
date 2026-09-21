/**
 * Base API service for Room Booking Service.
 * Native `fetch`, no external HTTP dependencies.
 *
 * Works with the Vite dev proxy (`/api` -> http://localhost:4000).
 * For production, set `VITE_API_URL` (e.g. "https://api.example.com").
 */
import type {
  ApiErrorResponse,
  AuthResponse,
  Booking,
  CreateBookingPayload,
  RegisterResponse,
  Room,
} from '../types/index';

const API_BASE = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}/api`;

const TOKEN_KEY = 'rb_token';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorResponse | null;

  constructor(status: number, body: ApiErrorResponse | null) {
    super(body?.message ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let body: ApiErrorResponse | null = null;
    try {
      body = (await response.json()) as ApiErrorResponse;
    } catch {
      body = null;
    }
    throw new ApiError(response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/** GET /api/rooms — list of active rooms. */
export function getRooms(): Promise<Room[]> {
  return request<Room[]>('/rooms');
}

/** GET /api/bookings?date=YYYY-MM-DD — all bookings for a specific date. */
export function getBookings(date: string): Promise<Booking[]> {
  return request<Booking[]>(`/bookings?date=${encodeURIComponent(date)}`);
}

/** POST /api/bookings — create a booking (requires auth). */
export function createBooking(payload: CreateBookingPayload): Promise<Booking> {
  return request<Booking>('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** GET /api/bookings/my — bookings of the current user (requires auth). */
export function getMyBookings(): Promise<Booking[]> {
  return request<Booking[]>('/bookings/my');
}

/** DELETE /api/bookings/:id — cancel a booking, returns the updated booking. */
export function cancelBooking(id: string): Promise<Booking> {
  return request<Booking>(`/bookings/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

/** POST /api/auth/login — returns a JWT token and the user. */
export function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/** POST /api/auth/register — creates a user (call login() afterwards). */
export function register(payload: { fullName: string; email: string; password: string }): Promise<RegisterResponse> {
  return request<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export const bookingApi = {
  getRooms,
  getBookings,
  createBooking,
  getMyBookings,
  cancelBooking,
  login,
  register,
};
