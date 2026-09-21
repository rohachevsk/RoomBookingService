import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

const anchorClass =
  'rounded-full px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-ivory ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt ' +
  'dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white';

const anchors = [
  { href: '#features', label: 'Возможности' },
  { href: '#how', label: 'Как это работает' },
  { href: '#schedule', label: 'Расписание' },
];

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showAnchors = location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-white dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        {/* Left: logo */}
        <div className="flex min-w-0 flex-1 items-center">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Room Booking — на главную">
            <span className="rounded-full bg-cobalt p-2">
              <Building2 className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <span className="hidden truncate text-[17px] font-semibold tracking-tight text-ink sm:inline dark:text-white">
              Room Booking
            </span>
          </Link>
        </div>

        {/* Center: anchor nav (landing only) */}
        {showAnchors && (
          <nav className="hidden shrink-0 items-center gap-1 md:flex" aria-label="Разделы страницы">
            {anchors.map((anchor) => (
              <a key={anchor.href} href={anchor.href} className={anchorClass}>
                {anchor.label}
              </a>
            ))}
          </nav>
        )}

        {/* Right: auth */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          {user ? (
            <>
              <Link
                to="/my-bookings"
                className="hidden shrink-0 rounded-full px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt md:inline dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Мои бронирования
              </Link>
              <div className="hidden min-w-0 text-right lg:block">
                <p className="truncate text-sm font-medium text-ink dark:text-white">{user.fullName}</p>
                <p className="text-xs text-graphite dark:text-slate-400">
                  {user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
                </p>
              </div>
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lavender text-sm font-semibold text-cobalt dark:bg-indigo-500/20 dark:text-indigo-300"
                title={user.fullName}
                aria-hidden="true"
              >
                {getInitials(user.fullName)}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                title="Выйти"
                aria-label="Выйти из аккаунта"
                className="rounded-full p-2 text-graphite transition-colors hover:bg-ivory hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ivory focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Войти
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-2 rounded-full bg-cobalt px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cobalt-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt focus-visible:ring-offset-2"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Регистрация</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
