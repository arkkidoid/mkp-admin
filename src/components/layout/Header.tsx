import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const ROUTE_LABELS: Record<string, string> = {
  '/':               'Dashboard',
  '/parents':        'Parents',
  '/teachers':       'Teachers',
  '/children':       'Students',
  '/batches':        'Batches',
  '/courses':        'Courses',
  '/attendance':     'Attendance',
  '/assignments':    'Assignments',
  '/fees':           'Fee Records',
  '/fees/payments':  'Payment History',
  '/events':         'Events',
  '/gallery':        'Gallery',
  '/notifications':  'Notifications',
  '/reports':        'Reports',
  '/settings':       'Settings',
};

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const pageTitle = ROUTE_LABELS[location.pathname] ?? 'Admin';

  const initials = (user?.name ?? 'A').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="h-14 bg-surface border-b border-border-light flex items-center px-4 gap-3 flex-shrink-0 z-10">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-border-light transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title — desktop */}
      <span className="hidden md:block text-sm font-semibold text-text">{pageTitle}</span>
      {/* Brand — mobile */}
      <span className="md:hidden text-sm font-bold text-text">{pageTitle}</span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate('/notifications')}
          className="p-2 rounded-lg text-text-secondary hover:bg-border-light hover:text-text transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-border-light mx-1" />

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-text leading-tight">{user?.name ?? 'Admin'}</p>
            <p className="text-[10px] text-text-light">Administrator</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 select-none">
            {initials}
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="p-2 rounded-lg text-text-light hover:bg-red-50 hover:text-error transition-colors ml-1"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
