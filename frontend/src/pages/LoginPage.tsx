import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, LogIn, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/api/bookingApi';
import type { PendingBooking } from '@/components/CreateBookingModal';

interface LocationState {
  from?: string;
  pendingBooking?: PendingBooking;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 transition-colors ' +
  'placeholder:text-slate-400 focus:border-cobalt focus:outline-none focus:ring-2 focus-visible:ring-cobalt/30 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white';

export function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setFieldError('Введите корректный email.');
      return;
    }
    if (password === '') {
      setFieldError('Введите пароль.');
      return;
    }
    setFieldError(null);
    setServerError(null);
    try {
      await login(email, password);
      const state = location.state as LocationState | null;
      navigate(state?.from ?? '/', state?.pendingBooking ? { state: { pendingBooking: state.pendingBooking } } : undefined);
    } catch (error) {
      setServerError(
        error instanceof ApiError && error.body ? error.body.message : 'Не удалось войти. Попробуйте ещё раз.',
      );
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 dark:bg-slate-950">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
      >
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Вход</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Войдите, чтобы бронировать переговорные.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                disabled={loading}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="user@example.com"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Пароль
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                disabled={loading}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
          </div>

          {fieldError && (
            <p role="alert" className="text-[13px] text-rose-600 dark:text-rose-400">
              {fieldError}
            </p>
          )}
          {serverError && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-800 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200"
            >
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-cobalt px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cobalt-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {loading ? 'Входим…' : 'Войти'}
          </button>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            Нет аккаунта?{' '}
            <Link to="/register" className="font-medium text-cobalt hover:text-cobalt-deep dark:text-indigo-400">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
